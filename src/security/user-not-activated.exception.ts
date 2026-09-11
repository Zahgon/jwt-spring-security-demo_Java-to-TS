import { AuthenticationException } from './core/exceptions';

/**
 * This exception is thrown in case of a not activated user trying to authenticate.
 */
export class UserNotActivatedException extends AuthenticationException {
   constructor(message: string) {
      super(message);
   }
}
