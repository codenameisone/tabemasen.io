const HEADER = /[ \t]*<header class="site-header">[\s\S]*?<\/header>/;
const FOOTER = /[ \t]*<footer class="site-footer">[\s\S]*?<\/footer>/;
const NAV_JS = /[ \t]*<script is:inline src="\/nav\.js" defer><\/script>\n?/;

export const LEGACY_PAGES = {
  'index.astro': { page: 'home', depth: 0 },
  'about/index.astro': { page: 'about', depth: 1 },
  'allergies/index.astro': { page: 'allergies', current: '/allergies/', depth: 1 },
  'allergies/food-allergies-in-japanese/index.astro': { page: 'allergies-phrases', current: '/allergies/', depth: 2 },
  'allergies/labeling-guide/index.astro': { page: 'allergies-labeling', current: '/allergies/', depth: 2 },
  'celiac/index.astro': { page: 'celiac', current: '/gluten-free-japan/', depth: 1 },
  'featured/index.astro': { page: 'featured', depth: 1 },
  'gluten-free-japan/index.astro': { page: 'gluten-free', current: '/gluten-free-japan/', depth: 1 },
  'halal/index.astro': { page: 'halal', current: '/halal/', depth: 1 },
  'halal/certification-guide/index.astro': { page: 'halal-cert', current: '/halal/', depth: 2 },
  'vegan/index.astro': { page: 'vegan', current: '/vegan/', depth: 1 },
};

export function swapChrome(source, { page, current, depth = 1 }) {
  if (source.startsWith('---')) throw new Error('file already has frontmatter');
  if (!HEADER.test(source)) throw new Error('no <header class="site-header"> block');
  if (!FOOTER.test(source)) throw new Error('no <footer class="site-footer"> block');
  const up = '../'.repeat(depth + 1);
  const cur = current ? ` current="${current}"` : '';
  const front = `---\nimport SiteHeader from '${up}components/SiteHeader.astro';\nimport SiteFooter from '${up}components/SiteFooter.astro';\n---\n`;
  return front + source
    .replace(HEADER, `  <SiteHeader page="${page}"${cur} />`)
    .replace(FOOTER, `  <SiteFooter page="${page}" />`)
    .replace(NAV_JS, '');
}
