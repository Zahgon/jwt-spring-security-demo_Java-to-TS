import { Router, type Request, type Response } from 'express';
import { APPLICATION_JSON_UTF8, writeBody } from '../util/http-response';
import { writeValueAsString } from '../util/jackson';

/**
 * Port of `PersonRestController`, mounted under `/api`.
 */
export function personRestController(): Router {
   const router = Router();

   router.get('/person', (_request: Request, response: Response) => {
      writeBody(response, 200, writeValueAsString(new Person('John Doe', 'john.doe@test.org')), APPLICATION_JSON_UTF8);
   });

   return router;
}

class Person {
   constructor(
      private readonly name: string,
      private readonly email: string,
   ) {}

   getName(): string {
      return this.name;
   }

   getEmail(): string {
      return this.email;
   }

   toJSON(): { name: string; email: string } {
      return { name: this.name, email: this.email };
   }
}
