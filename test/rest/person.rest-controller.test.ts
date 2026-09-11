import request from 'supertest';
import { setupRestControllerTest } from '../util/abstract-rest-controller-test';
import { getTokenForLogin } from '../util/login-utils';

/**
 * Port of `PersonRestControllerTest`.
 */
describe('PersonRestController', () => {
   const app = setupRestControllerTest();

   async function assertSuccessfulPersonRequest(token: string): Promise<void> {
      const response = await request(app())
         .get('/api/person')
         .set('Content-Type', 'application/json')
         .set('Authorization', `Bearer ${token}`)
         .expect(200);

      expect(JSON.parse(response.text)).toMatchObject({
         name: 'John Doe',
         email: 'john.doe@test.org',
      });
   }

   it('getPersonForUser', async () => {
      const token = await getTokenForLogin('user', 'password', app());

      await assertSuccessfulPersonRequest(token);
   });

   it('getPersonForAdmin', async () => {
      const token = await getTokenForLogin('admin', 'admin', app());

      await assertSuccessfulPersonRequest(token);
   });

   it('getPersonForAnonymous', async () => {
      await request(app()).get('/api/person').set('Content-Type', 'application/json').expect(401);
   });
});
