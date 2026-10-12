import { describe, it, expect } from 'vitest';
import { exampleCardHtml } from '../src/lib/cardData';
import { insertAtMarker } from '../src/lib/fragments';

describe('exampleCardHtml', () => {
  it('renders the real gluten-free card as a labelled static image of text', () => {
    const html = exampleCardHtml({ patterns: ['gluten-free'] }, 'Example "gluten-free" card');
    expect(html).toMatch(/^<div class="card" lang="ja" role="img" aria-label="Example &quot;gluten-free&quot; card">/);
    expect(html).toContain('大麦・ライ麦');
    expect(html).toContain('共用の調理器具');
  });
});

describe('insertAtMarker', () => {
  it('replaces the one marker', () => {
    expect(insertAtMarker('<p>a</p><!-- x --><p>b</p>', '<!-- x -->', '<i>c</i>')).toBe('<p>a</p><i>c</i><p>b</p>');
  });
  it('throws when the marker is missing or repeated, so a copy edit cannot drop the insert silently', () => {
    expect(() => insertAtMarker('<p>a</p>', '<!-- x -->', 'c')).toThrow(/<!-- x -->.*0/);
    expect(() => insertAtMarker('<!-- x --><!-- x -->', '<!-- x -->', 'c')).toThrow(/2/);
  });
});

describe('splitAtMarkers', async () => {
  const { splitAtMarkers } = await import('../src/lib/fragments');
  it('splits at each marker in order', () => {
    expect(splitAtMarkers('a<!-- 1 -->b<!-- 2 -->c', ['<!-- 1 -->', '<!-- 2 -->'])).toEqual(['a', 'b', 'c']);
  });
  it('throws when a marker is missing, repeated or out of order', () => {
    expect(() => splitAtMarkers('a<!-- 1 -->b', ['<!-- 1 -->', '<!-- 2 -->'])).toThrow(/<!-- 2 -->/);
    expect(() => splitAtMarkers('a<!-- 1 -->b<!-- 1 -->', ['<!-- 1 -->'])).toThrow(/<!-- 1 -->/);
    expect(() => splitAtMarkers('a<!-- 2 -->b<!-- 1 -->c', ['<!-- 1 -->', '<!-- 2 -->'])).toThrow(/order/);
  });
});
