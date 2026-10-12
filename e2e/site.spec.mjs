import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/guides/', '/allergies/', '/allergies/labeling-guide/', '/allergies/food-allergies-in-japanese/',
  '/halal/', '/halal/certification-guide/', '/vegan/', '/gluten-free-japan/', '/celiac/', '/about/', '/featured/'];

test.beforeEach(async ({ context }) => {
  await context.route(/gc\.zgo\.at/, (route) => route.abort());   // analytics off in tests
});

for (const path of PAGES) {
  test(`${path} loads without console errors`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/gc\.zgo\.at|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
    const res = await page.goto(path);
    expect(res.status()).toBe(200);
    await expect(page.locator('.tm-header')).toBeVisible();
    await expect(page.locator('.tm-footer')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('builder: chips, severity and the hash', async ({ page }) => {
  await page.goto('/');
  for (const key of ['peanut', 'shrimp', 'egg']) await page.locator(`.chip[data-key="${key}"]`).click();
  await page.locator('label.severity-option').click();
  await expect(page).toHaveURL(/#a=peanut,shrimp,egg&s=severe$/);
  await expect(page.locator('#card .card-line--item')).toHaveCount(3);
  await expect(page.locator('#card .card-line--warning')).toBeVisible();
});

test('shared link restores the card', async ({ page }) => {
  await page.goto('/#a=peanut&s=severe&n=Sarah');
  await expect(page.locator('.chip[data-key="peanut"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#severity-toggle')).toBeChecked();
  await expect(page.locator('#card .card-line--greeting')).toContainText('Sarah');
});

test('mandatory allergens are the nine from data.js', async ({ page }) => {
  await page.goto('/');
  const keys = await page.locator('.chip--mandatory').evaluateAll((els) => els.map((e) => e.dataset.key).sort());
  expect(keys).toEqual(['buckwheat', 'cashew', 'crab', 'dairy', 'egg', 'peanut', 'shrimp', 'walnut', 'wheat']);
});

test('PNG export downloads a file', async ({ page }) => {
  await page.goto('/#a=egg');
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#download-btn').click()]);
  expect(download.suggestedFilename()).toMatch(/^tabemasen-\d{4}-\d{2}-\d{2}\.png$/);
});

test('print shows only the card', async ({ page }) => {
  await page.goto('/#a=egg');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#card')).toBeVisible();
  for (const sel of ['.tm-header', '.selection-panel', '.action-bar', '.tm-footer', '.tm-intro']) {
    await expect(page.locator(sel).first()).toBeHidden();
  }
});

test('allergies picker hands its choices to the builder', async ({ page }) => {
  await page.goto('/allergies/');
  const go = page.locator('.picker__go');
  await expect(go).toHaveAttribute('href', '/');
  await page.locator('.picker__chip[data-key="egg"]').click();
  await page.locator('.picker__chip[data-key="cashew"]').click();
  await page.locator('.picker__switch').click();
  await expect(go).toHaveAttribute('href', '/#a=egg,cashew&s=severe');
  await go.click();
  await expect(page.locator('.chip[data-key="cashew"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#severity-toggle')).toBeChecked();
});

test('allergies picker still links to the builder without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:4322/allergies/');
  await expect(page.locator('.picker__go')).toHaveAttribute('href', '/');
  await context.close();
});

test('mobile menu opens on a legacy page', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile only');
  await page.goto('/vegan/');
  await page.locator('.tm-header__toggle').click();
  await expect(page.locator('#tm-nav a[href="/halal/"]')).toBeVisible();
  await expect(page.locator('.tm-header__toggle')).toHaveAttribute('aria-expanded', 'true');
});

for (const path of ['/', '/allergies/', '/guides/']) {
  test(`${path} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const bad = violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}
