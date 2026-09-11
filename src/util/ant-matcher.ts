/**
 * Port of Spring's `AntPathMatcher`, restricted to the pattern vocabulary this application uses:
 * `?` (one character, not `/`), `*` (any run of characters within one path segment) and `**`
 * (any number of segments).
 *
 * `WebSecurityConfig` relies on the distinction between the two star forms — `/*.html` must
 * match only top-level pages while `/**\/*.html` reaches nested ones — so the two cannot be
 * collapsed into a single wildcard.
 */
function toRegExp(pattern: string): RegExp {
   let source = '';
   let index = 0;

   while (index < pattern.length) {
      const char = pattern[index]!;

      if (char === '*') {
         const isDoubleStar = pattern[index + 1] === '*';
         if (isDoubleStar) {
            // `/**` swallows the separator too, so `/a/**` matches both `/a` and `/a/b/c`.
            if (source.endsWith('/')) {
               source = `${source.slice(0, -1)}(?:/.*)?`;
            } else {
               source += '.*';
            }
            index += 2;
            // A trailing separator after `**` is already covered by the group above.
            if (pattern[index] === '/') {
               index += 1;
               source += '/?';
            }
            continue;
         }
         source += '[^/]*';
         index += 1;
         continue;
      }

      if (char === '?') {
         source += '[^/]';
         index += 1;
         continue;
      }

      source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
      index += 1;
   }

   return new RegExp(`^${source}$`);
}

const cache = new Map<string, RegExp>();

export function antMatches(pattern: string, path: string): boolean {
   let regexp = cache.get(pattern);
   if (regexp === undefined) {
      regexp = toRegExp(pattern);
      cache.set(pattern, regexp);
   }
   return regexp.test(path);
}
