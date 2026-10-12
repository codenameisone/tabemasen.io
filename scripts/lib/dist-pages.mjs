import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export function listDistPages(distDir) {
  const out = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name === 'index.html') {
        const folder = relative(distDir, dir).split(sep).join('/');
        out.push({ url: folder ? `/${folder}/` : '/', file: path });
      }
    }
  })(distDir);
  return out.sort((a, b) => a.url.localeCompare(b.url));
}
