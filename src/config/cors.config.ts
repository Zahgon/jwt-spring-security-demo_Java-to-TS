import type { NextFunction, Request, Response } from 'express';

/**
 * Port of `CorsConfig`.
 *
 * The Java bean registers a `CorsFilter` for `/api/**` with credentials enabled and `*` for
 * origins, headers and methods. Spring's filter reflects the request's own `Origin` back rather
 * than literally emitting `*` — required, because `*` and `Allow-Credentials: true` are not a
 * legal combination — and answers preflights itself with a 200 and an empty body.
 */
function matchesApiPath(path: string): boolean {
   return path === '/api' || path.startsWith('/api/');
}

export function corsFilter() {
   return function doFilter(request: Request, response: Response, next: NextFunction): void {
      if (!matchesApiPath(request.path)) {
         next();
         return;
      }

      const origin = request.header('Origin');
      if (origin === undefined) {
         // Not a CORS request: Spring's `DefaultCorsProcessor` returns before touching the
         // response, so no `Vary` headers are emitted either.
         next();
         return;
      }

      response.setHeader('Vary', ['Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers']);

      response.setHeader('Access-Control-Allow-Origin', origin);

      const requestMethod = request.header('Access-Control-Request-Method');
      if (request.method === 'OPTIONS' && requestMethod !== undefined) {
         // `DefaultCorsProcessor` writes these in a fixed order: origin, methods, headers,
         // then credentials.
         response.setHeader('Access-Control-Allow-Methods', requestMethod);
         const requestHeaders = request.header('Access-Control-Request-Headers');
         if (requestHeaders !== undefined) {
            response.setHeader('Access-Control-Allow-Headers', requestHeaders);
         }
         response.setHeader('Access-Control-Allow-Credentials', 'true');
         // A preflight is answered here and never reaches the rest of the chain.
         response.status(200).setHeader('Content-Length', '0');
         response.end();
         return;
      }

      response.setHeader('Access-Control-Allow-Credentials', 'true');
      next();
   };
}
