import { describe, it, expect } from 'vitest';
import { pageSnapshot, snapshotDiff } from '../scripts/lib/page-snapshot.mjs';

const page = (body, head = '') => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

describe('pageSnapshot', () => {
  it('keeps text blocks in order, including header and footer', () => {
    const s = pageSnapshot(page('<header><a href="/">Home</a></header><h1>Title</h1><p>One</p><footer><p>Foot</p></footer>'));
    expect(s.blocks).toEqual(['Home', 'Title', 'One', 'Foot']);
  });

  it('records link targets, image alts and analytics events', () => {
    const s = pageSnapshot(page('<a href="https://b.example/" data-gc-event="x">B</a><a href="/a/">A</a><img src="/i.png" alt="An inn">'));
    expect(s.links).toEqual(['/a/', 'https://b.example/']);
    expect(s.alts).toEqual(['An inn']);
    expect(s.events).toEqual(['x']);
  });

  it('parses JSON-LD', () => {
    const s = pageSnapshot(page('', '<script type="application/ld+json">{"@type":"FAQPage","a":1}</script>'));
    expect(s.jsonld).toEqual([{ '@type': 'FAQPage', a: 1 }]);
  });
});

describe('snapshotDiff', () => {
  const base = pageSnapshot(page('<p>Keep</p><p>Lost</p><a href="https://gone.example/">x</a>',
    '<script type="application/ld+json">{"text":"old"}</script>'));
  it('is empty for identical pages', () => {
    expect(snapshotDiff(base, base)).toEqual([]);
  });
  it('reports removed and added blocks, links and JSON-LD changes', () => {
    const now = pageSnapshot(page('<p>Keep</p><p>New</p>', '<script type="application/ld+json">{"text":"new"}</script>'));
    const d = snapshotDiff(base, now).join('\n');
    expect(d).toContain('- block: Lost');
    expect(d).toContain('+ block: New');
    expect(d).toContain('- link: https://gone.example/');
    expect(d).toContain('JSON-LD changed');
  });
  it('catches a removed duplicate block', () => {
    const two = pageSnapshot(page('<a href="/">Go</a><a href="/">Go</a>'));
    const one = pageSnapshot(page('<a href="/">Go</a>'));
    expect(snapshotDiff(two, one)).toContain('- block: Go');
  });
});
