import type { Router } from 'express';
import { jwtFilter } from './jwt.filter';
import type { TokenProvider } from './token-provider';

/**
 * Port of `JWTConfigurer`.
 *
 * The Java class exists purely to register `JWTFilter` ahead of
 * `UsernamePasswordAuthenticationFilter` in the Spring Security chain. Express has no filter
 * registry to address by type, so "before the authentication filter" becomes "mounted before
 * the authorization middleware" — the ordering is enforced by the call site in
 * `web-security.config.ts`.
 */
export function applyJwtConfigurer(router: Router, tokenProvider: TokenProvider): void {
   router.use(jwtFilter(tokenProvider));
}
