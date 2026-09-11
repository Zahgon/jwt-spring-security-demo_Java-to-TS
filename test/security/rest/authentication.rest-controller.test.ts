import request from 'supertest';
import { setupRestControllerTest } from '../../util/abstract-rest-controller-test';

/**
 * Port of `AuthenticationRestControllerTest`.
 */
describe('AuthenticationRestController', () => {
   const app = setupRestControllerTest();

   it('successfulAuthenticationWithUser', async () => {
      const response = await request(app())
         .post('/api/authenticate')
         .set('Content-Type', 'application/json')
         .send('{"password": "password", "username": "user"}')
         .expect(200);

      expect(response.text).toContain('id_token');
   });

   it('successfulAuthenticationWithAdmin', async () => {
      const response = await request(app())
         .post('/api/authenticate')
         .set('Content-Type', 'application/json')
         .send('{"password": "admin", "username": "admin"}')
         .expect(200);

      expect(response.text).toContain('id_token');
   });

   it('unsuccessfulAuthenticationWithDisabled', async () => {
      const response = await request(app())
         .post('/api/authenticate')
         .set('Content-Type', 'application/json')
         .send('{"password": "password", "username": "disabled"}')
         .expect(401);

      expect(response.text).not.toContain('id_token');
   });

   it('unsuccessfulAuthenticationWithWrongPassword', async () => {
      const response = await request(app())
         .post('/api/authenticate')
         .set('Content-Type', 'application/json')
         .send('{"password": "wrong", "username": "user"}')
         .expect(401);

      expect(response.text).not.toContain('id_token');
   });

   it('unsuccessfulAuthenticationWithNotExistingUser', async () => {
      const response = await request(app())
         .post('/api/authenticate')
         .set('Content-Type', 'application/json')
         .send('{"password": "password", "username": "not_existing"}')
         .expect(401);

      expect(response.text).not.toContain('id_token');
   });
});
