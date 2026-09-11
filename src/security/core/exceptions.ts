/**
 * The Spring Security exception types this application distinguishes.
 *
 * The distinction is not cosmetic: `ExceptionTranslationFilter` routes `AuthenticationException`
 * to the entry point (401) and `AccessDeniedException` to the access-denied handler (403), and
 * the exception's message becomes the `message` field of the error body.
 */
export class AuthenticationException extends Error {
   constructor(message: string) {
      super(message);
      this.name = new.target.name;
   }
}

export class BadCredentialsException extends AuthenticationException {}

export class UsernameNotFoundException extends AuthenticationException {}

/**
 * Raised by `ExceptionTranslationFilter` when an anonymous caller reaches a protected resource.
 * Spring's message — "Full authentication is required to access this resource" — is part of the
 * observable response body.
 */
export class InsufficientAuthenticationException extends AuthenticationException {}

/**
 * `DaoAuthenticationProvider` wraps any non-`UsernameNotFoundException` failure from the
 * `UserDetailsService` in this type, preserving the original message. That is how
 * `UserNotActivatedException` surfaces as a 401 carrying "User <login> was not activated".
 */
export class InternalAuthenticationServiceException extends AuthenticationException {
   constructor(
      message: string,
      override readonly cause?: unknown,
   ) {
      super(message);
   }
}

export class AccessDeniedException extends Error {
   constructor(message: string) {
      super(message);
      this.name = new.target.name;
   }
}

/** Thrown when a bean-validation constraint on a request body fails; renders as 400. */
export class MethodArgumentNotValidException extends Error {
   constructor(
      readonly objectName: string,
      readonly fieldErrors: readonly FieldError[],
   ) {
      super(`Validation failed for object='${objectName}'. Error count: ${fieldErrors.length}`);
      this.name = 'MethodArgumentNotValidException';
   }
}

export interface FieldError {
   readonly codes: readonly string[];
   readonly arguments: readonly unknown[];
   readonly defaultMessage: string;
   readonly objectName: string;
   readonly field: string;
   readonly rejectedValue: unknown;
   readonly bindingFailure: boolean;
   readonly code: string;
}
