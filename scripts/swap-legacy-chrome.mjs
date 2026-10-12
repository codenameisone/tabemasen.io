// One-off: run once, commit the result.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { swapChrome, LEGACY_PAGES } from './lib/legacy-chrome.mjs';

for (const [rel, opts] of Object.entries(LEGACY_PAGES)) {
  const path = join('src/pages', rel);
  writeFileSync(path, swapChrome(readFileSync(path, 'utf8'), opts));
  console.log(`swapped ${path}`);
}
