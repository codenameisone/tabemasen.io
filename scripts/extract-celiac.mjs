// scripts/extract-celiac.mjs — one-off: run once, commit the fragments. Reads the legacy /celiac/ page (from git history once replaced).
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { outerHTML, innerTextOfAll } from './lib/extract-html.mjs';

const dir = 'src/pages/celiac';
const raw = (() => {
  const cur = readFileSync(`${dir}/index.astro`, 'utf8');
  return cur.includes('ce-hero__title') ? cur : execSync(`git show ${process.env.LEGACY_REV ?? 'HEAD'}:${dir}/index.astro`, { encoding: 'utf8', maxBuffer: 1 << 26 });
})();
const src = raw.replace(/^---[\s\S]*?---\n/, '');
const lds = innerTextOfAll(src, 'script').filter((t) => t.trim().startsWith('{'));
if (lds.length !== 3) throw new Error(`expected 3 JSON-LD blocks, found ${lds.length}`);
lds.forEach((t, i) => { JSON.parse(t); writeFileSync(`${dir}/_jsonld-${i + 1}.json`, t.trim() + '\n'); });

const OLD = 'Generate my celiac card →';
const NEW = 'Generate my Japanese celiac card →';
const long = (html, n) => {
  const count = html.split(OLD).length - 1;
  if (count !== n) throw new Error(`expected ${n} CTA(s) with old wording, found ${count}`);
  return html.replaceAll(OLD, NEW);
};
const events = (html) => [...html.matchAll(/data-gc-event="([^"]*)"/g)].map((m) => m[1]);

// The phone mockup (.ce-phone-stage) is a sibling of .ce-hero__copy, so it is not extracted.
const out = {
  '_hero.html': long(outerHTML(src, '.ce-hero__copy'), 1),
  // GuideLayout already provides <main>; the legacy <main class="ce-main"> becomes a div (one landmark per page).
  '_body.html': long(outerHTML(src, '.ce-main'), 1).replace(/^<main class="ce-main">/, '<div class="ce-main">').replace(/<\/main>$/, '</div>'),
  '_cta.html': long(outerHTML(src, '.ce-cta'), 1),
};
const want = ['cta-celiac-hero', 'cta-celiac-mid', 'cta-celiac-footer'];
const got = Object.values(out).flatMap(events);
if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`events changed: ${got}`);
for (const [name, html] of Object.entries(out)) {
  if (/var\(--/.test(html)) throw new Error(`${name} uses var(--…): add a shim`);
  if (/ce-toc/.test(html)) throw new Error(`${name} has a contents list`);
  if (/ce-phone/.test(html)) throw new Error(`${name} contains the phone mockup`);
  writeFileSync(`${dir}/${name}`, html + '\n');
  console.log(`wrote ${name} (${html.length} chars)`);
}
