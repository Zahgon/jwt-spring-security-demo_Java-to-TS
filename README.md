# JWT Spring Security Demo — TypeScript

![Screenshot from running application](etc/screenshot-jwt-spring-security-demo.png?raw=true "Screenshot JWT Spring Security Demo")

## About

A TypeScript/Node port of [szerhusenBC/jwt-spring-security-demo](https://github.com/szerhusenBC/jwt-spring-security-demo),
a demo of **[JWT (JSON Web Token)](https://jwt.io)** authentication originally built with
**Spring Security** and **Spring Boot**.

The port preserves the original's HTTP contract rather than merely its feature list: status
codes, response bodies (including Jackson's pretty-printed `" : "` field separator), error
payloads, security headers and the issued tokens themselves are byte-compatible. A token minted
by the Java service verifies against this one and vice versa. See
[MIGRATION.md](MIGRATION.md) for how that was established and where the two intentionally
differ.

## Requirements

Node.js 22.5 or newer — the persistence layer uses the built-in `node:sqlite` module.

## Usage

```bash
npm install
npm start          # builds, then serves on http://localhost:8080
npm run dev        # watch mode
npm test           # the ported test suite
npm run typecheck
```

## Backend

There are three user accounts present to demonstrate the different levels of access to the
endpoints in the API and the different authorization exceptions:

```
Admin - admin:admin
User - user:password
Disabled - disabled:password (this user is deactivated)
```

There are four endpoints that are reasonable for the demo:

```
/api/authenticate - authentication endpoint with unrestricted access
/api/user         - returns detail information for an authenticated user (a valid JWT token must be present in the request header)
/api/persons      - an example endpoint that is restricted to authorized users with the authority 'ROLE_USER'
/api/hiddenmessage - an example endpoint that is restricted to authorized users with the authority 'ROLE_ADMIN'
```

## Frontend

The original's small JavaScript client is carried over unchanged at
[/src/resources/static/js/client.js](src/resources/static/js/client.js) and is served from the
application root.

### Generating password hashes for new users

Passwords are bcrypt-encoded, matching the original's `BCryptPasswordEncoder`; the seeded
`$2a$` hashes are reused as-is. You can generate new ones with the
[Bcrypt Generator](https://www.bcrypt-generator.com).

### Configuration

Settings live in [src/resources/application.yml](src/resources/application.yml), the same file
the Spring version used. Every value can be overridden with an environment variable using
Spring's relaxed-binding upper-case form, e.g. `JWT_BASE64_SECRET` or `SERVER_PORT`.

### Using another database

The demo uses an in-process SQLite database seeded from
[src/resources/import.sql](src/resources/import.sql), standing in for the original's embedded
H2 instance. Swapping in a networked database means replacing `src/config/database.ts` and the
two repositories in `src/security/repository/` — note that a client for such a database will be
asynchronous, so the repository signatures (and their callers) would need to become `async`.

## Docker

```bash
npm run build
docker build -f docker/Dockerfile -t jwt-spring-security-demo-ts .
docker run -p 8080:8080 jwt-spring-security-demo-ts
```

## Author

Original project by **Stephan Zerhusen** — https://github.com/szerhusenBC

## Copyright and license

The code is released under the [MIT license](LICENSE?raw=true).
