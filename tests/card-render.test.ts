import { describe, it, expect } from 'vitest';
import { renderCardHtml as fromRender } from '../src/lib/cardRender';
import { loadCardData, renderCardHtml as fromData } from '../src/lib/cardData';

describe('cardRender', () => {
  it('matches the cardData re-export', () => {
    const lines = loadCardData().buildCard({ allergens: ['egg'], patterns: [], severity: 'severe', name: '', customText: '', showEnglish: true });
    expect(fromRender(lines, true)).toBe(fromData(lines, true));
    expect(fromRender(lines, true)).toContain('card-line');
  });
});
