import type { Request, Response } from 'express';
import { sendError } from '../util/error-response';
import type { AccessDeniedException } from './core/exceptions';

/**
 * Port of `JwtAccessDeniedHandler`.
 */
export const JwtAccessDeniedHandler = {
   handle(request: Request, response: Response, accessDeniedException: AccessDeniedException): void {
      // This is invoked when user tries to access a secured REST resource without the necessary authorization
      // We should just send a 403 Forbidden response because there is no 'error' page to redirect to
      // Here you can place any message you want
      sendError(request, response, 403, accessDeniedException.message);
   },
};
