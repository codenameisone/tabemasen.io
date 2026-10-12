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
  const html = await container.renderToString(SiteFooter, { props: { page: 'allergies' } });

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
    expect(html).toContain('data-gc-event="coffee-allergies"');
    expect(html).toContain('Emergency in Japan: 119.');
    expect(html).toContain('Wording last reviewed October 2026.');
  });
});

describe('SiteFooter per-diet resources', async () => {
  const render = (page: string) => container.renderToString(SiteFooter, { props: { page } });
  const cases: Record<string, string[]> = {
    vegan: ['https://www.happycow.net/asia/japan/', 'https://www.vegeproject.org/', 'https://isitveganjapan.com/', 'https://vegewel.com/en/'],
    halal: ['https://www.halalgourmet.jp/', 'https://halalnavi.com/', 'https://tokyocamii.org/en/', 'https://www.jhalal.com/'],
    'halal-cert': ['https://www.halalgourmet.jp/en', 'https://www.halal-navi.com/', 'https://www.japan.travel/en/plan/muslim-travelers/', 'https://jhalal.com/en/'],
    allergies: ['https://www.foodallergy.org/resources/travel-tips-japan', 'https://www.legalnomads.com/gluten-free/japanese/', 'https://jp.usembassy.gov/services/importing-medication/'],
  };
  for (const [page, hrefs] of Object.entries(cases)) {
    it(`${page} footer lists the resources its legacy footer had`, async () => {
      const html = await render(page);
      for (const href of hrefs) expect(html).toContain(`href="${href}"`);
    });
  }

  it('vegan footer does not fall back to the allergy resources', async () => {
    expect(await render('vegan')).not.toContain('foodallergy.org');
  });

  it('halal certification guide keeps its own disclaimer', async () => {
    const html = await render('halal-cert');
    expect(html).toContain('This article explains halal certification from a practical standpoint and is not a religious ruling.');
    expect(html).toContain('If in doubt, consult the certifying body directly.');
    expect(html).not.toContain('Not medical advice.');
  });
});

describe('SiteFooter name meaning', () => {
  it('home footer explains the name, other pages do not', async () => {
    const home = (await container.renderToString(SiteFooter, { props: { page: 'home' } })).replace(/ data-astro-cid-\w+/g, '');
    const vegan = await container.renderToString(SiteFooter, { props: { page: 'vegan' } });
    expect(home).toMatch(/<strong>Tabemasen<\/strong> \(<span lang="ja">食べません<\/span>\) is Japanese for “I don't eat” — the polite way to say a dish isn't for you\./);
    expect(vegan).not.toContain('食べません');
  });
});

describe('logo links', () => {
  // Lighthouse label-content-name-mismatch: the accessible name must contain the visible
  // text, so the logo links use their visible "tabemasen" rather than an aria-label.
  it('have no aria-label overriding the visible name', async () => {
    const header = await container.renderToString(SiteHeader, { props: { page: 'home' } });
    const footer = await container.renderToString(SiteFooter, { props: { page: 'home' } });
    expect(header).not.toMatch(/class="tm-header__brand"[^>]*aria-label/);
    expect(footer).not.toMatch(/class="tm-footer__home"[^>]*aria-label/);
  });
});
