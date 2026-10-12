// Every built page must match content-snapshot.json: text blocks (header and footer
// included), link targets, image alts, analytics events and JSON-LD. A deliberate change
// is made by refreshing the snapshot (npm run content:snapshot) so it shows in the PR diff.
import { readFileSync } from 'node:fs';
import { builtPages, readSnapshotOf } from './lib/built-pages.mjs';
import { snapshotDiff } from './lib/page-snapshot.mjs';

const snapshot = JSON.parse(readFileSync('content-snapshot.json', 'utf8'));
const pages = builtPages();
let failures = 0;
for (const url of Object.keys(snapshot)) {
  if (!pages.includes(url)) { failures++; console.error(`✗ ${url}: in the snapshot but not built`); }
}
for (const url of pages) {
  if (!snapshot[url]) { failures++; console.error(`✗ ${url}: built but not in the snapshot`); continue; }
  const diff = snapshotDiff(snapshot[url], readSnapshotOf(url));
  if (diff.length) {
    failures += diff.length;
    console.error(`✗ ${url}\n${diff.map((d) => `    ${d}`).join('\n')}`);
  } else console.log(`ok ${url}`);
}
if (failures) {
  console.error(`\n${failures} content difference(s) from content-snapshot.json.`);
  console.error('If they are intended: npm run content:snapshot, and commit the snapshot with the change.');
  process.exit(1);
}
console.log('\nContent check passed against content-snapshot.json.');
