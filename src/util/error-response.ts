import type { Request, Response } from 'express';
import { APPLICATION_JSON_UTF8, writeBody } from './http-response';
import { formatTimestamp, writeValueAsString } from './jackson';

/**
 * Reproduces `HttpServletResponse#sendError` as Spring Boot 2.1 renders it for a JSON client.
 *
 * `sendError` hands the request to the container's error dispatcher, which Spring Boot answers
 * with `BasicErrorController`. For an `application/json` caller that produces a body of
 * `timestamp`, `status`, `error`, `message` and `path`, in that order, pretty-printed by the
 * same Jackson mapper the rest of the application uses.
 */
const REASON_PHRASES: Readonly<Record<number, string>> = {
   400: 'Bad Request',
   401: 'Unauthorized',
   403: 'Forbidden',
   404: 'Not Found',
   500: 'Internal Server Error',
};

export function reasonPhrase(status: number): string {
   return REASON_PHRASES[status] ?? 'Error';
}

export function sendError(
   request: Request,
   response: Response,
   status: number,
   message: string,
   extra?: Record<string, unknown>,
   contentType?: string,
): void {
   if (response.headersSent) {
      return;
   }

   const body: Record<string, unknown> = {
      timestamp: formatTimestamp(new Date()),
      status,
      error: reasonPhrase(status),
      ...extra,
      message,
      path: request.originalUrl.split('?')[0],
   };

   writeBody(response, status, writeValueAsString(body), contentType ?? APPLICATION_JSON_UTF8);
}
