# Migration notes: Java/Spring Boot → TypeScript/Node

Source: `szerhusenBC/jwt-spring-security-demo` (Spring Boot 2.1.8, Java 11, 22 main classes /
6 test classes, 16 tests).

## Approach

The Java baseline was built and run first, and its behaviour recorded — every endpoint, every
error path, the exact bytes of the issued tokens — before any TypeScript was written. That
recording, not the source code alone, is what the port was written against, and it is preserved
in [`differential/`](differential/) so the comparison can be re-run.

## File map

| Java | TypeScript |
| --- | --- |
| `JwtDemoApplication` | `src/index.ts` + `src/application.ts` |
| `config/WebSecurityConfig` | `src/config/web-security.config.ts` |
| `config/CorsConfig` | `src/config/cors.config.ts` |
| `security/jwt/TokenProvider` | `src/security/jwt/token-provider.ts` |
| `security/jwt/JWTFilter` | `src/security/jwt/jwt.filter.ts` |
| `security/jwt/JWTConfigurer` | `src/security/jwt/jwt-configurer.ts` |
| `security/SecurityUtils` | `src/security/security-utils.ts` |
| `security/UserModelDetailsService` | `src/security/user-model-details.service.ts` |
| `security/JwtAuthenticationEntryPoint` | `src/security/jwt-authentication-entry-point.ts` |
| `security/JwtAccessDeniedHandler` | `src/security/jwt-access-denied-handler.ts` |
| `security/UserNotActivatedException` | `src/security/user-not-activated.exception.ts` |
| `security/model/{User,Authority}` | `src/security/model/{user,authority}.entity.ts` |
| `security/repository/*` | `src/security/repository/*.ts` |
| `security/service/UserService` | `src/security/service/user.service.ts` |
| `security/rest/*`, `rest/*` | `src/security/rest/*.ts`, `src/rest/*.ts` |
| Spring Security internals | `src/security/core/*.ts` |
| Jackson / Spring Boot error rendering | `src/util/jackson.ts`, `src/util/error-response.ts` |

Framework machinery the application depended on but did not own is reimplemented under
`src/security/core/` and `src/util/` — only the slice actually reached at runtime.

## Decisions worth knowing about

**`SecurityContextHolder` → `AsyncLocalStorage`.** Spring hangs the authentication off a
`ThreadLocal`, which works because each request owns a thread. Node has no such thread, so the
request-scoped half became an `AsyncLocalStorage` scope opened per request. That alone would
break `SecurityUtilsTest`, which calls `setContext` outside any request; a fallback slot,
consulted only when no async scope is active, restores that behaviour without letting state leak
between concurrent requests.

**Persistence stayed synchronous.** H2-in-memory was replaced with `node:sqlite`, which is both
in-process and synchronous. That keeps the repositories' blocking signatures — turning the call
graph `async` for a database that never leaves the process would have rippled through
`UserService`, `SecurityUtils` and the controllers for no benefit.

**Token compatibility required three non-defaults.** jjwt emits a bare `{"alg":"HS512"}` header,
writes no `iat`, and orders claims `sub, auth, exp`. `jsonwebtoken` adds `typ: "JWT"` and an
`iat` by default, so both are suppressed explicitly in `token-provider.ts`.

**Authority ordering differs by design, in two places.** The `auth` claim is sorted
(`ROLE_ADMIN,ROLE_USER`) because Spring's `UserDetails` keeps authorities in a `TreeSet`; the
`/api/user` body is *not* sorted (`ROLE_USER, ROLE_ADMIN`) because it serialises the entity's
own collection. Both orderings are reproduced.

**Jackson's pretty-printer is not `JSON.stringify`.** `INDENT_OUTPUT` uses `" : "` as the field
separator and an inline indenter for arrays, so arrays do not increase the indentation of the
objects inside them. `src/util/jackson.ts` reproduces this; without it every response body
differs from the original.

**Quirks preserved rather than fixed.** Two behaviours look like bugs and were kept, because
changing them would change the contract: `/api/user` throws (500) when the token names a user
who no longer exists, mirroring `Optional#get()`; and an ignored path with no matching static
file returns a bare, header-less 401 rather than a 404, which is what the original's error
re-dispatch through the security chain produces.

## Verification

- The 16 ported tests correspond one-to-one with the 16 JUnit tests, and pass.
- The differential harness reports no behavioural difference across 29 request scenarios.
  The two remaining textual differences are the position of the `Authorization` response header
  and the ordering of simultaneous validation errors — the latter being non-deterministic in the
  original itself. Both are documented in [`differential/README.md`](differential/README.md).

## Not carried over

`spring-boot-devtools` (restart-on-change; `npm run dev` covers it), the H2 web console, and the
unused `application.properties` left beside `application.yml` in the original. The `etc/`
screenshots, `LICENSE` and `.editorconfig` are carried over unchanged.
