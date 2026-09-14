import { describe, expect, it } from '@jest/globals';

import { askAiUrl, nutritionForPortion, parseSearchResponse, rankByName } from '../usda';

// Trimmed from a real /foods/search response.
const response = {
  foods: [
    {
      fdcId: 2708392,
      description: 'Dessert pizza',
      dataType: 'Survey (FNDDS)',
      foodNutrients: [
        { nutrientId: 1003, value: 3.1 },
        { nutrientId: 1008, value: 204 },
        { nutrientId: 2000, value: 15.75 },
        { nutrientId: 1079, value: 1.7 },
      ],
      foodMeasures: [
        { disseminationText: '1 surface inch', gramWeight: 10.5 },
        { disseminationText: 'Quantity not specified', gramWeight: 108 },
        { disseminationText: '1 piece', gramWeight: 108 },
      ],
    },
    {
      fdcId: 170395,
      description: 'PIZZA HUT 12" Cheese Pizza, Pan Crust',
      dataType: 'SR Legacy',
      foodNutrients: [
        { nutrientId: 1008, value: 280 },
        { nutrientId: 1062, value: 1170 },
        { nutrientId: 1079, value: 1.7 },
      ],
      foodMeasures: [],
    },
    { fdcId: 1, description: 'No nutrients', foodNutrients: [{ nutrientId: 1003, value: 2 }] },
  ],
};

describe('parseSearchResponse', () => {
  const foods = parseSearchResponse(response);

  it('reads kcal, fiber and sugar per 100 g and skips foods without them', () => {
    expect(foods.map((f) => f.description)).toEqual(['Dessert pizza', 'PIZZA HUT 12" Cheese Pizza, Pan Crust']);
    expect(foods[0].per100g).toEqual({ kcal: 204, fiberG: 1.7, sugarG: 15.75 });
    expect(foods[1].per100g).toEqual({ kcal: 280, fiberG: 1.7, sugarG: null });
  });

  it('puts the typical serving first, keeps household portions, and always offers 100 g', () => {
    expect(foods[0].portions.map((p) => p.label)).toEqual([
      '1 serving (108 g)',
      '1 surface inch (10.5 g)',
      '1 piece (108 g)',
      '100 g',
    ]);
    expect(foods[1].portions.map((p) => p.label)).toEqual(['100 g']);
  });

  it('tolerates malformed input', () => {
    expect(parseSearchResponse(null)).toEqual([]);
    expect(parseSearchResponse({})).toEqual([]);
  });
});

describe('rankByName', () => {
  it('puts generic names first, then other names starting with the query, then the rest', () => {
    const [dessert, hut] = parseSearchResponse(response);
    const cheese = { ...dessert, fdcId: 3, description: 'Pizza, cheese, thin crust' };
    expect(rankByName([dessert, hut, cheese], 'pizza').map((f) => f.fdcId)).toEqual([3, hut.fdcId, dessert.fdcId]);
  });
});

describe('nutritionForPortion', () => {
  it('scales per-100 g values to the portion weight', () => {
    const [pizza] = parseSearchResponse(response);
    expect(nutritionForPortion(pizza, { label: '1 piece (108 g)', grams: 108 })).toEqual({
      kcal: 220,
      fiberG: 1.8,
      sugarG: 17,
    });
  });
});

describe('askAiUrl', () => {
  it('builds a Google AI Mode search with the portion and food', () => {
    const url = new URL(askAiUrl(' Kebab ', '1 wrap'));
    expect(url.searchParams.get('udm')).toBe('50');
    expect(url.searchParams.get('q')).toBe(
      'How many calories (kcal), grams of fiber and grams of sugar are in 1 wrap of Kebab?',
    );
  });

  it('asks about a typical portion when none is set', () => {
    expect(new URL(askAiUrl('Pizza', '')).searchParams.get('q')).toContain('one typical portion of Pizza');
  });
});
