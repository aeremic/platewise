import { backupDatabaseSync, openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import journal from '../../drizzle/meta/_journal.json';

/**
 * Copies the database before any pending migration runs, so a failed or faulty migration can
 * never cost the user their diary. One backup per schema version:
 * `platewise-backup-<applied migrations>.db` next to the main database. Fresh installs (nothing
 * to protect) and up-to-date databases are skipped. Never throws: a failed backup must not
 * block the app from opening.
 */
export function backupBeforeMigrations(db: SQLiteDatabase, databaseName: string): void {
  try {
    const hasMigrationsTable = db.getFirstSync<{ n: number }>(
      "SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'",
    );
    if (!hasMigrationsTable?.n) return;

    const applied = db.getFirstSync<{ n: number }>('SELECT count(*) AS n FROM __drizzle_migrations')?.n ?? 0;
    if (applied >= journal.entries.length) return;

    const backupName = databaseName.replace(/\.db$/, `-backup-${applied}.db`);
    const backup = openDatabaseSync(backupName);
    try {
      const existing = backup.getFirstSync<{ n: number }>("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table'");
      // Keep the first backup taken for this version (e.g. if the app is relaunched after a failure).
      if (!existing?.n) {
        backupDatabaseSync({ sourceDatabase: db, sourceDatabaseName: 'main', destDatabase: backup, destDatabaseName: 'main' });
      }
    } finally {
      backup.closeSync();
    }
  } catch (error) {
    console.warn('Database backup before migration failed', error);
  }
}
