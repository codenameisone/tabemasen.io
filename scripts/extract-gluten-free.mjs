// scripts/extract-gluten-free.mjs — one-off: run once, commit the fragments. Reads the legacy /gluten-free-japan/ page from git history.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { outerHTML, innerTextOfAll } from './lib/extract-html.mjs';

const dir = 'src/pages/gluten-free-japan';
// The legacy page is replaced by the new index.astro, so read the last legacy revision from git (or the file, if still legacy).
const raw = (() => {
  const cur = readFileSync(`${dir}/index.astro`, 'utf8');
  return cur.includes('gf-hero__title') ? cur : execSync(`git show ${process.env.LEGACY_REV ?? 'HEAD'}:${dir}/index.astro`, { encoding: 'utf8', maxBuffer: 1 << 26 });
})();
const src = raw.replace(/^---[\s\S]*?---\n/, '');
const lds = innerTextOfAll(src, 'script').filter((t) => t.trim().startsWith('{'));
if (lds.length !== 3) throw new Error(`expected 3 JSON-LD blocks, found ${lds.length}`);
lds.forEach((t, i) => { JSON.parse(t); writeFileSync(`${dir}/_jsonld-${i + 1}.json`, t.trim() + '\n'); });

const events = (html) => [...html.matchAll(/data-gc-event="([^"]*)"/g)].map((m) => m[1]);
const OLD = 'Generate my gluten-free card →';
const NEW = 'Generate my Japanese gluten-free card →';

// Body: the legacy <main class="gf-main"> stays (BaseLayout has no <main>, same as /allergies/).
let body = outerHTML(src, '.gf-main');
const cta = outerHTML(src, '.gf-cta');
const hero = outerHTML(src, '.gf-hero__actions');
const trust = outerHTML(src, '.gf-trust-strip');
const t = (sel) => innerTextOfAll(src, sel)[0];
const ctaH = innerTextOfAll(cta, 'h2')[0], ctaP = innerTextOfAll(cta, 'p')[0];
if (cta.split(OLD).length !== 2 || hero.split(OLD).length !== 2) throw new Error('expected one old-wording CTA in hero and in closing');
const midOld = body.split(OLD).length - 1;
if (midOld !== 2) throw new Error(`expected 2 mid CTAs with old wording, found ${midOld}`);
body = body.split(OLD).join(NEW);
if (body.split(NEW).length !== 3) throw new Error('mid CTA wording not rewritten');
const want = ['cta-gluten-free-hero', 'cta-gluten-free-mid', 'cta-gluten-free-mid-2', 'cta-gluten-free-footer'];
const got = [...events(hero), ...events(body), ...events(cta)];
if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`events changed: ${got}`);
if (/var\(--/.test(body)) throw new Error('_body.html uses var(--…): add a shim');
if (/<img/.test(body)) throw new Error('body has images: handle alt text');
writeFileSync(`${dir}/_body.html`, body + '\n');
writeFileSync(`${dir}/_hero-extra.html`, trust + '\n');
console.log(`wrote _body.html (${body.length} chars), _hero-extra.html`);
console.log(JSON.stringify({
  eyebrow: t('.gf-hero__eyebrow'), h1: t('.gf-hero__title'), lede: t('.gf-hero__lede'),
  reviewed: t('.reviewed-note'), microcopy: t('.gf-microcopy'),
  closing: { heading: ctaH, text: ctaP, event: events(cta)[0] }, heroEvent: events(hero)[0],
}, null, 2));
