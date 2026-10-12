// Build-time access to public/data.js (the single source of card wording) and a
// port of app.js renderCard(), so static example cards match the live card exactly.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { renderCardHtml, type CardState, type CardLine } from './cardRender';

export { renderCardHtml };
export type { CardState, CardLine };

type CardData = {
  allergens: { key: string; japanese: string; english: string; mandatory?: boolean }[];
  patterns: { key: string; label_en: string }[];
  buildCard(state: CardState): CardLine[];
};

let cached: CardData | undefined;

export function loadCardData(): CardData {
  if (cached) return cached;
  const context = { window: {} as { CARD_DATA?: CardData } };
  vm.createContext(context);
  vm.runInContext(readFileSync(join(process.cwd(), 'public/data.js'), 'utf8'), context);
  if (!context.window.CARD_DATA) throw new Error('public/data.js did not define window.CARD_DATA');
  cached = context.window.CARD_DATA;
  return cached;
}
