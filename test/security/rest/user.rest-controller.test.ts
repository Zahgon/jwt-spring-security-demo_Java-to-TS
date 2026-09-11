import request from 'supertest';
import { clearContext } from '../../../src/security/core/security-context-holder';
import { setupRestControllerTest } from '../../util/abstract-rest-controller-test';
import { getTokenForLogin } from '../../util/login-utils';

/**
 * Port of `UserRestControllerTest`.
 */
describe('UserRestController', () => {
   const app = setupRestControllerTest();

   beforeEach(() => {
      clearContext();
   });

   it('getActualUserForUserWithToken', async () => {
      const token = await getTokenForLogin('user', 'password', app());

      const response = await request(app())
         .get('/api/user')
         .set('Content-Type', 'application/json')
         .set('Authorization', `Bearer ${token}`)
         .expect(200);

      expect(JSON.parse(response.text)).toMatchObject({
         username: 'user',
         firstname: 'user',
         lastname: 'user',
         email: 'enabled@user.com',
         authorities: [{ name: 'ROLE_USER' }],
      });
   });

   it('getActualUserForUserWithoutToken', async () => {
      await request(app()).get('/api/user').set('Content-Type', 'application/json').expect(401);
   });
});
