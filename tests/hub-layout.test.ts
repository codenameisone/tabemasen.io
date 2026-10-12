import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import HubLayout from '../src/layouts/HubLayout.astro';
import sushi from '../src/assets/illustrations/sushi.jpg';

const base = {
  title: 'Hub | tabemasen', description: 'D', canonical: 'https://tabemasen.io/gluten-free-japan/', jsonLd: ['{"@type":"Article"}'],
  page: 'gluten-free', diet: 'gluten-free', eyebrow: 'Eyebrow', h1: 'Hub H1', lede: 'The lede.', reviewed: 'October 2026',
  illustration: { src: sushi, alt: 'Watercolour sketch: a sushi counter' },
  picker: { allergenKeys: ['egg', 'soy'], showSeverity: true, event: 'cta-gluten-free-hero' },
  example: {}, ctaLabel: 'Generate my Japanese gluten-free card →',
  closing: { heading: 'Ready?', text: 'Text.', event: 'cta-gluten-free-footer' },
};

describe('HubLayout heroExtra', async () => {
  const container = await AstroContainer.create();
  it('renders heroExtra raw HTML in the hero copy, after the lede', async () => {
    const html = await container.renderToString(HubLayout, { props: { ...base, heroExtra: '<div class="gf-trust-strip">Trust</div>' }, slots: { default: '<p>Body</p>' } });
    expect(html).toMatch(/hub-hero__lede[\s\S]*The lede\.[\s\S]*gf-trust-strip">Trust<\/div>[\s\S]*<\/section>/);
    expect(html.indexOf('gf-trust-strip')).toBeLessThan(html.indexOf('hub-pick'));
  });
  it('renders nothing extra without heroExtra', async () => {
    const html = await container.renderToString(HubLayout, { props: base, slots: { default: '<p>Body</p>' } });
    expect(html).not.toContain('gf-trust-strip');
  });
});

describe('HubLayout link-preview meta', async () => {
  const container = await AstroContainer.create();
  it('defaults to a website preview using the page description', async () => {
    const html = await container.renderToString(HubLayout, { props: base, slots: { default: '' } });
    expect(html).toContain('<meta property="og:type" content="website">');
    expect(html).toContain('<meta property="og:description" content="D">');
  });
  it('keeps a hub\'s own og:type and og/twitter descriptions', async () => {
    const html = await container.renderToString(HubLayout, { props: { ...base, ogType: 'article', ogDescription: 'OG', twitterDescription: 'TW' }, slots: { default: '' } });
    expect(html).toContain('<meta property="og:type" content="article">');
    expect(html).toContain('<meta property="og:description" content="OG">');
    expect(html).toContain('<meta name="twitter:description" content="TW">');
  });
});

describe('HubLayout main landmark', async () => {
  const container = await AstroContainer.create();
  it('wraps hero, picker and body in exactly one main, outside header and footer', async () => {
    const html = await container.renderToString(HubLayout, { props: base, slots: { default: '<p>Body</p>' } });
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(main).toContain('id="main"');
    expect(main).toContain('<h1');
    expect(main).toContain('hub-pick');
    expect(main).toContain('hub-cta');
    expect(main).not.toContain('tm-header');
    expect(main).not.toContain('tm-footer');
  });
});
