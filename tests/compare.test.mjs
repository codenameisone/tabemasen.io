import { describe, it, expect } from 'vitest';
import { classifyLegacyFiles, firstDifference } from '../scripts/lib/compare.mjs';

describe('classifyLegacyFiles', () => {
  it('splits pages from statics and drops repo-only files', () => {
    const result = classifyLegacyFiles([
      '.gitignore', 'CHANGELOG.md', 'README.md', 'docs/superpowers/specs/x.md',
      '.github/workflows/site.yml',
      'index.html', 'allergies/index.html', 'allergies/labeling-guide/index.html',
      'CNAME', 'app.js', 'assets/og-image.png', 'llms.txt', 'sitemap.xml',
    ]);
    expect(result.pages).toEqual(['index.html', 'allergies/index.html', 'allergies/labeling-guide/index.html']);
    expect(result.statics).toEqual(['CNAME', 'app.js', 'assets/og-image.png', 'llms.txt', 'sitemap.xml']);
  });

  it('does not treat a file merely ending in index.html as a page', () => {
    expect(classifyLegacyFiles(['notindex.html']).statics).toEqual(['notindex.html']);
  });
});

describe('firstDifference', () => {
  it('returns null for equal strings', () => {
    expect(firstDifference('a\nb', 'a\nb')).toBeNull();
  });

  it('reports the first differing line, 1-based', () => {
    expect(firstDifference('a\nb\nc', 'a\nB\nc')).toEqual({ line: 2, expected: 'b', actual: 'B' });
  });

  it('reports a missing tail', () => {
    expect(firstDifference('a\nb', 'a')).toEqual({ line: 2, expected: 'b', actual: '<end of file>' });
  });
});
