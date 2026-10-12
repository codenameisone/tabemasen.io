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

test('mandatory chips carry a dot', async ({ page }) => {
  const before = (loc) => loc.evaluate((e) => getComputedStyle(e, '::before').content);
  await page.goto('/');
  expect(await before(page.locator('.chip[data-key="cashew"]'))).not.toBe('none');
  expect(await before(page.locator('.chip[data-key="almond"]'))).toBe('none');
  await page.goto('/allergies/');
  expect(await before(page.locator('.picker__chip[data-key="cashew"]').first())).not.toBe('none');
  expect(await before(page.locator('.picker__chip[data-key="sesame"]').first())).toBe('none');
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
  await expect(page.locator('.picker__builder')).toHaveAttribute('href', '/');
  await page.locator('.picker__chip[data-key="egg"]').click();
  await page.locator('.picker__chip[data-key="cashew"]').click();
  await page.locator('.picker__switch').click();
  await expect(go).toHaveAttribute('href', '/#a=egg,cashew&s=severe');
  await go.click();
  await expect(page.locator('.chip[data-key="cashew"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.chip[data-key="egg"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#severity-toggle')).toBeChecked();
});

test('allergies picker still links to the builder without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:4322/allergies/');
  await expect(page.locator('.picker__go')).toHaveAttribute('href', '/');
  await expect(page.locator('#hub-card')).toContainText('すみません、お願いがあります。');
  await context.close();
});

