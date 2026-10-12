import { defineConfig } from 'astro/config';

// Static site for GitHub Pages; check:seo and check:content guard every built page.
export default defineConfig({
  site: 'https://tabemasen.io',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: false,
  devToolbar: { enabled: false },
  // Never inline font files as base64: they would sit in the render-blocking stylesheet.
  vite: { build: { assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined) } },
});
