import { describe, it, expect } from 'vitest';
import { textBlocks, missingBlocks, unmatchedSelectors } from '../scripts/lib/text-blocks.mjs';

const page = (body) => `<!DOCTYPE html><html><head><title>t</title><style>p{}</style></head><body>${body}</body></html>`;

describe('textBlocks', () => {
  it('collects paragraphs, headings, list items and summaries with collapsed whitespace', () => {
    const html = page('<h2>Why  it\n matters</h2><p>One <em>two</em></p><ul><li>a</li></ul><details><summary>Q?</summary><p>A.</p></details>');
    expect(textBlocks(html)).toEqual(['Why it matters', 'One two', 'a', 'Q?', 'A.']);
  });

  it('treats a div with its own text as a block', () => {
    expect(textBlocks(page('<div class="card"><div class="t">Peanut <em>(落花生)</em></div></div>'))).toEqual(['Peanut (落花生)']);
  });

  it('covers text that lives only in links and spans', () => {
    expect(textBlocks(page('<div class="actions"><a href="/">Generate →</a> <span>No signup · Free</span></div>'))).toEqual(['Generate →', 'No signup · Free']);
  });

  it('does not emit nested blocks separately', () => {
    expect(textBlocks(page('<li><p>inner</p> tail</li>'))).toEqual(['inner tail']);
  });

  it('limits to include regions and skips exclude regions, scripts and styles', () => {
    const html = page('<header class="site-header"><p>nav</p></header><main><p>keep</p><div class="phone"><p>mock</p></div><script>var x</script></main>');
    expect(textBlocks(html, { include: ['main'], exclude: ['.phone'] })).toEqual(['keep']);
    expect(textBlocks(html, { exclude: ['.site-header'] })).toEqual(['keep', 'mock']);
  });

  it('matches #id selectors and returns unique blocks', () => {
    expect(textBlocks(page('<section id="x"><p>a</p><p>a</p></section><p>b</p>'), { include: ['#x'] })).toEqual(['a']);
  });
});

describe('missingBlocks', () => {
  it('lists old blocks absent from the new page and not allowed', () => {
    expect(missingBlocks(['a', 'b', 'c'], ['a', 'x'], ['c'])).toEqual(['b']);
  });
});

describe('unmatchedSelectors', () => {
  it('returns selectors that match no element', () => {
    const html = page('<main><p>text</p></main>');
    expect(unmatchedSelectors(html, ['main', '.nope'])).toEqual(['.nope']);
  });

  it('returns empty array when all selectors match', () => {
    const html = page('<main><p>text</p></main>');
    expect(unmatchedSelectors(html, ['main', 'p'])).toEqual([]);
  });

  it('matches tag, class and id selectors', () => {
    const html = page('<div class="card" id="x"><p>text</p></div>');
    expect(unmatchedSelectors(html, ['.card', '#x', 'span'])).toEqual(['span']);
  });
});
