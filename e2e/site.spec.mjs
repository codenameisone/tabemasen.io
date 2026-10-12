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

test('mobile menu opens on the vegan hub', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile only');
  await page.goto('/vegan/');
  await page.locator('.tm-header__toggle').click();
  await expect(page.locator('#tm-nav a[href="/halal/"]')).toBeVisible();
  await expect(page.locator('.tm-header__toggle')).toHaveAttribute('aria-expanded', 'true');
});

for (const path of ['/', '/allergies/', '/halal/', '/guides/', '/allergies/labeling-guide/', '/allergies/food-allergies-in-japanese/', '/halal/certification-guide/', '/vegan/', '/gluten-free-japan/', '/celiac/', '/about/', '/featured/']) {
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

test('food allergies guide: in-page links resolve, mandatory cards use the red border, others stay neutral', async ({ page }) => {
  await page.goto('/allergies/food-allergies-in-japanese/');
  const ids = await page.$$eval('a[href^="#"]', (as) => as.map((a) => a.getAttribute('href').slice(1)).filter(Boolean));
  for (const id of ids) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
  const color = (sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).borderTopColor);
  const red = await page.evaluate(() => {
    const d = document.createElement('i'); d.style.color = 'var(--tm-shu)'; document.body.append(d);
    const c = getComputedStyle(d).color; d.remove(); return c;
  });
  expect(await color('.fa-allergen-card--mandatory')).toBe(red);
  expect(await color('.fa-allergen-card:not(.fa-allergen-card--mandatory)')).not.toBe(red);
});

test('halal hub: picker starts empty, hands pattern and choices to the builder, no phone mockup', async ({ page }) => {
  await page.goto('/halal/');
  await expect(page.locator('h1')).toHaveText('Japan halal restaurant card');
  await expect(page.locator('.hl-phone-stage, .hl-phone')).toHaveCount(0);
  const go = page.locator('.picker__go');
  await expect(go).toHaveText('Generate my Japanese halal card →');
  await expect(go).toHaveAttribute('data-gc-event', 'cta-halal-hero');
  await expect(go).toHaveAttribute('href', '/#p=halal');
  await expect(page.locator('.picker__builder')).toHaveAttribute('data-gc-event', 'cta-halal-builder');
  await expect(page.locator('.picker__switch')).toHaveCount(0);
  await expect(page.locator('.picker__chip[aria-pressed="true"]')).toHaveCount(0);
  await page.locator('.picker__chip[data-key="shrimp"]').click();
  await expect(page.locator('#hub-card .card-line', { hasText: '・えび' })).toHaveCount(1);
  await expect(go).toHaveAttribute('href', '/#a=shrimp&p=halal');
  await expect(page.locator('.hub-cta a.tm-btn')).toHaveText('Generate my Japanese halal card →');
  await expect(page.locator('.hub-cta a.tm-btn')).toHaveAttribute('data-gc-event', 'cta-halal-footer');
  await expect(page.locator('.hub-cta a.tm-btn')).toHaveAttribute('href', '/#p=halal');
});

