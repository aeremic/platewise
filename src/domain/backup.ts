import type { HealthLevel } from './health';

/**
 * Portable backup of everything the user entered: categories (including hidden and removed
 * ones, so past entries still resolve), entries and the goal history. Plain JSON, identical on
 * iOS and Android. Importing replaces all data, keeping ids so references stay intact.
 *
 * `schemaVersion` is the number of database migrations the exporting app had. Older files
 * import (fields added later get their defaults); files from a newer app are rejected.
 */

export const BACKUP_APP = 'platewise';
export const BACKUP_FORMAT_VERSION = 1;

export type BackupCategory = {
  id: number;
  name: string;
  emoji: string | null;
  health: HealthLevel;
  sortOrder: number;
  seedKey: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  portionLabel: string | null;
  kcal: number | null;
  fiberG: number | null;
  sugarG: number | null;
};

export type BackupEntry = {
  id: number;
  date: string;
  categoryId: number;
  mealType: string | null;
  note: string | null;
  createdAt: string;
  portions: number;
  kcal: number | null;
  fiberG: number | null;
  sugarG: number | null;
};

export type BackupGoal = {
  id: number;
  effectiveFrom: string;
  kcalMax: number | null;
  fiberMin: number | null;
  sugarMax: number | null;
  createdAt: string;
};

export type BackupData = {
  categories: BackupCategory[];
  entries: BackupEntry[];
  dailyGoals: BackupGoal[];
};

export type BackupFile = {
  app: typeof BACKUP_APP;
  formatVersion: number;
  schemaVersion: number;
  exportedAt: string;
  platform: string;
  appVersion: string | null;
  data: BackupData;
};

export type BackupMeta = Pick<BackupFile, 'schemaVersion' | 'exportedAt' | 'platform' | 'appVersion'>;

export function createBackup(data: BackupData, meta: BackupMeta): BackupFile {
  return { app: BACKUP_APP, formatVersion: BACKUP_FORMAT_VERSION, ...meta, data };
}

export type BackupSummary = {
  categories: number;
  entries: number;
  goalChanges: number;
  exportedAt: string;
  platform: string;
  firstDate: string | null;
  lastDate: string | null;
};

export function summarizeBackup(backup: BackupFile): BackupSummary {
  const dates = backup.data.entries.map((e) => e.date).sort();
  return {
    // Removed categories are kept only to resolve old entries; don't count them.
    categories: backup.data.categories.filter((c) => c.deletedAt == null).length,
    entries: backup.data.entries.length,
    // The initial "0000-01-01" row isn't a change the user made.
    goalChanges: backup.data.dailyGoals.filter((g) => g.effectiveFrom !== '0000-01-01').length,
    exportedAt: backup.exportedAt,
    platform: backup.platform,
    firstDate: dates[0] ?? null,
    lastDate: dates.at(-1) ?? null,
  };
}

export type ParseResult =
  | { ok: true; backup: BackupFile; summary: BackupSummary }
  | { ok: false; error: string };

class InvalidBackup extends Error {}

export function parseBackup(text: string, currentSchemaVersion: number): ParseResult {
  try {
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new InvalidBackup('This file isn’t a Platewise backup (it isn’t valid JSON).');
    }
    const root = asObject(json, 'file');
    if (root.app !== BACKUP_APP) throw new InvalidBackup('This file isn’t a Platewise backup.');

    const formatVersion = int(root.formatVersion, 'formatVersion');
    const schemaVersion = int(root.schemaVersion, 'schemaVersion');
    if (formatVersion > BACKUP_FORMAT_VERSION || schemaVersion > currentSchemaVersion) {
      throw new InvalidBackup('This backup was made with a newer version of Platewise. Update the app on this phone first.');
    }

    const data = asObject(root.data, 'data');
    const categories = asArray(data.categories, 'data.categories').map(readCategory);
    const entries = asArray(data.entries, 'data.entries').map(readEntry);
    const dailyGoals = asArray(data.dailyGoals ?? [], 'data.dailyGoals').map(readGoal);

    assertUniqueIds(categories, 'categories');
    assertUniqueIds(entries, 'entries');
    assertUniqueIds(dailyGoals, 'dailyGoals');
    const categoryIds = new Set(categories.map((c) => c.id));
    entries.forEach((entry, i) => {
      if (!categoryIds.has(entry.categoryId)) {
        throw new InvalidBackup(`The backup is damaged: entries[${i}] refers to a missing category.`);
      }
    });
    const goalDates = new Set<string>();
    dailyGoals.forEach((goal, i) => {
      if (goalDates.has(goal.effectiveFrom)) {
        throw new InvalidBackup(`The backup is damaged: dailyGoals[${i}] repeats ${goal.effectiveFrom}.`);
      }
      goalDates.add(goal.effectiveFrom);
    });

    const backup: BackupFile = {
      app: BACKUP_APP,
      formatVersion,
      schemaVersion,
      exportedAt: str(root.exportedAt, 'exportedAt'),
      platform: typeof root.platform === 'string' ? root.platform : 'unknown',
      appVersion: typeof root.appVersion === 'string' ? root.appVersion : null,
      data: { categories, entries, dailyGoals },
    };
    return { ok: true, backup, summary: summarizeBackup(backup) };
  } catch (error) {
    if (error instanceof InvalidBackup) return { ok: false, error: error.message };
    throw error;
  }
}