test('allergies picker starts empty and the preview fills in as you pick', async ({ page }) => {
  await page.goto('/allergies/');
  const card = page.locator('#hub-card');
  await expect(card).toContainText('すみません、お願いがあります。');
  await expect(card.locator('.card-line--item')).toHaveCount(0);
  await expect(card.locator('.card-line--warning')).toHaveCount(0);
  await expect(page.locator('.picker__chip[aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator('.hub-pick__hint')).toBeVisible();
  await page.locator('.picker__chip[data-key="egg"]').click();
  await expect(card.locator('.card-line', { hasText: '・卵' })).toHaveCount(1);
  await page.locator('.picker__chip[data-key="cashew"]').click();
  await expect(card.locator('.card-line', { hasText: '・カシューナッツ' })).toHaveCount(1);
  await page.locator('.picker__chip[data-key="shrimp"]').click();
  await expect(card.locator('.card-line--item')).toHaveText(['・えび', '・卵', '・カシューナッツ']);
  await page.locator('.picker__switch').click();
  await expect(card.locator('.card-line--warning').first()).toBeVisible();
  await page.locator('.picker__chip[data-key="egg"]').click();
  await expect(card.locator('.card-line', { hasText: '・卵' })).toHaveCount(0);
  await page.locator('.picker__switch').click();
  await expect(card.locator('.card-line--warning')).toHaveCount(0);
  await expect(page.locator('.picker__go')).toHaveAttribute('href', '/#a=shrimp,cashew');
  await expect(page.locator('.picker__builder')).toHaveAttribute('href', '/#a=shrimp,cashew');
});

test('allergies preview matches the builder after hand-off', async ({ page }) => {
  await page.goto('/allergies/');
  await page.locator('.picker__chip[data-key="shrimp"]').click();
  await page.locator('.picker__chip[data-key="wheat"]').click();
  await expect(page.locator('#hub-card .card-line', { hasText: '・小麦' })).toHaveCount(1);
  const hub = await page.locator('#hub-card .card-line').allTextContents();
  await page.locator('.picker__go').click();
  await expect(page.locator('#card .card-line').first()).toBeVisible();
  const builder = await page.locator('#card .card-line').allTextContents();
  expect(builder).toEqual(hub);
});

test('mobile menu opens on a legacy page', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile only');
  await page.goto('/vegan/');
  await page.locator('.tm-header__toggle').click();
  await expect(page.locator('#tm-nav a[href="/halal/"]')).toBeVisible();
  await expect(page.locator('.tm-header__toggle')).toHaveAttribute('aria-expanded', 'true');
});

for (const path of ['/', '/allergies/', '/guides/', '/allergies/labeling-guide/', '/allergies/food-allergies-in-japanese/']) {
  test(`${path} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const bad = violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('labeling guide: kanji cards are marked by shape, not colour alone', async ({ page }) => {
  await page.goto('/allergies/labeling-guide/');
  const before = (sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el, '::before').content);
  const borderStyle = (sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).borderTopStyle);
  expect(await before('.lg-kanji-card--mandatory')).not.toBe('none');
  expect(await before('.lg-kanji-card--recommended')).toBe('none');
  expect(await borderStyle('.lg-kanji-card--recommended')).toBe('solid');
  expect(await borderStyle('.lg-kanji-card--unlisted')).toBe('dashed');
  expect(await borderStyle('.lg-kanji-legend__swatch--unlisted')).toBe('dashed');
  const underline = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).textDecorationStyle);
  expect(await underline('.hl--individual')).not.toBe(await underline('.hl--collective'));
});

test('labeling guide: inline styles that use retired variables still render', async ({ page }) => {
  await page.goto('/allergies/labeling-guide/');
  const bg = await page.locator('.hl--collective').evaluate((el) => getComputedStyle(el.parentElement).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});

test('labeling guide: every contents link targets a section and scrolls to it', async ({ page }) => {
  await page.goto('/allergies/labeling-guide/');
  const hrefs = await page.locator('.guide-toc .lg-toc a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toHaveLength(12);
  await page.locator('.guide-toc__fold').evaluate((d) => d.setAttribute('open', ''));
  for (const href of hrefs) await expect(page.locator(href)).toHaveCount(1);
  await page.locator('.guide-toc .lg-toc a[href="#kanji-cheat-sheet"]').click();
  await expect(page.locator('#kanji-cheat-sheet')).toBeInViewport();
});

test('labeling guide: contents list is sticky on desktop and above the body on phones', async ({ page }, info) => {
  await page.goto('/allergies/labeling-guide/');
  const position = await page.locator('.guide-toc').evaluate((el) => getComputedStyle(el).position);
  if (info.project.name === 'desktop') {
    expect(position).toBe('sticky');
    await expect(page.locator('.guide-toc__summary')).toBeHidden();
    await expect(page.locator('.guide-toc .lg-toc a').first()).toBeVisible();
  }
  else {
    expect(position).toBe('static');
    const fold = page.locator('details.guide-toc__fold');
    const first = page.locator('.guide-toc .lg-toc a').first();
    await expect(fold).not.toHaveAttribute('open', '');
    await expect(first).toBeHidden();
    await page.locator('.guide-toc__summary').click();
    await expect(fold).toHaveAttribute('open', '');
    await expect(first).toBeVisible();
    const tocBottom = await page.locator('.guide-toc').evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
    const bodyTop = await page.locator('.guide-body').evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    expect(tocBottom).toBeLessThanOrEqual(bodyTop);
  }
});

test('labeling guide: no horizontal overflow and the CTA goes to the builder', async ({ page }) => {
  await page.goto('/allergies/labeling-guide/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const cta = page.locator('.lg-cta a');
  await expect(cta).toHaveText('Generate my Japanese allergy card →');
  await expect(cta).toHaveAttribute('href', '/');
  await expect(cta).toHaveAttribute('data-gc-event', 'cta-allergies-labeling-footer');
});

test('labeling guide: Keep reading lists the other allergy guide, not itself', async ({ page }) => {
  await page.goto('/allergies/labeling-guide/');
  const links = page.locator('.guide-related a');
  await expect(links.filter({ hasText: 'Food allergies in Japanese' })).toHaveCount(1);
  await expect(page.locator('.guide-related a[href="/allergies/labeling-guide/"]')).toHaveCount(0);
});

test('food allergies guide: no contents column, one main landmark, mandatory cards marked by shape', async ({ page }) => {
  await page.goto('/allergies/food-allergies-in-japanese/');
  await expect(page.locator('.guide-toc')).toHaveCount(0);
  await expect(page.locator('aside')).toHaveCount(0);
  await expect(page.locator('main')).toHaveCount(1);
  const before = (sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el, '::before').content);
  const border = (sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(await before('.fa-allergen-card--mandatory')).not.toBe('none');
  expect(await before('.fa-allergen-card:not(.fa-allergen-card--mandatory)')).toBe('none');
  expect(await border('.fa-allergen-card--mandatory')).toBe('2px');
  expect(await border('.fa-allergen-card:not(.fa-allergen-card--mandatory)')).toBe('1px');
});

test('food allergies guide: no overflow, CTAs keep events and go to the builder, related excludes itself', async ({ page }) => {
  await page.goto('/allergies/food-allergies-in-japanese/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (const ev of ['hero', 'mid', 'footer']) {
    const cta = page.locator(`a[data-gc-event="cta-allergies-phrases-${ev}"]`);
    await expect(cta).toHaveText('Generate my Japanese allergy card →');
    await expect(cta).toHaveAttribute('href', '/');
  }
  await expect(page.locator('.guide-related a[href="/allergies/food-allergies-in-japanese/"]')).toHaveCount(0);
  await expect(page.locator('.guide-related a[href="/allergies/labeling-guide/"]')).toHaveCount(1);
});
