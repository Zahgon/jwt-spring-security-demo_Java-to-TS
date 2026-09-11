/**
 * Serialisation compatible with the Jackson `ObjectMapper` the Spring application used.
 *
 * `application.yml` enables `spring.jackson.serialization.INDENT_OUTPUT`, which installs
 * Jackson's `DefaultPrettyPrinter`. That printer is not the same as `JSON.stringify(v, null, 2)`:
 *
 *   - the field separator is `" : "` (space on both sides of the colon), not `": "`;
 *   - objects are indented two spaces per *object* nesting level;
 *   - arrays use a `FixedSpaceIndenter`, so they stay inline (`[ a, b ]`) and, crucially, do
 *     not contribute to the indentation level of the values they contain;
 *   - empty containers render as `{ }` and `[ ]`.
 *
 * Reproducing this keeps the migrated service byte-compatible with the original responses.
 */

const INDENT_UNIT = '  ';

function isPlainObject(value: unknown): value is Record<string, unknown> {
   return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Serialises `value` the way Jackson's `DefaultPrettyPrinter` does.
 *
 * `depth` counts enclosing *objects* only, mirroring Jackson's `_nesting` counter, which the
 * inline array indenter leaves untouched.
 */
function write(value: unknown, depth: number): string {
   if (value === null || value === undefined) {
      return 'null';
   }
   // Honour `toJSON()` the way `JSON.stringify` does. The ported entities and DTOs use it to
   // declare their serialised shape, which is where `@JsonIgnore` and `@JsonProperty` renames
   // such as `id_token` are expressed.
   if (typeof (value as { toJSON?: unknown }).toJSON === 'function') {
      return write((value as { toJSON(): unknown }).toJSON(), depth);
   }
   if (Array.isArray(value)) {
      const items = value.filter((item) => item !== undefined);
      if (items.length === 0) {
         return '[ ]';
      }
      return `[ ${items.map((item) => write(item, depth)).join(', ')} ]`;
   }
   if (isPlainObject(value)) {
      const entries = Object.entries(value).filter(([, v]) => v !== undefined);
      if (entries.length === 0) {
         return '{ }';
      }
      const inner = INDENT_UNIT.repeat(depth + 1);
      const outer = INDENT_UNIT.repeat(depth);
      const fields = entries
         .map(([key, v]) => `${inner}${JSON.stringify(key)} : ${write(v, depth + 1)}`)
         .join(',\n');
      return `{\n${fields}\n${outer}}`;
   }
   return JSON.stringify(value);
}

export function writeValueAsString(value: unknown): string {
   return write(value, 0);
}

/**
 * Renders a timestamp the way Spring Boot 2.1 serialises the `timestamp` error attribute:
 * `yyyy-MM-dd'T'HH:mm:ss.SSSZ` in UTC, e.g. `2026-09-07T05:40:45.661+0000`.
 */
export function formatTimestamp(date: Date): string {
   return `${date.toISOString().replace('Z', '')}+0000`;
}
