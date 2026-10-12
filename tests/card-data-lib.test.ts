import { describe, it, expect } from 'vitest';
import { loadCardData, renderCardHtml } from '../src/lib/cardData';

const base = { allergens: [], patterns: [], severity: 'allergy' as const, name: '', customText: '', showEnglish: true };

describe('loadCardData', () => {
  it('evaluates public/data.js and exposes buildCard', () => {
    const data = loadCardData();
    expect(data.allergens.filter((a) => a.mandatory)).toHaveLength(9);
    const lines = data.buildCard({ ...base, allergens: ['egg'] });
    expect(lines.find((l) => l.kind === 'item')?.ja).toBe('・卵');
  });
});

describe('renderCardHtml', () => {
  const lines = loadCardData().buildCard({ ...base, allergens: ['peanut'], severity: 'severe', name: 'Sarah' });

  it('renders Japanese lines with their kind classes, as app.js does', () => {
    const html = renderCardHtml(lines, true);
    expect(html).toContain('<p class="card-line card-line--greeting">すみません、私はSarahと申します。お願いがあります。</p>');
    expect(html).toContain('<p class="card-line card-line--item">・落花生(ピーナッツ)</p>');
    expect(html).toContain('<p class="card-line card-line--warning">⚠ 重度のアレルギーで、少量でも命に関わります。<br>調理器具や油も分けていただけると助かります。</p>');
  });

  it('puts English in .card-en before the disclaimer, hidden when showEnglish is false', () => {
    const shown = renderCardHtml(lines, true);
    expect(shown).toMatch(/<div class="card-en"><div class="card-en-divider"><\/div><p class="card-en-line card-en-line--greeting">Excuse me, my name is Sarah\. I have a request\.<\/p>/);
    expect(shown.indexOf('card-en')).toBeLessThan(shown.indexOf('card-line--disclaimer'));
    expect(renderCardHtml(lines, false)).toContain('<div class="card-en card-en--hidden">');
  });

  it('trims trailing blanks before the disclaimer and escapes HTML', () => {
    const custom = loadCardData().buildCard({ ...base, allergens: ['egg'], customText: '<b>x</b>' });
    const html = renderCardHtml(custom, false);
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).not.toMatch(/card-line--blank">&nbsp;<\/p><div class="card-en/);
  });
});
