/**
 * Port of Hibernate Validator's `EmailValidator`, which `UserModelDetailsService` uses to decide
 * whether a login should be looked up as an e-mail address or as a username.
 *
 * Only the structural checks that can change that decision are reproduced: split on the last
 * `@`, a local part of at most 64 characters built from the permitted atoms (or a quoted
 * string), and a syntactically valid domain. Hibernate additionally accepts a bracketed IP
 * literal domain, which is honoured here too.
 */
const LOCAL_PART_ATOM = "[a-z0-9!#$%&'*+/=?^_`{|}~\\u0080-\\uFFFF-]";
const LOCAL_PART_INSIDE_QUOTES_ATOM = `(?:[a-z0-9!#$%&'*+/=?^_\`{|}~\\u0080-\\uFFFF.\\s-]|\\\\\\\\|\\\\\")`;

const LOCAL_PART_PATTERN = new RegExp(
   `^(?:${LOCAL_PART_ATOM}+|\"${LOCAL_PART_INSIDE_QUOTES_ATOM}+\")` +
      `(?:\\.(?:${LOCAL_PART_ATOM}+|\"${LOCAL_PART_INSIDE_QUOTES_ATOM}+\"))*$`,
   'i',
);

const DOMAIN_LABEL = '[a-z\\u0080-\\uFFFF0-9!#$%&\'*+/=?^_`{|}~]';
const DOMAIN_PATTERN = new RegExp(
   `^${DOMAIN_LABEL}(?:[${DOMAIN_LABEL.slice(1, -1)}-]*${DOMAIN_LABEL})?` +
      `(?:\\.${DOMAIN_LABEL}(?:[${DOMAIN_LABEL.slice(1, -1)}-]*${DOMAIN_LABEL})?)*$`,
   'i',
);

const MAX_LOCAL_PART_LENGTH = 64;

function isValidDomain(domain: string): boolean {
   // A bracketed literal such as `[192.168.0.1]` — Hibernate defers these to its IP checks.
   if (domain.startsWith('[') && domain.endsWith(']')) {
      return domain.length > 2;
   }
   if (domain.length === 0 || domain.length > 255) {
      return false;
   }
   if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
      return false;
   }
   if (domain.startsWith('-') || domain.endsWith('-')) {
      return false;
   }
   return DOMAIN_PATTERN.test(domain);
}

/** Hibernate's validator treats `null` as valid; the caller decides whether that is acceptable. */
export function isValidEmail(value: string | null | undefined): boolean {
   if (value === null || value === undefined) {
      return true;
   }
   if (value.length === 0) {
      return true;
   }

   const splitPosition = value.lastIndexOf('@');
   if (splitPosition < 0) {
      return false;
   }

   const localPart = value.substring(0, splitPosition);
   const domainPart = value.substring(splitPosition + 1);

   if (localPart.length === 0 || localPart.length > MAX_LOCAL_PART_LENGTH) {
      return false;
   }
   if (!LOCAL_PART_PATTERN.test(localPart)) {
      return false;
   }
   return isValidDomain(domainPart);
}
