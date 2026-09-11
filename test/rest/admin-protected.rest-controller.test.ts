import request from 'supertest';
import { setupRestControllerTest } from '../util/abstract-rest-controller-test';
import { getTokenForLogin } from '../util/login-utils';

/**
 * Port of `AdminProtectedRestControllerTest`.
 */
describe('AdminProtectedRestController', () => {
   const app = setupRestControllerTest();

   it('getAdminProtectedGreetingForUser', async () => {
      const token = await getTokenForLogin('user', 'password', app());

      await request(app())
         .get('/api/hiddenmessage')
         .set('Content-Type', 'application/json')
         .set('Authorization', `Bearer ${token}`)
         .expect(403);
   });

   it('getAdminProtectedGreetingForAdmin', async () => {
      const token = await getTokenForLogin('admin', 'admin', app());

      const response = await request(app())
         .get('/api/hiddenmessage')
         .set('Content-Type', 'application/json')
         .set('Authorization', `Bearer ${token}`)
         .expect(200);

      expect(JSON.parse(response.text)).toMatchObject({ message: 'this is a hidden message!' });
   });

   it('getAdminProtectedGreetingForAnonymous', async () => {
      await request(app()).get('/api/hiddenmessage').set('Content-Type', 'application/json').expect(401);
   });
});
