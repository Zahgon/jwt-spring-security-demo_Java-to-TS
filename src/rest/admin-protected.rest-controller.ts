import { Router, type Request, type Response } from 'express';
import { APPLICATION_JSON_UTF8, writeBody } from '../util/http-response';
import { writeValueAsString } from '../util/jackson';

/**
 * Port of `AdminProtectedRestController`, mounted under `/api`.
 */
export function adminProtectedRestController(): Router {
   const router = Router();

   router.get('/hiddenmessage', (_request: Request, response: Response) => {
      writeBody(response, 200, writeValueAsString(new HiddenMessage('this is a hidden message!')), APPLICATION_JSON_UTF8);
   });

   return router;
}

class HiddenMessage {
   constructor(private readonly message: string) {}

   getMessage(): string {
      return this.message;
   }

   toJSON(): { message: string } {
      return { message: this.message };
   }
}
