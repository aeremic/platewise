import { asc } from 'drizzle-orm';

import { db } from '@/db/client';
import { categories, dailyGoals, entries } from '@/db/schema';
import type { BackupData } from '@/domain/backup';

import { seedDefaultCategories } from './categoriesRepo';

/** Every row the user's diary consists of, in id order. */
export async function readAllData(): Promise<BackupData> {
  const [categoryRows, entryRows, goalRows] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.id)),
    db.select().from(entries).orderBy(asc(entries.id)),
    db.select().from(dailyGoals).orderBy(asc(dailyGoals.id)),
  ]);
  return { categories: categoryRows, entries: entryRows, dailyGoals: goalRows };
}

// Keeps each INSERT well under SQLite's bound-parameter limit.
const CHUNK = 200;

/**
 * Replaces all diary data with `data` in one transaction: either everything is imported or
 * nothing changes. Ids are kept so entries keep pointing at their categories. Built-in
 * categories this app version knows about but the backup lacks are added afterwards.
 */
export async function replaceAllData(data: BackupData): Promise<void> {
  // The expo-sqlite driver runs transactions synchronously.
  db.transaction((tx) => {
    tx.delete(entries).run();
    tx.delete(categories).run();
    tx.delete(dailyGoals).run();
    for (let i = 0; i < data.categories.length; i += CHUNK) {
      tx.insert(categories).values(data.categories.slice(i, i + CHUNK)).run();
    }
    for (let i = 0; i < data.entries.length; i += CHUNK) {
      tx.insert(entries).values(data.entries.slice(i, i + CHUNK)).run();
    }
    for (let i = 0; i < data.dailyGoals.length; i += CHUNK) {
      tx.insert(dailyGoals).values(data.dailyGoals.slice(i, i + CHUNK)).run();
    }
  });
  await seedDefaultCategories();
}
