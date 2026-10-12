// scripts/extract-halal.mjs — one-off: run once, commit the fragments. Reads the legacy /halal/ page from git history.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { outerHTML, innerTextOfAll } from './lib/extract-html.mjs';

const dir = 'src/pages/halal';
// The legacy page is replaced by the new index.astro, so read the last legacy revision from git (or the file, if still legacy).
const raw = (() => {
  const cur = readFileSync(`${dir}/index.astro`, 'utf8');
  return cur.includes('hl-hero__title') ? cur : execSync(`git show ${process.env.LEGACY_REV ?? 'HEAD'}:${dir}/index.astro`, { encoding: 'utf8', maxBuffer: 1 << 26 });
})();
const src = raw.replace(/^---[\s\S]*?---\n/, '');
const lds = innerTextOfAll(src, 'script').filter((t) => t.trim().startsWith('{'));
if (lds.length !== 1) throw new Error(`expected 1 JSON-LD block, found ${lds.length}`);
lds.forEach((t, i) => { JSON.parse(t); writeFileSync(i === 0 && lds.length === 1 ? `${dir}/_jsonld.json` : `${dir}/_jsonld-${i + 1}.json`, t.trim() + '\n'); });

const events = (html) => [...html.matchAll(/data-gc-event="([^"]*)"/g)].map((m) => m[1]);
const OLD = 'Generate my halal card →';
const NEW = 'Generate my Japanese halal card →';

// Body: the legacy <main class="hl-main"> stays (BaseLayout has no <main>, same as /allergies/).
const body = outerHTML(src, '.hl-main');
const cta = outerHTML(src, '.hl-cta');
const hero = outerHTML(src, '.hl-hero__actions');
const t = (sel) => innerTextOfAll(src, sel)[0];
const ctaH = innerTextOfAll(cta, 'h2')[0], ctaP = innerTextOfAll(cta, 'p')[0];
if (cta.split(OLD).length !== 2 || hero.split(OLD).length !== 2) throw new Error('expected one old-wording CTA in hero and in closing');
const want = ['cta-halal-hero', 'cta-halal-footer'];
const got = [...events(hero), ...events(body), ...events(cta)];
if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`events changed: ${got}`);
if (/var\(--/.test(body)) throw new Error('_body.html uses var(--…): add a shim');
if (/<img/.test(body)) throw new Error('body has images: handle alt text');
writeFileSync(`${dir}/_body.html`, body + '\n');
console.log(`wrote _body.html (${body.length} chars)`);
console.log(JSON.stringify({
  eyebrow: t('.hl-hero__eyebrow'), h1: t('.hl-hero__title'), lede: t('.hl-hero__lede'),
  reviewed: t('.reviewed-note'), microcopy: t('.hl-microcopy'),
  closing: { heading: ctaH, text: ctaP, event: events(cta)[0] }, heroEvent: events(hero)[0],
}, null, 2));
