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
