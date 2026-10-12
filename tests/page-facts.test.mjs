import { describe, it, expect } from 'vitest';
import { pageFacts } from '../scripts/lib/page-facts.mjs';

const html = `<!DOCTYPE html><html><head>
  <title>  Japan  Allergy Card | tabemasen </title>
  <meta name="description" content="Free card.">
  <link rel="canonical" href="https://tabemasen.io/allergies/">
  <link rel="stylesheet" href="/styles.css">
  <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization"},{"@type":["Article","WebPage"],"author":{"@type":"Person"}}]}</script>
  <script type="application/ld+json">{ broken </script>
  <script src="data.js"></script>
</head><body>
  <h1>Japan food allergy <em>restaurant</em> card</h1><h1>Second</h1>
  <a href="/halal/">Halal</a><img src="/assets/og-image.png" alt="">
</body></html>`;

describe('pageFacts', () => {
  const f = pageFacts(html);

  it('reads title, description and canonical', () => {
    expect(f.title).toBe('Japan Allergy Card | tabemasen');
    expect(f.description).toBe('Free card.');
    expect(f.canonical).toBe('https://tabemasen.io/allergies/');
  });

  it('reads the first H1 as collapsed text including nested elements', () => {
    expect(f.h1).toBe('Japan food allergy restaurant card');
  });

  it('collects JSON-LD @types (nested, arrays) sorted and unique, and parse errors', () => {
    expect(f.jsonLdTypes).toEqual(['Article', 'Organization', 'Person', 'WebPage']);
    expect(f.jsonLdErrors).toHaveLength(1);
  });

  it('returns null robots when absent', () => {
    expect(f.robots).toBeNull();
  });

  it('collects stylesheet, script, anchor and image references but not the canonical', () => {
    expect(f.links).toEqual(['/styles.css', 'data.js', '/halal/', '/assets/og-image.png']);
  });
});