function readCategory(value: unknown, i: number): BackupCategory {
  const at = `categories[${i}]`;
  const row = asObject(value, at);
  const health = int(row.health, `${at}.health`);
  if (health !== 0 && health !== 1 && health !== 2) throw damaged(`${at}.health`);
  const createdAt = optStr(row.createdAt, `${at}.createdAt`) ?? nowSql();
  return {
    id: int(row.id, `${at}.id`),
    name: str(row.name, `${at}.name`),
    emoji: optStr(row.emoji, `${at}.emoji`),
    health,
    sortOrder: optInt(row.sortOrder, `${at}.sortOrder`) ?? 0,
    seedKey: optStr(row.seedKey, `${at}.seedKey`),
    archivedAt: optStr(row.archivedAt, `${at}.archivedAt`),
    deletedAt: optStr(row.deletedAt, `${at}.deletedAt`),
    createdAt,
    updatedAt: optStr(row.updatedAt, `${at}.updatedAt`) ?? createdAt,
    portionLabel: optStr(row.portionLabel, `${at}.portionLabel`),
    kcal: optNum(row.kcal, `${at}.kcal`),
    fiberG: optNum(row.fiberG, `${at}.fiberG`),
    sugarG: optNum(row.sugarG, `${at}.sugarG`),
  };
}

function readEntry(value: unknown, i: number): BackupEntry {
  const at = `entries[${i}]`;
  const row = asObject(value, at);
  const date = str(row.date, `${at}.date`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw damaged(`${at}.date`);
  const portions = optNum(row.portions, `${at}.portions`) ?? 1;
  if (portions <= 0) throw damaged(`${at}.portions`);
  return {
    id: int(row.id, `${at}.id`),
    date,
    categoryId: int(row.categoryId, `${at}.categoryId`),
    mealType: optStr(row.mealType, `${at}.mealType`),
    note: optStr(row.note, `${at}.note`),
    createdAt: optStr(row.createdAt, `${at}.createdAt`) ?? nowSql(),
    portions,
    kcal: optNum(row.kcal, `${at}.kcal`),
    fiberG: optNum(row.fiberG, `${at}.fiberG`),
    sugarG: optNum(row.sugarG, `${at}.sugarG`),
  };
}

function readGoal(value: unknown, i: number): BackupGoal {
  const at = `dailyGoals[${i}]`;
  const row = asObject(value, at);
  const effectiveFrom = str(row.effectiveFrom, `${at}.effectiveFrom`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) throw damaged(`${at}.effectiveFrom`);
  return {
    id: int(row.id, `${at}.id`),
    effectiveFrom,
    kcalMax: optNum(row.kcalMax, `${at}.kcalMax`),
    fiberMin: optNum(row.fiberMin, `${at}.fiberMin`),
    sugarMax: optNum(row.sugarMax, `${at}.sugarMax`),
    createdAt: optStr(row.createdAt, `${at}.createdAt`) ?? nowSql(),
  };
}

function assertUniqueIds(rows: { id: number }[], table: string) {
  const seen = new Set<number>();
  for (const row of rows) {
    if (seen.has(row.id)) throw new InvalidBackup(`The backup is damaged: ${table} has a duplicate id ${row.id}.`);
    seen.add(row.id);
  }
}

const damaged = (field: string) => new InvalidBackup(`The backup is damaged: ${field} is invalid.`);

function asObject(value: unknown, field: string): Record<string, unknown> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) throw damaged(field);
  return value as Record<string, unknown>;
}

function asArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw damaged(field);
  return value;
}

function str(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) throw damaged(field);
  return value;
}

function optStr(value: unknown, field: string): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') throw damaged(field);
  return value;
}

function int(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) throw damaged(field);
  return value;
}

function optInt(value: unknown, field: string): number | null {
  return value == null ? null : int(value, field);
}

function optNum(value: unknown, field: string): number | null {
  if (value == null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw damaged(field);
  return value;
}

/** Same format SQLite's datetime('now') uses. */
function nowSql(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}
