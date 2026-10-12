// The Japanese web fonts come from Fontsource split into ~120 unicode-range files per
// weight. Declaring all of them made a 1 MB render-blocking stylesheet; we declare only
// the ranges that hold a character the site can show (pages, card data, builder).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const pkg = (name, weights, chars = 'site') => weights.map((w) => ({ name, weight: w, chars, css: `node_modules/@fontsource/${name}/${w}.css` }));
// chars: which characters a file must cover. 'site' = everything in the sources;
// 'brush' = only BrushGlyph texts and diet glyphs; 'seal' = the 食 hanko (weight 800).
export const FONT_FILES = [
  ...pkg('shippori-mincho', [500, 600, 700]),
  ...pkg('shippori-mincho', [800], 'seal'),
  ...pkg('zen-kaku-gothic-new', [400, 500, 700]),
  ...pkg('yuji-syuku', [400], 'brush'),
];

export function parseRanges(text) {
  return text.split(',').map((s) => s.trim().replace(/^U\+/i, '')).filter(Boolean).map((s) => {
    if (s.includes('?')) return [parseInt(s.replace(/\?/g, '0'), 16), parseInt(s.replace(/\?/g, 'f'), 16)];
    const [a, b] = s.split('-');
    return [parseInt(a, 16), parseInt(b ?? a, 16)];
  });
}

// [0x41,0x42,0x43,0x3042] -> 'U+41-43,U+3042'
export function formatRanges(sorted) {
  const parts = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    const hex = (n) => n.toString(16);
    parts.push(j > i ? `U+${hex(sorted[i])}-${hex(sorted[j])}` : `U+${hex(sorted[i])}`);
    i = j;
  }
  return parts.join(',');
}

export const inRanges = (cp, ranges) => ranges.some(([a, b]) => cp >= a && cp <= b);

// Every @font-face in a Fontsource CSS file whose range holds a used code point,
// rewritten to woff2 only (every supported browser has it) with files under `fileBase`.
export function selectFaces(css, codePoints, fileBase, { display = 'swap', alphabets = true } = {}) {
  const out = [];
  for (const [face] of css.matchAll(/@font-face\s*\{[^}]*\}/g)) {
    const file = face.match(/\.\/files\/([^)]+\.woff2)/)[1];
    const range = face.match(/unicode-range:([^;]+);/);
    // Alphabet slices (latin, latin-ext, cyrillic…) stay whole: names and custom text on
    // the card can use any of their letters. Numbered slices are Japanese: keep only those
    // holding a character we use, narrowed to those characters (same file, far less CSS).
    const alphabet = alphabets && !/-\d+-\d+-\w+\.woff2$/.test(file);
    let rule = face
      .replace(/src:[^;]+;/, `src: url(${fileBase}${file}) format('woff2');`)
      .replace(/\s*font-display:[^;]+;/, '');
    if (range && !alphabet) {
      const used = [...codePoints].filter((cp) => inRanges(cp, parseRanges(range[1]))).sort((a, b) => a - b);
      if (!used.length) continue;
      rule = rule.replace(/unicode-range:[^;]+;/, `unicode-range: ${formatRanges(used)};`);
    }
    out.push(rule.replace(/\{/, `{\n  font-display: ${display};`));
  }
  return out;
}

const SOURCES = ['src', 'public/data.js', 'public/app.js'];
const TEXT = /\.(astro|html|json|md|mdx|ts|mjs|js|css)$/;

// Every code point in the site's sources: page copy, fragments, card data and builder strings.
export function siteCodePoints(root = '.') {
  const cps = new Set();
  const add = (file) => { for (const ch of readFileSync(file, 'utf8')) cps.add(ch.codePointAt(0)); };
  const visit = (p) => {
    if (statSync(p).isDirectory()) { for (const n of readdirSync(p)) visit(join(p, n)); }
    else if (TEXT.test(p) && !p.endsWith(join('styles', 'fonts.css'))) add(p);
  };
  for (const s of SOURCES) visit(join(root, s));
  return cps;
}

// Characters drawn in the brush font: <BrushGlyph text="…"> and the diet glyphs.
export function brushCodePoints(root = '.') {
  const cps = new Set();
  const visit = (p) => {
    if (statSync(p).isDirectory()) { for (const n of readdirSync(p)) visit(join(p, n)); return; }
    if (!/\.(astro|ts)$/.test(p)) return;
    const src = readFileSync(p, 'utf8');
    for (const m of src.matchAll(/<BrushGlyph[^>]*?\btext="([^"]+)"/g)) for (const ch of m[1]) cps.add(ch.codePointAt(0));
    for (const m of src.matchAll(/\bglyph:\s*'([^']+)'/g)) for (const ch of m[1]) cps.add(ch.codePointAt(0));
  };
  visit(join(root, 'src'));
  return cps;
}

let siteCache;
export function codePointsFor(file) {
  if (file.chars === 'seal') return new Set([0x98df]);
  if (file.chars === 'brush') return brushCodePoints();
  return (siteCache ??= siteCodePoints());
}
