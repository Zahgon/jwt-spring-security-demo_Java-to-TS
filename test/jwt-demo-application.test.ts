import { createApplication } from '../src/application';

/**
 * Port of `JwtDemoApplicationTest`.
 */
describe('JwtDemoApplication', () => {
   it('contextLoads', () => {
      // just test if the application context loads
      expect(createApplication()).toBeDefined();
   });
});
