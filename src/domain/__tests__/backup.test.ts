import { describe, expect, it } from '@jest/globals';

import { createBackup, parseBackup, type BackupData } from '../backup';

const data: BackupData = {
  categories: [
    {
      id: 1,
      name: 'Pizza',
      emoji: '🍕',
      health: 0,
      sortOrder: 0,
      seedKey: 'pizza',
      archivedAt: null,
      deletedAt: null,
      createdAt: '2026-09-13 21:36:09',
      updatedAt: '2026-09-13 21:36:09',
      portionLabel: '2 slices',
      kcal: 570,
      fiberG: 4,
      sugarG: 8,
    },
    {
      id: 30,
      name: 'Kebab',
      emoji: null,
      health: 0,
      sortOrder: 0,
      seedKey: null,
      archivedAt: null,
      deletedAt: '2026-09-14 08:00:00',
      createdAt: '2026-09-13 22:00:00',
      updatedAt: '2026-09-14 08:00:00',
      portionLabel: null,
      kcal: null,
      fiberG: null,
      sugarG: null,
    },
  ],
  entries: [
    {
      id: 5,
      date: '2026-09-14',
      categoryId: 1,
      mealType: null,
      note: null,
      createdAt: '2026-09-14 09:00:00',
      portions: 1.5,
      kcal: 855,
      fiberG: 6,
      sugarG: 12,
    },
    {
      id: 6,
      date: '2026-09-10',
      categoryId: 30,
      mealType: null,
      note: null,
      createdAt: '2026-09-10 12:00:00',
      portions: 1,
      kcal: null,
      fiberG: null,
      sugarG: null,
    },
  ],
  dailyGoals: [
    { id: 1, effectiveFrom: '0000-01-01', kcalMax: 2000, fiberMin: 30, sugarMax: 50, createdAt: '2026-09-13 22:59:32' },
    { id: 2, effectiveFrom: '2026-09-14', kcalMax: 1800, fiberMin: 30, sugarMax: null, createdAt: '2026-09-14 07:56:37' },
  ],
};

const meta = { schemaVersion: 4, exportedAt: '2026-09-14T11:30:00.000Z', platform: 'android', appVersion: '1.0.0' };

const serialize = (value: unknown) => JSON.stringify(value);

describe('backup round trip', () => {
  it('parses exactly what was exported, including removed categories and goal history', () => {
    const result = parseBackup(serialize(createBackup(data, meta)), 4);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.backup.data).toEqual(data);
    expect(result.summary).toEqual({
      categories: 1,
      entries: 2,
      goalChanges: 1,
      exportedAt: meta.exportedAt,
      platform: 'android',
      firstDate: '2026-09-10',
      lastDate: '2026-09-14',
    });
  });

  it('accepts backups from an older app, filling in fields added later', () => {
    const old = createBackup(data, { ...meta, schemaVersion: 1 }) as unknown as {
      data: { entries: Record<string, unknown>[]; categories: Record<string, unknown>[] };
    };
    for (const entry of old.data.entries) {
      delete entry.portions;
      delete entry.kcal;
    }
    for (const category of old.data.categories) delete category.deletedAt;
    const result = parseBackup(serialize({ ...old, data: { categories: old.data.categories, entries: old.data.entries } }), 4);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.backup.data.entries[0]).toMatchObject({ portions: 1, kcal: null });
    expect(result.backup.data.categories[1].deletedAt).toBeNull();
    expect(result.backup.data.dailyGoals).toEqual([]);
  });
});

describe('rejected files', () => {
  const errorFor = (text: string) => {
    const result = parseBackup(text, 4);
    return result.ok ? null : result.error;
  };
  const withData = (patch: Partial<BackupData>) => serialize(createBackup({ ...data, ...patch }, meta));

  it('rejects files that are not Platewise backups', () => {
    expect(errorFor('not json')).toMatch(/isn’t valid JSON/);
    expect(errorFor(serialize({ hello: 'world' }))).toMatch(/isn’t a Platewise backup/);
  });

  it('rejects backups from a newer app version', () => {
    expect(errorFor(serialize(createBackup(data, { ...meta, schemaVersion: 5 })))).toMatch(/newer version/);
  });

  it('rejects damaged data with a pointer to the problem', () => {
    expect(errorFor(withData({ entries: [{ ...data.entries[0], categoryId: 99 }] }))).toMatch(/entries\[0\] refers to a missing category/);
    expect(errorFor(withData({ entries: [{ ...data.entries[0], date: '14.9.2026' }] }))).toMatch(/entries\[0\]\.date/);
    expect(errorFor(withData({ categories: [{ ...data.categories[0], health: 3 as 0 }] }))).toMatch(/categories\[0\]\.health/);
    expect(errorFor(withData({ categories: [data.categories[0], { ...data.categories[1], id: 1 }] }))).toMatch(/duplicate id 1/);
    expect(errorFor(withData({ entries: [{ ...data.entries[0], portions: 0 }] }))).toMatch(/portions/);
  });
});
