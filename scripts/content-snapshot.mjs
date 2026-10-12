// Writes content-snapshot.json from the build in dist/. Run after a deliberate copy,
// link or JSON-LD change (npm run build && npm run content:snapshot) and commit the diff.
import { writeFileSync } from 'node:fs';
import { builtPages, readSnapshotOf } from './lib/built-pages.mjs';

const out = {};
for (const url of builtPages()) out[url] = readSnapshotOf(url);
writeFileSync('content-snapshot.json', JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote content-snapshot.json (${Object.keys(out).length} pages).`);
