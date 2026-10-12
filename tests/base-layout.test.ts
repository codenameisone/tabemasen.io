import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import BaseLayout from '../src/layouts/BaseLayout.astro';

const props = {
  title: 'T | tabemasen',
  description: 'D',
  canonical: 'https://tabemasen.io/guides/',
  page: 'guides',
  current: '/guides/',
  jsonLd: ['{"@context":"https://schema.org","@type":"CollectionPage"}'],
};

describe('BaseLayout', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(BaseLayout, { props, slots: { default: '<main><p>body</p></main>' } });

  it('renders the head metadata search engines and link previews read', () => {
    expect(html).toContain('<title>T | tabemasen</title>');
    expect(html).toContain('<meta name="description" content="D">');
    expect(html).toContain('<link rel="canonical" href="https://tabemasen.io/guides/">');
    expect(html).toContain('<meta property="og:url" content="https://tabemasen.io/guides/">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="msvalidate.01" content="739633B14AA9EF483F9FA562680C9A0F">');
  });

  it('emits JSON-LD strings verbatim', () => {
    expect(html).toContain('<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage"}</script>');
  });

  it('wraps the slot in the site header and footer and loads analytics', () => {
    expect(html).toMatch(/class="tm-header[\s\S]*<p>body<\/p>[\s\S]*class="tm-footer/);
    expect(html).toContain('src="/analytics.js"');
    expect(html).toContain('data-goatcounter="https://nqtn.goatcounter.com/count"');
  });

  it('declares the language and viewport', () => {
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('name="viewport"');
  });
});

describe('BaseLayout link-preview overrides', async () => {
  const container = await AstroContainer.create();
  it('uses the page description for og/twitter by default', async () => {
    const html = await container.renderToString(BaseLayout, { props, slots: { default: '' } });
    expect(html).toContain('<meta property="og:description" content="D">');
    expect(html).toContain('<meta name="twitter:description" content="D">');
  });
  it('lets a page keep its own og and twitter descriptions', async () => {
    const html = await container.renderToString(BaseLayout, { props: { ...props, ogDescription: 'OG', twitterDescription: 'TW' }, slots: { default: '' } });
    expect(html).toContain('<meta name="description" content="D">');
    expect(html).toContain('<meta property="og:description" content="OG">');
    expect(html).toContain('<meta name="twitter:description" content="TW">');
  });
});
