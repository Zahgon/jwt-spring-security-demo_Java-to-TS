import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

/**
 * Externalised configuration, the counterpart of Spring Boot's `application.yml` binding.
 *
 * Spring resolves `${jwt.base64-secret}` and friends through the `Environment`; here the same
 * YAML document is parsed once and exposed as a typed object. Environment variables using
 * Spring's relaxed-binding upper-case form (e.g. `JWT_BASE64_SECRET`) still win, so the
 * application stays configurable without editing the file.
 */
export interface JwtProperties {
   readonly header: string;
   readonly base64Secret: string;
   readonly tokenValidityInSeconds: number;
   readonly tokenValidityInSecondsForRememberMe: number;
}

export interface ApplicationProperties {
   readonly server: { readonly port: number; readonly contextPath: string };
   readonly jwt: JwtProperties;
}

const RESOURCES_DIR = resolve(__dirname, '..', 'resources');

function envOverride(key: string, fallback: string): string {
   const value = process.env[key];
   return value === undefined || value === '' ? fallback : value;
}

function loadYaml(): Record<string, any> {
   const raw = readFileSync(resolve(RESOURCES_DIR, 'application.yml'), 'utf8');
   return (parse(raw) ?? {}) as Record<string, any>;
}

function build(): ApplicationProperties {
   const yaml = loadYaml();
   const jwt = (yaml['jwt'] ?? {}) as Record<string, any>;
   const server = (yaml['server'] ?? {}) as Record<string, any>;

   return {
      server: {
         port: Number(envOverride('SERVER_PORT', String(server['port'] ?? 8080))),
         contextPath: envOverride('SERVER_SERVLET_CONTEXT_PATH', server['servlet']?.['context-path'] ?? '/'),
      },
      jwt: {
         header: envOverride('JWT_HEADER', jwt['header']),
         base64Secret: envOverride('JWT_BASE64_SECRET', jwt['base64-secret']),
         tokenValidityInSeconds: Number(
            envOverride('JWT_TOKEN_VALIDITY_IN_SECONDS', String(jwt['token-validity-in-seconds'])),
         ),
         tokenValidityInSecondsForRememberMe: Number(
            envOverride(
               'JWT_TOKEN_VALIDITY_IN_SECONDS_FOR_REMEMBER_ME',
               String(jwt['token-validity-in-seconds-for-remember-me']),
            ),
         ),
      },
   };
}

let cached: ApplicationProperties | undefined;

export function applicationProperties(): ApplicationProperties {
   cached ??= build();
   return cached;
}

export function resourcePath(...segments: string[]): string {
   return resolve(RESOURCES_DIR, ...segments);
}