test('halal hub: body is styled (ingredient cards, FAQ) and the FAQ opens', async ({ page }) => {
  await page.goto('/halal/');
  await expect(page.locator('.hl-feature-card')).toHaveCount(8);
  const card = page.locator('.hl-feature-card').first();
  expect(await card.evaluate((e) => getComputedStyle(e).borderTopWidth)).not.toBe('0px');
  expect(await page.locator('.hl-feature-grid').evaluate((e) => getComputedStyle(e).display)).toBe('grid');
  expect(await page.locator('.hl-faq__item summary').first().evaluate((e) => e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await expect(page.locator('.hl-faq__item')).toHaveCount(7);
  await expect(page.locator('.hl-faq__item[open]')).toHaveCount(1);
  await page.locator('.hl-faq__item summary').nth(1).click();
  await expect(page.locator('.hl-faq__item').nth(1)).toHaveAttribute('open', '');
  await expect(page.locator('main, [role="main"]')).toHaveCount(1);
});

test('halal hub: tapping chips updates the card and both links open the builder with it', async ({ page }) => {
  await page.goto('/halal/');
  const card = page.locator('#hub-card');
  await expect(card.locator('.card-line', { hasText: '・卵' })).toHaveCount(0);
  await page.locator('.picker__chip[data-key="shrimp"]').click();
  await page.locator('.picker__chip[data-key="egg"]').click();
  await expect(card.locator('.card-line', { hasText: '・卵' })).toHaveCount(1);
  await expect(card.locator('.card-line', { hasText: '・えび' })).toHaveCount(1);
  const go = await page.locator('.picker__go').getAttribute('href');
  expect(go).toBe('/#a=shrimp,egg&p=halal');
  await expect(page.locator('.picker__builder')).toHaveAttribute('href', go);
});

test('halal preview matches the builder after hand-off, with the halal pattern selected', async ({ page }) => {
  await page.goto('/halal/');
  await page.locator('.picker__chip[data-key="shrimp"]').click();
  await page.locator('.picker__chip[data-key="wheat"]').click();
  await expect(page.locator('#hub-card .card-line', { hasText: '・小麦' })).toHaveCount(1);
  const hub = await page.locator('#hub-card .card-line').allTextContents();
  await page.locator('.picker__go').click();
  await expect(page.locator('#card .card-line').first()).toBeVisible();
  expect(await page.locator('#card .card-line').allTextContents()).toEqual(hub);
  await expect(page.locator('.pattern-btn[data-key="halal"]')).toHaveClass(/pattern-btn--selected/);
  await expect(page.locator('.chip[data-key="shrimp"]')).toHaveAttribute('aria-pressed', 'true');
});

test('halal hub: no horizontal overflow and in-page links resolve', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/halal/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const hrefs = await page.locator('a[href^="#"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')).filter((h) => h.length > 1));
  for (const h of hrefs) await expect(page.locator(`[id="${h.slice(1)}"]`)).toHaveCount(1);
});

test('vegan hub: picker starts empty, hands pattern to the builder, no phone mockup', async ({ page }) => {
  await page.goto('/vegan/');
  await expect(page.locator('h1')).toHaveText('Japan vegan restaurant card');
  await expect(page.locator('.vg-phone-stage, .vg-phone')).toHaveCount(0);
  const go = page.locator('.picker__go');
  await expect(go).toHaveText('Generate my Japanese vegan card →');
  await expect(go).toHaveAttribute('data-gc-event', 'cta-vegan-hero');
  await expect(go).toHaveAttribute('href', '/#p=vegan');
  await expect(page.locator('.picker__builder')).toHaveAttribute('data-gc-event', 'cta-vegan-builder');
  await expect(page.locator('.picker__switch')).toHaveCount(0);
  await expect(page.locator('.picker__chip[aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator('.picker__chip')).toHaveCount(7);
  await page.locator('.picker__chip[data-key="soy"]').click();
  await expect(go).toHaveAttribute('href', '/#a=soy&p=vegan');
  await expect(page.locator('.picker__builder')).toHaveAttribute('href', '/#a=soy&p=vegan');
  await expect(page.locator('.hub-cta a.tm-btn')).toHaveText('Generate my Japanese vegan card →');
  await expect(page.locator('.hub-cta a.tm-btn')).toHaveAttribute('data-gc-event', 'cta-vegan-footer');
  await expect(page.locator('.hub-cta a.tm-btn')).toHaveAttribute('href', '/#p=vegan');
});

test('vegan hub: body is styled (cards, FAQ) and the FAQ opens', async ({ page }) => {
  await page.goto('/vegan/');
  await expect(page.locator('.vg-feature-card')).toHaveCount(8);
  expect(await page.locator('.vg-feature-card').first().evaluate((e) => getComputedStyle(e).borderTopWidth)).not.toBe('0px');
  expect(await page.locator('.vg-feature-grid').evaluate((e) => getComputedStyle(e).display)).toBe('grid');
  expect(await page.locator('.vg-faq__item summary').first().evaluate((e) => e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await expect(page.locator('.vg-faq__item')).toHaveCount(7);
  await expect(page.locator('.vg-faq__item[open]')).toHaveCount(1);
  await page.locator('.vg-faq__item summary').nth(1).click();
  await expect(page.locator('.vg-faq__item').nth(1)).toHaveAttribute('open', '');
  await expect(page.locator('main, [role="main"]')).toHaveCount(1);
});

test('vegan hub: no horizontal overflow and in-page links resolve', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/vegan/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const hrefs = await page.locator('a[href^="#"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')).filter((h) => h.length > 1));
  for (const h of hrefs) await expect(page.locator(`[id="${h.slice(1)}"]`)).toHaveCount(1);
});

test('halal certification guide: tiers, callouts and icons are told apart by more than colour', async ({ page }) => {
  await page.goto('/halal/certification-guide/');
  const top = (sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).borderTopStyle);
  expect(await top('.cg-tier-card--halal')).toBe('solid');
  expect(await top('.cg-tier-card--friendly')).toBe('dashed');
  expect(await top('.cg-tier-card--porkfree')).toBe('dotted');
  const left = (sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).borderLeftStyle);
  expect(await left('.cg-callout--warning')).toBe('double');
  expect(await left('.cg-callout--info')).toBe('dashed');
  expect(await left('.cg-callout--danger')).toBe('solid');
  const glyph = (sel) => page.locator(sel).first().innerText();
  expect(await glyph('.cg-tier-row__icon--yes')).toBe('✓');
  expect(await glyph('.cg-tier-row__icon--no')).toBe('✗');
  expect(await glyph('.cg-tier-row__icon--maybe')).toBe('?');
});

