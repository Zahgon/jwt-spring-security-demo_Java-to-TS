import { getDatabase } from '../../config/database';
import { Authority } from '../model/authority.entity';

/**
 * Spring Data JPA repository for the {@link Authority} entity.
 *
 * Carried over from the original, where it is likewise declared but not consumed by any
 * component — keeping it preserves the repository surface of the migrated application.
 */
export const AuthorityRepository = {
   findAll(): Authority[] {
      const rows = getDatabase()
         .prepare('SELECT "NAME" FROM "AUTHORITY" ORDER BY rowid')
         .all() as unknown as Array<{ NAME: string }>;
      return rows.map((row) => new Authority(row.NAME));
   },

   findById(name: string): Authority | undefined {
      const row = getDatabase()
         .prepare('SELECT "NAME" FROM "AUTHORITY" WHERE "NAME" = ?')
         .get(name) as unknown as { NAME: string } | undefined;
      return row === undefined ? undefined : new Authority(row.NAME);
   },
};
