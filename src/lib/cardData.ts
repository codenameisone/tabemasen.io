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

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function fullCardState(state: Partial<CardState>): CardState {
  return { allergens: [], patterns: [], severity: 'allergy', name: '', customText: '', showEnglish: true, ...state };
}

// The inner lines of a card for this state, exactly as the live builder renders them.
export function cardLinesHtml(state: Partial<CardState>): string {
  const full = fullCardState(state);
  return renderCardHtml(loadCardData().buildCard(full), full.showEnglish);
}

// A static example card for pages whose copy lives in raw HTML fragments.
export function exampleCardHtml(state: Partial<CardState>, label: string): string {
  return `<div class="card" lang="ja" role="img" aria-label="${escapeAttr(label)}">${cardLinesHtml(state)}</div>`;
}
