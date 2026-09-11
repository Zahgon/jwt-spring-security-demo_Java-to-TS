import jwt, { type JwtPayload } from 'jsonwebtoken';
import { applicationProperties } from '../../config/properties';
import { getLogger } from '../../util/logger';
import {
   SimpleGrantedAuthority,
   UserDetailsImpl,
   UsernamePasswordAuthenticationToken,
   type Authentication,
   type GrantedAuthority,
} from '../core/authentication';

const log = getLogger('org.zerhusen.security.jwt.TokenProvider');

const AUTHORITIES_KEY = 'auth';

/**
 * Port of `org.zerhusen.security.jwt.TokenProvider` (jjwt).
 *
 * Tokens are byte-compatible with the ones the Java service issued, which matters because a
 * token minted by either implementation must verify in the other. Three jjwt details drive
 * that and none of them are `jsonwebtoken`'s defaults:
 *
 *   - jjwt emits a bare `{"alg":"HS512"}` header, whereas `jsonwebtoken` adds `"typ":"JWT"`;
 *   - jjwt only writes the claims it was given, so there is no `iat`;
 *   - the claim order is `sub`, `auth`, `exp`, matching the builder call order.
 */
export class TokenProvider {
   private readonly tokenValidityInMilliseconds: number;
   private readonly tokenValidityInMillisecondsForRememberMe: number;
   private key!: Buffer;

   constructor(
      private readonly base64Secret: string,
      tokenValidityInSeconds: number,
      tokenValidityInSecondsForRememberMe: number,
   ) {
      this.tokenValidityInMilliseconds = tokenValidityInSeconds * 1000;
      this.tokenValidityInMillisecondsForRememberMe = tokenValidityInSecondsForRememberMe * 1000;
   }

   /** `InitializingBean#afterPropertiesSet` — decodes the configured secret into the HMAC key. */
   afterPropertiesSet(): void {
      this.key = Buffer.from(this.base64Secret, 'base64');
   }

   createToken(authentication: Authentication, rememberMe: boolean): string {
      const authorities = authentication
         .getAuthorities()
         .map((authority: GrantedAuthority) => authority.getAuthority())
         .join(',');

      const now = Date.now();
      const validity = rememberMe
         ? now + this.tokenValidityInMillisecondsForRememberMe
         : now + this.tokenValidityInMilliseconds;

      return jwt.sign(
         {
            sub: authentication.getName(),
            [AUTHORITIES_KEY]: authorities,
            // jjwt stores `exp` with second precision, truncating toward zero.
            exp: Math.floor(validity / 1000),
         },
         this.key,
         {
            algorithm: 'HS512',
            // Suppresses `jsonwebtoken`'s default `typ` header so the header matches jjwt's.
            header: { alg: 'HS512', typ: undefined as unknown as string },
            noTimestamp: true,
         },
      );
   }

   getAuthentication(token: string): Authentication {
      const claims = jwt.verify(token, this.key, { algorithms: ['HS512'] }) as JwtPayload;

      const authorities = String(claims[AUTHORITIES_KEY] ?? '')
         .split(',')
         .map((authority) => new SimpleGrantedAuthority(authority));

      const principal = new UserDetailsImpl(String(claims.sub), '', authorities);

      return new UsernamePasswordAuthenticationToken(principal, token, authorities);
   }

   validateToken(authToken: string): boolean {
      try {
         jwt.verify(authToken, this.key, { algorithms: ['HS512'] });
         return true;
      } catch (error) {
         // `jsonwebtoken` reports through a small set of error names where jjwt used distinct
         // exception types; the mapping keeps the original log statements meaningful.
         const name = error instanceof Error ? error.name : '';
         const message = error instanceof Error ? error.message : String(error);

         if (name === 'TokenExpiredError') {
            log.info('Expired JWT token.');
            log.trace('Expired JWT token trace: {}', message);
         } else if (name === 'NotBeforeError') {
            log.info('Unsupported JWT token.');
            log.trace('Unsupported JWT token trace: {}', message);
         } else if (name === 'JsonWebTokenError') {
            log.info('Invalid JWT signature.');
            log.trace('Invalid JWT signature trace: {}', message);
         } else {
            log.info('JWT token compact of handler are invalid.');
            log.trace('JWT token compact of handler are invalid trace: {}', message);
         }
         return false;
      }
   }
}

let instance: TokenProvider | undefined;

/** The singleton the Spring container would have managed as a `@Component`. */
export function tokenProvider(): TokenProvider {
   if (instance === undefined) {
      const { jwt: properties } = applicationProperties();
      instance = new TokenProvider(
         properties.base64Secret,
         properties.tokenValidityInSeconds,
         properties.tokenValidityInSecondsForRememberMe,
      );
      instance.afterPropertiesSet();
   }
   return instance;
}
