import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { buildPickerHref } from '../src/lib/picker';
import Picker from '../src/components/Picker.astro';

describe('buildPickerHref', () => {
  it('matches app.js encodeHash order and separators', () => {
    expect(buildPickerHref({ pattern: null, allergens: ['peanut', 'egg'], severe: true })).toBe('/#a=peanut,egg&s=severe');
    expect(buildPickerHref({ pattern: 'vegan', allergens: ['soy'], severe: false })).toBe('/#a=soy&p=vegan');
  });

  it('returns / without a hash when nothing is chosen (works without JS)', () => {
    expect(buildPickerHref({ pattern: null, allergens: [], severe: false })).toBe('/');
    expect(buildPickerHref({ pattern: 'halal', allergens: [], severe: false })).toBe('/#p=halal');
  });
});

describe('Picker', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Picker, {
    props: { diet: 'allergies', allergenKeys: ['egg', 'cashew', 'sesame'], showSeverity: true,
      ctaLabel: 'Generate my Japanese allergy card →', event: 'cta-allergies-hero' },
  });

  it('renders a real link to / before any script runs', () => {
    expect(html).toMatch(/<a[^>]*class="tm-btn picker__go"[^>]*href="\/"/);
    expect(html).toContain('Generate my Japanese allergy card →');
    expect(html).toContain('data-gc-event="cta-allergies-hero"');
  });

  it('renders toggle chips with English labels and Japanese hints from data.js', () => {
    expect(html).toContain('data-key="egg"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('Cashew');
    expect(html).toContain('カシューナッツ');
  });

  it('marks mandatory allergens', () => {
    expect(html).toMatch(/data-key="cashew"[^>]*data-mandatory|data-mandatory[^>]*data-key="cashew"/);
    expect(html).not.toMatch(/data-key="sesame"[^>]*data-mandatory/);
  });

  it('renders a mandatory legend when a mandatory chip is present', () => {
    expect(html).toContain('picker__legend');
    expect(html).toContain("Red dot: Japan's mandatory allergens");
  });

  it('omits the legend when no chip is mandatory', async () => {
    const out = await container.renderToString(Picker, {
      props: { diet: 'allergies', allergenKeys: ['sesame', 'soy'], ctaLabel: 'x', event: 'cta-x' },
    });
    expect(out).not.toContain('picker__legend');
  });

  it('tags the secondary builder link when builderEvent is set', async () => {
    const out = await container.renderToString(Picker, {
      props: { diet: 'allergies', allergenKeys: ['egg'], ctaLabel: 'x', event: 'cta-allergies-hero', builderEvent: 'cta-allergies-builder' },
    });
    expect(out).toMatch(/<a[^>]*class="[^"]*picker__builder[^"]*"[^>]*data-gc-event="cta-allergies-builder"/);
    expect(html).not.toMatch(/picker__builder[^>]*data-gc-event/);
  });

  it('includes the severity switch when asked', () => {
    expect(html).toContain('role="switch"');
  });
});

describe('Picker duplicate id avoidance', async () => {
  const container = await AstroContainer.create();
  const html1 = await container.renderToString(Picker, {
    props: { diet: 'allergies', allergenKeys: ['egg'], showSeverity: true,
      ctaLabel: 'Allergy card', event: 'cta-allergies-hero' },
  });
  const html2 = await container.renderToString(Picker, {
    props: { diet: 'vegan', allergenKeys: ['soy'], showSeverity: true,
      ctaLabel: 'Vegan card', event: 'cta-vegan-hero' },
  });
  const combined = html1 + html2;

  it('derives severity label id from event prop to avoid duplicates', () => {
    expect(html1).toContain('id="picker-sev-cta-allergies-hero"');
    expect(html2).toContain('id="picker-sev-cta-vegan-hero"');
    expect(html1).toContain('aria-labelledby="picker-sev-cta-allergies-hero"');
    expect(html2).toContain('aria-labelledby="picker-sev-cta-vegan-hero"');
  });

  it('each switch aria-labelledby matches its own label id', () => {
    const match1 = combined.match(/id="(picker-sev-cta-allergies-hero)"/);
    const match2 = combined.match(/id="(picker-sev-cta-vegan-hero)"/);
    expect(match1).not.toBeNull();
    expect(match2).not.toBeNull();
    expect(combined.indexOf('aria-labelledby="picker-sev-cta-allergies-hero"')).toBeGreaterThan(-1);
    expect(combined.indexOf('aria-labelledby="picker-sev-cta-vegan-hero"')).toBeGreaterThan(-1);
  });
});

describe('Picker preset and preview', async () => {
  const container = await AstroContainer.create();
  const base = { diet: 'allergies', allergenKeys: ['egg', 'cashew', 'peanut'], showSeverity: true, ctaLabel: 'x', event: 'cta-x' };
  const html = await container.renderToString(Picker, { props: { ...base, preset: { allergens: ['peanut', 'egg'], severe: true }, previewId: 'x' } });

  it('presses preset chips, checks the switch, and encodes the href in DOM order', () => {
    expect(html).toMatch(/data-key="egg"[^>]*aria-pressed="true"/);
    expect(html).toMatch(/data-key="peanut"[^>]*aria-pressed="true"/);
    expect(html).toMatch(/data-key="cashew"[^>]*aria-pressed="false"/);
    expect(html).toMatch(/role="switch" aria-checked="true"/);
    expect(html).toMatch(/href="\/#a=egg,peanut&(amp;)?s=severe"/);
  });
  it('exposes the preview id', () => {
    expect(html).toContain('data-preview="x"');
  });
  it('throws on an unknown preset key', async () => {
    await expect(container.renderToString(Picker, { props: { ...base, preset: { allergens: ['nope'], severe: false } } })).rejects.toThrow();
  });
  it('throws when a preset key is not one of the picker allergenKeys', async () => {
    await expect(container.renderToString(Picker, { props: { ...base, allergenKeys: ['egg', 'cashew'], preset: { allergens: ['soy'], severe: false } } })).rejects.toThrow(/soy/);
  });
});

describe('Picker builder link', async () => {
  const container = await AstroContainer.create();

  it('renders the builder link with preset allergens and severity', async () => {
    const html = await container.renderToString(Picker, {
      props: { diet: 'allergies', allergenKeys: ['egg', 'cashew'], showSeverity: true,
        ctaLabel: 'x', event: 'cta-x', preset: { allergens: ['egg'], severe: true } },
    });
    expect(html).toContain('class="picker__builder"');
    expect(html).toMatch(/class="picker__builder"[^>]*href="\/#a=egg&(amp;)?s=severe"/);
  });

  it('renders the builder link to / when no preset', async () => {
    const html = await container.renderToString(Picker, {
      props: { diet: 'allergies', allergenKeys: ['egg', 'cashew'],
        ctaLabel: 'x', event: 'cta-x' },
    });
    expect(html).toContain('class="picker__builder"');
    expect(html).toMatch(/class="picker__builder"[^>]*href="\/"/);
  });
});
