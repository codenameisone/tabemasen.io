import { describe, it, expect } from 'vitest';
import { normalizeHtml } from '../scripts/lib/normalize-html.mjs';

const doc = (body, head = '<title>t</title>') =>
  `<!DOCTYPE html><html lang="en"><head>${head}</head><body>${body}</body></html>`;

describe('normalizeHtml', () => {
  it('ignores whitespace differences between tags and inside text', () => {
    expect(normalizeHtml(doc('<p>Hello   world</p>\n\n<p>x</p>')))
      .toBe(normalizeHtml(doc('<p>Hello world</p><p>x</p>')));
  });

  it('ignores attribute order', () => {
    expect(normalizeHtml(doc('<a href="/" class="x">a</a>')))
      .toBe(normalizeHtml(doc('<a class="x" href="/">a</a>')));
  });

  it('treats defer and defer="" as the same', () => {
    expect(normalizeHtml(doc('<script src="/a.js" defer></script>')))
      .toBe(normalizeHtml(doc('<script defer="" src="/a.js"></script>')));
  });

  it('treats &nbsp; and a literal no-break space as the same', () => {
    expect(normalizeHtml(doc('<p>a&nbsp;b</p>')))
      .toBe(normalizeHtml(doc('<p>a b</p>')));
  });

  it('does not treat a no-break space as an ordinary space', () => {
    expect(normalizeHtml(doc('<p>a&nbsp;b</p>')))
      .not.toBe(normalizeHtml(doc('<p>a b</p>')));
  });

  it('detects changed text', () => {
    expect(normalizeHtml(doc('<h1>Allergy card</h1>')))
      .not.toBe(normalizeHtml(doc('<h1>Allergy cards</h1>')));
  });

  it('keeps and compares comments', () => {
    expect(normalizeHtml(doc('<!-- one --><p>x</p>')))
      .not.toBe(normalizeHtml(doc('<!-- two --><p>x</p>')));
  });

  it('detects a changed attribute value', () => {
    expect(normalizeHtml(doc('<link rel="canonical" href="https://tabemasen.io/a/">', '')))
      .not.toBe(normalizeHtml(doc('<link rel="canonical" href="https://tabemasen.io/b/">', '')));
  });

  it('detects changed script and style content', () => {
    expect(normalizeHtml(doc('<script>var a = 1;</script>')))
      .not.toBe(normalizeHtml(doc('<script>var a = 2;</script>')));
    expect(normalizeHtml(doc('', '<style>.a { color: red; }</style>')))
      .not.toBe(normalizeHtml(doc('', '<style>.a { color: blue; }</style>')));
  });

  it('detects an added attribute such as an Astro scope class', () => {
    expect(normalizeHtml(doc('<p>x</p>')))
      .not.toBe(normalizeHtml(doc('<p data-astro-cid-abc123>x</p>')));
  });

  it('prints one node per line', () => {
    expect(normalizeHtml(doc('<p>x</p>')).split('\n')).toEqual([
      '<!doctype html>',
      '<html lang="en">',
      '  <head>',
      '    <title>',
      '      t',
      '    </title>',
      '  </head>',
      '  <body>',
      '    <p>',
      '      x',
      '    </p>',
      '  </body>',
      '</html>',
    ]);
  });
});
