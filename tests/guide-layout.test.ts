import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import GuideLayout from '../src/layouts/GuideLayout.astro';
import konbini from '../src/assets/illustrations/konbini.jpg';

const related = [{ id: 'phrases', data: { title: 'Food allergies in Japanese', description: 'Phrases.', diets: ['allergies'], reviewed: new Date('2026-10-08'), permalink: '/allergies/food-allergies-in-japanese/' } }];
const base = {
  title: 'Guide | tabemasen', description: 'D', canonical: 'https://tabemasen.io/allergies/labeling-guide/',
  jsonLd: ['{"@type":"Article"}'], page: 'allergies-labeling', current: '/allergies/',
  illustration: { src: konbini, alt: 'Watercolour sketch: a hand turns over an onigiri', caption: 'Cap.' },
};
const slots = {
  head: '<meta property="article:section" content="Allergies">',
  hero: '<h1>Title</h1>', notice: '<div class="lg-disclaimer">Not advice.</div>',
  toc: '<nav class="lg-toc"><a href="#a">A</a></nav>', default: '<article class="lg-article"><section id="a"><h2>A</h2></section></article>',
  cta: '<section class="lg-cta"><a href="/">Go</a></section>',
};

describe('GuideLayout', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(GuideLayout, { props: { ...base, related }, slots });

  it('emits article metadata and the head slot', () => {
    expect(html).toContain('<meta property="og:type" content="article">');
    expect(html).toContain('<meta property="article:section" content="Allergies">');
    expect(html).toContain('<script type="application/ld+json">{"@type":"Article"}</script>');
  });

  it('places hero, notice, contents and body in their regions, in order', () => {
    expect(html).toMatch(/class="[^"]*guide-hero[\s\S]*<h1>Title<\/h1>[\s\S]*class="[^"]*guide-notice[\s\S]*Not advice\.[\s\S]*class="[^"]*guide-toc[\s\S]*lg-toc[\s\S]*class="[^"]*guide-body[\s\S]*lg-article[\s\S]*lg-cta/);
  });

  it('shows the illustration with its alt text and caption', () => {
    expect(html).toContain('alt="Watercolour sketch: a hand turns over an onigiri"');
    expect(html).toContain('Cap.');
  });

  it('lists related guides under Keep reading', () => {
    expect(html).toContain('Keep reading');
    expect(html).toContain('href="/allergies/food-allergies-in-japanese/"');
  });

  it('hides Keep reading when there is nothing to list', async () => {
    const none = await container.renderToString(GuideLayout, { props: { ...base, related: [] }, slots });
    expect(none).not.toContain('Keep reading');
  });
});
