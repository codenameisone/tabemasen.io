import { describe, it, expect } from 'vitest';
import {
  baselineProblems, pageProblems, resolveInternal, linkCandidates, sitemapProblems,
  pageBasicsProblems, allowlistProblems,
  socialMeta, socialProblems,
} from '../scripts/lib/seo-checks.mjs';

const facts = (over = {}) => ({
  title: 'T', description: 'D', h1: 'H', canonical: 'https://tabemasen.io/a/',
  robots: null, jsonLdTypes: ['Article'], jsonLdErrors: [], links: [], refresh: false, ...over,
});
const noAllow = { changes: [], knownBrokenLinks: [] };

describe('baselineProblems', () => {
  it('passes when nothing changed', () => {
    expect(baselineProblems({ '/a/': facts() }, { '/a/': facts() }, noAllow)).toEqual([]);
  });

  it('reports a missing page', () => {
    expect(baselineProblems({ '/a/': facts() }, {}, noAllow)).toEqual(['/a/: page is missing from dist/']);
  });

  it('reports a changed field with old and new values', () => {
    const p = baselineProblems({ '/a/': facts() }, { '/a/': facts({ title: 'T2' }) }, noAllow);
    expect(p).toEqual(['/a/: title changed\n    was: "T"\n    now: "T2"']);
  });

  it('compares jsonLdTypes as lists', () => {
    const p = baselineProblems({ '/a/': facts() }, { '/a/': facts({ jsonLdTypes: ['Article', 'FAQPage'] }) }, noAllow);
    expect(p).toHaveLength(1);
  });

  it('accepts a change listed in the allowlist', () => {
    const allow = { changes: [{ url: '/a/', field: 'title', reason: 'CTR fix', date: '2026-10-12' }], knownBrokenLinks: [] };
    expect(baselineProblems({ '/a/': facts() }, { '/a/': facts({ title: 'T2' }) }, allow)).toEqual([]);
  });

  it('ignores new pages that are not in the baseline', () => {
    expect(baselineProblems({}, { '/new/': facts() }, noAllow)).toEqual([]);
  });
});

describe('pageProblems', () => {
  it('reports JSON-LD parse errors', () => {
    expect(pageProblems('/a/', facts({ jsonLdErrors: ['Unexpected token'] })))
      .toEqual(['/a/: JSON-LD does not parse (Unexpected token)']);
  });

  it('reports noindex in any case', () => {
    expect(pageProblems('/a/', facts({ robots: 'NoIndex, follow' }))).toEqual(['/a/: robots meta contains noindex']);
  });

  it('passes a clean page', () => {
    expect(pageProblems('/a/', facts())).toEqual([]);
  });
});

describe('resolveInternal', () => {
  it('resolves root-relative and page-relative paths', () => {
    expect(resolveInternal('/halal/', '/allergies/')).toBe('/halal/');
    expect(resolveInternal('data.js', '/')).toBe('/data.js');
    expect(resolveInternal('../vegan/', '/allergies/labeling-guide/')).toBe('/allergies/vegan/');
  });

  it('treats absolute links to the own site as internal', () => {
    expect(resolveInternal('https://tabemasen.io/gluten-free-japan/#x', '/gluten-free/')).toBe('/gluten-free-japan/');
  });

  it('strips query and hash, and ignores a pure fragment', () => {
    expect(resolveInternal('/?a=1#p=vegan', '/vegan/')).toBe('/');
    expect(resolveInternal('#corrections', '/about/')).toBeNull();
  });

  it('returns null for external and non-navigational links', () => {
    expect(resolveInternal('https://buymeacoffee.com/iwakuranik', '/')).toBeNull();
    expect(resolveInternal('//gc.zgo.at/count.js', '/')).toBeNull();
    expect(resolveInternal('mailto:hello@tabemasen.io', '/')).toBeNull();
  });

  it('decodes percent-encoding', () => {
    expect(resolveInternal('/a%20b/', '/')).toBe('/a b/');
  });
});

describe('linkCandidates', () => {
  it('maps a directory path to its index.html', () => {
    expect(linkCandidates('/halal/')).toEqual(['halal/index.html']);
    expect(linkCandidates('/')).toEqual(['index.html']);
  });

  it('accepts a file or a directory without trailing slash', () => {
    expect(linkCandidates('/data.js')).toEqual(['data.js', 'data.js/index.html']);
  });
});

