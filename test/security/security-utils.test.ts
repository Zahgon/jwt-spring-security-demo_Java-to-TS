import { UsernamePasswordAuthenticationToken } from '../../src/security/core/authentication';
import {
   clearContext,
   createEmptyContext,
   setContext,
} from '../../src/security/core/security-context-holder';
import { getCurrentUsername } from '../../src/security/security-utils';

/**
 * Port of `SecurityUtilsTest`.
 *
 * The Java tests share a `ThreadLocal` and happen to pass because JUnit ran the
 * no-authentication case first. Jest runs in declaration order, so the context is cleared
 * explicitly between tests rather than relying on that ordering.
 */
describe('SecurityUtils', () => {
   beforeEach(() => {
      clearContext();
   });

   it('getCurrentUsername', () => {
      const securityContext = createEmptyContext();
      securityContext.setAuthentication(new UsernamePasswordAuthenticationToken('admin', 'admin'));
      setContext(securityContext);

      const username = getCurrentUsername();

      expect(username).toBe('admin');
   });

   it('getCurrentUsernameForNoAuthenticationInContext', () => {
      const username = getCurrentUsername();

      expect(username).toBeUndefined();
   });
});
