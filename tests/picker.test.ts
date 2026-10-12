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
