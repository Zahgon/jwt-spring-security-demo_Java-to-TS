import { Router, type Request, type Response } from 'express';
import { APPLICATION_JSON_UTF8, writeBody } from '../../util/http-response';
import { writeValueAsString } from '../../util/jackson';
import { UserService } from '../service/user.service';

/**
 * Port of `UserRestController`, mounted under `/api`.
 */
export function userRestController(): Router {
   const router = Router();

   router.get('/user', (_request: Request, response: Response) => {
      const user = UserService.getUserWithAuthorities();
      if (user === undefined) {
         // `Optional#get()` on an empty Optional — a `NoSuchElementException`, which Spring
         // surfaces as a 500. Preserved rather than "fixed" so the ported endpoint fails the
         // same way the original does.
         throw new Error('No value present');
      }
      writeBody(response, 200, writeValueAsString(user), APPLICATION_JSON_UTF8);
   });

   return router;
}
