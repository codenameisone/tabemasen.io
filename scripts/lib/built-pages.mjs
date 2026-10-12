import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pageSnapshot } from './page-snapshot.mjs';

// Every built page as a URL path, e.g. '/', '/allergies/labeling-guide/'.
export function builtPages(root = 'dist') {
  const out = [];
  (function walk(dir, url) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (name === 'index.html') out.push(url);
      else if (!name.startsWith('_') && statSync(p).isDirectory()) walk(p, `${url}${name}/`);
    }
  })(root, '/');
  return out.sort();
}

export const readSnapshotOf = (url, root = 'dist') => pageSnapshot(readFileSync(join(root, url, 'index.html'), 'utf8'));
