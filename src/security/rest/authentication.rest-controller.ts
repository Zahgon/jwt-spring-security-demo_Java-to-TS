import { Router, type Request, type Response } from 'express';
import { authenticationManager } from '../core/authentication-manager';
import { UsernamePasswordAuthenticationToken } from '../core/authentication';
import { getContext } from '../core/security-context-holder';
import { AUTHORIZATION_HEADER } from '../jwt/jwt.filter';
import { tokenProvider } from '../jwt/token-provider';
import { APPLICATION_JSON_UTF8, writeBody } from '../../util/http-response';
import { writeValueAsString } from '../../util/jackson';
import { LoginDto, validateLoginDto } from './dto/login.dto';

/**
 * Controller to authenticate users.
 *
 * Port of `AuthenticationRestController`, mounted under `/api`.
 */
export function authenticationRestController(): Router {
   const router = Router();

   router.post('/authenticate', (request: Request, response: Response) => {
      const loginDto = Object.assign(new LoginDto(), request.body ?? {});
      validateLoginDto(loginDto);

      const authenticationToken = new UsernamePasswordAuthenticationToken(
         loginDto.getUsername(),
         loginDto.getPassword(),
      );

      const authentication = authenticationManager.authenticate(authenticationToken);
      getContext().setAuthentication(authentication);

      const rememberMe = loginDto.isRememberMe() == null ? false : Boolean(loginDto.isRememberMe());
      const jwt = tokenProvider().createToken(authentication, rememberMe);

      response.setHeader(AUTHORIZATION_HEADER, `Bearer ${jwt}`);
      writeBody(response, 200, writeValueAsString(new JWTToken(jwt)), APPLICATION_JSON_UTF8);
   });

   return router;
}

/**
 * Object to return as body in JWT Authentication.
 *
 * `@JsonProperty("id_token")` renames the field on the wire.
 */
class JWTToken {
   constructor(private readonly idToken: string) {}

   getIdToken(): string {
      return this.idToken;
   }

   toJSON(): { id_token: string } {
      return { id_token: this.idToken };
   }
}
