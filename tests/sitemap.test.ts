import { describe, it, expect } from 'vitest';
import { sitemapXml, STATIC_PAGES } from '../src/lib/sitemap';

describe('sitemapXml', () => {
  it('renders the existing urlset format', () => {
    expect(sitemapXml([{ loc: 'https://tabemasen.io/', changefreq: 'monthly', priority: '1.0' },
      { loc: 'https://tabemasen.io/celiac/', changefreq: 'monthly', priority: '0.8', lastmod: '2026-10-10' }]))
      .toBe(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tabemasen.io/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://tabemasen.io/celiac/</loc>
    <lastmod>2026-10-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`);
  });

  it('lists every indexable page from today plus /guides/', () => {
    expect(STATIC_PAGES.map((p) => p.loc.replace('https://tabemasen.io', ''))).toEqual([
      '/', '/allergies/', '/allergies/labeling-guide/', '/allergies/food-allergies-in-japanese/',
      '/gluten-free-japan/', '/celiac/', '/halal/', '/halal/certification-guide/', '/vegan/',
      '/guides/', '/featured/', '/about/',
    ]);
  });
});
