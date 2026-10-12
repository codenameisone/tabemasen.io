import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'src/styles';
const files = readdirSync(dir).filter((f) => f.endsWith('.css'));

describe('CSS content alt-text fallbacks', () => {
  it('every `content: X / Y` declaration is preceded by a plain content line in the same rule', () => {
    const bad = [];
    for (const f of files) {
      const css = readFileSync(join(dir, f), 'utf8');
      for (const [, body] of css.matchAll(/\{([^{}]*)\}/g)) {
        const decls = body.split(';').map((d) => d.trim()).filter(Boolean);
        decls.forEach((d, i) => {
          const m = d.match(/^content:\s*(.+?)\s+\/\s+.+$/);
          if (!m) return;
          const prev = decls[i - 1] ?? '';
          if (prev.replace(/\s+/g, ' ') !== `content: ${m[1]}`) bad.push(`${f}: ${d}`);
        });
      }
    }
    expect(bad).toEqual([]);
  });
});