test('halal certification guide: every in-page link resolves and the contents list scrolls', async ({ page }) => {
  await page.goto('/halal/certification-guide/');
  const hrefs = await page.locator('main a[href^="#"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toHaveLength(11);
  for (const href of hrefs) await expect(page.locator(href)).toHaveCount(1);
  await page.locator('.guide-toc__fold').evaluate((d) => d.setAttribute('open', ''));
  await page.locator('.guide-toc .cg-toc a[href="#kanji-cheat-sheet"]').click();
  await expect(page.locator('#kanji-cheat-sheet')).toBeInViewport();
});

test('halal certification guide: disclaimer stays in the hero, inline links and footer CTA keep their events', async ({ page }) => {
  await page.goto('/halal/certification-guide/');
  await expect(page.locator('.guide-hero__copy .cg-hero__disclaimer')).toHaveCount(1);
  for (const ev of ['cta-halal-cert-inline-verify', 'cta-halal-cert-inline-faq']) {
    const a = page.locator(`a[data-gc-event="${ev}"]`);
    await expect(a).toHaveCount(1);
    await expect(a).toHaveAttribute('href', '/#p=halal');
  }
  const cta = page.locator('.cg-cta a');
  await expect(cta).toHaveText('Generate my Japanese halal card →');
  await expect(cta).toHaveAttribute('href', '/#p=halal');
  await expect(cta).toHaveAttribute('data-gc-event', 'cta-halal-cert-footer');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('halal certification guide: Keep reading lists other halal guides, not itself', async ({ page }) => {
  await page.goto('/halal/certification-guide/');
  await expect(page.locator('.guide-related a[href="/halal/certification-guide/"]')).toHaveCount(0);
});

test('halal certification guide: contents list is sticky on desktop and above the body on phones', async ({ page }, info) => {
  await page.goto('/halal/certification-guide/');
  const position = await page.locator('.guide-toc').evaluate((el) => getComputedStyle(el).position);
  const first = page.locator('.guide-toc .cg-toc a').first();
  if (info.project.name === 'desktop') {
    expect(position).toBe('sticky');
    await expect(page.locator('.guide-toc__summary')).toBeHidden();
    await expect(first).toBeVisible();
  }
  else {
    expect(position).toBe('static');
    const fold = page.locator('details.guide-toc__fold');
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

test('vegan hub: tapping chips updates the card and both links open the builder with it', async ({ page }) => {
  await page.goto('/vegan/');
  const card = page.locator('#hub-card');
  await expect(card.locator('.card-line', { hasText: '・小麦' })).toHaveCount(0);
  await page.locator('.picker__chip[data-key="wheat"]').click();
  await page.locator('.picker__chip[data-key="sesame"]').click();
  await expect(card.locator('.card-line', { hasText: '・小麦' })).toHaveCount(1);
  await expect(card.locator('.card-line', { hasText: '・ごま' })).toHaveCount(1);
  const go = await page.locator('.picker__go').getAttribute('href');
  expect(go).toBe('/#a=wheat,sesame&p=vegan');
  await expect(page.locator('.picker__builder')).toHaveAttribute('href', go);
});

test('vegan preview matches the builder after hand-off, with the vegan pattern selected', async ({ page }) => {
  await page.goto('/vegan/');
  await page.locator('.picker__chip[data-key="peanut"]').click();
  await expect(page.locator('#hub-card .card-line', { hasText: '・落花生' })).toHaveCount(1);
  const hub = await page.locator('#hub-card .card-line').allTextContents();
  await page.locator('.picker__go').click();
  await expect(page.locator('#card .card-line').first()).toBeVisible();
  expect(await page.locator('#card .card-line').allTextContents()).toEqual(hub);
  await expect(page.locator('.pattern-btn[data-key="vegan"]')).toHaveClass(/pattern-btn--selected/);
  await expect(page.locator('.chip[data-key="peanut"]')).toHaveAttribute('aria-pressed', 'true');
});

test('gluten-free hub: picker starts empty, severity toggle, no phone mockup, builder hand-off', async ({ page }) => {
  await page.goto('/gluten-free-japan/');
  await expect(page.locator('h1')).toHaveText('Gluten-free in Japan');
  await expect(page.locator('.gf-phone-stage, .gf-phone')).toHaveCount(0);
  const go = page.locator('.picker__go');
  await expect(go).toHaveText('Generate my Japanese gluten-free card →');
  await expect(go).toHaveAttribute('data-gc-event', 'cta-gluten-free-hero');
  await expect(go).toHaveAttribute('href', '/#p=gluten-free');
  await expect(page.locator('.picker__builder')).toHaveAttribute('data-gc-event', 'cta-gluten-free-builder');
  await expect(page.locator('.picker__builder')).toHaveAttribute('href', '/#p=gluten-free');
  await expect(page.locator('.picker__switch')).toHaveCount(1);
  await expect(page.locator('.picker__chip[aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator('.picker__chip')).toHaveCount(9);
  await page.locator('.picker__chip[data-key="egg"]').click();
  await expect(go).toHaveAttribute('href', '/#a=egg&p=gluten-free');
  await page.locator('.picker__switch').click();
  await expect(go).toHaveAttribute('href', '/#a=egg&p=gluten-free&s=severe');
  await expect(page.locator('.picker__builder')).toHaveAttribute('href', '/#a=egg&p=gluten-free&s=severe');
  await expect(page.locator('.hub-cta a.tm-btn')).toHaveText('Generate my Japanese gluten-free card →');
  await expect(page.locator('.hub-cta a.tm-btn')).toHaveAttribute('data-gc-event', 'cta-gluten-free-footer');
  await expect(page.locator('.hub-cta a.tm-btn')).toHaveAttribute('href', '/#p=gluten-free');
});

test('gluten-free hub: trust strip sits under the lede and both mid CTAs keep events, hrefs and wording', async ({ page }) => {
  await page.goto('/gluten-free-japan/');
  await expect(page.locator('.gf-trust-strip__item')).toHaveCount(3);
  await expect(page.locator('.gf-trust-strip')).toContainText('Covers soy sauce, dashi & fryer cross-contamination');
  const mids = page.locator('.gf-main a.btn');
  await expect(mids).toHaveCount(2);
  await expect(mids).toHaveText(['Generate my Japanese gluten-free card →', 'Generate my Japanese gluten-free card →']);
  await expect(mids.nth(0)).toHaveAttribute('data-gc-event', 'cta-gluten-free-mid');
  await expect(mids.nth(1)).toHaveAttribute('data-gc-event', 'cta-gluten-free-mid-2');
  for (const i of [0, 1]) await expect(mids.nth(i)).toHaveAttribute('href', '/#p=gluten-free');
  expect(await mids.first().evaluate((e) => e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
});

test('gluten-free hub: body is styled (items, safe cards, FAQ) and the FAQ opens', async ({ page }) => {
  await page.goto('/gluten-free-japan/');
  await expect(page.locator('.gf-gluten-item')).toHaveCount(9);
  await expect(page.locator('.gf-safe-card')).toHaveCount(6);
  expect(await page.locator('.gf-gluten-list').evaluate((e) => getComputedStyle(e).display)).toBe('flex');
  expect(await page.locator('.gf-safe-grid').evaluate((e) => getComputedStyle(e).display)).toBe('grid');
  // gluten items and safe foods are told apart by more than colour: edge style and a marker
  expect(await page.locator('.gf-gluten-item').first().evaluate((e) => getComputedStyle(e).borderLeftStyle)).toBe('solid');
  expect(await page.locator('.gf-safe-card').first().evaluate((e) => getComputedStyle(e).borderLeftStyle)).toBe('double');
  expect(await page.locator('.gf-gluten-item__title').first().evaluate((e) => getComputedStyle(e, '::before').content)).toContain('✕');
  expect(await page.locator('.gf-safe-card__title').first().evaluate((e) => getComputedStyle(e, '::before').content)).toContain('✓');
  expect(await page.locator('.gf-faq__item summary').first().evaluate((e) => e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await expect(page.locator('.gf-faq__item')).toHaveCount(9);
  await expect(page.locator('.gf-faq__item[open]')).toHaveCount(1);
  await page.locator('.gf-faq__item summary').nth(1).click();
  await expect(page.locator('.gf-faq__item').nth(1)).toHaveAttribute('open', '');
  await expect(page.locator('main, [role="main"]')).toHaveCount(1);
});

test('gluten-free hub: tapping chips updates the card and both links open the builder with it', async ({ page }) => {
  await page.goto('/gluten-free-japan/');
  const card = page.locator('#hub-card');
  await expect(card.locator('.card-line', { hasText: '・卵' })).toHaveCount(0);
  await page.locator('.picker__chip[data-key="shrimp"]').click();
  await page.locator('.picker__chip[data-key="egg"]').click();
  await expect(card.locator('.card-line', { hasText: '・卵' })).toHaveCount(1);
  await expect(card.locator('.card-line', { hasText: '・えび' })).toHaveCount(1);
  const go = await page.locator('.picker__go').getAttribute('href');
  expect(go).toBe('/#a=egg,shrimp&p=gluten-free');
  await expect(page.locator('.picker__builder')).toHaveAttribute('href', go);
});

test('gluten-free preview matches the builder after hand-off, with the gluten-free pattern selected', async ({ page }) => {
  await page.goto('/gluten-free-japan/');
  await page.locator('.picker__chip[data-key="shrimp"]').click();
  await page.locator('.picker__chip[data-key="soy"]').click();
  await page.locator('.picker__switch').click();
  await expect(page.locator('#hub-card .card-line', { hasText: '・えび' })).toHaveCount(1);
  const hub = await page.locator('#hub-card .card-line').allTextContents();
  await page.locator('.picker__go').click();
  await expect(page.locator('#card .card-line').first()).toBeVisible();
  expect(await page.locator('#card .card-line').allTextContents()).toEqual(hub);
  await expect(page.locator('.pattern-btn[data-key="gluten-free"]')).toHaveClass(/pattern-btn--selected/);
  await expect(page.locator('.chip[data-key="shrimp"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#severity-toggle')).toBeChecked();
});

test('gluten-free hub: no horizontal overflow and in-page links resolve', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/gluten-free-japan/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const hrefs = await page.locator('a[href^="#"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')).filter((h) => h.length > 1));
  for (const h of hrefs) await expect(page.locator(`[id="${h.slice(1)}"]`)).toHaveCount(1);
});

test('celiac guide: no contents column, one main landmark, no phone mockup, notes and rows marked by shape', async ({ page }) => {
  await page.goto('/celiac/');
  await expect(page.locator('.guide-toc')).toHaveCount(0);
  await expect(page.locator('aside')).toHaveCount(0);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('.ce-phone-stage, .ce-phone')).toHaveCount(0);
  const css = (sel, prop) => page.locator(sel).first().evaluate((el, p) => getComputedStyle(el)[p], prop);
  expect(await css('.ce-note', 'borderLeftStyle')).toBe('dashed');
  expect(await css('.ce-kanji-callout', 'borderLeftStyle')).toBe('solid');
  expect(await css('.ce-card-feature__icon', 'borderTopWidth')).toBe('2px');
  expect(await css('.ce-card-feature__icon', 'borderTopStyle')).toBe('solid');
});

test('celiac guide: no overflow, CTAs keep events and go to the gluten-free builder, related excludes itself', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/celiac/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (const ev of ['hero', 'mid', 'footer']) {
    const cta = page.locator(`a[data-gc-event="cta-celiac-${ev}"]`);
    await expect(cta).toHaveCount(1);
    await expect(cta).toHaveText('Generate my Japanese celiac card →');
    await expect(cta).toHaveAttribute('href', '/#p=gluten-free');
  }
  await expect(page.locator('.guide-related a[href="/celiac/"]')).toHaveCount(0);
  // celiac is the only gluten-free guide, so there is nothing to list and no empty Keep reading block
  await expect(page.locator('.guide-related')).toHaveCount(0);
});

test('celiac guide: in-page links resolve and the FAQ opens', async ({ page }) => {
  await page.goto('/celiac/');
  const ids = await page.$$eval('a[href^="#"]', (as) => as.map((a) => a.getAttribute('href').slice(1)).filter(Boolean));
  for (const id of ids) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
  const second = page.locator('.ce-faq__item').nth(1);
  await second.locator('summary').click();
  await expect(second).toHaveAttribute('open', '');
});

for (const path of ['/about/', '/featured/']) {
  test(`${path}: one main landmark, no overflow at 375, in-page links resolve, CTA keeps event and href`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const ids = await page.$$eval('main a[href^="#"]', (as) => as.map((a) => a.getAttribute('href').slice(1)).filter(Boolean));
    for (const id of ids) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
    const cta = page.locator(`a[data-gc-event="cta-${path.replaceAll('/', '')}-footer"]`);
    await expect(cta).toHaveCount(1);
    await expect(cta).toHaveText('Generate my Japanese restaurant card →');
    await expect(cta).toHaveAttribute('href', '/');
  });
}

test('/featured/: logos and featured-* events keep their hrefs, alt text and sizes', async ({ page }) => {
  await page.goto('/featured/');
  const links = {
    'featured-japanforkids-article': 'https://japanforkids.jp/food-allergies-japan-kids/',
    'featured-japanforkids-logo': 'https://japanforkids.jp/',
    'featured-japanforkids-site': 'https://japanforkids.jp/',
    'featured-tokyochapter-about': 'https://www.thetokyochapter.com/my-chapters/',
    'featured-tokyochapter-article': 'https://www.thetokyochapter.com/japan-with-severe-food-allergies/',
    'featured-tokyochapter-logo': 'https://www.thetokyochapter.com/',
  };
  for (const [ev, href] of Object.entries(links)) {
    const a = page.locator(`a[data-gc-event="${ev}"]`);
    await expect(a).toHaveCount(1);
    await expect(a).toHaveAttribute('href', href);
  }
  const tc = page.locator('a[data-gc-event="featured-tokyochapter-logo"] img');
  await expect(tc).toHaveAttribute('alt', 'The Tokyo Chapter');
  await expect(tc).toHaveAttribute('src', '/assets/featured/the-tokyo-chapter.webp');
  await expect(tc).toHaveAttribute('width', '240');
  await expect(tc).toHaveAttribute('height', '120');
  const jk = page.locator('a[data-gc-event="featured-japanforkids-logo"] img');
  await expect(jk).toHaveAttribute('alt', 'Japan for Kids');
  await expect(jk).toHaveAttribute('src', '/assets/featured/japan-for-kids.webp');
  await expect(jk).toHaveAttribute('width', '240');
  await expect(jk).toHaveAttribute('height', '54');
  await expect(page.locator('.feat-logo img')).toHaveCount(2);
  // touch targets on the card links
  for (const box of await page.locator('.ft-card__links a').all()) expect((await box.boundingBox()).height).toBeGreaterThanOrEqual(44);
});

test('/about/#corrections: the guides\' Corrections link lands on the Corrections section in view', async ({ page }) => {
  await page.goto('/celiac/');
  await page.locator('a[href="/about/#corrections"]').first().click();
  await expect(page).toHaveURL(/\/about\/#corrections$/);
  const target = page.locator('#corrections');
  await expect(target).toHaveCount(1);
  await expect(target.locator('h2')).toHaveText('Corrections');
  await expect(target).toBeInViewport();
  // the sticky header must not cover the heading
  const header = await page.locator('.tm-header').boundingBox();
  const h2 = await target.locator('h2').boundingBox();
  expect(h2.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
});

test('/about/: emergency callout and notes are marked by shape, not colour alone', async ({ page }) => {
  await page.goto('/about/');
  const css = (sel, prop) => page.locator(sel).first().evaluate((el, p) => getComputedStyle(el)[p], prop);
  expect(await css('.ab-callout', 'borderLeftStyle')).toBe('solid');
  expect(await css('.ab-meta', 'borderLeftStyle')).toBe('dashed');
});

for (const path of ['/halal/', '/vegan/', '/gluten-free-japan/', '/halal/certification-guide/']) {
  test(`${path}: FAQ marker sits inside the summary at 375`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(path);
    const summary = page.locator('[class$="-faq__item"] summary').first();
    expect(await summary.evaluate((e) => getComputedStyle(e).listStylePosition)).toBe('inside');
  });
}

test('gluten-free: avoid and safe cards keep their marker glyphs', async ({ page }) => {
  await page.goto('/gluten-free-japan/');
  const avoid = await page.locator('.gf-gluten-item__title').first().evaluate((e) => getComputedStyle(e, '::before').content);
  const safe = await page.locator('.gf-safe-card__title').first().evaluate((e) => getComputedStyle(e, '::before').content);
  expect(avoid).toContain('✕');
  expect(safe).toContain('✓');
});

test('hub pages: h1 and picker are inside the single main landmark', async ({ page }) => {
  for (const path of ['/allergies/', '/halal/', '/vegan/', '/gluten-free-japan/']) {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main .hub-pick')).toHaveCount(1);
    await expect(page.locator('main .hub-cta')).toHaveCount(1);
  }
});

test('food allergies guide: nine mandatory allergens, cashew included, marked in text as well as colour', async ({ page }) => {
  await page.goto('/allergies/food-allergies-in-japanese/');
  const cards = page.locator('.fa-allergen-card--mandatory');
  await expect(cards).toHaveCount(9);
  await expect(cards.filter({ hasText: 'Cashew' })).toHaveCount(1);
  for (const card of await cards.all()) await expect(card).toContainText('mandatory allergen');
  const body = await page.locator('main').innerText();
  expect(body).not.toMatch(/mandatory 8|8 specific allergens/);
  const ld = await page.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => x.textContent).join(' '));
  expect(ld).not.toMatch(/mandatory 8|8 specific allergens/);
});

// The focus ring must stand out (≥ 3:1) from the section it sits on, light or dark.
const ringContrast = (locator) => locator.evaluate((el) => {
  const rgb = (c) => (c.match(/[\d.]+/g) ?? []).slice(0, 4).map(Number);
  const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  let n = el.parentElement, bg;
  while (n) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.length === 3 || c[3] > 0) { bg = c; break; } n = n.parentElement; }
  bg ??= [255, 255, 255];
  const s = getComputedStyle(el);
  const rings = [s.outlineStyle !== 'none' ? rgb(s.outlineColor) : null, ...(s.boxShadow.match(/rgba?\([^)]*\)/g) ?? []).map(rgb)].filter(Boolean);
  return Math.max(0, ...rings.map((c) => ratio(c, bg)));
});

for (const [path, sel] of [
  ['/celiac/', 'a[data-gc-event="cta-celiac-footer"]'],
  ['/vegan/', '.hub-cta a'],
  ['/', '.action-bar button'],
  ['/allergies/labeling-guide/', '.tm-footer a'],
  ['/allergies/labeling-guide/', 'main a'],
]) {
  test(`focus ring is visible on ${path} ${sel}`, async ({ page }) => {
    await page.goto(path);
    const el = page.locator(sel).first();
    await el.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(el).toBeFocused();
    expect(await ringContrast(el)).toBeGreaterThanOrEqual(3);
  });
}

test('mobile menu: close icon while open, Escape closes and returns focus', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'menu toggle is mobile-only');
  await page.goto('/vegan/');
  const toggle = page.locator('.tm-header__toggle');
  await expect(toggle.locator('.tm-header__icon--open')).toBeVisible();
  await expect(toggle.locator('.tm-header__icon--close')).toBeHidden();
  await toggle.click();
  await expect(toggle.locator('.tm-header__icon--close')).toBeVisible();
  await expect(toggle.locator('.tm-header__icon--open')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#tm-nav a[href="/halal/"]')).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('unknown paths get the branded, noindexed 404 page', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const res = await page.goto('/no-such-page/');
  expect(res.status()).toBe(404);
  await expect(page).toHaveTitle(/tabemasen/);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  for (const href of ['/', '/allergies/', '/halal/', '/vegan/', '/gluten-free-japan/', '/guides/']) {
    await expect(page.locator(`main a[href="${href}"]`).first()).toBeVisible();
  }
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.filter((v) => ['serious', 'critical'].includes(v.impact))).toEqual([]);
  expect(errors).toEqual([]);
});

