import { describe, it, expect } from 'vitest';
import { outerHTML, outerHTMLWithout, innerTextOfAll } from '../scripts/lib/extract-html.mjs';

const doc = `<!DOCTYPE html><html><head>
<script type="application/ld+json">{"a":1}</script><script type="application/ld+json">{"b":2}</script></head><body>
<section class="lg-hero"><div class="lg-hero__inner"><h1 class="t">Japan's allergen labeling, explained: what's on the packet vs.&nbsp;what's not</h1></div></section>
<article class="lg-article"><section id="s1"><p>Keep <em>this</em></p><nav class="lg-toc"><a href="#s1">S1</a></nav></section></article>
</body></html>`;

describe('extract-html', () => {
  it('returns the outer HTML of the first match, nested markup intact', () => {
    expect(outerHTML(doc, '.lg-hero__inner')).toBe('<div class="lg-hero__inner"><h1 class="t">Japan\'s allergen labeling, explained: what\'s on the packet vs.&nbsp;what\'s not</h1></div>');
  });

  it('keeps the no-break space as &nbsp;', () => {
    expect(outerHTML(doc, 'h1')).toContain('vs.&nbsp;what');
  });

  it('removes a descendant from the extracted element', () => {
    const body = outerHTMLWithout(doc, '.lg-article', '.lg-toc');
    expect(body).toContain('<p>Keep <em>this</em></p>');
    expect(body).not.toContain('lg-toc');
  });

  it('collects the raw text of every match', () => {
    expect(innerTextOfAll(doc, 'script')).toEqual(['{"a":1}', '{"b":2}']);
  });

  it('throws when nothing matches', () => {
    expect(() => outerHTML(doc, '.nope')).toThrow(/\.nope/);
  });
});
