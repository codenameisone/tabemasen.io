export const DIET_KEYS = ['allergies', 'halal', 'vegan', 'vegetarian', 'pescatarian', 'kosher', 'gluten-free'] as const;
export type DietKey = (typeof DIET_KEYS)[number];

export const DIETS: Record<DietKey, { name: string; glyph: string; hub: string | null; pattern: string | null }> = {
  allergies:     { name: 'Allergies',             glyph: '卵',       hub: '/allergies/',         pattern: null },
  halal:         { name: 'Halal',                 glyph: '豚',       hub: '/halal/',             pattern: 'halal' },
  vegan:         { name: 'Vegan',                 glyph: '菜',       hub: '/vegan/',             pattern: 'vegan' },
  vegetarian:    { name: 'Vegetarian',            glyph: '菜',       hub: null,                  pattern: 'vegetarian' },
  pescatarian:   { name: 'Pescatarian',           glyph: '魚',       hub: null,                  pattern: 'pescatarian' },
  kosher:        { name: 'Kosher',                glyph: 'コーシャ', hub: null,                  pattern: 'kosher' },
  'gluten-free': { name: 'Gluten-free & coeliac', glyph: '麦',       hub: '/gluten-free-japan/', pattern: 'gluten-free' },
};
