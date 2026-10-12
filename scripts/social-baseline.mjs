// One-off: record each page's legacy link-preview meta (og:, twitter:, article:) from the
// pre-redesign sources at a git ref (default slice1-base) into seo-social-baseline.json.
// check:seo then requires every recorded value to survive unchanged.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { socialMeta } from './lib/seo-checks.mjs';

const ref = process.argv[2] ?? 'slice1-base';
const urls = Object.keys(JSON.parse(readFileSync('seo-baseline.json', 'utf8')));
const out = {};
for (const url of urls) {
  const src = execFileSync('git', ['show', `${ref}:src/pages${url}index.astro`], { encoding: 'utf8' });
  const meta = socialMeta(src);
  if (Object.keys(meta).length) out[url] = meta;
}
writeFileSync('seo-social-baseline.json', JSON.stringify(out, null, 2) + '\n');
console.log(`Recorded social meta for ${Object.keys(out).length} of ${urls.length} pages from ${ref}.`);
