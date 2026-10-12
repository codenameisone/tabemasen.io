import { DIETS, DIET_KEYS, type DietKey } from '../data/diets';

export type GuideLike = {
  id: string;
  data: { title: string; diets: DietKey[]; reviewed: Date; draft?: boolean; permalink?: string };
};

export const guideUrl = (entry: { id: string; data: { permalink?: string } }) =>
  entry.data.permalink ?? `/guides/${entry.id}/`;

const live = <T extends GuideLike>(entries: T[]) => entries.filter((e) => !e.data.draft);
const byReview = <T extends GuideLike>(a: T, b: T) =>
  b.data.reviewed.getTime() - a.data.reviewed.getTime() || a.data.title.localeCompare(b.data.title);

export function guidesForDiet<T extends GuideLike>(entries: T[], diet: DietKey): T[] {
  return live(entries).filter((e) => e.data.diets.includes(diet)).sort(byReview);
}

export function groupGuides<T extends GuideLike>(entries: T[]) {
  const groups: { key: DietKey | 'general'; name: string; glyph: string; guides: T[] }[] = [];
  for (const key of DIET_KEYS) {
    const guides = guidesForDiet(entries, key);
    if (guides.length) groups.push({ key, name: DIETS[key].name, glyph: DIETS[key].glyph, guides });
  }
  const general = live(entries).filter((e) => e.data.diets.length === 0).sort(byReview);
  if (general.length) groups.push({ key: 'general', name: 'Eating in Japan', glyph: '旅', guides: general });
  return groups;
}

export function relatedGuides<T extends GuideLike>(entries: T[], diet: DietKey, excludeId: string): T[] {
  return guidesForDiet(entries, diet).filter((g) => g.id !== excludeId);
}
