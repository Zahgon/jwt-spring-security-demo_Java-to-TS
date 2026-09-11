import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { corsFilter } from './config/cors.config';
import { getDatabase } from './config/database';
import { applicationProperties, resourcePath } from './config/properties';
import { authorizationFilter, isIgnored, securityHeaders } from './config/web-security.config';
import { adminProtectedRestController } from './rest/admin-protected.rest-controller';
import { personRestController } from './rest/person.rest-controller';
import { AccessDeniedException, AuthenticationException, MethodArgumentNotValidException } from './security/core/exceptions';
import { runWithNewContext } from './security/core/security-context-holder';
import { applyJwtConfigurer } from './security/jwt/jwt-configurer';
import { tokenProvider } from './security/jwt/token-provider';
import { JwtAccessDeniedHandler } from './security/jwt-access-denied-handler';
import { JwtAuthenticationEntryPoint } from './security/jwt-authentication-entry-point';
import { authenticationRestController } from './security/rest/authentication.rest-controller';
import { userRestController } from './security/rest/user.rest-controller';
import { sendError } from './util/error-response';

/**
 * Assembles the application the way Spring Boot's auto-configuration plus `WebSecurityConfig`
 * did. The middleware order below *is* the security filter chain, and it is load-bearing:
 *
 *   1. a fresh security context per request  (`SecurityContextPersistenceFilter`)
 *   2. CORS                                  (`addFilterBefore(corsFilter, …)`)
 *   3. security response headers             (`headers()`)
 *   4. the JWT filter                        (`apply(securityConfigurerAdapter())`)
 *   5. authorization                         (`authorizeRequests()`)
 *   6. the controllers
 *   7. exception translation                 (`exceptionHandling()`)
 *
 * Requests matching `web.ignoring()` skip steps 2–5 entirely.
 */
export function createApplication(): Express {
   const app = express();
   const properties = applicationProperties();

   // Eagerly initialise the datasource so the first request does not pay for the seed data,
   // mirroring Spring's eager `DataSource` bean.
   getDatabase();

   app.disable('x-powered-by');
   app.set('etag', false);

   // (1) Every request runs inside its own security context.
   app.use((_request, _response, next) => runWithNewContext(() => next()));

   app.use(express.json({ type: ['application/json', 'application/*+json'] }));

   // (2) CORS.
   //
   // Mounted on the application rather than inside the secured chain: `CorsFilter` is declared
   // as a `@Bean`, so Spring Boot registers it in the servlet filter chain for *every* request.
   // That placement is what lets it answer the OPTIONS preflight, which `web.ignoring()`
   // deliberately excludes from the security chain.
   app.use(corsFilter());

   const secured = express.Router();

   // (3) Spring Security's default response headers, with `frameOptions().sameOrigin()`.
   secured.use(securityHeaders());

   // (4) `JWTConfigurer` installs `JWTFilter` ahead of the authorization decision.
   applyJwtConfigurer(secured, tokenProvider());

   // (5) `authorizeRequests()` / `anyRequest().authenticated()`.
   secured.use(authorizationFilter());

   // (6) Controllers, all mapped under `/api`.
   secured.use('/api', authenticationRestController());
   secured.use('/api', userRestController());
   secured.use('/api', personRestController());
   secured.use('/api', adminProtectedRestController());

   // No handler matched. Spring's `DispatcherServlet` reports 404 through the same error
   // controller as everything else, so the body is the standard error JSON with
   // "No message available". The `hal+json` content type comes from
   // `spring-boot-starter-data-rest`, whose HAL converter wins content negotiation here.
   secured.use((request: Request, response: Response) => {
      sendError(request, response, 404, 'No message available', undefined, 'application/hal+json;charset=UTF-8');
   });

   // Static resources from `src/main/resources/static`. Spring's resource handler sits *behind*
   // the security chain, so only the paths `web.ignoring()` releases reach it without a token.
   const staticResources = express.static(resourcePath('static'), {
      index: 'index.html',
      // Match the original's plain resource responses: Spring sent neither ETag nor
      // Cache-Control for these files.
      etag: false,
      cacheControl: false,
   });

   app.use((request: Request, response: Response, next: NextFunction) => {
      if (isIgnored(request)) {
         staticResources(request, response, () => ignoredNotFound(response));
         return;
      }
      secured(request, response, next);
   });

   // (7) `ExceptionTranslationFilter` plus Spring MVC's default exception handling.
   app.use(errorHandler);

   Object.defineProperty(app, 'serverPort', { value: properties.server.port, enumerable: false });

   return app;
}

/**
 * An ignored path that matches no static resource.
 *
 * The original answers these with a bare, header-less 401: security releases the request, the
 * resource handler misses, and the resulting 404 is re-dispatched to `/error` — which is *not*
 * ignored, so the security chain rejects the error dispatch itself. The empty 401 is the
 * observable result of that round trip, reproduced here rather than "corrected" to a 404.
 */
function ignoredNotFound(response: Response): void {
   response.status(401);
   response.setHeader('Content-Length', '0');
   response.end();
}

/**
 * Maps escaped exceptions onto responses exactly as the Spring stack did: authentication
 * failures reach the entry point (401), authorization failures the access-denied handler (403),
 * bean-validation failures render Spring MVC's 400 body, and anything else is a 500.
 */
function errorHandler(error: unknown, request: Request, response: Response, next: NextFunction): void {
   if (response.headersSent) {
      next(error);
      return;
   }

   if (error instanceof AuthenticationException) {
      JwtAuthenticationEntryPoint.commence(request, response, error);
      return;
   }

   if (error instanceof AccessDeniedException) {
      JwtAccessDeniedHandler.handle(request, response, error);
      return;
   }

   if (error instanceof MethodArgumentNotValidException) {
      sendError(request, response, 400, error.message, { errors: error.fieldErrors });
      return;
   }

   // A malformed JSON body is a `HttpMessageNotReadableException` in Spring — also a 400.
   if (error instanceof SyntaxError && 'body' in error) {
      sendError(request, response, 400, 'JSON parse error', {});
      return;
   }

   sendError(request, response, 500, error instanceof Error ? error.message : String(error));
}
