import { describe, it, expect } from 'vitest';
import { swapChrome } from '../scripts/lib/legacy-chrome.mjs';

const legacy = `<!DOCTYPE html>
<html lang="en">
<head><title>x</title></head>
<body>
  <header class="site-header">
    <nav class="site-nav"><a href="/">Generate card</a></nav>
  </header>
  <main><p>keep</p></main>
  <footer class="site-footer">
    <p>old</p>
  </footer>
  <script is:inline src="/nav.js" defer></script>
  <script is:inline src="/analytics.js"></script>
</body>
</html>`;

describe('swapChrome', () => {
  const out = swapChrome(legacy, { page: 'vegan', current: '/vegan/' });

  it('adds frontmatter importing the components', () => {
    expect(out.startsWith("---\nimport SiteHeader from '../../components/SiteHeader.astro';\nimport SiteFooter from '../../components/SiteFooter.astro';\n---\n<!DOCTYPE html>")).toBe(true);
  });

  it('swaps header and footer and keeps the body', () => {
    expect(out).toContain('<SiteHeader page="vegan" current="/vegan/" />');
    expect(out).toContain('<SiteFooter page="vegan" />');
    expect(out).toContain('<main><p>keep</p></main>');
    expect(out).not.toContain('site-header');
    expect(out).not.toContain('site-footer');
  });

  it('drops nav.js but keeps other scripts', () => {
    expect(out).not.toContain('/nav.js');
    expect(out).toContain('/analytics.js');
  });

  it('omits current when not given', () => {
    expect(swapChrome(legacy, { page: 'about' })).toContain('<SiteHeader page="about" />');
  });

  it('uses the right relative import depth (folders below src/pages/)', () => {
    expect(swapChrome(legacy, { page: 'x', depth: 0 })).toContain("from '../components/SiteHeader.astro'");
    expect(swapChrome(legacy, { page: 'x', depth: 1 })).toContain("from '../../components/SiteHeader.astro'");
    expect(swapChrome(legacy, { page: 'x', depth: 2 })).toContain("from '../../../components/SiteHeader.astro'");
  });

  it('refuses files without the legacy blocks or with frontmatter', () => {
    expect(() => swapChrome('<html><body></body></html>', { page: 'x' })).toThrow(/site-header/);
    expect(() => swapChrome('---\n---\n' + legacy, { page: 'x' })).toThrow(/frontmatter/);
  });
});
