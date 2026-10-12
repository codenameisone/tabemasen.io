import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:4322' },
  webServer: { command: 'node scripts/serve-dist.mjs', url: 'http://localhost:4322/', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { viewport: { width: 375, height: 812 } } },
  ],
});
