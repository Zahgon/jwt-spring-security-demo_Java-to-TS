import { getLogger } from '../util/logger';
import { isUserDetails } from './core/authentication';
import { getContext } from './core/security-context-holder';

const LOG = getLogger('org.zerhusen.security.SecurityUtils');

/**
 * Port of `org.zerhusen.security.SecurityUtils`.
 *
 * Java returns `Optional<String>`; the TypeScript equivalent is `string | undefined`, which
 * `strictNullChecks` polices at the same call sites `Optional` did.
 */
export function getCurrentUsername(): string | undefined {
   const authentication = getContext().getAuthentication();

   if (authentication === null) {
      LOG.debug('no authentication in security context found');
      return undefined;
   }

   let username: string | undefined;
   const principal = authentication.getPrincipal();
   if (isUserDetails(principal)) {
      username = principal.getUsername();
   } else if (typeof principal === 'string') {
      username = principal;
   }

   LOG.debug("found username '{}' in security context", username);

   // `Optional.ofNullable` — an unrecognised principal type yields an empty result.
   return username ?? undefined;
}

export const SecurityUtils = { getCurrentUsername };
