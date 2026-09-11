import type { Express } from 'express';
import { createApplication } from '../../src/application';
import { clearContext } from '../../src/security/core/security-context-holder';

/**
 * Port of `AbstractRestControllerTest`.
 *
 * `@SpringBootTest` + `@AutoConfigureMockMvc` gave every test class a fully wired application
 * and a `MockMvc` to drive it without opening a socket; `supertest` against the Express app
 * fills the same role. The `@Before` hook that clears the security context is preserved.
 */
export function setupRestControllerTest(): () => Express {
   let app: Express;

   beforeAll(() => {
      app = createApplication();
   });

   beforeEach(() => {
      clearContext();
   });

   return () => app;
}
