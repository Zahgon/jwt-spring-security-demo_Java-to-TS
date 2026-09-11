import { getLogger } from '../util/logger';
import { isValidEmail } from '../util/email-validator';
import { SimpleGrantedAuthority, UserDetailsImpl, type UserDetails } from './core/authentication';
import { UsernameNotFoundException } from './core/exceptions';
import type { User } from './model/user.entity';
import { UserRepository } from './repository/user.repository';
import { UserNotActivatedException } from './user-not-activated.exception';

const log = getLogger('org.zerhusen.security.UserModelDetailsService');

/**
 * Authenticate a user from the database.
 *
 * Port of `UserModelDetailsService`. The activation check lives inside the user lookup, exactly
 * as in the original, so a deactivated account is rejected with "was not activated" before the
 * password is ever compared — even when that password is wrong.
 */
export const UserModelDetailsService = {
   loadUserByUsername(login: string): UserDetails {
      log.debug("Authenticating user '{}'", login);

      if (isValidEmail(login)) {
         const user = UserRepository.findOneWithAuthoritiesByEmailIgnoreCase(login);
         if (user === undefined) {
            throw new UsernameNotFoundException(`User with email ${login} was not found in the database`);
         }
         return createSpringSecurityUser(login, user);
      }

      const lowercaseLogin = login.toLowerCase();
      const user = UserRepository.findOneWithAuthoritiesByUsername(lowercaseLogin);
      if (user === undefined) {
         throw new UsernameNotFoundException(`User ${lowercaseLogin} was not found in the database`);
      }
      return createSpringSecurityUser(lowercaseLogin, user);
   },
};

/**
 * `lowercaseLogin` only ever reaches the exception message: the returned principal is built from
 * the *entity's* username, which is why authenticating as `ADMIN` or by e-mail address still
 * yields a token whose subject is the stored username.
 */
function createSpringSecurityUser(lowercaseLogin: string, user: User): UserDetailsImpl {
   if (!user.isActivated()) {
      throw new UserNotActivatedException(`User ${lowercaseLogin} was not activated`);
   }
   const grantedAuthorities = user
      .getAuthorities()
      .map((authority) => new SimpleGrantedAuthority(authority.getName()));

   return new UserDetailsImpl(user.getUsername(), user.getPassword(), grantedAuthorities);
}
