import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { markInline } from './lib/astro-inline.mjs';

function astroFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return astroFiles(path);
    return path.endsWith('.astro') ? [path] : [];
  });
}

for (const path of astroFiles('src/pages')) {
  const before = readFileSync(path, 'utf8');
  const after = markInline(before);
  if (after !== before) writeFileSync(path, after);
  console.log(`${after === before ? 'unchanged' : 'marked   '} ${path}`);
}
