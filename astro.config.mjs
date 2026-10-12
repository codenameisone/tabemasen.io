import { defineConfig } from 'astro/config';

// Milestone 1: the pages are the legacy HTML verbatim. Nothing here may
// change their output; scripts/compare-build.mjs is the proof.
export default defineConfig({
  site: 'https://tabemasen.io',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: false,
  devToolbar: { enabled: false },
});
