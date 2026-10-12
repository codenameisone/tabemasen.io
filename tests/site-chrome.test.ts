import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SiteHeader from '../src/components/SiteHeader.astro';
import SiteFooter from '../src/components/SiteFooter.astro';

const container = await AstroContainer.create();

describe('SiteHeader', async () => {
  const html = await container.renderToString(SiteHeader, { props: { page: 'vegan', current: '/vegan/' } });

  it('links every hub and the guides index', () => {
    for (const href of ['/guides/', '/allergies/', '/halal/', '/vegan/', '/gluten-free-japan/']) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  it('marks only the current section', () => {
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/href="\/vegan\/"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/vegan\/"/);
  });

  it('keeps the per-page nav CTA event name', () => {
    expect(html).toContain('data-gc-event="cta-vegan-nav"');
    expect(html).toContain('Make my card');
  });

  it('has an accessible mobile menu toggle', () => {
    expect(html).toContain('aria-controls="tm-nav"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('id="tm-nav"');
  });
});

describe('SiteFooter', async () => {
  const html = await container.renderToString(SiteFooter, { props: { page: 'halal' } });

  it('keeps every link the old footer had', () => {
    for (const href of ['/allergies/', '/gluten-free-japan/', '/vegan/', '/halal/',
      '/allergies/food-allergies-in-japanese/', '/allergies/labeling-guide/', '/celiac/',
      'https://www.foodallergy.org/resources/travel-tips-japan', 'https://www.legalnomads.com/gluten-free/japanese/',
      'https://jp.usembassy.gov/services/importing-medication/', '/about/', '/featured/',
      'https://github.com/codenameisone/tabemasen.io', 'https://github.com/codenameisone/tabemasen.io/blob/main/CHANGELOG.md',
      'mailto:hello@tabemasen.io', 'https://buymeacoffee.com/iwakuranik']) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  it('adds the guides index and the halal certification guide', () => {
    expect(html).toContain('href="/guides/"');
    expect(html).toContain('href="/halal/certification-guide/"');
  });

  it('keeps the per-page coffee event and the safety disclaimer', () => {
    expect(html).toContain('data-gc-event="coffee-halal"');
    expect(html).toContain('Emergency in Japan: 119.');
    expect(html).toContain('Wording last reviewed October 2026.');
  });
});
