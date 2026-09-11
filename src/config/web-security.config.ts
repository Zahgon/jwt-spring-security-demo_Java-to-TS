import type { NextFunction, Request, Response } from 'express';
import { antMatches } from '../util/ant-matcher';
import { AccessDeniedException, InsufficientAuthenticationException } from '../security/core/exceptions';
import { getContext } from '../security/core/security-context-holder';
import { JwtAccessDeniedHandler } from '../security/jwt-access-denied-handler';
import { JwtAuthenticationEntryPoint } from '../security/jwt-authentication-entry-point';

/**
 * Port of `WebSecurityConfig`.
 *
 * Spring expresses this as a fluent `HttpSecurity` chain; the equivalents are split across the
 * three exports below, in the order the filter chain applied them.
 */

/**
 * `configure(WebSecurity web)` — requests that bypass the security filter chain entirely.
 *
 * These are *not* "permitted" requests: the chain never runs for them, which is why a CORS
 * preflight comes back without any of the security headers below.
 */
const IGNORED_PATTERNS: readonly string[] = [
   '/',
   '/*.html',
   '/favicon.ico',
   '/**/*.html',
   '/**/*.css',
   '/**/*.js',
   '/h2-console/**',
];

export function isIgnored(request: Request): boolean {
   if (request.method === 'OPTIONS') {
      return true;
   }
   return IGNORED_PATTERNS.some((pattern) => antMatches(pattern, request.path));
}

/**
 * The headers Spring Security writes by default, plus `frameOptions().sameOrigin()` from the
 * h2-console allowance in the original configuration.
 */
export function securityHeaders() {
   return function doFilter(_request: Request, response: Response, next: NextFunction): void {
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('X-XSS-Protection', '1; mode=block');
      response.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
      response.setHeader('Pragma', 'no-cache');
      response.setHeader('Expires', '0');
      response.setHeader('X-Frame-Options', 'SAMEORIGIN');
      next();
   };
}

/** `authorizeRequests()` — evaluated in declaration order, first match wins. */
interface AuthorizationRule {
   readonly pattern: string;
   readonly authority?: string;
   readonly permitAll?: boolean;
}

const AUTHORIZATION_RULES: readonly AuthorizationRule[] = [
   { pattern: '/api/authenticate', permitAll: true },
   { pattern: '/api/person', authority: 'ROLE_USER' },
   { pattern: '/api/hiddenmessage', authority: 'ROLE_ADMIN' },
];

/**
 * `.anyRequest().authenticated()` combined with `ExceptionTranslationFilter`.
 *
 * The split between 401 and 403 is the subtle part: an *anonymous* caller who fails any rule is
 * sent to the authentication entry point (401, "Full authentication is required…"), while an
 * authenticated caller who merely lacks the authority gets the access-denied handler (403,
 * "Access is denied"). Because no rule matches unknown paths, `anyRequest()` also makes a
 * request for a nonexistent endpoint answer 401 rather than 404.
 */
export function authorizationFilter() {
   return function doFilter(request: Request, response: Response, next: NextFunction): void {
      const authentication = getContext().getAuthentication();
      const authenticated = authentication !== null && authentication.isAuthenticated();

      const rule = AUTHORIZATION_RULES.find((candidate) => antMatches(candidate.pattern, request.path));

      if (rule?.permitAll === true) {
         next();
         return;
      }

      if (!authenticated) {
         JwtAuthenticationEntryPoint.commence(
            request,
            response,
            new InsufficientAuthenticationException('Full authentication is required to access this resource'),
         );
         return;
      }

      if (rule?.authority !== undefined) {
         const granted = authentication.getAuthorities().some((a) => a.getAuthority() === rule.authority);
         if (!granted) {
            JwtAccessDeniedHandler.handle(request, response, new AccessDeniedException('Access is denied'));
            return;
         }
      }

      next();
   };
}
