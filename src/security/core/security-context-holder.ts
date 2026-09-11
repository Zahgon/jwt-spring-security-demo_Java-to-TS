import { AsyncLocalStorage } from 'node:async_hooks';
import type { Authentication } from './authentication';

/**
 * The counterpart of Spring Security's `SecurityContextHolder`.
 *
 * Spring's default strategy is a `ThreadLocal`: every request is served on its own thread, so
 * storing the authentication there isolates concurrent requests while still letting any code
 * deep in the call stack reach it without threading a parameter through.
 *
 * Node has no threads to hang that off, so the request-scoped half is an `AsyncLocalStorage`:
 * `runWithNewContext` opens a scope per request and every asynchronous continuation started
 * inside it sees its own context.
 *
 * The `ThreadLocal` analogy is not quite complete though. Code that runs *outside* any request —
 * unit tests calling `setContext` directly, or bootstrap code — still expects a context to
 * exist, which is what the main thread's `ThreadLocal` provided. `fallbackContext` plays that
 * role: it is consulted only when no async scope is active, so it can never leak between
 * concurrent requests.
 */
export interface SecurityContext {
   getAuthentication(): Authentication | null;
   setAuthentication(authentication: Authentication | null): void;
}

class SecurityContextImpl implements SecurityContext {
   private authentication: Authentication | null = null;

   getAuthentication(): Authentication | null {
      return this.authentication;
   }

   setAuthentication(authentication: Authentication | null): void {
      this.authentication = authentication;
   }
}

interface ContextHolder {
   context: SecurityContext;
}

const storage = new AsyncLocalStorage<ContextHolder>();

/** Stands in for the main thread's `ThreadLocal` slot when no request scope is active. */
let fallbackContext: SecurityContext | null = null;

export function createEmptyContext(): SecurityContext {
   return new SecurityContextImpl();
}

/**
 * Never returns null, matching Spring: an empty context is created on demand so callers can
 * always ask for `getAuthentication()` and simply get `null` back.
 */
export function getContext(): SecurityContext {
   const holder = storage.getStore();
   if (holder) {
      return holder.context;
   }
   fallbackContext ??= createEmptyContext();
   return fallbackContext;
}

export function setContext(context: SecurityContext): void {
   const holder = storage.getStore();
   if (holder) {
      holder.context = context;
      return;
   }
   fallbackContext = context;
}

export function clearContext(): void {
   const holder = storage.getStore();
   if (holder) {
      holder.context = createEmptyContext();
      return;
   }
   fallbackContext = null;
}

/**
 * Runs `callback` in a fresh, isolated security context — the equivalent of Spring's
 * `SecurityContextPersistenceFilter` establishing (and later clearing) the `ThreadLocal`
 * around a single request.
 */
export function runWithNewContext<T>(callback: () => T): T {
   return storage.run({ context: createEmptyContext() }, callback);
}

export const SecurityContextHolder = {
   createEmptyContext,
   getContext,
   setContext,
   clearContext,
   runWithNewContext,
};
