/**
 * The slice of Spring Security's authentication model this application actually relies on:
 * `GrantedAuthority`, `UserDetails`, `Authentication` and the two token implementations.
 */

export interface GrantedAuthority {
   getAuthority(): string;
}

export class SimpleGrantedAuthority implements GrantedAuthority {
   constructor(private readonly role: string) {}

   getAuthority(): string {
      return this.role;
   }

   toString(): string {
      return this.role;
   }
}

export interface UserDetails {
   getUsername(): string;
   getPassword(): string;
   getAuthorities(): readonly GrantedAuthority[];
}

/**
 * Mirrors `org.springframework.security.core.userdetails.User`.
 *
 * The constructor sorts the authorities: Spring stores them in a `TreeSet` ordered by the
 * authority string. That ordering is observable — it is the order in which the roles appear in
 * the `auth` claim of the issued JWT (`ROLE_ADMIN,ROLE_USER`, not the entity's own order).
 */
export class UserDetailsImpl implements UserDetails {
   private readonly authorities: readonly GrantedAuthority[];

   constructor(
      private readonly username: string,
      private readonly password: string,
      authorities: readonly GrantedAuthority[],
   ) {
      this.authorities = [...authorities].sort((a, b) => {
         const left = a.getAuthority();
         const right = b.getAuthority();
         return left < right ? -1 : left > right ? 1 : 0;
      });
   }

   getUsername(): string {
      return this.username;
   }

   getPassword(): string {
      return this.password;
   }

   getAuthorities(): readonly GrantedAuthority[] {
      return this.authorities;
   }
}

export interface Authentication {
   getName(): string;
   getPrincipal(): unknown;
   getCredentials(): unknown;
   getAuthorities(): readonly GrantedAuthority[];
   isAuthenticated(): boolean;
}

export function isUserDetails(principal: unknown): principal is UserDetails {
   return (
      typeof principal === 'object' &&
      principal !== null &&
      typeof (principal as UserDetails).getUsername === 'function' &&
      typeof (principal as UserDetails).getAuthorities === 'function'
   );
}

/** Mirrors `UsernamePasswordAuthenticationToken`. */
export class UsernamePasswordAuthenticationToken implements Authentication {
   private readonly authorities: readonly GrantedAuthority[];
   private readonly authenticated: boolean;

   constructor(
      private readonly principal: unknown,
      private readonly credentials: unknown,
      authorities?: readonly GrantedAuthority[],
   ) {
      // The two-argument form builds an *unauthenticated* request token; supplying authorities
      // is what marks the token as trusted, exactly as in Spring Security.
      this.authorities = authorities ?? [];
      this.authenticated = authorities !== undefined;
   }

   getName(): string {
      if (isUserDetails(this.principal)) {
         return this.principal.getUsername();
      }
      return typeof this.principal === 'string' ? this.principal : String(this.principal);
   }

   getPrincipal(): unknown {
      return this.principal;
   }

   getCredentials(): unknown {
      return this.credentials;
   }

   getAuthorities(): readonly GrantedAuthority[] {
      return this.authorities;
   }

   isAuthenticated(): boolean {
      return this.authenticated;
   }
}
