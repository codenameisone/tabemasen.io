import { describe, it, expect } from 'vitest';
import { guideUrl, guidesForDiet, groupGuides } from '../src/lib/guides';
import { DIETS, DIET_KEYS } from '../src/data/diets';

const g = (id: string, diets: string[], reviewed: string, extra: Record<string, unknown> = {}) =>
  ({ id, data: { title: id, diets, reviewed: new Date(reviewed), ...extra } }) as any;

describe('guideUrl', () => {
  it('uses the permalink for legacy guides and /guides/<id>/ otherwise', () => {
    expect(guideUrl(g('labeling-guide', ['allergies'], '2026-10-08', { permalink: '/allergies/labeling-guide/' }))).toBe('/allergies/labeling-guide/');
    expect(guideUrl(g('kura-sushi', ['allergies'], '2026-10-08'))).toBe('/guides/kura-sushi/');
  });
});

describe('guidesForDiet', () => {
  it('filters by diet, drops drafts, newest review first', () => {
    const list = [g('a', ['allergies'], '2026-05-01'), g('b', ['allergies', 'vegan'], '2026-10-01'),
      g('c', ['halal'], '2026-10-02'), g('d', ['allergies'], '2026-10-03', { draft: true })];
    expect(guidesForDiet(list, 'allergies').map((x) => x.id)).toEqual(['b', 'a']);
  });
});

describe('groupGuides', () => {
  it('groups in diet order, adds Eating in Japan for untagged guides, omits empty groups', () => {
    const groups = groupGuides([g('h', ['halal'], '2026-10-01'), g('a', ['allergies'], '2026-10-01'), g('k', [], '2026-10-01')]);
    expect(groups.map((x) => x.key)).toEqual(['allergies', 'halal', 'general']);
    expect(groups[2]).toMatchObject({ name: 'Eating in Japan', glyph: '旅' });
  });
});

describe('DIETS', () => {
  it('covers every key and maps hubs and builder patterns', () => {
    expect(Object.keys(DIETS)).toEqual([...DIET_KEYS]);
    expect(DIETS.allergies).toMatchObject({ hub: '/allergies/', pattern: null });
    expect(DIETS['gluten-free']).toMatchObject({ hub: '/gluten-free-japan/', pattern: 'gluten-free' });
    expect(DIETS.kosher.hub).toBeNull();
  });
});
