import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseRanges, inRanges, selectFaces, siteCodePoints, brushCodePoints, codePointsFor, FONT_FILES } from '../scripts/lib/font-subset.mjs';

describe('parseRanges', () => {
  it('reads single code points, ranges and wildcards', () => {
    const r = parseRanges('U+0000-00ff, U+3042,U+4??');
    expect(inRanges(0x41, r)).toBe(true);
    expect(inRanges(0x3042, r)).toBe(true);
    expect(inRanges(0x3043, r)).toBe(false);
    expect(inRanges(0x4ff, r)).toBe(true);
  });
});

describe('selectFaces', () => {
  const css = `/* a */
@font-face {
  font-family: 'F';
  font-weight: 400;
  src: url(./files/f-0-400-normal.woff2) format('woff2'), url(./files/f-0-400-normal.woff) format('woff');
  unicode-range: U+3042;
}
/* b */
@font-face {
  font-family: 'F';
  font-weight: 400;
  src: url(./files/f-1-400-normal.woff2) format('woff2'), url(./files/f-1-400-normal.woff) format('woff');
  unicode-range: U+4E00;
}`;
  it('keeps only faces whose range holds a used character, woff2 only', () => {
    const out = selectFaces(css, new Set([0x3042]), '../fonts/', { display: 'swap' });
    expect(out).toHaveLength(1);
    expect(out[0]).toContain('url(../fonts/f-0-400-normal.woff2)');
    expect(out[0]).not.toContain('.woff)');
    expect(out[0]).toContain('font-display: swap');
    expect(out[0]).toContain('unicode-range: U+3042;');
  });
});

describe('selectFaces and alphabet slices', () => {
  const face = (file, range) => `@font-face {
  font-family: 'F';
  font-weight: 400;
  src: url(./files/${file}.woff2) format('woff2'), url(./files/${file}.woff) format('woff');
  unicode-range: ${range};
}`;
  it('keeps latin/latin-ext/cyrillic whole, so names like José Müller use the web font', () => {
    const css = [face('f-latin-400-normal', 'U+0000-00FF'), face('f-cyrillic-400-normal', 'U+0400-045F'), face('f-12-400-normal', 'U+4E00,U+4E01')].join('\n');
    const out = selectFaces(css, new Set([0x41, 0x4e00]), './');
    expect(out).toHaveLength(3);
    expect(out[0]).toContain('unicode-range: U+0000-00FF;');
    expect(out[1]).toContain('unicode-range: U+0400-045F;');
    expect(out[2]).toContain('unicode-range: U+4e00;');
  });
});

describe('src/styles/fonts.css', () => {
  // Fails when copy or card data gains a character the generated font CSS doesn't
  // declare: run `npm run fonts` and commit src/styles/fonts.css.
  const generated = readFileSync('src/styles/fonts.css', 'utf8');
  const declaredFor = (family, weight) => [...generated.matchAll(/@font-face\s*\{[^}]*\}/g)].map(([f]) => f)
    .filter((f) => f.includes(`'${family}'`) && f.includes(`font-weight: ${weight};`))
    .map((f) => parseRanges(f.match(/unicode-range:([^;]+);/)[1]));
  for (const file of FONT_FILES) {
    it(`${file.name} ${file.weight} declares every character it is used for`, () => {
      const family = readFileSync(file.css, 'utf8').match(/font-family: '([^']+)'/)[1];
      const declared = declaredFor(family, file.weight);
      const all = [...readFileSync(file.css, 'utf8').matchAll(/unicode-range:([^;]+);/g)].map((m) => parseRanges(m[1]));
      const missing = [...codePointsFor(file)].filter((cp) => all.some((r) => inRanges(cp, r)) && !declared.some((r) => inRanges(cp, r)));
      expect(missing.map((cp) => String.fromCodePoint(cp))).toEqual([]);
    });
  }
  it('limits the brush font to the brush glyphs and the 800 weight to the seal', () => {
    const brush = brushCodePoints();
    for (const ch of '旅迷だしみりん醤油卵豚菜魚麦') expect(brush.has(ch.codePointAt(0)), ch).toBe(true);
    expect(brush.has(0x20)).toBe(false);
    expect(brush.has(0x61)).toBe(false);
    expect(declaredFor('Yuji Syuku', 400).flat().length).toBeLessThan(40);
    expect(declaredFor('Shippori Mincho', 800).every((r) => r.every(([a, b]) => a === 0x98df && b === 0x98df))).toBe(true);
  });
});
