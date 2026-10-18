// Builds a Platewise backup file with ~5 weeks of realistic demo data, used for store
// screenshots: import it on a fresh simulator/emulator via Settings → Backup → Import.
//
//   node scripts/make-demo-backup.mts [YYYY-MM-DD end date, default today] > demo-backup.json
//
// Deterministic: the same end date always produces the same file.
import { readFileSync } from 'node:fs';

import { DEFAULT_CATEGORIES } from '../src/db/defaultCategories.ts';

const journal = JSON.parse(readFileSync(new URL('../drizzle/meta/_journal.json', import.meta.url), 'utf8'));

const endArg = process.argv[2];
const end = endArg ? new Date(`${endArg}T12:00:00`) : new Date();
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const categories = DEFAULT_CATEGORIES.map((c, i) => ({
  id: i + 1,
  name: c.name,
  emoji: c.emoji,
  health: c.health,
  sortOrder: 0,
  seedKey: c.seedKey,
  archivedAt: null,
  deletedAt: null,
  createdAt: '2026-08-20 08:00:00',
  updatedAt: '2026-08-20 08:00:00',
  portionLabel: c.portionLabel,
  kcal: c.kcal,
  fiberG: c.fiberG,
  sugarG: c.sugarG,
}));
const idOf = (seedKey: string) => {
  const category = categories.find((c) => c.seedKey === seedKey);
  if (!category) throw new Error(`Unknown seed key ${seedKey}`);
  return category;
};

// Day templates: [seedKey, portions][]. Mostly healthy, some mixed, a few treat days.
const HEALTHY: [string, number][][] = [
  [['oatmeal', 1], ['fruit', 1], ['salad', 1], ['grilled_chicken', 1], ['vegetables', 1], ['yogurt', 1]],
  [['eggs', 1], ['legumes', 1], ['vegetables', 2], ['fruit', 1], ['nuts', 1], ['salad', 1]],
  [['yogurt', 1], ['fruit', 1], ['fish', 1], ['salad', 1], ['legumes', 1], ['potatoes', 1]],
  [['oatmeal', 1], ['nuts', 1], ['grilled_chicken', 1], ['vegetables', 2], ['fruit', 1], ['bread', 1]],
];
const MIXED: [string, number][][] = [
  [['bread', 2], ['cheese', 1], ['pasta', 1], ['salad', 1], ['sweet_coffee', 1], ['fruit', 1]],
  [['sandwich', 1], ['red_meat', 1], ['potatoes', 1], ['vegetables', 1], ['ice_cream', 1]],
  [['eggs', 1], ['bread', 1], ['pizza', 1], ['salad', 1], ['fruit', 1]],
];
const TREAT: [string, number][][] = [
  [['pizza', 1.5], ['soda', 1], ['ice_cream', 1], ['bread', 1]],
  [['burger', 1], ['fries', 1], ['soda', 1], ['cake', 1]],
];

const entries: object[] = [];
let entryId = 1;
const DAYS = 37;
for (let back = DAYS - 1; back >= 0; back--) {
  const date = new Date(end);
  date.setDate(end.getDate() - back);
  // Leave today empty-ish for the "add food" screenshot, and skip a couple of days.
  if (back === 0 || back === 9 || back === 23) continue;
  const pattern = (DAYS - back) % 9;
  const templates = pattern === 8 ? TREAT : pattern === 3 || pattern === 6 ? MIXED : HEALTHY;
  // Healthy days rotate daily; mixed and treat days rotate weekly so each looks different.
  const index = templates === HEALTHY ? DAYS - back : Math.floor((DAYS - back) / 9) + pattern;
  const day = templates[index % templates.length];
  day.forEach(([seedKey, portions], i) => {
    const c = idOf(seedKey);
    entries.push({
      id: entryId++,
      date: dayKey(date),
      categoryId: c.id,
      mealType: null,
      note: null,
      createdAt: `${dayKey(date)} ${String(8 + i * 2).padStart(2, '0')}:15:00`,
      portions,
      kcal: Math.round(c.kcal * portions),
      fiberG: Math.round(c.fiberG * portions * 10) / 10,
      sugarG: Math.round(c.sugarG * portions * 10) / 10,
    });
  });
}

const backup = {
  app: 'platewise',
  formatVersion: 1,
  schemaVersion: journal.entries.length,
  exportedAt: new Date(end).toISOString(),
  platform: 'demo',
  appVersion: null,
  data: {
    categories,
    entries,
    dailyGoals: [
      { id: 1, effectiveFrom: '0000-01-01', kcalMax: 2000, fiberMin: 30, sugarMax: 50, createdAt: '2026-08-20 08:00:00' },
    ],
  },
};
process.stdout.write(JSON.stringify(backup, null, 2) + '\n');
