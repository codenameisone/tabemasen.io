// scripts/extract-food-allergies-in-japanese.mjs — one-off: run once, commit the fragments.
import { readFileSync, writeFileSync } from 'node:fs';
import { outerHTML, innerTextOfAll } from './lib/extract-html.mjs';

const dir = 'src/pages/allergies/food-allergies-in-japanese';
const src = readFileSync(`${dir}/index.astro`, 'utf8').replace(/^---[\s\S]*?---\n/, '');
const lds = innerTextOfAll(src, 'script').filter((t) => t.trim().startsWith('{'));
if (lds.length !== 3) throw new Error(`expected 3 JSON-LD blocks, found ${lds.length}`);
lds.forEach((t, i) => { JSON.parse(t); writeFileSync(`${dir}/_jsonld-${i + 1}.json`, t.trim() + '\n'); });

const OLD = 'Generate my allergy card →';
const NEW = 'Generate my Japanese allergy card →';
const long = (html, n) => {
  const count = html.split(OLD).length - 1;
  if (count !== n) throw new Error(`expected ${n} CTA(s) with old wording, found ${count}`);
  return html.replaceAll(OLD, NEW);
};
const events = (html) => [...html.matchAll(/data-gc-event="([^"]*)"/g)].map((m) => m[1]);

const out = {
  '_hero.html': long(outerHTML(src, '.fa-hero__inner'), 1),
  // GuideLayout already provides <main>; the legacy <main class="fa-main"> becomes a div (one landmark per page).
  '_body.html': long(outerHTML(src, '.fa-main'), 1).replace(/^<main class="fa-main">/, '<div class="fa-main">').replace(/<\/main>$/, '</div>'),
  '_cta.html': long(outerHTML(src, '.fa-cta'), 1),
};
const want = ['cta-allergies-phrases-hero', 'cta-allergies-phrases-mid', 'cta-allergies-phrases-footer'];
const got = Object.values(out).flatMap(events);
if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`events changed: ${got}`);
for (const [name, html] of Object.entries(out)) {
  if (/var\(--/.test(html)) throw new Error(`${name} uses var(--…): add a shim`);
  if (/fa-toc/.test(html)) throw new Error(`${name} has a contents list`);
  writeFileSync(`${dir}/${name}`, html + '\n');
  console.log(`wrote ${name} (${html.length} chars)`);
}
