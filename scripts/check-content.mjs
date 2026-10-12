// Every text block a page had at the slice base must still be on the built page.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { textBlocks, missingBlocks, unmatchedSelectors } from './lib/text-blocks.mjs';

const manifest = JSON.parse(readFileSync('content-manifest.json', 'utf8'));
const allowlist = JSON.parse(readFileSync('content-allowlist.json', 'utf8'));
const ref = process.env.CONTENT_REF ?? manifest.ref;

let failures = 0;
for (const [url, spec] of Object.entries(manifest.pages)) {
  const built = join('dist', url, 'index.html');
  if (!existsSync(built)) { failures++; console.error(`✗ ${url}: not built`); continue; }
  const legacySource = execFileSync('git', ['show', `${ref}:${spec.legacy}`]).toString('utf8');
  const includeSelectors = spec.include ?? ['body'];
  const unmatched = unmatchedSelectors(legacySource, includeSelectors);
  if (unmatched.length) {
    failures++;
    console.error(`✗ ${url}: include selector(s) matched nothing in ${ref}:${spec.legacy}: ${unmatched.join(', ')}`);
    continue;
  }
  const before = textBlocks(legacySource, { include: includeSelectors, exclude: spec.exclude ?? [] });
  if (before.length === 0) {
    failures++;
    console.error(`✗ ${url}: no text blocks found at ${ref}`);
    continue;
  }
  const after = textBlocks(readFileSync(built, 'utf8'), { exclude: ['.tm-header', '.tm-footer'] });
  const allowed = allowlist.filter((a) => a.url === url).map((a) => a.text);
  const missing = missingBlocks(before, after, allowed);
  if (missing.length) {
    failures += missing.length;
    console.error(`✗ ${url}: ${missing.length} block(s) missing\n${missing.map((m) => `    - ${m}`).join('\n')}`);
  } else {
    console.log(`ok ${url} (${before.length} blocks)`);
  }
}
if (failures) { console.error(`\n${failures} content problem(s) against ${ref}.`); process.exit(1); }
console.log(`\nContent check passed against ${ref}.`);