describe('sitemapProblems', () => {
  const xml = '<urlset><url><loc>https://tabemasen.io/</loc></url><url><loc>https://tabemasen.io/halal/</loc></url></urlset>';

  it('passes when every indexable URL is listed', () => {
    expect(sitemapProblems(xml, ['/', '/halal/'])).toEqual([]);
  });

  it('reports indexable URLs missing from the sitemap', () => {
    expect(sitemapProblems(xml, ['/', '/halal/', '/vegan/'])).toEqual(['sitemap.xml is missing /vegan/']);
  });

  it('reports sitemap URLs that do not exist', () => {
    expect(sitemapProblems(xml, ['/'])).toEqual(['sitemap.xml lists /halal/, which is not an indexable built page']);
  });
});

describe('pageBasicsProblems', () => {
  it('requires title, description, h1 and canonical on normal pages', () => {
    expect(pageBasicsProblems('/new/', facts({ title: '', description: null, h1: null, canonical: null, refresh: false })))
      .toEqual(['/new/: missing title', '/new/: missing description', '/new/: missing h1', '/new/: missing canonical']);
  });

  it('exempts meta-refresh redirect stubs', () => {
    expect(pageBasicsProblems('/gluten-free/', facts({ description: null, refresh: true }))).toEqual([]);
  });
});

describe('allowlistProblems', () => {
  it('requires a reason everywhere and a YYYY-MM-DD date on changes', () => {
    const p = allowlistProblems({
      changes: [{ url: '/a/', field: 'title', reason: '', date: '12/10/2026' }],
      knownBrokenLinks: [{ from: '/a/', href: '/x' }],
    });
    expect(p).toEqual([
      'seo-allowlist.json changes[0] (/a/ title): missing reason',
      'seo-allowlist.json changes[0] (/a/ title): date must be YYYY-MM-DD',
      'seo-allowlist.json knownBrokenLinks[0] (/a/ -> /x): missing reason',
    ]);
  });
});

describe('resolveInternal with malformed encoding', () => {
  it('returns the raw path instead of throwing', () => {
    expect(resolveInternal('/a%zz/', '/')).toBe('/a%zz/');
  });
});

describe('social meta', () => {
  const html = `<head><meta property="og:type" content="article"><meta property="og:description" content="Tom &amp; &quot;Jerry&quot;">
    <meta name="twitter:description" content="Short"><meta name="description" content="not social"></head>`;

  it('reads og:, twitter: and article: meta with entities decoded', () => {
    expect(socialMeta(html)).toEqual({ 'og:type': 'article', 'og:description': 'Tom & "Jerry"', 'twitter:description': 'Short' });
  });

  it('flags a changed or missing legacy value and ignores added tags', () => {
    const baseline = { '/a/': { 'og:type': 'article', 'twitter:description': 'Short', 'og:title': 'T' } };
    const current = { '/a/': { 'og:type': 'website', 'twitter:description': 'Short', 'twitter:image': 'x' } };
    const problems = socialProblems(baseline, current);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain('/a/: og:type changed');
    expect(problems[1]).toContain('/a/: og:title changed');
  });

  it('keeps repeated keys (article:tag) as an ordered array', () => {
    const h = '<meta property="article:tag" content="a"><meta property="article:tag" content="b"><meta property="og:type" content="article">';
    expect(socialMeta(h)).toEqual({ 'article:tag': ['a', 'b'], 'og:type': 'article' });
  });

  it('flags a dropped or reordered repeated tag', () => {
    const baseline = { '/a/': { 'article:tag': ['a', 'b'] } };
    expect(socialProblems(baseline, { '/a/': { 'article:tag': ['a', 'b'] } })).toEqual([]);
    expect(socialProblems(baseline, { '/a/': { 'article:tag': 'b' } })).toHaveLength(1);
    expect(socialProblems(baseline, { '/a/': { 'article:tag': ['a'] } })).toHaveLength(1);
    expect(socialProblems(baseline, { '/a/': { 'article:tag': ['b', 'a'] } })).toHaveLength(1);
  });

  it('passes when every legacy value is unchanged', () => {
    expect(socialProblems({ '/a/': { 'og:type': 'article' } }, { '/a/': { 'og:type': 'article', 'og:url': 'u' } })).toEqual([]);
  });
});
