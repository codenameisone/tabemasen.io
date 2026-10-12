// scripts/extract-halal-certification-guide.mjs — one-off: run once, commit the fragments.
import { readFileSync, writeFileSync } from 'node:fs';
import { outerHTML, outerHTMLWithout, innerTextOfAll } from './lib/extract-html.mjs';

const dir = 'src/pages/halal/certification-guide';
const src = readFileSync(`${dir}/index.astro`, 'utf8').replace(/^---[\s\S]*?---\n/, '');
const lds = innerTextOfAll(src, 'script').filter((t) => t.trim().startsWith('{'));
if (lds.length !== 3) throw new Error(`expected 3 JSON-LD blocks, found ${lds.length}`);
lds.forEach((t, i) => { JSON.parse(t); writeFileSync(`${dir}/_jsonld-${i + 1}.json`, t.trim() + '\n'); });

const write = (name, html) => { writeFileSync(`${dir}/${name}`, html + '\n'); console.log(`wrote ${name} (${html.length} chars)`); return html; };
const hero = write('_hero.html', outerHTML(src, '.cg-hero__inner'));
const toc = write('_toc.html', outerHTML(src, '.cg-toc'));
const body = write('_body.html', outerHTMLWithout(src, '.cg-article', '.cg-toc'));
const OLD = 'Generate my halal card →', NEW = 'Generate my Japanese halal card →';
const ctaSrc = outerHTML(src, '.cg-cta');
if (ctaSrc.split(OLD).length !== 2) throw new Error('CTA wording not found exactly once');
const cta = write('_cta.html', ctaSrc.replace(OLD, NEW));

const count = (s, re) => (s.match(re) ?? []).length;
if (count(cta, /Generate my Japanese halal card →/g) !== 1) throw new Error('new CTA wording count');
if (!cta.includes('data-gc-event="cta-halal-cert-footer"')) throw new Error('footer event changed');
const events = [...body.matchAll(/data-gc-event="([^"]*)"/g)].map((m) => m[1]).sort().join();
if (events !== 'cta-halal-cert-inline-faq,cta-halal-cert-inline-verify') throw new Error(`body events: ${events}`);
if (body.includes('cg-toc')) throw new Error('contents list left in body');
if (!hero.includes('cg-hero__disclaimer')) throw new Error('disclaimer missing from hero');
if (/var\(--/.test(hero + toc + body + cta)) console.log('NOTE: fragments use var(--…)');
else console.log('no var(--…) in fragments');
