// Records what search engines see today. Run once at the end of Milestone 1;
// after that, changes go through seo-allowlist.json, not by re-running this.
import { readFileSync, writeFileSync } from 'node:fs';
import { pageFacts } from './lib/page-facts.mjs';
import { BASELINE_FIELDS } from './lib/seo-checks.mjs';
import { listDistPages } from './lib/dist-pages.mjs';

const baseline = {};
for (const { url, file } of listDistPages('dist')) {
  const facts = pageFacts(readFileSync(file, 'utf8'));
  baseline[url] = Object.fromEntries(BASELINE_FIELDS.map((f) => [f, facts[f]]));
}
writeFileSync('seo-baseline.json', JSON.stringify(baseline, null, 2) + '\n');
console.log(`seo-baseline.json: ${Object.keys(baseline).length} pages`);
