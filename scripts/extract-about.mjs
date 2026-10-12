// scripts/extract-about.mjs — one-off: run once, commit the fragments.
import { readFileSync, writeFileSync } from 'node:fs';
import { outerHTML, innerTextOfAll } from './lib/extract-html.mjs';

const dir = 'src/pages/about';
const src = readFileSync(`${dir}/index.astro`, 'utf8').replace(/^---[\s\S]*?---\n/, '');
const lds = innerTextOfAll(src, 'script').filter((t) => t.trim().startsWith('{'));
if (lds.length !== 1) throw new Error(`expected 1 JSON-LD block, found ${lds.length}`);
lds.forEach((t, i) => { JSON.parse(t); writeFileSync(`${dir}/_jsonld-${i + 1}.json`, t.trim() + '\n'); });

const events = (html) => [...html.matchAll(/data-gc-event="([^"]*)"/g)].map((m) => m[1]);
const out = {
  '_hero.html': outerHTML(src, '.ab-hero__inner'),
  // BaseLayout page wraps everything in one <main>; the legacy <main class="ab-main"> becomes a div.
  '_body.html': outerHTML(src, '.ab-main').replace(/^<main class="ab-main">/, '<div class="ab-main">').replace(/<\/main>$/, '</div>'),
  '_cta.html': outerHTML(src, '.ab-cta'),
};
const got = Object.values(out).flatMap(events).sort();
const want = ['cta-about-footer'];
if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`events changed: ${got}`);
for (const [name, html] of Object.entries(out)) {
  if (/var\(--/.test(html)) throw new Error(`${name} uses var(--…): add a shim`);
  if (/<main/.test(html)) throw new Error(`${name} still has a <main>`);
  writeFileSync(`${dir}/${name}`, html + '\n');
  console.log(`wrote ${name} (${html.length} chars)`);
}
