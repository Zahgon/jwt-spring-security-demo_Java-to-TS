/**
 * A very small stand-in for SLF4J.
 *
 * The application only ever logs at debug/info/trace with SLF4J's `{}` placeholders, and
 * `application.yml` sets `logging.level.org.zerhusen.security: DEBUG`. Reproducing that much
 * keeps the log statements in the ported classes readable as direct translations rather than
 * pulling in a logging framework this demo does not need.
 */
export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LEVEL_ORDER: Record<LogLevel, number> = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4 };

/** Mirrors `logging.level.org.zerhusen.security: DEBUG` with an INFO root level. */
const CONFIGURED_LEVELS: ReadonlyArray<readonly [string, LogLevel]> = [
   ['org.zerhusen.security', 'DEBUG'],
   ['', 'INFO'],
];

function configuredLevel(name: string): LogLevel {
   for (const [prefix, level] of CONFIGURED_LEVELS) {
      if (prefix === '' || name === prefix || name.startsWith(`${prefix}.`)) {
         return level;
      }
   }
   return 'INFO';
}

function isEnabled(name: string, level: LogLevel): boolean {
   if (process.env['LOGGING_ENABLED'] === 'false') {
      return false;
   }
   return LEVEL_ORDER[level] >= LEVEL_ORDER[configuredLevel(name)];
}

/** Substitutes SLF4J's `{}` placeholders positionally. */
function format(message: string, args: unknown[]): string {
   let index = 0;
   return message.replace(/\{\}/g, () => (index < args.length ? String(args[index++]) : '{}'));
}

export interface Logger {
   trace(message: string, ...args: unknown[]): void;
   debug(message: string, ...args: unknown[]): void;
   info(message: string, ...args: unknown[]): void;
   warn(message: string, ...args: unknown[]): void;
   error(message: string, ...args: unknown[]): void;
}

export function getLogger(name: string): Logger {
   const emit = (level: LogLevel, message: string, args: unknown[]): void => {
      if (!isEnabled(name, level)) {
         return;
      }
      const line = `${new Date().toISOString()} ${level.padEnd(5)} --- [${name}] : ${format(message, args)}`;
      if (level === 'ERROR' || level === 'WARN') {
         console.error(line);
      } else {
         console.log(line);
      }
   };

   return {
      trace: (message, ...args) => emit('TRACE', message, args),
      debug: (message, ...args) => emit('DEBUG', message, args),
      info: (message, ...args) => emit('INFO', message, args),
      warn: (message, ...args) => emit('WARN', message, args),
      error: (message, ...args) => emit('ERROR', message, args),
   };
}
