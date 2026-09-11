import { MethodArgumentNotValidException, type FieldError } from '../../core/exceptions';

/**
 * DTO for storing a user's credentials.
 *
 * Port of `LoginDto`, including the `@NotNull`/`@Size` constraints. Their failure shape is part
 * of the HTTP contract — Spring answers a violated `@Valid @RequestBody` with a 400 whose body
 * lists `MessageSourceResolvable` field errors — so `validate` builds the same structure rather
 * than a simplified one.
 */
export class LoginDto {
   username?: string | null;
   password?: string | null;
   rememberMe?: boolean | null;

   getUsername(): string {
      return this.username as string;
   }

   setUsername(username: string): void {
      this.username = username;
   }

   getPassword(): string {
      return this.password as string;
   }

   setPassword(password: string): void {
      this.password = password;
   }

   isRememberMe(): boolean | null | undefined {
      return this.rememberMe;
   }

   setRememberMe(rememberMe: boolean): void {
      this.rememberMe = rememberMe;
   }

   toString(): string {
      return `LoginVM{username='${this.username}', rememberMe=${this.rememberMe}}`;
   }
}

const OBJECT_NAME = 'loginDto';

interface SizeConstraint {
   readonly field: 'username' | 'password';
   readonly min: number;
   readonly max: number;
}

/**
 * Mirrors the annotations: `@Size(min = 1, max = 50)` / `@Size(min = 4, max = 100)`.
 *
 * Listed password-first to reproduce the order the original emits when both fields are absent.
 * Bean Validation hands Spring an unordered `Set<ConstraintViolation>`, so this ordering is an
 * observed property of the reference implementation rather than a specified one.
 */
const SIZE_CONSTRAINTS: readonly SizeConstraint[] = [
   { field: 'password', min: 4, max: 100 },
   { field: 'username', min: 1, max: 50 },
];

function resolvableField(field: string): Record<string, unknown> {
   return {
      codes: [`${OBJECT_NAME}.${field}`, field],
      arguments: null,
      defaultMessage: field,
      code: field,
   };
}

function notNullError(field: string): FieldError {
   return {
      codes: [`NotNull.${OBJECT_NAME}.${field}`, `NotNull.${field}`, 'NotNull.java.lang.String', 'NotNull'],
      arguments: [resolvableField(field)],
      defaultMessage: 'must not be null',
      objectName: OBJECT_NAME,
      field,
      rejectedValue: null,
      bindingFailure: false,
      code: 'NotNull',
   };
}

function sizeError(constraint: SizeConstraint, rejectedValue: string): FieldError {
   const { field, min, max } = constraint;
   return {
      codes: [`Size.${OBJECT_NAME}.${field}`, `Size.${field}`, 'Size.java.lang.String', 'Size'],
      // Hibernate reports the bounds as max then min, matching the original response body.
      arguments: [resolvableField(field), max, min],
      defaultMessage: `size must be between ${min} and ${max}`,
      objectName: OBJECT_NAME,
      field,
      rejectedValue,
      bindingFailure: false,
      code: 'Size',
   };
}

/** Throws `MethodArgumentNotValidException` when any constraint on the DTO is violated. */
export function validateLoginDto(dto: LoginDto): void {
   const errors: FieldError[] = [];

   for (const constraint of SIZE_CONSTRAINTS) {
      const value = dto[constraint.field];
      if (value === undefined || value === null) {
         errors.push(notNullError(constraint.field));
         continue;
      }
      if (value.length < constraint.min || value.length > constraint.max) {
         errors.push(sizeError(constraint, value));
      }
   }

   if (errors.length > 0) {
      throw new MethodArgumentNotValidException(OBJECT_NAME, errors);
   }
}
