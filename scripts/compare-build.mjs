// Proves Milestone 1's promise: dist/ serves what the legacy site served.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeHtml } from './lib/normalize-html.mjs';
import { classifyLegacyFiles, firstDifference } from './lib/compare.mjs';

const ref = process.env.COMPARE_REF ?? 'pre-astro';
const dist = 'dist';

const git = (...args) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
const tree = git('ls-tree', '-r', '--name-only', ref).toString('utf8').trim().split('\n');
const { pages, statics } = classifyLegacyFiles(tree);

let failures = 0;
const fail = (msg) => { failures++; console.error(msg); };

for (const path of pages) {
  const built = join(dist, path);
  if (!existsSync(built)) { fail(`MISSING page  ${path}`); continue; }
  const before = normalizeHtml(git('show', `${ref}:${path}`).toString('utf8'));
  const after = normalizeHtml(readFileSync(built, 'utf8'));
  const diff = firstDifference(before, after);
  if (diff) {
    fail(`DIFF    page  ${path} (normalised line ${diff.line})\n  ${ref}: ${diff.expected}\n  dist: ${diff.actual}`);
  } else {
    console.log(`ok      page  ${path}`);
  }
}

for (const path of statics) {
  const built = join(dist, path);
  if (!existsSync(built)) { fail(`MISSING file  ${path}`); continue; }
  if (Buffer.compare(git('show', `${ref}:${path}`), readFileSync(built)) !== 0) {
    fail(`DIFF    file  ${path} (bytes differ)`);
  } else {
    console.log(`ok      file  ${path}`);
  }
}

console.log(`\n${pages.length} pages, ${statics.length} files compared against ${ref}: ${failures} problem(s).`);
process.exit(failures ? 1 : 0);
