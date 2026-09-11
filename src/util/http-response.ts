import type { Response } from 'express';

/** The content type Spring's `MappingJackson2HttpMessageConverter` writes. */
export const APPLICATION_JSON_UTF8 = 'application/json;charset=UTF-8';

/**
 * Writes a response body verbatim.
 *
 * `res.send()` is avoided deliberately: it rewrites the `Content-Type` through Express's
 * charset normaliser (yielding `application/json; charset=utf-8`) and sets a `Content-Length`.
 * Ending the response directly preserves the exact header spelling and the chunked encoding
 * the original produced.
 */
export function writeBody(response: Response, status: number, body: string, contentType: string): void {
   response.status(status);
   response.setHeader('Content-Type', contentType);
   response.end(body);
}
