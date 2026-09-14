import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import { backupBeforeMigrations } from './backup';
import * as schema from './schema';

export const DATABASE_NAME = 'platewise.db';

export const sqlite = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
sqlite.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
backupBeforeMigrations(sqlite, DATABASE_NAME);

export const db = drizzle(sqlite, { schema });

export type TableName = 'categories' | 'entries' | 'daily_goals';
