import type { Request, Response } from 'express';
import { sendError } from '../util/error-response';
import type { AuthenticationException } from './core/exceptions';

/**
 * Port of `JwtAuthenticationEntryPoint`.
 */
export const JwtAuthenticationEntryPoint = {
   commence(request: Request, response: Response, authException: AuthenticationException): void {
      // This is invoked when user tries to access a secured REST resource without supplying any credentials
      // We should just send a 401 Unauthorized response because there is no 'login page' to redirect to
      // Here you can place any message you want
      sendError(request, response, 401, authException.message);
   },
};
