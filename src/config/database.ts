import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resourcePath } from './properties';

/**
 * Stands in for the embedded H2 database plus Hibernate's `ddl-auto: create-drop`.
 *
 * The original runs an in-memory H2 instance whose schema Hibernate derives from the JPA
 * annotations, then seeds it from `import.sql`. Node ships an in-process SQLite engine
 * (`node:sqlite`) that fills the same niche and — importantly — is *synchronous*, so the
 * repositories keep the blocking signatures their JPA counterparts had instead of turning the
 * whole call graph async for a database that never leaves the process.
 *
 * The DDL below is the schema Hibernate generates for `User` and `Authority`: table and column
 * names come from the `@Table`/`@Column` annotations, and `USER_SEQ` reproduces the
 * `@SequenceGenerator` that backs the entity's identifier.
 */
const SCHEMA = `
CREATE TABLE "AUTHORITY" (
   "NAME" VARCHAR(50) NOT NULL,
   PRIMARY KEY ("NAME")
);

CREATE TABLE "USER" (
   "ID" BIGINT NOT NULL,
   "USERNAME" VARCHAR(50) UNIQUE,
   "PASSWORD" VARCHAR(100),
   "FIRSTNAME" VARCHAR(50),
   "LASTNAME" VARCHAR(50),
   "EMAIL" VARCHAR(50),
   "ACTIVATED" BOOLEAN NOT NULL,
   PRIMARY KEY ("ID")
);

CREATE TABLE "USER_AUTHORITY" (
   "USER_ID" BIGINT NOT NULL,
   "AUTHORITY_NAME" VARCHAR(50) NOT NULL,
   PRIMARY KEY ("USER_ID", "AUTHORITY_NAME"),
   FOREIGN KEY ("USER_ID") REFERENCES "USER" ("ID"),
   FOREIGN KEY ("AUTHORITY_NAME") REFERENCES "AUTHORITY" ("NAME")
);

CREATE TABLE "USER_SEQ" (
   "NEXT_VAL" BIGINT NOT NULL
);
INSERT INTO "USER_SEQ" ("NEXT_VAL") VALUES (1);
`;

/**
 * Splits `import.sql` into executable statements.
 *
 * Hibernate's single-line extractor treats one line as one statement and skips comments; the
 * leading `# noinspection` line in the source file is an IDE directive, not SQL, so it is
 * dropped here rather than being handed to the database.
 */
function importStatements(): string[] {
   return readFileSync(resourcePath('import.sql'), 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('--'))
      .map((line) => (line.endsWith(';') ? line.slice(0, -1) : line));
}

let database: DatabaseSync | undefined;

export function getDatabase(): DatabaseSync {
   if (database === undefined) {
      database = new DatabaseSync(':memory:');
      database.exec(SCHEMA);
      for (const statement of importStatements()) {
         database.exec(statement);
      }
   }
   return database;
}

/** Drops the in-memory database — the `create-drop` half of the Hibernate setting. */
export function closeDatabase(): void {
   database?.close();
   database = undefined;
}
