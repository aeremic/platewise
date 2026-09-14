import { roundAmount, type Nutrition } from '@/domain/nutrition';

/**
 * USDA FoodData Central: free database of generic foods with nutrients per 100 g and
 * household portions. https://fdc.nal.usda.gov/api-guide
 *
 * Without a key the shared DEMO_KEY allows only ~10 lookups per hour; a free personal key
 * (https://api.data.gov/signup) can be set as EXPO_PUBLIC_FDC_API_KEY in .env.local.
 */
const API_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const API_KEY = process.env.EXPO_PUBLIC_FDC_API_KEY || 'DEMO_KEY';

// Generic-food datasets; "Branded" (packaged products) is excluded on purpose.
const DATA_TYPES = ['Survey (FNDDS)', 'SR Legacy', 'Foundation'];
const MAX_RESULTS = 12;

// Nutrient ids differ slightly between datasets; the first one present wins.
const NUTRIENT_IDS: Record<keyof Nutrition, number[]> = {
  kcal: [1008, 2047, 2048], // Energy (kcal), Atwater general / specific
  fiberG: [1079], // Fiber, total dietary
  sugarG: [2000, 1063], // Total sugars
};

export type UsdaPortion = {
  /** e.g. "1 piece (108 g)" — used as the category's portion label. */
  label: string;
  grams: number;
};

export type UsdaFood = {
  fdcId: number;
  description: string;
  per100g: Nutrition;
  /** Typical serving first, then household portions, always ending with 100 g. */
  portions: UsdaPortion[];
};

export class UsdaError extends Error {
  constructor(
    readonly kind: 'rate-limit' | 'network' | 'server',
    message: string,
  ) {
    super(message);
  }
}

export async function searchUsdaFoods(query: string, signal?: AbortSignal): Promise<UsdaFood[]> {
  const exact = await request(query, true, signal);
  return exact.length > 0 ? exact : request(query, false, signal);
}

async function request(query: string, requireAllWords: boolean, signal?: AbortSignal): Promise<UsdaFood[]> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}?api_key=${encodeURIComponent(API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, dataType: DATA_TYPES, pageSize: 50, requireAllWords }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new UsdaError('network', 'No connection to the nutrition database.');
  }
  if (response.status === 429) {
    throw new UsdaError('rate-limit', 'Too many lookups for now. Try again later or use Ask AI.');
  }
  if (!response.ok) {
    throw new UsdaError('server', `The nutrition database returned an error (${response.status}).`);
  }
  // Fetch a wide page in one request and rank locally; USDA's own order buries generic foods.
  return rankByName(parseSearchResponse(await response.json()), query).slice(0, MAX_RESULTS);
}

/**
 * USDA's relevance puts e.g. "Dessert pizza" above "Pizza, cheese…" for "pizza". Generic USDA
 * names ("Pizza" or "Pizza, …") come first, then other names starting with the query
 * ("PIZZA HUT …"); otherwise USDA's order is kept.
 */
export function rankByName(foods: UsdaFood[], query: string): UsdaFood[] {
  const q = query.trim().toLowerCase();
  const rank = (food: UsdaFood) => {
    const name = food.description.toLowerCase();
    if (name === q || name.startsWith(`${q},`)) return 0;
    return name.startsWith(q) ? 1 : 2;
  };
  return foods
    .map((food, index) => ({ food, index }))
    .sort((a, b) => rank(a.food) - rank(b.food) || a.index - b.index)
    .map(({ food }) => food);
}

type RawFood = {
  fdcId?: number;
  description?: string;
  foodNutrients?: { nutrientId?: number; value?: number }[];
  foodMeasures?: { disseminationText?: string; gramWeight?: number }[];
};

export function parseSearchResponse(json: unknown): UsdaFood[] {
  const foods = (json as { foods?: RawFood[] } | null)?.foods ?? [];
  return foods.flatMap((food) => {
    if (food.fdcId == null || !food.description) return [];
    const per100g = readNutrition(food.foodNutrients ?? []);
    if (per100g.kcal == null && per100g.fiberG == null && per100g.sugarG == null) return [];
    return [{ fdcId: food.fdcId, description: food.description, per100g, portions: readPortions(food.foodMeasures ?? []) }];
  });
}

function readNutrition(nutrients: NonNullable<RawFood['foodNutrients']>): Nutrition {
  const valueOf = (ids: number[]) => {
    for (const id of ids) {
      const value = nutrients.find((n) => n.nutrientId === id)?.value;
      if (typeof value === 'number') return value;
    }
    return null;
  };
  return { kcal: valueOf(NUTRIENT_IDS.kcal), fiberG: valueOf(NUTRIENT_IDS.fiberG), sugarG: valueOf(NUTRIENT_IDS.sugarG) };
}

function readPortions(measures: NonNullable<RawFood['foodMeasures']>): UsdaPortion[] {
  const portions: UsdaPortion[] = [];
  for (const measure of measures) {
    const grams = measure.gramWeight;
    const text = measure.disseminationText?.trim();
    if (!text || grams == null || grams <= 0) continue;
    const typical = text === 'Quantity not specified';
    const label = `${typical ? '1 serving' : text} (${roundAmount(grams)} g)`;
    if (portions.some((p) => p.label === label)) continue;
    // The typical serving goes first: it's what the result preview shows.
    if (typical) portions.unshift({ label, grams });
    else portions.push({ label, grams });
  }
  portions.push({ label: '100 g', grams: 100 });
  return portions;
}

export function nutritionForPortion(food: UsdaFood, portion: UsdaPortion): Nutrition {
  const scale = (value: number | null) => (value == null ? null : roundAmount((value * portion.grams) / 100));
  return {
    kcal: food.per100g.kcal == null ? null : Math.round((food.per100g.kcal * portion.grams) / 100),
    fiberG: scale(food.per100g.fiberG),
    sugarG: scale(food.per100g.sugarG),
  };
}

/** Google AI Mode search for a food's nutrition; falls back to regular results where AI Mode isn't available. */
export function askAiUrl(foodName: string, portionLabel: string | null): string {
  const portion = portionLabel?.trim() ? portionLabel.trim() : 'one typical portion';
  const question = `How many calories (kcal), grams of fiber and grams of sugar are in ${portion} of ${foodName.trim()}?`;
  return `https://www.google.com/search?udm=50&q=${encodeURIComponent(question)}`;
}
