import { defineConfig } from 'astro/config';

// Static site for GitHub Pages; check:seo and check:content guard every built page.
export default defineConfig({
  site: 'https://tabemasen.io',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: false,
  devToolbar: { enabled: false },
});
