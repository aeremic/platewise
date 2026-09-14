import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const drizzleDir = join(__dirname, '../../../drizzle');
const migrationFiles = readdirSync(drizzleDir).filter((f) => f.endsWith('.sql'));

/**
 * Users' food diaries live only on their phones, so a migration must never lose data.
 * drizzle-kit rewrites SQLite tables (`__new_*` + DROP) for some schema changes, e.g. altering a
 * column; those must be redesigned as additive changes instead.
 */
const DESTRUCTIVE = [
  /\bDROP\s+(TABLE|COLUMN|INDEX|VIEW|TRIGGER)\b/i,
  /\bALTER\s+TABLE\s+\S+\s+(DROP|RENAME)\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bTRUNCATE\b/i,
  /`?__new_/i,
];

describe('drizzle migrations', () => {
  it('exist', () => {
    expect(migrationFiles.length).toBeGreaterThan(0);
  });

  it.each(migrationFiles)('%s only adds schema and data', (file) => {
    const sql = readFileSync(join(drizzleDir, file), 'utf8')
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');
    for (const pattern of DESTRUCTIVE) {
      expect({ file, destructive: pattern.test(sql) }).toEqual({ file, destructive: false });
    }
  });

  it('are all registered in the journal', () => {
    const journal = JSON.parse(readFileSync(join(drizzleDir, 'meta/_journal.json'), 'utf8')) as {
      entries: { tag: string }[];
    };
    expect(journal.entries.map((e) => `${e.tag}.sql`).sort()).toEqual([...migrationFiles].sort());
  });
});