test('halal certification table says it scrolls when it is wider than the screen', async ({ page }, info) => {
  await page.goto('/halal/certification-guide/');
  const wrap = page.locator('.cg-table-wrap');
  const overflows = await wrap.evaluate((el) => el.scrollWidth > el.clientWidth);
  const hint = page.locator('.cg-table-hint');
  if (info.project.name === 'mobile') {
    expect(overflows).toBe(true);
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('sideways');
    expect(await wrap.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain('gradient');
  } else {
    expect(overflows).toBe(false);
    await expect(hint).toBeHidden();
  }
});

test('home: h1, builder, action toolbar and guides are inside the single main landmark', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toHaveCount(1);
  for (const sel of ['h1', '#builder', '[role="toolbar"]', '#home-guides-h']) {
    await expect(page.locator(`main ${sel}`)).toHaveCount(1);
  }
});

test('guide contents list comes back when a narrow window is widened', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'resizes the viewport itself');
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto('/allergies/labeling-guide/');
  const link = page.locator('.guide-toc a').first();
  await expect(link).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(link).toBeVisible();
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(link).toBeHidden();
});

for (const [path, ev, text, href] of [
  ['/allergies/labeling-guide/', 'cta-allergies-labeling-hero', 'Generate my Japanese allergy card →', '/'],
  ['/halal/certification-guide/', 'cta-halal-cert-hero', 'Generate my Japanese halal card →', '/#p=halal'],
]) {
  test(`${path} offers the card in its header`, async ({ page }) => {
    await page.goto(path);
    const cta = page.locator(`a[data-gc-event="${ev}"]`);
    await expect(cta).toHaveText(text);
    await expect(cta).toHaveAttribute('href', href);
    const box = await cta.boundingBox();
    expect(box.y).toBeLessThan(1400);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
}

test("vegan: every Japanese line the 'What's on the card' section quotes is on the vegan card", async ({ page }) => {
  await page.goto('/vegan/');
  const section = page.locator('section', { has: page.locator('h2', { hasText: "What's on the tabemasen card" }) });
  const quoted = ((await section.innerText()).match(/「([^」]+)」/g) ?? []).map((q) => q.slice(1, -1));
  expect(quoted.length).toBeGreaterThan(0);
  await page.goto('/#p=vegan');
  const card = (await page.locator('#card').innerText()).replace(/\s+/g, '');
  for (const q of quoted) expect(card).toContain(q.replace(/\s+/g, ''));
});

test("halal: 'What's on the card' names every item the halal card lists, and nothing it doesn't", async ({ page }) => {
  await page.goto('/halal/');
  const section = page.locator('section', { has: page.locator('h2', { hasText: "What's on the tabemasen card" }) });
  const text = (await section.innerText()).toLowerCase();
  await page.goto('/#p=halal&en=1');
  const items = await page.locator('#card .card-en-line--item').allInnerTexts();
  expect(items.length).toBeGreaterThan(0);
  for (const item of items) {
    const word = item.replace(/^[•・]\s*/, '').trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expect(text, `section names "${word}"`).toMatch(new RegExp(`\\b${word}\\b`));
  }
  expect(text).not.toMatch(/asks specifically about shared cookware/);
});

test('celiac: shows the real gluten-free card next to the mid-page CTA', async ({ page }) => {
  await page.goto('/celiac/');
  const card = page.locator('.ce-example .card[role="img"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('大麦・ライ麦');
  await expect(card).toContainText('醤油は小麦不使用のものをお願いします');
  await expect(page.locator('.ce-example figcaption')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('gluten-free hub: the sushi illustration explains the soy sauce in it', async ({ page }) => {
  await page.goto('/gluten-free-japan/');
  await expect(page.locator('figure figcaption').first()).toContainText('soy sauce');
});

test('gluten-free: what the page says the card covers is on the card', async ({ page }) => {
  await page.goto('/#p=gluten-free&en=0');
  const card = await page.locator('#card').innerText();
  await page.goto('/gluten-free-japan/');
  const claims = [await page.locator('.hub-hero__lede').innerText(), await page.locator('.gf-mid-cta__text').first().innerText()].join(' ');
  const said = { 'soy sauce': '醤油', noodle: '麺', miso: '味噌', 'barley tea': '麦茶', fryer: '油', cookware: '調理器具', dashi: 'だし' };
  for (const [en, ja] of Object.entries(said)) {
    if (claims.toLowerCase().includes(en)) expect(card, `page says the card covers ${en}`).toContain(ja);
  }
  expect(await page.locator('main').innerText()).not.toContain('one of the first things the card asks about');
});

test('keyboard focus keeps the home card its drop shadow', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('#card');
  const before = await card.evaluate((el) => getComputedStyle(el).boxShadow);
  await card.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(card).toBeFocused();
  expect(await card.evaluate((el) => getComputedStyle(el).boxShadow)).toBe(before);
});

test('halal certification table hint shows exactly when the table scrolls', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'resizes the viewport itself');
  for (const width of [375, 600, 640, 700, 960, 1000, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/halal/certification-guide/');
    const overflows = await page.locator('.cg-table-wrap').evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(await page.locator('.cg-table-hint').isVisible(), `hint at ${width}px`).toBe(overflows);
  }
});
