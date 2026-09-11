import bcrypt from 'bcryptjs';
import {
   UsernamePasswordAuthenticationToken,
   type Authentication,
   type UserDetails,
} from './authentication';
import {
   BadCredentialsException,
   InternalAuthenticationServiceException,
   UsernameNotFoundException,
} from './exceptions';
import { UserModelDetailsService } from '../user-model-details.service';

/**
 * `BCryptPasswordEncoder`. The seeded hashes are `$2a$08$…`, which bcryptjs verifies directly.
 */
export const passwordEncoder = {
   matches(rawPassword: string, encodedPassword: string): boolean {
      try {
         return bcrypt.compareSync(rawPassword, encodedPassword);
      } catch {
         // A malformed stored hash is a mismatch, not a crash — as in Spring, which logs and
         // returns false rather than propagating.
         return false;
      }
   },

   encode(rawPassword: string): string {
      return bcrypt.hashSync(rawPassword, 10);
   },
};

/**
 * Port of `DaoAuthenticationProvider` as reached through `AuthenticationManagerBuilder`.
 *
 * Two behaviours here are observable in the response body and are deliberate:
 *
 *   - `hideUserNotFoundExceptions` is on by default, so an unknown account is reported as
 *     "Bad credentials" — indistinguishable from a wrong password, which is the point;
 *   - any *other* failure escaping the `UserDetailsService` is wrapped in an
 *     `InternalAuthenticationServiceException` that preserves the original message. That is the
 *     path `UserNotActivatedException` takes to become a 401 reading
 *     "User <login> was not activated".
 */
export const authenticationManager = {
   authenticate(authentication: Authentication): Authentication {
      const username = authentication.getName();
      const presentedPassword = String(authentication.getCredentials() ?? '');

      let user: UserDetails;
      try {
         user = UserModelDetailsService.loadUserByUsername(username);
      } catch (error) {
         if (error instanceof UsernameNotFoundException) {
            throw new BadCredentialsException('Bad credentials');
         }
         throw new InternalAuthenticationServiceException(
            error instanceof Error ? error.message : String(error),
            error,
         );
      }

      if (!passwordEncoder.matches(presentedPassword, user.getPassword())) {
         throw new BadCredentialsException('Bad credentials');
      }

      // The successful token carries the UserDetails as principal, so `getName()` returns the
      // stored username and the authorities are the sorted set from `UserDetailsImpl`.
      return new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
   },
};
