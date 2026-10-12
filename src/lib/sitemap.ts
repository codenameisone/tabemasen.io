export type SitemapEntry = { loc: string; changefreq: string; priority: string; lastmod?: string };
const SITE = 'https://tabemasen.io';

// Same pages, order and values as the hand-written sitemap it replaces, plus /guides/.
export const STATIC_PAGES: SitemapEntry[] = [
  { loc: `${SITE}/`, changefreq: 'monthly', priority: '1.0' },
  { loc: `${SITE}/allergies/`, changefreq: 'monthly', priority: '0.9' },
  { loc: `${SITE}/allergies/labeling-guide/`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE}/allergies/food-allergies-in-japanese/`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE}/gluten-free-japan/`, changefreq: 'monthly', priority: '0.9' },
  { loc: `${SITE}/celiac/`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE}/halal/`, changefreq: 'monthly', priority: '0.9' },
  { loc: `${SITE}/halal/certification-guide/`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE}/vegan/`, changefreq: 'monthly', priority: '0.9' },
  { loc: `${SITE}/guides/`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE}/featured/`, changefreq: 'monthly', priority: '0.5', lastmod: '2026-10-05' },
  { loc: `${SITE}/about/`, changefreq: 'monthly', priority: '0.5', lastmod: '2026-10-08' },
];

export function sitemapXml(entries: SitemapEntry[]): string {
  const urls = entries.map((e) => [
    '  <url>',
    `    <loc>${e.loc}</loc>`,
    ...(e.lastmod ? [`    <lastmod>${e.lastmod}</lastmod>`] : []),
    `    <changefreq>${e.changefreq}</changefreq>`,
    `    <priority>${e.priority}</priority>`,
    '  </url>',
  ].join('\n'));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
