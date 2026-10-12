import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('FAQ disclosure markers', () => {
  it.each(['halal-body', 'vegan-body', 'gluten-free-body', 'halal-certification-guide-body'])('%s.css does not hang the marker outside', (f) => {
    expect(readFileSync(`src/styles/${f}.css`, 'utf8')).not.toMatch(/list-style-position:\s*outside/);
  });
});
