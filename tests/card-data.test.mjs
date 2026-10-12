import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// data.js is a browser script that sets window.CARD_DATA; evaluate it as-is.
function loadCardData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(readFileSync('public/data.js', 'utf8'), context);
  return context.window.CARD_DATA;
}

describe('CARD_DATA.allergens', () => {
  it("flags exactly Japan's 9 mandatory allergens (CAA, cashew added April 2026)", () => {
    const mandatory = loadCardData().allergens.filter((a) => a.mandatory).map((a) => a.key).sort();
    expect(mandatory).toEqual(
      ['buckwheat', 'cashew', 'crab', 'dairy', 'egg', 'peanut', 'shrimp', 'walnut', 'wheat'],
    );
  });

  it('does not flag recommended-only allergens such as almond, soy and sesame', () => {
    const byKey = Object.fromEntries(loadCardData().allergens.map((a) => [a.key, a]));
    for (const key of ['almond', 'soy', 'sesame']) expect(byKey[key].mandatory).toBeFalsy();
  });
});
