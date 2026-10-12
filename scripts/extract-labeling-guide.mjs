// scripts/extract-labeling-guide.mjs — one-off: run once, commit the fragments.
import { readFileSync, writeFileSync } from 'node:fs';
import { outerHTML, outerHTMLWithout, innerTextOfAll } from './lib/extract-html.mjs';

const dir = 'src/pages/allergies/labeling-guide';
const src = readFileSync(`${dir}/index.astro`, 'utf8').replace(/^---[\s\S]*?---\n/, '');
const lds = innerTextOfAll(src, 'script').filter((t) => t.trim().startsWith('{'));
if (lds.length !== 3) throw new Error(`expected 3 JSON-LD blocks, found ${lds.length}`);
lds.forEach((t, i) => { JSON.parse(t); writeFileSync(`${dir}/_jsonld-${i + 1}.json`, t.trim() + '\n'); });

const write = (name, html) => { writeFileSync(`${dir}/${name}`, html + '\n'); console.log(`wrote ${name} (${html.length} chars)`); };
write('_hero.html', outerHTML(src, '.lg-hero__inner'));
write('_notice.html', outerHTML(src, '.lg-disclaimer'));
write('_toc.html', outerHTML(src, '.lg-toc'));
write('_body.html', outerHTMLWithout(src, '.lg-article', '.lg-toc'));
write('_cta.html', outerHTML(src, '.lg-cta').replace('Generate my card →', 'Generate my Japanese allergy card →'));
