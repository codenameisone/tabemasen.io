// Build-time access to public/data.js (the single source of card wording) and a
// port of app.js renderCard(), so static example cards match the live card exactly.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

export type CardState = {
  allergens: string[]; patterns: string[]; severity: 'allergy' | 'severe';
  name: string; customText: string; showEnglish: boolean;
};
export type CardLine = { kind: string; ja: string; en?: string };
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

const esc = (text: string) => text
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/\n/g, '<br>');

export function renderCardHtml(lines: CardLine[], showEnglish: boolean): string {
  const main = lines.filter((l) => l.kind !== 'disclaimer' && l.kind !== 'site-url');
  const tail = lines.filter((l) => l.kind === 'disclaimer' || l.kind === 'site-url');
  while (main.length && main[main.length - 1].kind === 'blank') main.pop();

  let html = main.map((l) => (l.kind === 'blank'
    ? '<p class="card-line card-line--blank">&nbsp;</p>'
    : `<p class="card-line card-line--${l.kind}">${esc(l.ja)}</p>`)).join('');

  html += `<div class="card-en${showEnglish ? '' : ' card-en--hidden'}"><div class="card-en-divider"></div>`;
  for (const l of main.filter((x) => x.kind === 'blank' || !!x.en)) {
    html += l.kind === 'blank'
      ? '<p class="card-en-line card-en-line--blank">&nbsp;</p>'
      : `<p class="card-en-line card-en-line--${l.kind}">${esc(l.en ?? '')}</p>`;
  }
  html += '</div>';
  for (const l of tail) html += `<p class="card-line card-line--${l.kind}">${esc(l.ja)}</p>`;
  return html;
}
