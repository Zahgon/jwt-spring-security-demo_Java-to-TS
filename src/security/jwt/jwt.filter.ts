import type { NextFunction, Request, Response } from 'express';
import { getLogger } from '../../util/logger';
import { getContext } from '../core/security-context-holder';
import type { TokenProvider } from './token-provider';

const LOG = getLogger('org.zerhusen.security.jwt.JWTFilter');

export const AUTHORIZATION_HEADER = 'Authorization';

/** `org.springframework.util.StringUtils#hasText`: non-null and not entirely whitespace. */
function hasText(value: string | undefined): value is string {
   return value !== undefined && value.trim().length > 0;
}

/**
 * Filters incoming requests and installs a Spring Security principal if a header corresponding
 * to a valid user is found.
 *
 * Express middleware occupies the same position in the chain as the servlet filter did: it runs
 * before the authorization check and, like the original, never rejects a request itself — an
 * absent or invalid token simply leaves the context anonymous and lets the authorization rules
 * decide.
 */
export function jwtFilter(tokenProvider: TokenProvider) {
   return function doFilter(request: Request, response: Response, next: NextFunction): void {
      const jwt = resolveToken(request);
      const requestURI = request.path;

      if (hasText(jwt) && tokenProvider.validateToken(jwt)) {
         const authentication = tokenProvider.getAuthentication(jwt);
         getContext().setAuthentication(authentication);
         LOG.debug("set Authentication to security context for '{}', uri: {}", authentication.getName(), requestURI);
      } else {
         LOG.debug('no valid JWT token found, uri: {}', requestURI);
      }

      next();
   };
}

function resolveToken(request: Request): string | undefined {
   const bearerToken = request.header(AUTHORIZATION_HEADER);
   if (hasText(bearerToken) && bearerToken.startsWith('Bearer ')) {
      return bearerToken.substring(7);
   }
   return undefined;
}
