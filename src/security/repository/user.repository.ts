import { getDatabase } from '../../config/database';
import { Authority } from '../model/authority.entity';
import { User } from '../model/user.entity';

interface UserRow {
   ID: number;
   USERNAME: string;
   PASSWORD: string;
   FIRSTNAME: string;
   LASTNAME: string;
   EMAIL: string;
   ACTIVATED: number;
}

function toUser(row: UserRow, authorities: Authority[]): User {
   const user = new User();
   user.setId(row.ID);
   user.setUsername(row.USERNAME);
   user.setPassword(row.PASSWORD);
   user.setFirstname(row.FIRSTNAME);
   user.setLastname(row.LASTNAME);
   user.setEmail(row.EMAIL);
   user.setActivated(row.ACTIVATED === 1);
   user.setAuthorities(authorities);
   return user;
}

/**
 * Loads the authorities joined to a user.
 *
 * The two finder methods below carry `@EntityGraph(attributePaths = "authorities")` in the
 * original, which tells Hibernate to fetch the association eagerly in the same round trip
 * rather than lazily on first access. Doing it here, unconditionally, gives the returned
 * `User` the same fully-populated shape.
 */
function findAuthorities(userId: number): Authority[] {
   const rows = getDatabase()
      .prepare('SELECT "AUTHORITY_NAME" AS NAME FROM "USER_AUTHORITY" WHERE "USER_ID" = ? ORDER BY rowid')
      .all(userId) as unknown as Array<{ NAME: string }>;
   return rows.map((row) => new Authority(row.NAME));
}

/**
 * Port of the Spring Data `UserRepository`. Spring derives the SQL from the method names; the
 * equivalent queries are spelled out here.
 */
export const UserRepository = {
   /** `Optional<User> findOneWithAuthoritiesByUsername(String username)` */
   findOneWithAuthoritiesByUsername(username: string): User | undefined {
      const row = getDatabase()
         .prepare('SELECT * FROM "USER" WHERE "USERNAME" = ?')
         .get(username) as unknown as UserRow | undefined;
      return row === undefined ? undefined : toUser(row, findAuthorities(row.ID));
   },

   /** `Optional<User> findOneWithAuthoritiesByEmailIgnoreCase(String email)` */
   findOneWithAuthoritiesByEmailIgnoreCase(email: string): User | undefined {
      const row = getDatabase()
         .prepare('SELECT * FROM "USER" WHERE UPPER("EMAIL") = UPPER(?)')
         .get(email) as unknown as UserRow | undefined;
      return row === undefined ? undefined : toUser(row, findAuthorities(row.ID));
   },

   findAll(): User[] {
      const rows = getDatabase().prepare('SELECT * FROM "USER" ORDER BY "ID"').all() as unknown as UserRow[];
      return rows.map((row) => toUser(row, findAuthorities(row.ID)));
   },
};
