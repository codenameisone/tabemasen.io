# M2 Slice 1: Foundation, Home and Allergies Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Draft 5 "sumi ink" design system, the new site header/footer on every page, the guides collection with `/guides/`, the redesigned card builder on `/`, and the redesigned `/allergies/` hub, in two reviewable PRs, with every existing word preserved.

**Architecture:** Part A (Tasks 0–7, PR A) adds guards (content preservation, stricter SEO checks), tokens and fonts, `BaseLayout`, `SiteHeader`/`SiteFooter`, swaps the old header/footer on all legacy pages, and adds the guide collection, `/guides/` and a generated `sitemap.xml`. Part B (Tasks 8–13, PR B) adds the card stylesheet (one CSS for live card, PNG and print), `ExampleCard`, `Picker`, rebuilds `/` around the existing builder markup (same IDs/classes for `app.js`) and `/allergies/` around its existing body markup, then adds Playwright smoke + axe tests.

**Tech Stack:** Astro ^7.3.8 (`astro:content` with `glob` loader, `astro:assets`), Fontsource (Shippori Mincho, Zen Kaku Gothic New, Yuji Syuku), Vitest ^5 with `getViteConfig` + `experimental_AstroContainer`, parse5, Playwright ^1.64 + `@axe-core/playwright`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-12-astro-migration-and-redesign-design.md`, especially §5 (design system), §6 (safeguards) and **§8 Amendments**, which win over earlier sections.

**Design reference:** canvas https://claude.ai/artifact/HViaYEm78Qezy2foQpWwFZ, pages "Card + builder" (`CardBuilder`, `CardBuilderMobile`, `CardLong`) and "Draft 5 — sumi ink" (`V5Home`, `V5Hub`). Local copies of the artboard sources: `/private/tmp/claude-501/-Users-iwakuralane-dev-tabemasen/1599d119-79b4-4f69-89d0-6e341b91af91/scratchpad/tab-card/project/*.dc.html` and `…/scratchpad/tab-v5/project/*.dc.html`. Draft 5's overlaid kanji, positioned captions and partner sections are **not** built (§8.3, §8.4).

## Global Constraints

- Branch `astro-redesign`. Part A and Part B each reach `main` through their own PR; never push to `main`.
- Never change any page's `<title>`, meta description, H1, canonical, robots or JSON-LD `@type`s: `npm run check:seo` must pass with `seo-allowlist.json` still `"changes": []`.
- Every text block of every restyled page survives: `npm run check:content` must pass; the only allowed text changes are the entries this plan adds to `content-allowlist.json`.
- `app.js` keeps working unchanged except the one `document.fonts.ready` change in Task 10. Every ID and class it queries or toggles stays: `#severity-toggle #english-toggle #name-input #custom-input #clear-btn #card #copy-btn #download-btn #print-btn .btn-text .chip-grid .pattern-list .severity-options .panel-toggle .panel-body .hidden .chip .chip--mandatory .chip--selected .pattern-btn .pattern-btn--selected .card-en .card-en--hidden .btn--success`.
- Shared card links (`#a=…&p=…&s=…&n=…&c=…&en=…`) keep working.
- Design tokens are CSS custom properties prefixed `--tm-` (§8.11). No Google Fonts requests; fonts come from Fontsource.
- No emoji in new UI chrome; icons are inline stroke SVG with `aria-hidden="true"`. Card content from `data.js` (e.g. `⚠`) is data and stays.
- No Japanese text positioned over illustrations; illustrations are plain images with an optional `figcaption` below.
- Hub CTAs read "Generate my Japanese [diet] card →" (owner rule); on `/allergies/`: "Generate my Japanese allergy card →".
- Analytics event names keep today's per-page pattern: header CTA `cta-<page>-nav`, footer coffee link `coffee-<page>`, where `<page>` ∈ `home about allergies allergies-phrases allergies-labeling celiac featured gluten-free halal-cert halal vegan`. The `/allergies/` picker button keeps `cta-allergies-hero` (continuity; replaces the spec's `picker-go:allergies`, recorded in Task 13).
- Touch targets ≥ 44px; text contrast ≥ 4.5:1 (3:1 at ≥ 24px).
- Commits end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01UpttBQPap9JzyZfAZEcyqK
  ```

## Review Focus

1. **Legacy CSS bleeding into the new header/footer** on the 9 pages that keep `styles.css` and big inline `<style>` blocks (element selectors such as `ul`, `a`, `nav`, `h3`). Expected: header/footer look identical on a legacy page and on `/guides/`. Pinned by Task 5 Step 6 (screenshots of three legacy pages at 375px and 1280px compared by eye against `/guides/`) and the Task 12 smoke test that the mobile menu opens on a legacy page.
2. **PNG export of the restyled card**: html2canvas must render the CSS pseudo-element header ("お店の方へ To the staff"), the 食 seal and the two-column grid, in web fonts. Pinned by Task 12's download test plus Task 10 Step 9 (open the exported PNG and look at it).
3. **Print** of `/`: only the card prints, colours of the warning block kept. Pinned by Task 12's `emulateMedia({ media: 'print' })` test that only `#card` is visible.
4. **A visitor arriving with a shared link** (`/#a=peanut&s=severe&n=Sarah`) sees the restored card in the new design, and a picker link from `/allergies/` restores its selections. Pinned by Task 12 builder and picker tests.
5. **JavaScript disabled or failing on `/allergies/`**: the picker button must still go somewhere useful (`/`). Pinned by Task 9's test that the server-rendered `href` is `/` for the allergies picker, and Task 12's `javaScriptEnabled: false` check.

---

## File Structure

| Path | Responsibility |
|---|---|
| `scripts/lib/text-blocks.mjs` | Extract text blocks from HTML regions |
| `scripts/check-content.mjs`, `content-manifest.json`, `content-allowlist.json` | `npm run check:content` |
| `scripts/lib/page-facts.mjs`, `scripts/lib/seo-checks.mjs`, `scripts/check-seo.mjs` | SEO checks (hardened in Task 2) |
| `src/styles/tokens.css` | `--tm-*` design tokens |
| `src/styles/fonts.css` | Fontsource imports |
| `src/styles/global.css` | Base styles for redesigned pages only |
| `src/styles/card.css` | The card: live preview, `ExampleCard`, PNG, print |
| `src/styles/builder.css` | Builder chrome on `/` (panels, chips, switches, action bar) |
| `src/lib/site.ts` | Nav items, footer link lists |
| `src/data/diets.ts` | Diet keys, names, glyphs, hub URLs |
| `src/lib/guides.ts` | Guide URL and grouping helpers |
| `src/lib/cardData.ts` | Build-time `CARD_DATA` from `public/data.js`; `renderCardHtml` |
| `src/lib/picker.ts` | `buildPickerHref` |
| `src/content.config.ts`, `src/content/guides/*.md` | Guide collection (4 legacy entries) |
| `src/layouts/BaseLayout.astro` | Document shell for redesigned pages |
| `src/layouts/HubLayout.astro` | Hub page structure |
| `src/components/SealMark.astro`, `SiteHeader.astro`, `SiteFooter.astro` | Site chrome |
| `src/components/Wash.astro`, `BrushGlyph.astro`, `Illustration.astro` | Design primitives |
| `src/components/ExampleCard.astro`, `Picker.astro` | Card preview and hub picker |
| `src/components/GuideList.astro`, `FeaturedStrip.astro` | Listings |
| `src/assets/illustrations/*.jpg` (+ `.md` sidecars), `src/assets/wash.png`, `src/assets/photos/*.png` | Images |
| `src/pages/guides/index.astro`, `src/pages/sitemap.xml.ts` | New routes |
| `scripts/swap-legacy-chrome.mjs`, `scripts/lib/legacy-chrome.mjs` | One-off header/footer swap on legacy pages |
| `scripts/serve-dist.mjs`, `playwright.config.mjs`, `e2e/*.spec.mjs` | E2E tests |
| `tests/*.test.mjs`, `tests/*.test.ts` | Unit and component tests |

---

# Part A — foundation (PR A)

### Task 0: Sync the branch and tag the slice base

**Files:** none.

**Interfaces:**
- Produces: git tag `slice1-base` (the commit `check:content` compares against); `astro-redesign` containing PR #13 (`mandatory: true` in `data.js`).

- [ ] **Step 1: Confirm PR #13 is merged**

Run: `gh pr view 13 --json state -q .state`
Expected: `MERGED`. If not, stop and ask the owner to merge it (Part B's legend depends on it).

- [ ] **Step 2: Bring `astro-redesign` up to `main`**

```bash
git checkout astro-redesign
git fetch origin
git merge --no-edit origin/main
npm ci && npm test && npm run build && npm run check:seo
```
Expected: merge succeeds (only `main`'s #13 commits come in), 48 tests pass, SEO check passed.

- [ ] **Step 3: Tag the base**

```bash
git tag slice1-base
git show -s --oneline slice1-base
```
(The tag is pushed with PR A in Task 7.)

---

### Task 1: Content preservation check

**Files:**
- Create: `scripts/lib/text-blocks.mjs`, `scripts/check-content.mjs`, `content-manifest.json`, `content-allowlist.json`
- Modify: `package.json` (script `check:content`)
- Test: `tests/text-blocks.test.mjs`

**Interfaces:**
- Produces: `textBlocks(html: string, opts?: { include?: string[], exclude?: string[] }): string[]` — unique, whitespace-collapsed text of every block element inside the `include` regions (default `['body']`), skipping `exclude` regions, `script`, `style`, `template`. Block = `h1–h6 p li dt dd summary td th figcaption blockquote caption label button`, or any other element with a direct non-whitespace text child (so text that lives only in a `div`, `a` or `span`, such as a CTA link or microcopy, is covered). A block's text is its full text content (nested blocks are not emitted separately). Selectors: `tag`, `.class`, `#id` only.
- Produces: `missingBlocks(oldBlocks: string[], newBlocks: string[], allowed: string[]): string[]`.
- Produces: CLI `npm run check:content`: for each URL in `content-manifest.json`, reads `legacy` source at `ref` with `git show`, extracts `include`/`exclude` blocks, extracts all blocks of `dist/<url>index.html` body minus `.tm-header` and `.tm-footer`, and fails on any missing block not allowlisted for that URL.

- [ ] **Step 1: Write the failing tests**

```js
// tests/text-blocks.test.mjs
import { describe, it, expect } from 'vitest';
import { textBlocks, missingBlocks } from '../scripts/lib/text-blocks.mjs';

const page = (body) => `<!DOCTYPE html><html><head><title>t</title><style>p{}</style></head><body>${body}</body></html>`;

describe('textBlocks', () => {
  it('collects paragraphs, headings, list items and summaries with collapsed whitespace', () => {
    const html = page('<h2>Why  it\n matters</h2><p>One <em>two</em></p><ul><li>a</li></ul><details><summary>Q?</summary><p>A.</p></details>');
    expect(textBlocks(html)).toEqual(['Why it matters', 'One two', 'a', 'Q?', 'A.']);
  });

  it('treats a div with its own text as a block', () => {
    expect(textBlocks(page('<div class="card"><div class="t">Peanut <em>(落花生)</em></div></div>'))).toEqual(['Peanut (落花生)']);
  });

  it('covers text that lives only in links and spans', () => {
    expect(textBlocks(page('<div class="actions"><a href="/">Generate →</a> <span>No signup · Free</span></div>'))).toEqual(['Generate →', 'No signup · Free']);
  });

  it('does not emit nested blocks separately', () => {
    expect(textBlocks(page('<li><p>inner</p> tail</li>'))).toEqual(['inner tail']);
  });

  it('limits to include regions and skips exclude regions, scripts and styles', () => {
    const html = page('<header class="site-header"><p>nav</p></header><main><p>keep</p><div class="phone"><p>mock</p></div><script>var x</script></main>');
    expect(textBlocks(html, { include: ['main'], exclude: ['.phone'] })).toEqual(['keep']);
    expect(textBlocks(html, { exclude: ['.site-header'] })).toEqual(['keep', 'mock']);
  });

  it('matches #id selectors and returns unique blocks', () => {
    expect(textBlocks(page('<section id="x"><p>a</p><p>a</p></section><p>b</p>'), { include: ['#x'] })).toEqual(['a']);
  });
});

describe('missingBlocks', () => {
  it('lists old blocks absent from the new page and not allowed', () => {
    expect(missingBlocks(['a', 'b', 'c'], ['a', 'x'], ['c'])).toEqual(['b']);
  });
});
```

- [ ] **Step 2: Run and see it fail**

Run: `npx vitest run tests/text-blocks.test.mjs`
Expected: FAIL, cannot find module `../scripts/lib/text-blocks.mjs`.

- [ ] **Step 3: Implement**

```js
// scripts/lib/text-blocks.mjs
import { parse } from 'parse5';

const BLOCK = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'dt', 'dd', 'summary',
  'td', 'th', 'figcaption', 'blockquote', 'caption', 'label', 'button']);
const SKIP = new Set(['script', 'style', 'template']);
const collapse = (s) => s.replace(/[ \t\n\r\f]+/g, ' ').trim();
const attr = (el, name) => el.attrs?.find((a) => a.name === name)?.value;

function matches(el, sel) {
  if (!el.tagName) return false;
  if (sel.startsWith('.')) return (attr(el, 'class') ?? '').split(/\s+/).includes(sel.slice(1));
  if (sel.startsWith('#')) return attr(el, 'id') === sel.slice(1);
  return el.tagName === sel;
}

function findAll(node, selectors, out) {
  for (const c of node.childNodes ?? []) {
    if (!c.tagName) continue;
    if (selectors.some((s) => matches(c, s))) out.push(c);
    else findAll(c, selectors, out);
  }
}

function textOf(el, exclude) {
  let s = '';
  (function walk(n) {
    for (const c of n.childNodes ?? []) {
      if (c.nodeName === '#text') s += c.value;
      else if (c.tagName && !SKIP.has(c.tagName) && !exclude.some((x) => matches(c, x))) walk(c);
    }
  })(el);
  return s;
}

const hasDirectText = (el) => (el.childNodes ?? []).some((c) => c.nodeName === '#text' && c.value.trim());

function collect(el, exclude, out) {
  if (SKIP.has(el.tagName) || exclude.some((x) => matches(el, x))) return;
  if (BLOCK.has(el.tagName) || hasDirectText(el)) {
    const t = collapse(textOf(el, exclude));
    if (t) out.push(t);
    return;
  }
  for (const c of el.childNodes ?? []) if (c.tagName) collect(c, exclude, out);
}

export function textBlocks(html, { include = ['body'], exclude = [] } = {}) {
  const roots = [];
  findAll(parse(html), include, roots);
  const out = [];
  for (const r of roots) collect(r, exclude, out);
  return [...new Set(out)];
}

export function missingBlocks(oldBlocks, newBlocks, allowed) {
  const have = new Set(newBlocks);
  const ok = new Set(allowed);
  return oldBlocks.filter((b) => !have.has(b) && !ok.has(b));
}
```

- [ ] **Step 4: Run and see it pass**

Run: `npx vitest run tests/text-blocks.test.mjs`
Expected: 7 passed.

- [ ] **Step 5: Write the CLI, manifest and allowlist**

```js
// scripts/check-content.mjs
// Every text block a page had at the slice base must still be on the built page.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { textBlocks, missingBlocks } from './lib/text-blocks.mjs';

const manifest = JSON.parse(readFileSync('content-manifest.json', 'utf8'));
const allowlist = JSON.parse(readFileSync('content-allowlist.json', 'utf8'));
const ref = process.env.CONTENT_REF ?? manifest.ref;

let failures = 0;
for (const [url, spec] of Object.entries(manifest.pages)) {
  const built = join('dist', url, 'index.html');
  if (!existsSync(built)) { failures++; console.error(`✗ ${url}: not built`); continue; }
  const before = textBlocks(execFileSync('git', ['show', `${ref}:${spec.legacy}`]).toString('utf8'),
    { include: spec.include ?? ['body'], exclude: spec.exclude ?? [] });
  const after = textBlocks(readFileSync(built, 'utf8'), { exclude: ['.tm-header', '.tm-footer'] });
  const allowed = allowlist.filter((a) => a.url === url).map((a) => a.text);
  const missing = missingBlocks(before, after, allowed);
  if (missing.length) {
    failures += missing.length;
    console.error(`✗ ${url}: ${missing.length} block(s) missing\n${missing.map((m) => `    - ${m}`).join('\n')}`);
  } else {
    console.log(`ok ${url} (${before.length} blocks)`);
  }
}
if (failures) { console.error(`\n${failures} content problem(s) against ${ref}.`); process.exit(1); }
console.log(`\nContent check passed against ${ref}.`);
```

`content-manifest.json` (all 11 pages with content; legacy pages compare everything except their old header/footer):
```json
{
  "ref": "slice1-base",
  "pages": {
    "/": { "legacy": "src/pages/index.astro", "include": [".app-intro", ".selection-panel", ".card-preview-section", ".action-bar"] },
    "/allergies/": { "legacy": "src/pages/allergies/index.astro", "include": [".al-hero__copy", "main", ".feat-strip", ".al-cta"] },
    "/allergies/labeling-guide/": { "legacy": "src/pages/allergies/labeling-guide/index.astro", "exclude": [".site-header", ".site-footer"] },
    "/allergies/food-allergies-in-japanese/": { "legacy": "src/pages/allergies/food-allergies-in-japanese/index.astro", "exclude": [".site-header", ".site-footer"] },
    "/halal/": { "legacy": "src/pages/halal/index.astro", "exclude": [".site-header", ".site-footer"] },
    "/halal/certification-guide/": { "legacy": "src/pages/halal/certification-guide/index.astro", "exclude": [".site-header", ".site-footer"] },
    "/vegan/": { "legacy": "src/pages/vegan/index.astro", "exclude": [".site-header", ".site-footer"] },
    "/gluten-free-japan/": { "legacy": "src/pages/gluten-free-japan/index.astro", "exclude": [".site-header", ".site-footer"] },
    "/celiac/": { "legacy": "src/pages/celiac/index.astro", "exclude": [".site-header", ".site-footer"] },
    "/about/": { "legacy": "src/pages/about/index.astro", "exclude": [".site-header", ".site-footer"] },
    "/featured/": { "legacy": "src/pages/featured/index.astro", "exclude": [".site-header", ".site-footer"] }
  }
}
```

`content-allowlist.json`:
```json
[]
```

Add to `package.json` scripts: `"check:content": "node scripts/check-content.mjs"`.

- [ ] **Step 6: Run it against today's build**

```bash
npm run build && npm run check:content
```
Expected: 11 `ok` lines and `Content check passed against slice1-base.` (nothing has changed yet). If a page fails now, the extractor is wrong, not the page: fix `text-blocks.mjs` with a new failing test first.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/text-blocks.mjs scripts/check-content.mjs content-manifest.json content-allowlist.json tests/text-blocks.test.mjs package.json
git commit -m "build: npm run check:content guards every text block of restyled pages"
```

---

### Task 2: Harden `check:seo` and the workflow (deferred review minors)

**Files:**
- Modify: `scripts/lib/page-facts.mjs`, `scripts/lib/seo-checks.mjs`, `scripts/check-seo.mjs`, `.github/workflows/site.yml`
- Test: `tests/page-facts.test.mjs`, `tests/seo-checks.test.mjs` (add cases)

**Interfaces:**
- Produces: `pageFacts(...)` gains `refresh: boolean` (a `<meta http-equiv="refresh">` exists).
- Produces: `pageBasicsProblems(url, facts): string[]` — non-refresh pages need non-empty `title`, `description`, `h1`, `canonical`.
- Produces: `allowlistProblems(allowlist): string[]` — every `changes[]` and `knownBrokenLinks[]` entry needs `reason` (non-empty) and every `changes[]` entry a `date` matching `YYYY-MM-DD`.
- Changes: `resolveInternal` never throws on malformed percent-encoding (returns the raw pathname). `check-seo.mjs` accepts a link target only if it is a **file** (`statSync(...).isFile()`).

- [ ] **Step 1: Add failing tests**

Append to `tests/page-facts.test.mjs`:
```js
describe('pageFacts refresh flag', () => {
  it('is true only when a meta refresh exists', () => {
    expect(pageFacts('<html><head><meta http-equiv="refresh" content="0; url=/x/"></head></html>').refresh).toBe(true);
    expect(pageFacts('<html><head><title>x</title></head></html>').refresh).toBe(false);
  });
});
```

Append to `tests/seo-checks.test.mjs`:
```js
import { pageBasicsProblems, allowlistProblems } from '../scripts/lib/seo-checks.mjs';

describe('pageBasicsProblems', () => {
  it('requires title, description, h1 and canonical on normal pages', () => {
    expect(pageBasicsProblems('/new/', facts({ title: '', description: null, h1: null, canonical: null, refresh: false })))
      .toEqual(['/new/: missing title', '/new/: missing description', '/new/: missing h1', '/new/: missing canonical']);
  });

  it('exempts meta-refresh redirect stubs', () => {
    expect(pageBasicsProblems('/gluten-free/', facts({ description: null, refresh: true }))).toEqual([]);
  });
});

describe('allowlistProblems', () => {
  it('requires a reason everywhere and a YYYY-MM-DD date on changes', () => {
    const p = allowlistProblems({
      changes: [{ url: '/a/', field: 'title', reason: '', date: '12/10/2026' }],
      knownBrokenLinks: [{ from: '/a/', href: '/x' }],
    });
    expect(p).toEqual([
      'seo-allowlist.json changes[0] (/a/ title): missing reason',
      'seo-allowlist.json changes[0] (/a/ title): date must be YYYY-MM-DD',
      'seo-allowlist.json knownBrokenLinks[0] (/a/ -> /x): missing reason',
    ]);
  });
});

describe('resolveInternal with malformed encoding', () => {
  it('returns the raw path instead of throwing', () => {
    expect(resolveInternal('/a%zz/', '/')).toBe('/a%zz/');
  });
});
```

- [ ] **Step 2: Run and see the new cases fail**

Run: `npx vitest run tests/page-facts.test.mjs tests/seo-checks.test.mjs`
Expected: the new cases fail (`refresh` undefined; `pageBasicsProblems is not a function`; `URIError: URI malformed`).

- [ ] **Step 3: Implement**

In `scripts/lib/page-facts.mjs`, add `refresh: false` to the initial `facts` object and, in the `meta` case:
```js
        if ((a['http-equiv'] ?? '').toLowerCase() === 'refresh') facts.refresh = true;
```

In `scripts/lib/seo-checks.mjs`, replace `resolveInternal` and add the two functions:
```js
const safeDecode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

export function resolveInternal(href, pageUrl, site = SITE) {
  if (/^(mailto:|tel:|javascript:|data:)/i.test(href) || href.startsWith('#')) return null;
  let u;
  try { u = new URL(href, site + pageUrl); } catch { return null; }
  if (u.origin !== site) return null;
  return safeDecode(u.pathname);
}

export function pageBasicsProblems(url, facts) {
  if (facts.refresh) return [];
  return ['title', 'description', 'h1', 'canonical']
    .filter((f) => !facts[f])
    .map((f) => `${url}: missing ${f}`);
}

export function allowlistProblems(allowlist) {
  const problems = [];
  allowlist.changes.forEach((c, i) => {
    const id = `seo-allowlist.json changes[${i}] (${c.url} ${c.field})`;
    if (!c.reason) problems.push(`${id}: missing reason`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date ?? '')) problems.push(`${id}: date must be YYYY-MM-DD`);
  });
  allowlist.knownBrokenLinks.forEach((k, i) => {
    if (!k.reason) problems.push(`seo-allowlist.json knownBrokenLinks[${i}] (${k.from} -> ${k.href}): missing reason`);
  });
  return problems;
}
```

In `scripts/check-seo.mjs`:
- import `pageBasicsProblems, allowlistProblems` and `statSync`;
- right after reading the allowlist: `problems.push(...allowlistProblems(allowlist));` (declare `problems` before it);
- in the page loop after `pageProblems`: `problems.push(...pageBasicsProblems(url, facts));`
- replace the link existence test with:
```js
const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };
// …
    if (linkCandidates(path).some((c) => isFile(join(dist, c)))) continue;
```

- [ ] **Step 4: Run tests and the checks**

```bash
npm test && npm run build && npm run check:seo
```
Expected: all tests pass; `SEO check passed: 12 pages, 11 indexable.` If `check:seo` now reports a pre-existing problem on the live pages (for example a link to a directory without `index.html`), stop and report it to the owner with the exact message.

- [ ] **Step 5: Tighten the workflow**

Replace `.github/workflows/site.yml` with:
```yaml
name: Site

on:
  push:
    branches: [main, astro-redesign]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: site-${{ github.ref }}
  # Never cancel an in-flight production deploy; superseded branch runs may be cancelled.
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0   # check:content reads the slice base tag
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm run check:seo
      - run: npm run check:content
      - if: github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
        uses: actions/upload-pages-artifact@v5
        with:
          path: dist

  deploy:
    if: github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/page-facts.mjs scripts/lib/seo-checks.mjs scripts/check-seo.mjs tests/page-facts.test.mjs tests/seo-checks.test.mjs .github/workflows/site.yml
git commit -m "build: stricter check:seo (page basics, allowlist fields, safe decoding, file-only targets); tighter workflow"
```

---

### Task 3: Tokens, fonts, global styles, `BaseLayout`

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/fonts.css`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`
- Modify: `vitest.config.mjs`, `package.json` (dependencies)
- Test: `tests/base-layout.test.ts`

**Interfaces:**
- Consumes: `SiteHeader`, `SiteFooter` from Task 4. **Order:** do Task 3 Steps 1, 2 and 5 (install, Vitest config, styles), then all of Task 4, then Task 3 Steps 3, 4, 6, 7 and 8.
- Produces: `BaseLayout` props `{ title: string; description: string; canonical: string; page: string; current?: string; ogType?: string; ogImage?: string; jsonLd?: string[]; bodyClass?: string }` and slots `default`, `head`.

- [ ] **Step 1: Install fonts and test tooling**

```bash
npm install @fontsource/shippori-mincho@^5 @fontsource/zen-kaku-gothic-new@^5 @fontsource/yuji-syuku@^5
```

- [ ] **Step 2: Let Vitest compile `.astro` files**

`vitest.config.mjs`:
```js
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: { include: ['tests/**/*.test.{mjs,ts}'] },
});
```
Run `npm test`. Expected: the existing 48+ tests still pass.

- [ ] **Step 3: Write the failing layout test**

```ts
// tests/base-layout.test.ts
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import BaseLayout from '../src/layouts/BaseLayout.astro';

const props = {
  title: 'T | tabemasen',
  description: 'D',
  canonical: 'https://tabemasen.io/guides/',
  page: 'guides',
  current: '/guides/',
  jsonLd: ['{"@context":"https://schema.org","@type":"CollectionPage"}'],
};

describe('BaseLayout', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(BaseLayout, { props, slots: { default: '<main><p>body</p></main>' } });

  it('renders the head metadata search engines and link previews read', () => {
    expect(html).toContain('<title>T | tabemasen</title>');
    expect(html).toContain('<meta name="description" content="D">');
    expect(html).toContain('<link rel="canonical" href="https://tabemasen.io/guides/">');
    expect(html).toContain('<meta property="og:url" content="https://tabemasen.io/guides/">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="msvalidate.01" content="739633B14AA9EF483F9FA562680C9A0F">');
  });

  it('emits JSON-LD strings verbatim', () => {
    expect(html).toContain('<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage"}</script>');
  });

  it('wraps the slot in the site header and footer and loads analytics', () => {
    expect(html).toMatch(/class="tm-header[\s\S]*<p>body<\/p>[\s\S]*class="tm-footer/);
    expect(html).toContain('src="/analytics.js"');
    expect(html).toContain('data-goatcounter="https://nqtn.goatcounter.com/count"');
  });

  it('declares the language and viewport', () => {
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('name="viewport"');
  });
});
```

- [ ] **Step 4: Run and see it fail**

Run: `npx vitest run tests/base-layout.test.ts`
Expected: FAIL, cannot resolve `../src/layouts/BaseLayout.astro`.

- [ ] **Step 5: Write the styles**

`src/styles/tokens.css`:
```css
/* Draft 5 "sumi ink". Prefixed --tm- so legacy styles.css variables never collide. */
:root {
  --tm-paper: #ffffff;
  --tm-paper-warm: #f6f1e7;
  --tm-paper-sunk: #ece5d7;
  --tm-ink: #1d1d1f;
  --tm-ink-card: #1e1b18;
  --tm-ink-muted: #45474d;
  --tm-ink-faint: #5c5348;       /* 7.1:1 on white, 6.3:1 on paper-warm */
  --tm-rule: #ddd4c3;
  --tm-rule-strong: #c9c0b0;
  --tm-shu: #c4412b;             /* 4.9:1 on white */
  --tm-shu-dark: #a8361f;
  --tm-shu-text: #b83a2a;
  --tm-shu-soft: #f7e7e0;
  --tm-warning-ink: #9b2f18;
  --tm-ai: #2c3a57;

  --tm-font-display: "Shippori Mincho", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif;
  --tm-font-body: "Zen Kaku Gothic New", "Hiragino Sans", "Yu Gothic UI", system-ui, sans-serif;
  --tm-font-brush: "Yuji Syuku", "Shippori Mincho", serif;

  --tm-space-1: 4px;  --tm-space-2: 8px;  --tm-space-3: 12px; --tm-space-4: 16px;
  --tm-space-5: 24px; --tm-space-6: 32px; --tm-space-7: 48px; --tm-space-8: 64px; --tm-space-9: 96px;
  --tm-radius: 4px;
  --tm-radius-pill: 999px;
  --tm-max: 1440px;
  --tm-gutter: 64px;
  --tm-shadow-card: 0 1px 0 rgba(30, 27, 24, .06), 0 18px 40px rgba(30, 27, 24, .14);
}
@media (max-width: 760px) {
  :root { --tm-gutter: 16px; }
}
```

`src/styles/fonts.css`:
```css
@import "@fontsource/shippori-mincho/500.css";
@import "@fontsource/shippori-mincho/600.css";
@import "@fontsource/shippori-mincho/700.css";
@import "@fontsource/shippori-mincho/800.css";
@import "@fontsource/zen-kaku-gothic-new/400.css";
@import "@fontsource/zen-kaku-gothic-new/500.css";
@import "@fontsource/zen-kaku-gothic-new/700.css";
@import "@fontsource/yuji-syuku/400.css";
```

`src/styles/global.css` (loaded only by `BaseLayout`, i.e. redesigned pages):
```css
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--tm-paper);
  color: var(--tm-ink);
  font-family: var(--tm-font-body);
  font-size: 17px;
  line-height: 1.65;
}
img { max-width: 100%; height: auto; }
a { color: var(--tm-ink); }
a:hover { color: var(--tm-shu); }
a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible, summary:focus-visible {
  outline: 2px solid var(--tm-ai);
  outline-offset: 2px;
}
.tm-container { max-width: var(--tm-max); margin: 0 auto; padding: 0 var(--tm-gutter); }
.tm-kicker { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--tm-ink-muted); }
.tm-display { font-family: var(--tm-font-display); font-weight: 600; letter-spacing: -0.02em; }
.tm-link { font-weight: 700; text-decoration: none; border-bottom: 2px solid var(--tm-shu); padding-bottom: 2px; }
.tm-btn {
  font: inherit; min-height: 56px; padding: 0 26px; border-radius: var(--tm-radius);
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 17px; text-decoration: none; border: 0; cursor: pointer;
  background: var(--tm-shu); color: #fff;
}
.tm-btn:hover { background: var(--tm-shu-dark); color: #fff; }
.visually-hidden {
  position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 6: Write `BaseLayout`**

```astro
---
// src/layouts/BaseLayout.astro
import '../styles/fonts.css';
import '../styles/tokens.css';
import '../styles/global.css';
import SiteHeader from '../components/SiteHeader.astro';
import SiteFooter from '../components/SiteFooter.astro';

interface Props {
  title: string;
  description: string;
  canonical: string;
  page: string;          // analytics page name, e.g. "allergies"
  current?: string;      // nav href to mark aria-current
  ogType?: string;
  ogImage?: string;
  jsonLd?: string[];     // raw JSON strings, emitted verbatim
  bodyClass?: string;
}
const {
  title, description, canonical, page, current,
  ogType = 'website', ogImage = 'https://tabemasen.io/assets/og-image.png',
  jsonLd = [], bodyClass,
} = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="msvalidate.01" content="739633B14AA9EF483F9FA562680C9A0F">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content={description}>
  <link rel="canonical" href={canonical}>
  <meta property="og:type" content={ogType}>
  <meta property="og:url" content={canonical}>
  <meta property="og:title" content={title}>
  <meta property="og:description" content={description}>
  <meta property="og:image" content={ogImage}>
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content={title}>
  <meta name="twitter:description" content={description}>
  <meta name="twitter:image" content={ogImage}>
  {jsonLd.map((json) => <script type="application/ld+json" set:html={json} />)}
  <link rel="icon" type="image/x-icon" href="/assets/favicon.ico">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
  <slot name="head" />
</head>
<body class={bodyClass}>
  <SiteHeader page={page} current={current} />
  <slot />
  <SiteFooter page={page} />
  <script is:inline src="/analytics.js"></script>
  <script is:inline data-goatcounter="https://nqtn.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>
```
Note: today's pages use `user-scalable=no` in the viewport; the redesign drops it (it blocks zoom, an accessibility failure). The viewport meta is not part of the SEO baseline.

- [ ] **Step 7: Run the test and see it pass**

Run: `npx vitest run tests/base-layout.test.ts`
Expected: 4 passed. If Astro serialises an attribute differently (for example `content="D" />`), adjust the assertion to the emitted form, not the layout; record a ruling.

- [ ] **Step 8: Commit**

```bash
git add src/styles/tokens.css src/styles/fonts.css src/styles/global.css src/layouts/BaseLayout.astro vitest.config.mjs tests/base-layout.test.ts package.json package-lock.json
git commit -m "feat(design): tokens, self-hosted fonts, global styles and BaseLayout"
```

---

### Task 4: `SealMark`, `SiteHeader`, `SiteFooter`

**Files:**
- Create: `src/lib/site.ts`, `src/components/SealMark.astro`, `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`
- Test: `tests/site-chrome.test.ts`

**Interfaces:**
- Produces: `NAV: { href: string; label: string }[]` = Guides `/guides/`, Allergies `/allergies/`, Halal `/halal/`, Vegan `/vegan/`, Gluten-free `/gluten-free-japan/`.
- Produces: `SiteHeader` props `{ page: string; current?: string }`; root `<header class="tm-header">`; nav `#tm-nav`; toggle `.tm-header__toggle[aria-controls="tm-nav"]`; CTA "Make my card" → `/` with `data-gc-event="cta-<page>-nav"`.
- Produces: `SiteFooter` props `{ page: string }`; root `<footer class="tm-footer">`; coffee link `data-gc-event="coffee-<page>"`.
- Produces: `SealMark` props `{ size?: number; color?: string }` (decorative, `aria-hidden`).

- [ ] **Step 1: Write the failing tests**

```ts
// tests/site-chrome.test.ts
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SiteHeader from '../src/components/SiteHeader.astro';
import SiteFooter from '../src/components/SiteFooter.astro';

const container = await AstroContainer.create();

describe('SiteHeader', async () => {
  const html = await container.renderToString(SiteHeader, { props: { page: 'vegan', current: '/vegan/' } });

  it('links every hub and the guides index', () => {
    for (const href of ['/guides/', '/allergies/', '/halal/', '/vegan/', '/gluten-free-japan/']) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  it('marks only the current section', () => {
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/href="\/vegan\/"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/vegan\/"/);
  });

  it('keeps the per-page nav CTA event name', () => {
    expect(html).toContain('data-gc-event="cta-vegan-nav"');
    expect(html).toContain('Make my card');
  });

  it('has an accessible mobile menu toggle', () => {
    expect(html).toContain('aria-controls="tm-nav"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('id="tm-nav"');
  });
});

describe('SiteFooter', async () => {
  const html = await container.renderToString(SiteFooter, { props: { page: 'halal' } });

  it('keeps every link the old footer had', () => {
    for (const href of ['/allergies/', '/gluten-free-japan/', '/vegan/', '/halal/',
      '/allergies/food-allergies-in-japanese/', '/allergies/labeling-guide/', '/celiac/',
      'https://www.foodallergy.org/resources/travel-tips-japan', 'https://www.legalnomads.com/gluten-free/japanese/',
      'https://jp.usembassy.gov/services/importing-medication/', '/about/', '/featured/',
      'https://github.com/codenameisone/tabemasen.io', 'https://github.com/codenameisone/tabemasen.io/blob/main/CHANGELOG.md',
      'mailto:hello@tabemasen.io', 'https://buymeacoffee.com/iwakuranik']) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  it('adds the guides index and the halal certification guide', () => {
    expect(html).toContain('href="/guides/"');
    expect(html).toContain('href="/halal/certification-guide/"');
  });

  it('keeps the per-page coffee event and the safety disclaimer', () => {
    expect(html).toContain('data-gc-event="coffee-halal"');
    expect(html).toContain('Emergency in Japan: 119.');
    expect(html).toContain('Wording last reviewed October 2026.');
  });
});
```

- [ ] **Step 2: Run and see it fail**

Run: `npx vitest run tests/site-chrome.test.ts`
Expected: FAIL, cannot resolve the components.

- [ ] **Step 3: Implement**

```ts
// src/lib/site.ts
export const NAV = [
  { href: '/guides/', label: 'Guides' },
  { href: '/allergies/', label: 'Allergies' },
  { href: '/halal/', label: 'Halal' },
  { href: '/vegan/', label: 'Vegan' },
  { href: '/gluten-free-japan/', label: 'Gluten-free' },
] as const;

export const FOOTER = {
  cards: [
    { href: '/allergies/', label: 'Allergies' },
    { href: '/gluten-free-japan/', label: 'Gluten-free' },
    { href: '/vegan/', label: 'Vegan' },
    { href: '/halal/', label: 'Halal' },
  ],
  guides: [
    { href: '/allergies/food-allergies-in-japanese/', label: 'Food allergies in Japanese' },
    { href: '/allergies/labeling-guide/', label: 'Japan labeling guide' },
    { href: '/celiac/', label: 'Celiac in Japan' },
    { href: '/halal/certification-guide/', label: 'Halal certification in Japan' },
    { href: '/guides/', label: 'All guides' },
  ],
  resources: [
    { href: 'https://www.foodallergy.org/resources/travel-tips-japan', label: 'FoodAllergy.org Japan tips' },
    { href: 'https://www.legalnomads.com/gluten-free/japanese/', label: 'Legal Nomads — GF Japan' },
    { href: 'https://jp.usembassy.gov/services/importing-medication/', label: 'Yunyu Kakunin-sho' },
  ],
  about: [
    { href: '/about/', label: 'About & safety' },
    { href: '/featured/', label: 'Featured in' },
    { href: 'https://github.com/codenameisone/tabemasen.io', label: 'GitHub' },
    { href: 'https://github.com/codenameisone/tabemasen.io/blob/main/CHANGELOG.md', label: 'Changelog' },
    { href: 'mailto:hello@tabemasen.io', label: 'Feedback' },
  ],
} as const;
```

```astro
---
// src/components/SealMark.astro — the 食 hanko. Decorative.
interface Props { size?: number; color?: string }
const { size = 34, color = 'var(--tm-shu)' } = Astro.props;
---
<span class="tm-seal" lang="ja" aria-hidden="true"
  style={`--seal-size:${size}px;--seal-color:${color}`}>食</span>
<style>
  .tm-seal {
    width: var(--seal-size); height: var(--seal-size); flex: none;
    display: inline-flex; align-items: center; justify-content: center;
    border: 2px solid var(--seal-color); color: var(--seal-color);
    font-family: var(--tm-font-display); font-weight: 800;
    font-size: calc(var(--seal-size) * 0.56); line-height: 1;
    transform: rotate(-4deg);
  }
</style>
```

```astro
---
// src/components/SiteHeader.astro
import '../styles/fonts.css';
import '../styles/tokens.css';
import SealMark from './SealMark.astro';
import { NAV } from '../lib/site';
interface Props { page: string; current?: string }
const { page, current } = Astro.props;
---
<header class="tm-header">
  <div class="tm-header__inner">
    <a class="tm-header__brand" href="/" aria-label="tabemasen home">
      <SealMark size={34} />
      <span class="tm-header__word">tabemasen</span>
    </a>
    <button class="tm-header__toggle" type="button" aria-expanded="false" aria-controls="tm-nav" aria-label="Open menu">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><line x1="4" y1="8" x2="20" y2="8"></line><line x1="4" y1="16" x2="20" y2="16"></line></svg>
    </button>
    <nav id="tm-nav" class="tm-header__nav" aria-label="Main">
      <ul class="tm-header__list">
        {NAV.map((item) => (
          <li><a class="tm-header__link" href={item.href} aria-current={item.href === current ? 'page' : undefined}>{item.label}</a></li>
        ))}
        <li><a class="tm-header__cta" href="/" data-gc-event={`cta-${page}-nav`}>Make my card</a></li>
      </ul>
    </nav>
  </div>
</header>

<script>
  for (const toggle of document.querySelectorAll<HTMLButtonElement>('.tm-header__toggle')) {
    const nav = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
    if (!nav) continue;
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.toggleAttribute('data-open', open);
      if (open) nav.querySelector<HTMLAnchorElement>('a')?.focus();
    });
  }
</script>

<style>
  /* Explicit resets: on legacy pages styles.css and inline styles are present. */
  .tm-header, .tm-header * { box-sizing: border-box; }
  .tm-header { background: var(--tm-paper); color: var(--tm-ink); font-family: var(--tm-font-body); font-size: 15px; line-height: 1.4; border-bottom: 1px solid var(--tm-rule); position: relative; z-index: 50; }
  .tm-header__inner { max-width: var(--tm-max); margin: 0 auto; padding: 14px var(--tm-gutter); display: flex; align-items: center; justify-content: space-between; gap: 12px 32px; flex-wrap: wrap; }
  .tm-header__brand { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; color: var(--tm-ink); min-height: 44px; }
  .tm-header__word { font-family: var(--tm-font-display); font-size: 24px; font-weight: 700; letter-spacing: 0; }
  .tm-header__toggle { display: none; width: 44px; height: 44px; margin: 0; padding: 0; border: 0; background: transparent; color: var(--tm-ink); align-items: center; justify-content: center; cursor: pointer; }
  .tm-header__list { list-style: none; margin: 0; padding: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 0 26px; }
  .tm-header__list li { margin: 0; padding: 0; }
  .tm-header__link { display: inline-flex; align-items: center; min-height: 44px; color: var(--tm-ink); text-decoration: none; font-weight: 500; border-bottom: 2px solid transparent; }
  .tm-header__link[aria-current="page"] { border-bottom-color: var(--tm-ink); }
  .tm-header__link:hover { color: var(--tm-shu); }
  .tm-header__cta { display: inline-flex; align-items: center; min-height: 44px; color: var(--tm-ink); text-decoration: none; font-weight: 700; border-bottom: 2px solid var(--tm-shu); margin-left: 8px; }
  @media (max-width: 760px) {
    .tm-header__inner { padding: 6px 8px 6px 16px; }
    .tm-header__word { font-size: 19px; }
    .tm-header__toggle { display: inline-flex; }
    .tm-header__nav { display: none; width: 100%; }
    .tm-header__nav[data-open] { display: block; }
    .tm-header__list { flex-direction: column; align-items: stretch; padding: 4px 8px 12px; }
    .tm-header__link, .tm-header__cta { width: 100%; margin: 0; border-bottom: 1px solid var(--tm-rule); }
    .tm-header__link[aria-current="page"] { border-bottom-color: var(--tm-rule); font-weight: 700; }
  }
</style>
```

```astro
---
// src/components/SiteFooter.astro
import '../styles/fonts.css';
import '../styles/tokens.css';
import SealMark from './SealMark.astro';
import { FOOTER } from '../lib/site';
interface Props { page: string }
const { page } = Astro.props;
const external = (href: string) => href.startsWith('http');
const columns = [
  { heading: 'Cards', links: FOOTER.cards },
  { heading: 'Guides', links: FOOTER.guides },
  { heading: 'Resources', links: FOOTER.resources },
  { heading: 'About', links: FOOTER.about },
];
---
<footer class="tm-footer">
  <div class="tm-footer__inner">
    <div class="tm-footer__brand">
      <a class="tm-footer__home" href="/" aria-label="tabemasen home"><SealMark size={28} color="#e07f6e" /><span>tabemasen</span></a>
      <p class="tm-footer__tagline">Free Japanese restaurant cards for travelers with food allergies and dietary restrictions.</p>
      <a class="tm-footer__coffee" href="https://buymeacoffee.com/iwakuranik" target="_blank" rel="noopener noreferrer" data-gc-event={`coffee-${page}`}>Buy me a coffee</a>
    </div>
    {columns.map((col) => (
      <div class="tm-footer__col">
        <h2 class="tm-footer__heading">{col.heading}</h2>
        <ul class="tm-footer__list">
          {col.links.map((l) => (
            <li><a href={l.href} target={external(l.href) ? '_blank' : undefined} rel={external(l.href) ? 'noopener' : undefined}>{l.label}</a></li>
          ))}
        </ul>
      </div>
    ))}
  </div>
  <div class="tm-footer__bottom">
    <p class="tm-footer__disclaimer">Not medical advice. A card helps you ask, but it can't guarantee what's in your food, so always confirm with staff. If you have a serious allergy, carry your prescribed medication and a doctor's letter. Emergency in Japan: 119. Wording last reviewed October 2026. <a href="/about/">How the cards are made</a></p>
    <p class="tm-footer__credit">Built by a fellow traveller · v2.0</p>
  </div>
</footer>

<style>
  .tm-footer, .tm-footer * { box-sizing: border-box; }
  .tm-footer { background: var(--tm-ink); color: #c9c1b5; font-family: var(--tm-font-body); font-size: 15px; line-height: 1.6; }
  .tm-footer a { color: #f6f1e7; text-decoration: none; }
  .tm-footer a:hover { color: #e07f6e; }
  .tm-footer__inner { max-width: var(--tm-max); margin: 0 auto; padding: 56px var(--tm-gutter) 32px; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 32px; }
  .tm-footer__home { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; font-family: var(--tm-font-display); font-size: 20px; font-weight: 700; }
  .tm-footer__tagline { margin: 8px 0 12px; font-size: 14px; }
  .tm-footer__coffee { display: inline-flex; align-items: center; min-height: 44px; font-weight: 700; border-bottom: 2px solid #e07f6e; }
  .tm-footer__heading { margin: 0 0 6px; font-family: var(--tm-font-body); font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #c9c1b5; }
  .tm-footer__list { list-style: none; margin: 0; padding: 0; }
  .tm-footer__list li { margin: 0; padding: 0; }
  .tm-footer__list a { display: inline-flex; align-items: center; min-height: 36px; }
  .tm-footer__bottom { max-width: var(--tm-max); margin: 0 auto; padding: 20px var(--tm-gutter) 40px; border-top: 1px solid #3a352f; font-size: 13px; }
  .tm-footer__disclaimer { margin: 0 0 8px; max-width: 900px; }
  .tm-footer__disclaimer a { border-bottom: 1px solid #c9c1b5; }
  .tm-footer__credit { margin: 0; color: #a89f91; }
</style>
```

- [ ] **Step 4: Run and see them pass**

Run: `npx vitest run tests/site-chrome.test.ts tests/base-layout.test.ts`
Expected: all pass (7 + 4).

- [ ] **Step 5: Commit**

```bash
git add src/lib/site.ts src/components/SealMark.astro src/components/SiteHeader.astro src/components/SiteFooter.astro tests/site-chrome.test.ts
git commit -m "feat(design): site header and footer (keeps every footer link and per-page events)"
```

---

### Task 5: New header and footer on every legacy page

**Files:**
- Create: `scripts/lib/legacy-chrome.mjs`, `scripts/swap-legacy-chrome.mjs`
- Modify: all 11 `src/pages/**/index.astro` that have a `<header class="site-header">` (every page except `gluten-free`)
- Test: `tests/legacy-chrome.test.mjs`

**Interfaces:**
- Consumes: `SiteHeader`, `SiteFooter` (Task 4).
- Produces: `swapChrome(source: string, { page: string, current?: string }): string` — replaces the `<header class="site-header">…</header>` block with `<SiteHeader page="…" current="…" />`, the `<footer class="site-footer">…</footer>` block with `<SiteFooter page="…" />`, removes the `nav.js` script tag, and prepends a frontmatter block importing both components. Throws if a block is missing or the file already has frontmatter.
- Produces: `LEGACY_PAGES: Record<string, { page: string, current?: string }>` keyed by path under `src/pages/`.

- [ ] **Step 1: Write the failing tests**

```js
// tests/legacy-chrome.test.mjs
import { describe, it, expect } from 'vitest';
import { swapChrome } from '../scripts/lib/legacy-chrome.mjs';

const legacy = `<!DOCTYPE html>
<html lang="en">
<head><title>x</title></head>
<body>
  <header class="site-header">
    <nav class="site-nav"><a href="/">Generate card</a></nav>
  </header>
  <main><p>keep</p></main>
  <footer class="site-footer">
    <p>old</p>
  </footer>
  <script is:inline src="/nav.js" defer></script>
  <script is:inline src="/analytics.js"></script>
</body>
</html>`;

describe('swapChrome', () => {
  const out = swapChrome(legacy, { page: 'vegan', current: '/vegan/' });

  it('adds frontmatter importing the components', () => {
    expect(out.startsWith("---\nimport SiteHeader from '../../components/SiteHeader.astro';\nimport SiteFooter from '../../components/SiteFooter.astro';\n---\n<!DOCTYPE html>")).toBe(true);
  });

  it('swaps header and footer and keeps the body', () => {
    expect(out).toContain('<SiteHeader page="vegan" current="/vegan/" />');
    expect(out).toContain('<SiteFooter page="vegan" />');
    expect(out).toContain('<main><p>keep</p></main>');
    expect(out).not.toContain('site-header');
    expect(out).not.toContain('site-footer');
  });

  it('drops nav.js but keeps other scripts', () => {
    expect(out).not.toContain('/nav.js');
    expect(out).toContain('/analytics.js');
  });

  it('omits current when not given', () => {
    expect(swapChrome(legacy, { page: 'about' })).toContain('<SiteHeader page="about" />');
  });

  it('uses the right relative import depth (folders below src/pages/)', () => {
    expect(swapChrome(legacy, { page: 'x', depth: 0 })).toContain("from '../components/SiteHeader.astro'");
    expect(swapChrome(legacy, { page: 'x', depth: 1 })).toContain("from '../../components/SiteHeader.astro'");
    expect(swapChrome(legacy, { page: 'x', depth: 2 })).toContain("from '../../../components/SiteHeader.astro'");
  });

  it('refuses files without the legacy blocks or with frontmatter', () => {
    expect(() => swapChrome('<html><body></body></html>', { page: 'x' })).toThrow(/site-header/);
    expect(() => swapChrome('---\n---\n' + legacy, { page: 'x' })).toThrow(/frontmatter/);
  });
});
```

`depth` is the number of folders between `src/pages/` and the file (`index.astro` → 0, `vegan/index.astro` → 1, `allergies/labeling-guide/index.astro` → 2) and defaults to 1; the import prefix is `'../'.repeat(depth + 1)`.

- [ ] **Step 2: Run and see it fail**

Run: `npx vitest run tests/legacy-chrome.test.mjs`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```js
// scripts/lib/legacy-chrome.mjs
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
```

```js
// scripts/swap-legacy-chrome.mjs — one-off: run once, commit the result.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { swapChrome, LEGACY_PAGES } from './lib/legacy-chrome.mjs';

for (const [rel, opts] of Object.entries(LEGACY_PAGES)) {
  const path = join('src/pages', rel);
  writeFileSync(path, swapChrome(readFileSync(path, 'utf8'), opts));
  console.log(`swapped ${path}`);
}
```

- [ ] **Step 4: Run tests and see them pass**

Run: `npx vitest run tests/legacy-chrome.test.mjs`
Expected: 6 passed.

- [ ] **Step 5: Swap, build, check**

```bash
node scripts/swap-legacy-chrome.mjs
grep -L "SiteHeader" $(find src/pages -name 'index.astro' ! -path '*/gluten-free/*')
npm run build && npm run check:seo && npm run check:content
```
Expected: 11 `swapped` lines; the `grep -L` prints nothing; build succeeds; SEO check passed (12 pages); content check passed for all 11 pages. If `check:seo` reports a broken link, the new header/footer introduced it: fix the component.

- [ ] **Step 6: Look at the result on legacy pages (Review Focus 1)**

```bash
npx astro preview --port 4321
```
With the Playwright browser tools, screenshot `/vegan/`, `/allergies/labeling-guide/` and `/about/` at 375×844 and 1280×800 (viewport top and page bottom). Expected: header and footer look like the design (seal, serif wordmark, nav; dark footer with four link columns), no list bullets, underlines or margins leaking from `styles.css`; the mobile menu opens and closes. Fix leaks by adding explicit resets in the component `<style>`, never by editing legacy page CSS. Stop the server with `npx astro preview stop`.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/legacy-chrome.mjs scripts/swap-legacy-chrome.mjs tests/legacy-chrome.test.mjs src/pages
git commit -m "feat(design): new site header and footer on every page; legacy bodies untouched"
```

---

### Task 6: Diets and the guide collection

**Files:**
- Create: `src/data/diets.ts`, `src/content.config.ts`, `src/content/guides/labeling-guide.md`, `src/content/guides/food-allergies-in-japanese.md`, `src/content/guides/halal-certification-guide.md`, `src/content/guides/celiac.md`, `src/lib/guides.ts`
- Test: `tests/guides.test.ts`

**Interfaces:**
- Produces: `DIET_KEYS = ['allergies','halal','vegan','vegetarian','pescatarian','kosher','gluten-free'] as const`, `type DietKey`, `DIETS: Record<DietKey, { name: string; glyph: string; hub: string | null; pattern: string | null }>` (`pattern` = the `data.js` pattern key used as `p=`; `allergies` → `null`).
- Produces: `guideUrl(entry: { id: string; data: { permalink?: string } }): string` → `permalink` or `/guides/<id>/`.
- Produces: `guidesForDiet<T extends GuideLike>(entries: T[], diet: DietKey): T[]` — non-draft entries whose `diets` include `diet`, newest `reviewed` first, then title.
- Produces: `groupGuides<T extends GuideLike>(entries: T[]): { key: DietKey | 'general'; name: string; glyph: string; guides: T[] }[]` — one group per diet that has guides, in `DIET_KEYS` order, plus `general` ("Eating in Japan", glyph `旅`) for entries with empty `diets`; empty groups omitted.
- `type GuideLike = { id: string; data: { title: string; diets: DietKey[]; reviewed: Date; draft?: boolean; permalink?: string } }`.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/guides.test.ts
import { describe, it, expect } from 'vitest';
import { guideUrl, guidesForDiet, groupGuides } from '../src/lib/guides';
import { DIETS, DIET_KEYS } from '../src/data/diets';

const g = (id: string, diets: string[], reviewed: string, extra: Record<string, unknown> = {}) =>
  ({ id, data: { title: id, diets, reviewed: new Date(reviewed), ...extra } }) as any;

describe('guideUrl', () => {
  it('uses the permalink for legacy guides and /guides/<id>/ otherwise', () => {
    expect(guideUrl(g('labeling-guide', ['allergies'], '2026-10-08', { permalink: '/allergies/labeling-guide/' }))).toBe('/allergies/labeling-guide/');
    expect(guideUrl(g('kura-sushi', ['allergies'], '2026-10-08'))).toBe('/guides/kura-sushi/');
  });
});

describe('guidesForDiet', () => {
  it('filters by diet, drops drafts, newest review first', () => {
    const list = [g('a', ['allergies'], '2026-05-01'), g('b', ['allergies', 'vegan'], '2026-10-01'),
      g('c', ['halal'], '2026-10-02'), g('d', ['allergies'], '2026-10-03', { draft: true })];
    expect(guidesForDiet(list, 'allergies').map((x) => x.id)).toEqual(['b', 'a']);
  });
});

describe('groupGuides', () => {
  it('groups in diet order, adds Eating in Japan for untagged guides, omits empty groups', () => {
    const groups = groupGuides([g('h', ['halal'], '2026-10-01'), g('a', ['allergies'], '2026-10-01'), g('k', [], '2026-10-01')]);
    expect(groups.map((x) => x.key)).toEqual(['allergies', 'halal', 'general']);
    expect(groups[2]).toMatchObject({ name: 'Eating in Japan', glyph: '旅' });
  });
});

describe('DIETS', () => {
  it('covers every key and maps hubs and builder patterns', () => {
    expect(Object.keys(DIETS)).toEqual([...DIET_KEYS]);
    expect(DIETS.allergies).toMatchObject({ hub: '/allergies/', pattern: null });
    expect(DIETS['gluten-free']).toMatchObject({ hub: '/gluten-free-japan/', pattern: 'gluten-free' });
    expect(DIETS.kosher.hub).toBeNull();
  });
});
```

- [ ] **Step 2: Run and see it fail**

Run: `npx vitest run tests/guides.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement data and helpers**

```ts
// src/data/diets.ts
export const DIET_KEYS = ['allergies', 'halal', 'vegan', 'vegetarian', 'pescatarian', 'kosher', 'gluten-free'] as const;
export type DietKey = (typeof DIET_KEYS)[number];

export const DIETS: Record<DietKey, { name: string; glyph: string; hub: string | null; pattern: string | null }> = {
  allergies:     { name: 'Allergies',             glyph: '卵',       hub: '/allergies/',         pattern: null },
  halal:         { name: 'Halal',                 glyph: '豚',       hub: '/halal/',             pattern: 'halal' },
  vegan:         { name: 'Vegan',                 glyph: '菜',       hub: '/vegan/',             pattern: 'vegan' },
  vegetarian:    { name: 'Vegetarian',            glyph: '菜',       hub: null,                  pattern: 'vegetarian' },
  pescatarian:   { name: 'Pescatarian',           glyph: '魚',       hub: null,                  pattern: 'pescatarian' },
  kosher:        { name: 'Kosher',                glyph: 'コーシャ', hub: null,                  pattern: 'kosher' },
  'gluten-free': { name: 'Gluten-free & coeliac', glyph: '麦',       hub: '/gluten-free-japan/', pattern: 'gluten-free' },
};
```

```ts
// src/lib/guides.ts
import { DIETS, DIET_KEYS, type DietKey } from '../data/diets';

export type GuideLike = {
  id: string;
  data: { title: string; diets: DietKey[]; reviewed: Date; draft?: boolean; permalink?: string };
};

export const guideUrl = (entry: { id: string; data: { permalink?: string } }) =>
  entry.data.permalink ?? `/guides/${entry.id}/`;

const live = <T extends GuideLike>(entries: T[]) => entries.filter((e) => !e.data.draft);
const byReview = <T extends GuideLike>(a: T, b: T) =>
  b.data.reviewed.getTime() - a.data.reviewed.getTime() || a.data.title.localeCompare(b.data.title);

export function guidesForDiet<T extends GuideLike>(entries: T[], diet: DietKey): T[] {
  return live(entries).filter((e) => e.data.diets.includes(diet)).sort(byReview);
}

export function groupGuides<T extends GuideLike>(entries: T[]) {
  const groups: { key: DietKey | 'general'; name: string; glyph: string; guides: T[] }[] = [];
  for (const key of DIET_KEYS) {
    const guides = guidesForDiet(entries, key);
    if (guides.length) groups.push({ key, name: DIETS[key].name, glyph: DIETS[key].glyph, guides });
  }
  const general = live(entries).filter((e) => e.data.diets.length === 0).sort(byReview);
  if (general.length) groups.push({ key: 'general', name: 'Eating in Japan', glyph: '旅', guides: general });
  return groups;
}
```

- [ ] **Step 4: Run and see it pass**

Run: `npx vitest run tests/guides.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Add the collection and the four legacy entries**

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { DIET_KEYS } from './data/diets';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z
    .object({
      title: z.string().min(1),            // listing title
      description: z.string().min(1),      // listing dek
      diets: z.array(z.enum(DIET_KEYS)),
      primaryDiet: z.enum(DIET_KEYS).optional(),
      permalink: z.string().regex(/^\/[a-z0-9/-]*\/$/).optional(),
      legacy: z.boolean().default(false),  // page lives in src/pages; entry is for listings only
      published: z.coerce.date(),
      reviewed: z.coerce.date(),
      author: z.string().default('Nik'),
      draft: z.boolean().default(false),
    })
    .refine((d) => d.diets.length <= 1 || d.primaryDiet, { message: 'primaryDiet is required when a guide has more than one diet' })
    .refine((d) => !d.legacy || d.permalink, { message: 'legacy guides need a permalink' }),
});

export const collections = { guides };
```

`src/content/guides/labeling-guide.md`:
```markdown
---
title: "Japan's allergen labels, explained"
description: "The nine mandatory allergens, where they hide on a konbini packet, why there's no “may contain”, and where the labelling rules stop: restaurant menus."
diets: [allergies]
permalink: /allergies/labeling-guide/
legacy: true
published: 2026-05-18
reviewed: 2026-10-08
---
```

`src/content/guides/food-allergies-in-japanese.md`:
```markdown
---
title: "Food allergies in Japanese"
description: "The exact phrase for every major allergen, in kanji with readings, and the phrases to use when ordering."
diets: [allergies]
permalink: /allergies/food-allergies-in-japanese/
legacy: true
published: 2026-05-25
reviewed: 2026-10-08
---
```

`src/content/guides/halal-certification-guide.md`:
```markdown
---
title: "Halal certification in Japan"
description: "The main certification bodies, what each logo means, and how to tell whether a Japanese restaurant is genuinely halal-certified."
diets: [halal]
permalink: /halal/certification-guide/
legacy: true
published: 2026-05-25
reviewed: 2026-10-08
---
```

`src/content/guides/celiac.md`:
```markdown
---
title: "Celiac (coeliac) disease in Japan"
description: "Japan's allergen law covers wheat, not barley, rye or gluten. What a Japanese label actually guarantees, and how to check food yourself."
diets: [gluten-free]
permalink: /celiac/
legacy: true
published: 2026-07-27
reviewed: 2026-10-10
---
```

- [ ] **Step 6: Build and confirm the collection loads**

Run: `npm run build`
Expected: build succeeds with no content schema errors. Then break one entry on purpose (delete `permalink` from `celiac.md`), run `npm run build`, expect it to fail with "legacy guides need a permalink", and restore the line.

- [ ] **Step 7: Commit**

```bash
git add src/data/diets.ts src/content.config.ts src/content/guides src/lib/guides.ts tests/guides.test.ts
git commit -m "feat(guides): diet taxonomy and guide collection with the four existing guides"
```

---

### Task 7: `/guides/` index, generated `sitemap.xml`, PR A

**Files:**
- Create: `src/components/BrushGlyph.astro`, `src/components/GuideList.astro`, `src/pages/guides/index.astro`, `src/pages/sitemap.xml.ts`, `src/lib/sitemap.ts`
- Delete: `public/sitemap.xml`
- Modify: `public/llms.txt` (one line), `CHANGELOG.md`
- Test: `tests/sitemap.test.ts`

**Interfaces:**
- Consumes: `groupGuides`, `guideUrl` (Task 6); `BaseLayout` (Task 3).
- Produces: `sitemapXml(entries: { loc: string; changefreq: string; priority: string; lastmod?: string }[]): string` in today's format.
- Produces: `BrushGlyph` props `{ text: string; size?: number; gloss?: string }`; `GuideList` props `{ guides: GuideLike[] }` (renders `<ul>` of links with title + description).

- [ ] **Step 1: Write the failing sitemap test**

```ts
// tests/sitemap.test.ts
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
```

- [ ] **Step 2: Run and see it fail**

Run: `npx vitest run tests/sitemap.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the sitemap**

Open `public/sitemap.xml` (it is deleted at the end of this step) and copy each URL's `changefreq`, `priority` and `lastmod` (only two entries have one) into `STATIC_PAGES` below, in the same order, inserting `/guides/` (`monthly`, `0.8`) before `/featured/`. The values shown are the expected ones; if the file differs, the file wins.

```ts
// src/lib/sitemap.ts
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
```

```ts
// src/pages/sitemap.xml.ts
import type { APIRoute } from 'astro';
import { sitemapXml, STATIC_PAGES } from '../lib/sitemap';

export const GET: APIRoute = () =>
  new Response(sitemapXml(STATIC_PAGES), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
```

Then: `git rm public/sitemap.xml`.

- [ ] **Step 4: Run and see it pass**

Run: `npx vitest run tests/sitemap.test.ts`
Expected: 2 passed. Then `npm run build && diff <(git show slice1-base:public/sitemap.xml) dist/sitemap.xml`. Expected: the only difference is the added `/guides/` block (and possibly whitespace). Any other difference means a copied value is wrong: fix `STATIC_PAGES`.

- [ ] **Step 5: Write `BrushGlyph`, `GuideList` and `/guides/`**

```astro
---
// src/components/BrushGlyph.astro — large brush-written kanji, decorative.
interface Props { text: string; size?: number; gloss?: string }
const { text, size = 120, gloss } = Astro.props;
---
<span class="tm-glyph">
  <span class="tm-glyph__text" lang="ja" aria-hidden="true" style={`font-size:${size}px`}>{text}</span>
  {gloss && <span class="tm-glyph__gloss">{gloss}</span>}
</span>
<style>
  .tm-glyph { display: inline-flex; align-items: flex-end; gap: 14px; }
  .tm-glyph__text { font-family: var(--tm-font-brush); line-height: .9; color: var(--tm-ink); }
  .tm-glyph__gloss { font-family: var(--tm-font-display); font-weight: 600; font-size: 16px; color: var(--tm-shu); padding-bottom: 8px; }
</style>
```

```astro
---
// src/components/GuideList.astro
import { guideUrl, type GuideLike } from '../lib/guides';
interface Props { guides: (GuideLike & { data: GuideLike['data'] & { description: string } })[] }
const { guides } = Astro.props;
---
<ul class="tm-guides">
  {guides.map((g) => (
    <li class="tm-guides__item">
      <a class="tm-guides__link" href={guideUrl(g)}>
        <span class="tm-guides__title">{g.data.title}</span>
        <span class="tm-guides__dek">{g.data.description}</span>
      </a>
    </li>
  ))}
</ul>
<style>
  .tm-guides { list-style: none; margin: 0; padding: 0; border-bottom: 1px solid var(--tm-rule); }
  .tm-guides__item { margin: 0; border-top: 1px solid var(--tm-rule); }
  .tm-guides__link { display: flex; flex-direction: column; gap: 4px; padding: 16px 0; min-height: 44px; text-decoration: none; color: var(--tm-ink); }
  .tm-guides__title { font-family: var(--tm-font-display); font-size: 21px; font-weight: 600; line-height: 1.3; }
  .tm-guides__link:hover .tm-guides__title { color: var(--tm-shu); }
  .tm-guides__dek { font-size: 15px; color: var(--tm-ink-muted); line-height: 1.55; }
</style>
```

```astro
---
// src/pages/guides/index.astro
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import BrushGlyph from '../../components/BrushGlyph.astro';
import GuideList from '../../components/GuideList.astro';
import { groupGuides } from '../../lib/guides';
import { DIETS } from '../../data/diets';

const groups = groupGuides(await getCollection('guides'));
const title = 'Guides: Eating in Japan with Allergies and Dietary Restrictions | tabemasen';
const description = 'Practical guides for eating in Japan with food allergies, coeliac disease, a vegan diet or halal requirements: labels, phrases, restaurants and what to ask.';
const jsonLd = [JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'tabemasen guides',
  url: 'https://tabemasen.io/guides/',
  description,
  publisher: { '@id': 'https://tabemasen.io/#organization' },
})];
---
<BaseLayout title={title} description={description} canonical="https://tabemasen.io/guides/" page="guides" current="/guides/" jsonLd={jsonLd}>
  <main class="tm-container gi">
    <header class="gi__head">
      <BrushGlyph text="旅" size={120} />
      <div class="gi__titles">
        <p class="tm-kicker">Guides</p>
        <h1 class="tm-display gi__h1">Read before you fly.</h1>
      </div>
      <p class="gi__lede">What the card can't do on its own: reading packets, choosing places that already cater for you, and the questions worth asking. Grouped by what you can't eat.</p>
    </header>
    <div class="gi__groups">
      {groups.map((group) => (
        <section class="gi__group" id={group.key} aria-labelledby={`gi-${group.key}`}>
          <h2 class="gi__group-title" id={`gi-${group.key}`}>
            <span class="gi__group-glyph" lang="ja" aria-hidden="true">{group.glyph}</span>
            {group.name}
          </h2>
          <GuideList guides={group.guides} />
          {group.key !== 'general' && DIETS[group.key].hub && (
            <a class="tm-link gi__hub" href={DIETS[group.key].hub}>{group.name} card and overview</a>
          )}
        </section>
      ))}
    </div>
  </main>
</BaseLayout>
<style>
  .gi { padding-top: 48px; padding-bottom: 96px; }
  .gi__head { display: grid; grid-template-columns: auto 1fr; gap: 16px 24px; align-items: end; margin-bottom: 56px; }
  .gi__titles { display: flex; flex-direction: column; gap: 6px; padding-bottom: 6px; }
  .gi__h1 { margin: 0; font-size: clamp(2.2rem, 4vw, 3rem); line-height: 1.08; }
  .gi__lede { grid-column: 1 / -1; margin: 0; max-width: 640px; color: var(--tm-ink-muted); font-size: 19px; }
  .gi__groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 48px 56px; }
  .gi__group { display: flex; flex-direction: column; gap: 14px; }
  .gi__group-title { margin: 0; display: flex; align-items: baseline; gap: 12px; font-size: 22px; }
  .gi__group-glyph { font-family: var(--tm-font-brush); font-weight: 400; font-size: 44px; line-height: 1; }
  .gi__hub { align-self: flex-start; }
  @media (max-width: 760px) { .gi { padding-top: 24px; } .gi__head { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 6: Add `/guides/` to `llms.txt` and the changelog**

In `public/llms.txt`, under the `## Free Japanese Restaurant Card Generator` list, after the Halal guide line, add:
```
- [All guides](https://tabemasen.io/guides/): Every tabemasen guide grouped by diet — allergies, halal, gluten-free and coeliac — with labels, phrases and restaurant advice
```
At the top of `CHANGELOG.md`, under a `## <today's date>` heading:
```markdown
- design: new site header and footer on every page (Draft 5 "sumi ink": seal mark, serif wordmark, self-hosted fonts). Page bodies unchanged.
- guides: new /guides/ index listing every guide by diet; guides are now a content collection, so hub pages and the index list them automatically.
- build: sitemap.xml is generated (same URLs plus /guides/); new npm run check:content guards every text block of restyled pages; check:seo also requires title, description, H1 and canonical on new pages.
```

- [ ] **Step 7: Full check**

```bash
npm test && npm run build && npm run check:seo && npm run check:content
```
Expected: tests pass; `SEO check passed: 13 pages, 12 indexable.` (`/guides/` is new and indexable; it is not in the baseline, so only the basics apply); content check passed. Open `/guides/` in `npx astro preview` at 375px and 1280px and check it against `V5Home`'s guides section style (glyph, serif heading, ruled list).

- [ ] **Step 8: Commit, push, open PR A** (ask the owner before pushing)

```bash
git add src/components/BrushGlyph.astro src/components/GuideList.astro src/pages/guides/index.astro src/pages/sitemap.xml.ts src/lib/sitemap.ts tests/sitemap.test.ts public/llms.txt CHANGELOG.md
git commit -m "feat(guides): /guides/ index; generated sitemap.xml"
git push origin astro-redesign slice1-base
gh pr create --base main --head astro-redesign --title "M2 slice 1 · Part A: site header/footer, guides index, guards" --body-file - <<'EOF'
## What
- New site header and footer (Draft 5) on every page. Page bodies untouched (`npm run check:content` passes for all 11 pages against `slice1-base`).
- `/guides/`: every guide grouped by diet, from the new guide collection (4 existing guides as listing entries; their pages are unchanged).
- `sitemap.xml` generated in the same format (+ `/guides/`).
- Guards: `check:content`; `check:seo` now requires page basics on new pages and validates allowlist entries; workflow permissions narrowed, prod deploys never cancelled, manual deploys allowed, actions on Node 24 majors.

## Not in this PR
Redesigned `/` and `/allergies/` (Part B).

## Verification
<npm test / check:seo / check:content output; screenshots of header and footer on /vegan/, /allergies/labeling-guide/, /about/ at 375 and 1280>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01UpttBQPap9JzyZfAZEcyqK
EOF
```
Expected: PR URL printed; CI passes. **Stop here until the owner merges PR A**, then `git fetch && git merge --ff-only origin/main` on `astro-redesign` (it is a merge commit away) and continue with Part B.

---

# Part B — card, home, allergies hub (PR B)

### Task 8: Card stylesheet, build-time card data, `ExampleCard`

**Files:**
- Create: `src/styles/card.css`, `src/lib/cardData.ts`, `src/components/ExampleCard.astro`
- Test: `tests/card-data-lib.test.ts`

**Interfaces:**
- Produces: `type CardState = { allergens: string[]; patterns: string[]; severity: 'allergy' | 'severe'; name: string; customText: string; showEnglish: boolean }`, `type CardLine = { kind: string; ja: string; en?: string }`.
- Produces: `loadCardData(): { allergens: { key: string; japanese: string; english: string; mandatory?: boolean }[]; patterns: { key: string; label_en: string }[]; buildCard(state: CardState): CardLine[] }` — evaluates `public/data.js` (path from `process.cwd()`) in a `vm` context once and caches it.
- Produces: `renderCardHtml(lines: CardLine[], showEnglish: boolean): string` — the same markup `app.js` `renderCard()` writes into `#card` (port of that function; same classes, same `&nbsp;` blanks, same `<br>` for `\n`, same escaping).
- Produces: `ExampleCard` props `{ state: Partial<CardState>; label?: string }` → `<div class="card" lang="ja" role="img" aria-label=…>` with `renderCardHtml` output.
- Produces: `card.css` styles `.card` and its line classes for screen (two-column items, phone single column below 480px) and print.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/card-data-lib.test.ts
import { describe, it, expect } from 'vitest';
import { loadCardData, renderCardHtml } from '../src/lib/cardData';

const base = { allergens: [], patterns: [], severity: 'allergy' as const, name: '', customText: '', showEnglish: true };

describe('loadCardData', () => {
  it('evaluates public/data.js and exposes buildCard', () => {
    const data = loadCardData();
    expect(data.allergens.filter((a) => a.mandatory)).toHaveLength(9);
    const lines = data.buildCard({ ...base, allergens: ['egg'] });
    expect(lines.find((l) => l.kind === 'item')?.ja).toBe('・卵');
  });
});

describe('renderCardHtml', () => {
  const lines = loadCardData().buildCard({ ...base, allergens: ['peanut'], severity: 'severe', name: 'Sarah' });

  it('renders Japanese lines with their kind classes, as app.js does', () => {
    const html = renderCardHtml(lines, true);
    expect(html).toContain('<p class="card-line card-line--greeting">すみません、私はSarahと申します。お願いがあります。</p>');
    expect(html).toContain('<p class="card-line card-line--item">・落花生(ピーナッツ)</p>');
    expect(html).toContain('<p class="card-line card-line--warning">⚠ 重度のアレルギーで、少量でも命に関わります。<br>調理器具や油も分けていただけると助かります。</p>');
  });

  it('puts English in .card-en before the disclaimer, hidden when showEnglish is false', () => {
    const shown = renderCardHtml(lines, true);
    expect(shown).toMatch(/<div class="card-en"><div class="card-en-divider"><\/div><p class="card-en-line card-en-line--greeting">Excuse me, my name is Sarah\. I have a request\.<\/p>/);
    expect(shown.indexOf('card-en')).toBeLessThan(shown.indexOf('card-line--disclaimer'));
    expect(renderCardHtml(lines, false)).toContain('<div class="card-en card-en--hidden">');
  });

  it('trims trailing blanks before the disclaimer and escapes HTML', () => {
    const custom = loadCardData().buildCard({ ...base, allergens: ['egg'], customText: '<b>x</b>' });
    const html = renderCardHtml(custom, false);
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).not.toMatch(/card-line--blank">&nbsp;<\/p><div class="card-en/);
  });
});
```

- [ ] **Step 2: Run and see it fail**

Run: `npx vitest run tests/card-data-lib.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `cardData.ts`**

```ts
// src/lib/cardData.ts
// Build-time access to public/data.js (the single source of card wording) and a
// port of app.js renderCard(), so static example cards match the live card exactly.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

export type CardState = {
  allergens: string[]; patterns: string[]; severity: 'allergy' | 'severe';
  name: string; customText: string; showEnglish: boolean;
};
export type CardLine = { kind: string; ja: string; en?: string };
type CardData = {
  allergens: { key: string; japanese: string; english: string; mandatory?: boolean }[];
  patterns: { key: string; label_en: string }[];
  buildCard(state: CardState): CardLine[];
};

let cached: CardData | undefined;

export function loadCardData(): CardData {
  if (cached) return cached;
  const context = { window: {} as { CARD_DATA?: CardData } };
  vm.createContext(context);
  vm.runInContext(readFileSync(join(process.cwd(), 'public/data.js'), 'utf8'), context);
  if (!context.window.CARD_DATA) throw new Error('public/data.js did not define window.CARD_DATA');
  cached = context.window.CARD_DATA;
  return cached;
}

const esc = (text: string) => text
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/\n/g, '<br>');

export function renderCardHtml(lines: CardLine[], showEnglish: boolean): string {
  const main = lines.filter((l) => l.kind !== 'disclaimer' && l.kind !== 'site-url');
  const tail = lines.filter((l) => l.kind === 'disclaimer' || l.kind === 'site-url');
  while (main.length && main[main.length - 1].kind === 'blank') main.pop();

  let html = main.map((l) => (l.kind === 'blank'
    ? '<p class="card-line card-line--blank">&nbsp;</p>'
    : `<p class="card-line card-line--${l.kind}">${esc(l.ja)}</p>`)).join('');

  html += `<div class="card-en${showEnglish ? '' : ' card-en--hidden'}"><div class="card-en-divider"></div>`;
  for (const l of main.filter((x) => x.kind === 'blank' || !!x.en)) {
    html += l.kind === 'blank'
      ? '<p class="card-en-line card-en-line--blank">&nbsp;</p>'
      : `<p class="card-en-line card-en-line--${l.kind}">${esc(l.en ?? '')}</p>`;
  }
  html += '</div>';
  for (const l of tail) html += `<p class="card-line card-line--${l.kind}">${esc(l.ja)}</p>`;
  return html;
}
```

- [ ] **Step 4: Run and see it pass**

Run: `npx vitest run tests/card-data-lib.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Write `card.css`** (screen values from the `CardBuilder`/`CardLong` artboards; print rules replace the ones in `styles.css`)

```css
/* src/styles/card.css — the card. Styles #card (filled by app.js), ExampleCard,
   the PNG export (html2canvas captures #card) and print. Class names come from
   app.js renderCard() / src/lib/cardData.ts renderCardHtml(). */
.card {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 24px;
  margin: 0;
  background: var(--tm-paper-warm);
  color: var(--tm-ink-card);
  padding: 68px 36px 26px;
  border-radius: var(--tm-radius);
  box-shadow: var(--tm-shadow-card);
  font-family: var(--tm-font-display);
  text-align: left;
}
.card::before {
  content: "お店の方へ　To the staff";
  position: absolute; top: 30px; left: 36px;
  font-size: 12px; letter-spacing: .2em; color: var(--tm-ink-faint);
}
.card::after {
  content: "食";
  position: absolute; top: 22px; right: 28px;
  width: 44px; height: 44px; box-sizing: border-box;
  border: 2.5px solid var(--tm-shu); color: var(--tm-shu);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 800; transform: rotate(8deg);
}
.card > * { grid-column: 1 / -1; margin: 0; }
.card-line { font-size: 18px; line-height: 1.7; }
.card-line--greeting, .card-line--statement { font-size: 21px; font-weight: 600; line-height: 1.6; }
.card-line--list-header { margin-top: 14px; margin-bottom: 4px; font-size: 16px; color: var(--tm-ink-faint); }
.card-line--item { grid-column: auto; font-size: 20px; font-weight: 700; padding: 6px 0; border-bottom: 1px solid var(--tm-rule); line-height: 1.5; }
.card-line--blank { height: 12px; font-size: 0; line-height: 0; }
.card-line--warning { background: var(--tm-shu-soft); color: var(--tm-warning-ink); font-size: 16px; font-weight: 600; padding: 12px 14px; border-radius: var(--tm-radius); line-height: 1.65; }
.card-line--note { background: var(--tm-paper-sunk); color: #3a352f; font-size: 15px; padding: 10px 14px; border-radius: var(--tm-radius); line-height: 1.65; }
.card-line--closing { font-size: 17px; }
.card-en { display: grid; grid-template-columns: 1fr 1fr; column-gap: 24px; margin-top: 22px; font-family: var(--tm-font-body); }
.card-en--hidden { display: none; }
.card-en-divider { grid-column: 1 / -1; border-top: 1px solid var(--tm-rule); margin-bottom: 12px; }
.card-en-line { grid-column: 1 / -1; margin: 0; font-size: 14px; line-height: 1.6; color: var(--tm-ink-muted); }
.card-en-line--greeting, .card-en-line--statement { font-weight: 700; color: var(--tm-ink); }
.card-en-line--item { grid-column: auto; }
.card-en-line--blank { height: 6px; font-size: 0; line-height: 0; }
.card-line--disclaimer { margin-top: 20px; padding-top: 12px; border-top: 1px solid var(--tm-rule); font-family: var(--tm-font-body); font-size: 12px; line-height: 1.55; color: var(--tm-ink-faint); }
.card-line--site-url { font-family: var(--tm-font-body); font-size: 12px; font-weight: 700; color: var(--tm-shu-text); letter-spacing: .04em; }

@media (max-width: 480px) {
  .card { grid-template-columns: 1fr; padding: 60px 20px 20px; }
  .card::before { top: 24px; left: 20px; font-size: 11px; }
  .card::after { top: 16px; right: 16px; width: 38px; height: 38px; font-size: 19px; border-width: 2px; }
  .card-line--item { grid-column: 1 / -1; font-size: 21px; }
  .card-line--greeting, .card-line--statement { font-size: 19px; }
  .card-en { grid-template-columns: 1fr; }
  .card-en-line--item { grid-column: 1 / -1; }
}

@media print {
  .card {
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    max-width: 640px; margin: 0 auto; box-shadow: none;
    border: 1px solid var(--tm-rule);
    break-inside: avoid; page-break-inside: avoid;
  }
  .card-line--warning, .card-line--note { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
```

- [ ] **Step 6: Write `ExampleCard`**

```astro
---
// src/components/ExampleCard.astro — a static card rendered from data.js at build time.
import '../styles/card.css';
import { loadCardData, renderCardHtml, type CardState } from '../lib/cardData';
interface Props { state: Partial<CardState>; label?: string }
const { state, label = 'Example card' } = Astro.props;
const full: CardState = { allergens: [], patterns: [], severity: 'allergy', name: '', customText: '', showEnglish: true, ...state };
const html = renderCardHtml(loadCardData().buildCard(full), full.showEnglish);
---
<div class="card" lang="ja" role="img" aria-label={label} set:html={html} />
```

- [ ] **Step 7: Commit**

```bash
git add src/styles/card.css src/lib/cardData.ts src/components/ExampleCard.astro tests/card-data-lib.test.ts
git commit -m "feat(card): card design stylesheet, build-time card data and ExampleCard"
```

---

### Task 9: `Picker`

**Files:**
- Create: `src/lib/picker.ts`, `src/components/Picker.astro`
- Test: `tests/picker.test.ts`

**Interfaces:**
- Consumes: `loadCardData` (Task 8), `DIETS` (Task 6).
- Produces: `buildPickerHref({ pattern, allergens, severe }: { pattern: string | null; allergens: string[]; severe: boolean }): string` — `/` plus a hash in `app.js` `encodeHash` order and format: `a=<keys comma-joined>`, `p=<pattern>`, `s=severe`, joined with `&`; no hash when all are empty.
- Produces: `Picker` props `{ diet: DietKey; allergenKeys: string[]; showSeverity?: boolean; ctaLabel: string; event: string }`. Server-rendered `href` = `buildPickerHref({ pattern: DIETS[diet].pattern, allergens: [], severe: false })`; a client script rewrites it from pressed chips and the severity switch.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/picker.test.ts
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { buildPickerHref } from '../src/lib/picker';
import Picker from '../src/components/Picker.astro';

describe('buildPickerHref', () => {
  it('matches app.js encodeHash order and separators', () => {
    expect(buildPickerHref({ pattern: null, allergens: ['peanut', 'egg'], severe: true })).toBe('/#a=peanut,egg&s=severe');
    expect(buildPickerHref({ pattern: 'vegan', allergens: ['soy'], severe: false })).toBe('/#a=soy&p=vegan');
  });

  it('returns / without a hash when nothing is chosen (works without JS)', () => {
    expect(buildPickerHref({ pattern: null, allergens: [], severe: false })).toBe('/');
    expect(buildPickerHref({ pattern: 'halal', allergens: [], severe: false })).toBe('/#p=halal');
  });
});

describe('Picker', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Picker, {
    props: { diet: 'allergies', allergenKeys: ['egg', 'cashew', 'sesame'], showSeverity: true,
      ctaLabel: 'Generate my Japanese allergy card →', event: 'cta-allergies-hero' },
  });

  it('renders a real link to / before any script runs', () => {
    expect(html).toMatch(/<a[^>]*class="tm-btn picker__go"[^>]*href="\/"/);
    expect(html).toContain('Generate my Japanese allergy card →');
    expect(html).toContain('data-gc-event="cta-allergies-hero"');
  });

  it('renders toggle chips with English labels and Japanese hints from data.js', () => {
    expect(html).toContain('data-key="egg"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('Cashew');
    expect(html).toContain('カシューナッツ');
  });

  it('marks mandatory allergens', () => {
    expect(html).toMatch(/data-key="cashew"[^>]*data-mandatory|data-mandatory[^>]*data-key="cashew"/);
    expect(html).not.toMatch(/data-key="sesame"[^>]*data-mandatory/);
  });

  it('includes the severity switch when asked', () => {
    expect(html).toContain('role="switch"');
  });
});
```

- [ ] **Step 2: Run and see it fail**

Run: `npx vitest run tests/picker.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/picker.ts
// Same order and separators as app.js encodeHash(), so links decode with parseHash().
export function buildPickerHref({ pattern, allergens, severe }: { pattern: string | null; allergens: string[]; severe: boolean }): string {
  const parts: string[] = [];
  if (allergens.length) parts.push(`a=${allergens.join(',')}`);
  if (pattern) parts.push(`p=${pattern}`);
  if (severe) parts.push('s=severe');
  return parts.length ? `/#${parts.join('&')}` : '/';
}
```

```astro
---
// src/components/Picker.astro — choose a few options here, finish on the full builder at /.
import { loadCardData } from '../lib/cardData';
import { buildPickerHref } from '../lib/picker';
import { DIETS, type DietKey } from '../data/diets';
interface Props { diet: DietKey; allergenKeys: string[]; showSeverity?: boolean; ctaLabel: string; event: string }
const { diet, allergenKeys, showSeverity = false, ctaLabel, event } = Astro.props;
const byKey = new Map(loadCardData().allergens.map((a) => [a.key, a]));
const chips = allergenKeys.map((k) => {
  const a = byKey.get(k);
  if (!a) throw new Error(`Picker: unknown allergen key "${k}"`);
  return a;
});
const pattern = DIETS[diet].pattern;
const href = buildPickerHref({ pattern, allergens: [], severe: false });
---
<div class="picker" data-pattern={pattern ?? ''}>
  <div class="picker__group" role="group" aria-label="Allergens">
    {chips.map((a) => (
      <button type="button" class="picker__chip" data-key={a.key} data-mandatory={a.mandatory ? '' : undefined} aria-pressed="false">
        {a.english} <small lang="ja">{a.japanese.replace(/[(（].*$/, '')}</small>
      </button>
    ))}
  </div>
  {showSeverity && (
    <div class="picker__severity">
      <span class="picker__sev-text" id="picker-sev-label"><strong>Severe allergy</strong> Adds a warning that trace amounts are dangerous</span>
      <button type="button" class="picker__switch" role="switch" aria-checked="false" aria-labelledby="picker-sev-label"></button>
    </div>
  )}
  <a class="tm-btn picker__go" href={href} data-gc-event={event}>{ctaLabel}</a>
  <p class="picker__more">More allergens, diets, your name and a custom line on the <a href="/">full card builder</a>.</p>
</div>

<script>
  import { buildPickerHref } from '../lib/picker';
  for (const root of document.querySelectorAll<HTMLElement>('.picker')) {
    const go = root.querySelector<HTMLAnchorElement>('.picker__go');
    const sw = root.querySelector<HTMLButtonElement>('.picker__switch');
    const pattern = root.dataset.pattern || null;
    const update = () => {
      const allergens = [...root.querySelectorAll<HTMLButtonElement>('.picker__chip[aria-pressed="true"]')].map((b) => b.dataset.key!);
      if (go) go.href = buildPickerHref({ pattern, allergens, severe: sw?.getAttribute('aria-checked') === 'true' });
    };
    for (const chip of root.querySelectorAll<HTMLButtonElement>('.picker__chip')) {
      chip.addEventListener('click', () => { chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')); update(); });
    }
    sw?.addEventListener('click', () => { sw.setAttribute('aria-checked', String(sw.getAttribute('aria-checked') !== 'true')); update(); });
  }
</script>

<style>
  .picker { display: flex; flex-direction: column; gap: 20px; }
  .picker__group { display: flex; flex-wrap: wrap; gap: 8px; }
  .picker__chip { font: inherit; min-height: 44px; padding: 0 14px; border-radius: var(--tm-radius-pill); border: 1.5px solid var(--tm-rule-strong); background: #fff; color: var(--tm-ink); font-size: 15px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
  .picker__chip[data-mandatory] { border-color: var(--tm-ink); }
  .picker__chip small { font-family: var(--tm-font-display); font-size: 13px; opacity: .8; }
  .picker__chip[aria-pressed="true"] { background: var(--tm-ink); border-color: var(--tm-ink); color: #fff; }
  .picker__severity { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-top: 1px solid var(--tm-rule); padding-top: 18px; }
  .picker__sev-text { display: flex; flex-direction: column; font-size: 14px; color: var(--tm-ink-muted); }
  .picker__sev-text strong { font-size: 16px; color: var(--tm-ink); }
  .picker__switch { width: 56px; height: 32px; flex: none; border-radius: 16px; border: 0; padding: 0; background: var(--tm-rule-strong); position: relative; cursor: pointer; }
  .picker__switch::after { content: ""; position: absolute; top: 4px; left: 4px; width: 24px; height: 24px; border-radius: 12px; background: #fff; transition: left .15s; }
  .picker__switch[aria-checked="true"] { background: var(--tm-shu); }
  .picker__switch[aria-checked="true"]::after { left: 28px; }
  .picker__go { align-self: flex-start; }
  .picker__more { margin: 0; font-size: 14px; color: var(--tm-ink-muted); }
</style>
```

(The `japanese.replace(/[(（].*$/, '')` keeps the short form, e.g. `落花生(ピーナッツ)` → `落花生`, `乳製品(牛乳、チーズ、バター)` → `乳製品`.)

- [ ] **Step 4: Run and see it pass**

Run: `npx vitest run tests/picker.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/picker.ts src/components/Picker.astro tests/picker.test.ts
git commit -m "feat(picker): hub picker that hands its selections to the full builder"
```

---

### Task 10: Redesigned `/` (builder)

**Files:**
- Create: `src/styles/builder.css`, `src/components/Wash.astro`, `src/components/Illustration.astro`, `src/components/FeaturedStrip.astro`, `src/assets/wash.png`, `src/assets/illustrations/{counter,table,konbini,noren}.jpg` + `.md` sidecars
- Modify: `src/pages/index.astro` (rewrite), `public/app.js` (await fonts before PNG capture), `content-allowlist.json`

**Interfaces:**
- Consumes: `BaseLayout`, `card.css`, `GuideList`, `guidesForDiet`, `BrushGlyph`.
- Produces: `Wash` (slot; props `{ soft?: boolean }`), `Illustration` (props `{ src: ImageMetadata; alt: string; caption?: string; widths?: number[]; sizes?: string; loading?: 'eager' | 'lazy'; class?: string }`), `FeaturedStrip` (props `{ eventSuffix: string }`; events `featured-tokyochapter-<suffix>` and `featured-japanforkids-<suffix>`; `/allergies/` passes `strip` to keep today's names, `/` passes `home`).

- [ ] **Step 1: Copy the images**

```bash
S=/private/tmp/claude-501/-Users-iwakuralane-dev-tabemasen/1599d119-79b4-4f69-89d0-6e341b91af91/scratchpad/tab-v5/img
mkdir -p src/assets/illustrations src/assets/photos
cp $S/counter.jpg $S/table.jpg $S/konbini.jpg $S/noren.jpg src/assets/illustrations/
cp $S/stroke-wash.png src/assets/wash.png
cp public/assets/ramen-shop-no-allergen-signage.png public/assets/onigiri-label-annotated.png src/assets/photos/
```
If the scratchpad copies are gone, download them from the design canvas's asset store (`Artifact` read with `path` = asset id: counter `03a34a0e6e96e405ab0a29f60077d43e`, konbini `3be6059c61f0b7ab24ce3108776027ae`, noren `afcbbf3d744001e5cb7dc7490ed98858`, table `44daff9000cfd1f04d4039d5eb19d3c9`, wash `439333cfe9227d107abaf8f6646108da`).

For each illustration create a sidecar, e.g. `src/assets/illustrations/counter.md`:
```markdown
Generated with Figma AI (gemini-3.1-flash-image), 2026-10-11, then levelled to pure-white paper.
Prompt: Loose hand-drawn black ink line illustration with soft watercolour washes, in the style of an urban sketchbook. Palette: muted indigo, soft vermilion red, warm ochre, grey, lots of white paper. Scene: inside a tiny Japanese ramen counter restaurant seen from the side. A foreign traveller with a backpack sits at the wooden counter and holds up a phone screen toward the chef behind the counter; the chef in a headband leans forward reading it attentively. Steam rises from a pot. On the wall behind: a row of blank wooden menu tags and a blank paper menu sheet, a short blank noren curtain over the kitchen door. The illustration fades out into white paper at the edges with a few ink and watercolour splatters. No text anywhere.
```
`table.md`, `konbini.md`, `noren.md`: same header line; prompts as used on 2026-10-11 (set meal on a wooden table with notebook and passport; hand holding an onigiri in a konbini; restaurant entrance with indigo noren, lantern and chalkboard). `wash.png` has no sidecar requirement but add one line: `Watercolour brush stroke, Figma AI 2026-10-11, converted to transparent PNG.`

- [ ] **Step 2: Write `Wash`, `Illustration`, `FeaturedStrip`**

```astro
---
// src/components/Wash.astro — watercolour highlight behind inline text.
import wash from '../assets/wash.png';
interface Props { soft?: boolean }
const { soft = false } = Astro.props;
---
<span class:list={['tm-wash', { 'tm-wash--soft': soft }]} style={`--wash:url(${wash.src})`}><slot /></span>
<style>
  .tm-wash { background: var(--wash) no-repeat 0 72% / 100% 58%; padding: 0 .14em; margin: 0 -.06em; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .tm-wash--soft { background-size: 100% 46%; background-position: 0 80%; }
</style>
```

```astro
---
// src/components/Illustration.astro — plain image + optional caption below. No overlays (spec §8.3).
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';
interface Props { src: ImageMetadata; alt: string; caption?: string; widths?: number[]; sizes?: string; loading?: 'eager' | 'lazy'; class?: string }
const { src, alt, caption, widths = [480, 800, 1200], sizes = '(max-width: 760px) 100vw, 50vw', loading = 'lazy', class: cls } = Astro.props;
---
<figure class:list={['tm-ill', cls]}>
  <Image src={src} alt={alt} widths={widths} sizes={sizes} loading={loading} format="webp" />
  {caption && <figcaption class="tm-ill__cap">{caption}</figcaption>}
</figure>
<style>
  .tm-ill { margin: 0; }
  .tm-ill :global(img) { display: block; width: 100%; height: auto; }
  .tm-ill__cap { margin-top: 10px; font-size: 14px; color: var(--tm-ink-faint); line-height: 1.5; }
</style>
```

```astro
---
// src/components/FeaturedStrip.astro — "Recommended by", same links as /allergies/ today.
interface Props { eventSuffix: string }
const { eventSuffix } = Astro.props;
---
<section class="tm-feat" aria-labelledby={`tm-feat-${eventSuffix}`}>
  <div class="tm-container tm-feat__inner">
    <h2 class="tm-kicker" id={`tm-feat-${eventSuffix}`}>Recommended by</h2>
    <ul class="tm-feat__list">
      <li><a href="https://www.thetokyochapter.com/japan-with-severe-food-allergies/" target="_blank" rel="noopener" data-gc-event={`featured-tokyochapter-${eventSuffix}`}><img src="/assets/featured/the-tokyo-chapter.webp" alt="The Tokyo Chapter: Japan with severe food allergies" width="80" height="40" loading="lazy"></a></li>
      <li><a href="https://japanforkids.jp/food-allergies-japan-kids/" target="_blank" rel="noopener" data-gc-event={`featured-japanforkids-${eventSuffix}`}><img src="/assets/featured/japan-for-kids.webp" alt="Japan for Kids: food allergies in Japan with kids" width="178" height="40" loading="lazy"></a></li>
    </ul>
    <a class="tm-feat__more" href="/featured/">See where tabemasen is featured →</a>
  </div>
</section>
<style>
  .tm-feat { border-top: 1px solid var(--tm-rule); }
  .tm-feat__inner { padding-top: 40px; padding-bottom: 40px; display: flex; flex-wrap: wrap; align-items: center; gap: 16px 40px; }
  .tm-feat__list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 16px 40px; }
  .tm-feat__list a { display: inline-flex; align-items: center; min-height: 44px; }
  .tm-feat__list img { height: 40px; width: auto; display: block; }
  .tm-feat__more { margin-left: auto; font-weight: 700; color: var(--tm-ink); }
</style>
```
Links, image paths, alt text and sizes are today's `/allergies/` feat-strip values.

- [ ] **Step 3: Write `builder.css`** (from the `CardBuilder` / `CardBuilderMobile` artboards, mapped to the classes the builder markup and `app.js` use)

```css
/* src/styles/builder.css — builder chrome on /. app.js owns: .chip, .chip--mandatory,
   .chip--selected, .pattern-btn, .pattern-btn--selected, .panel-toggle[aria-expanded],
   .panel-body.hidden, .btn--success, .card-en--hidden. */
.hidden { display: none !important; }
.site-seo-heading { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.tm-intro { display: grid; grid-template-columns: minmax(0, 6fr) minmax(0, 5fr); gap: 24px 48px; align-items: center; padding-top: 24px; padding-bottom: 32px; }
.tm-intro__copy { display: flex; flex-direction: column; gap: 14px; }
.tm-intro__display { margin: 0; font-family: var(--tm-font-display); font-size: clamp(2.3rem, 5vw, 3.75rem); line-height: 1.06; font-weight: 600; letter-spacing: -0.02em; }
.app-title { margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3; }
.app-lede { margin: 0; max-width: 640px; color: var(--tm-ink-muted); }
.app-safety-note { margin: 0; font-size: 14px; color: var(--tm-ink-faint); }

.app-grid { display: grid; grid-template-columns: minmax(0, 6fr) minmax(0, 6fr); gap: 64px; align-items: start; }
.selection-panel { counter-reset: step; }
.panel-section { border-top: 1px solid var(--tm-rule); padding: 20px 0; counter-increment: step; }
#panel-optional { border-bottom: 1px solid var(--tm-rule); }
.panel-heading { margin: 0; }
.panel-toggle { font: inherit; width: 100%; min-height: 44px; display: flex; align-items: baseline; gap: 14px; background: none; border: 0; padding: 0; color: var(--tm-ink); text-align: left; cursor: pointer; }
.panel-toggle::before { content: counter(step); font-family: var(--tm-font-display); font-size: 15px; font-weight: 700; color: var(--tm-shu); width: 22px; flex: none; }
.panel-title { font-family: var(--tm-font-display); font-size: 24px; font-weight: 600; }
.panel-chevron { margin-left: auto; align-self: center; width: 18px; height: 18px; color: var(--tm-ink-muted); transition: transform .15s; }
.panel-toggle[aria-expanded="false"] .panel-chevron { transform: rotate(-90deg); }
.panel-body { padding: 14px 0 0 36px; display: flex; flex-direction: column; gap: 12px; }
.field-hint { margin: 0; font-size: 14px; color: var(--tm-ink-muted); line-height: 1.55; }
.chip-legend { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 13px; color: var(--tm-ink-muted); }
.chip-legend i { display: inline-block; width: 18px; height: 12px; flex: none; border-radius: var(--tm-radius-pill); border: 1.5px solid var(--tm-ink); }
.chip-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { font: inherit; min-height: 44px; padding: 0 16px; border-radius: var(--tm-radius-pill); border: 1.5px solid var(--tm-rule-strong); background: #fff; color: var(--tm-ink); font-size: 15px; font-weight: 500; cursor: pointer; }
.chip--mandatory { border-color: var(--tm-ink); }
.chip--selected, .chip[aria-pressed="true"] { background: var(--tm-ink); border-color: var(--tm-ink); color: #fff; }
.pattern-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.pattern-btn { font: inherit; min-height: 52px; border-radius: var(--tm-radius); border: 1.5px solid var(--tm-rule-strong); background: #fff; color: var(--tm-ink); font-size: 16px; font-weight: 500; cursor: pointer; }
.pattern-btn--selected, .pattern-btn[aria-pressed="true"] { background: var(--tm-ink); border-color: var(--tm-ink); color: #fff; }

/* checkbox → switch (severity, Show English) */
.severity-options { display: flex; }
.severity-option, .english-toggle-label { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; cursor: pointer; font-weight: 700; }
.english-toggle-label { font-weight: 500; font-size: 15px; }
.severity-option input, .english-toggle-label input { appearance: none; -webkit-appearance: none; margin: 0; width: 52px; height: 30px; flex: none; border-radius: 15px; background: var(--tm-rule-strong); position: relative; cursor: pointer; }
.severity-option input::after, .english-toggle-label input::after { content: ""; position: absolute; top: 4px; left: 4px; width: 22px; height: 22px; border-radius: 11px; background: #fff; transition: left .15s; }
.severity-option input:checked, .english-toggle-label input:checked { background: var(--tm-shu); }
.severity-option input:checked::after, .english-toggle-label input:checked::after { left: 26px; }

.optional-fields { display: flex; flex-direction: column; gap: 14px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 14px; font-weight: 700; }
.text-input { font: inherit; font-size: 16px; min-height: 48px; padding: 10px 14px; border: 1.5px solid var(--tm-rule-strong); border-radius: var(--tm-radius); background: #fff; color: var(--tm-ink); }
.textarea-input { min-height: 72px; resize: vertical; }
.panel-tools { padding-top: 8px; }
.clear-btn { font: inherit; min-height: 44px; background: none; border: 0; padding: 0; color: var(--tm-ink-muted); text-decoration: underline; cursor: pointer; font-size: 14px; }

.card-preview-section { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 14px; padding-top: 20px; }
.card-preview-header { display: flex; justify-content: space-between; align-items: center; }
.preview-label { margin: 0; font-family: var(--tm-font-display); font-size: 24px; font-weight: 600; }
.card:focus-visible { outline: 2px solid var(--tm-ai); outline-offset: 4px; }

.action-bar { position: sticky; bottom: 20px; z-index: 20; margin: 40px auto 0; width: max-content; display: flex; gap: 8px; padding: 8px; background: var(--tm-ink); border-radius: var(--tm-radius-pill); box-shadow: 0 10px 30px rgba(30, 27, 24, .25); }
.btn { font: inherit; min-height: 48px; padding: 0 20px; border-radius: var(--tm-radius-pill); border: 0; display: inline-flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; cursor: pointer; background: transparent; color: #f6f1e7; }
.btn--primary { background: var(--tm-shu); color: #fff; }
.btn--success { background: #3f6b42; color: #fff; }
.btn-icon { display: inline-flex; }
.btn-icon svg { width: 18px; height: 18px; }

@media (max-width: 900px) {
  .tm-intro { grid-template-columns: 1fr; }
  .app-grid { grid-template-columns: 1fr; gap: 24px; }
  .card-preview-section { position: static; }
}
@media (max-width: 760px) {
  .tm-intro__ill { display: none; }
  .panel-body { padding-left: 0; }
  .panel-title { font-size: 21px; }
  .pattern-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .action-bar { position: fixed; left: 0; right: 0; bottom: 0; width: auto; margin: 0; border-radius: 0; background: #fff; border-top: 1px solid var(--tm-rule); box-shadow: none; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); }
  .btn { flex: 1; justify-content: center; border-radius: var(--tm-radius); border: 1.5px solid var(--tm-ink); color: var(--tm-ink); background: #fff; font-size: 14px; padding: 0 6px; }
  .btn--primary { flex: 1.6; background: var(--tm-shu); border-color: var(--tm-shu); color: #fff; }
  .btn--success { background: #3f6b42; border-color: #3f6b42; color: #fff; }
  .btn-icon { display: none; }
  body.tm-home { padding-bottom: 84px; }
}

@media print {
  @page { margin: 1.5cm; }
  .tm-header, .tm-footer, .tm-intro, .selection-panel, .card-preview-header, .action-bar, .tm-home-more { display: none !important; }
  html, body { background: #fff !important; margin: 0; padding: 0; }
  .main-content, .app-grid { display: block; max-width: 100%; margin: 0; padding: 0; }
  .card-preview-section { position: static; padding: 0; }
}
```

- [ ] **Step 4: Rewrite `src/pages/index.astro`**

Head data (title, description, canonical, JSON-LD) must be identical to today's page. Copy the JSON-LD **text between** `<script is:inline type="application/ld+json">` and `</script>` from the current `src/pages/index.astro` (lines 23–70 before this task) into `src/pages/_home-jsonld.json` unchanged, and import it as a raw string.

```astro
---
// src/pages/index.astro — the card builder. app.js + data.js drive everything inside
// .app-grid and .action-bar; keep every id/class listed in the plan's Global Constraints.
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Wash from '../components/Wash.astro';
import Illustration from '../components/Illustration.astro';
import BrushGlyph from '../components/BrushGlyph.astro';
import GuideList from '../components/GuideList.astro';
import FeaturedStrip from '../components/FeaturedStrip.astro';
import { guidesForDiet } from '../lib/guides';
import counter from '../assets/illustrations/counter.jpg';
import table from '../assets/illustrations/table.jpg';
import konbini from '../assets/illustrations/konbini.jpg';
import homeJsonLd from './_home-jsonld.json?raw';
import '../styles/card.css';
import '../styles/builder.css';

const guides = await getCollection('guides');
const allergyGuides = guidesForDiet(guides, 'allergies');
const chevron = '<svg class="panel-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';
---
<BaseLayout
  title="Japan Allergy Card — Free Japanese Restaurant Translation Card | tabemasen"
  description="Free generator for Japanese restaurant cards. Show your food allergies, vegetarian, vegan, halal, or gluten-free needs to staff in polite Japanese. No signup. Mobile-friendly."
  canonical="https://tabemasen.io/"
  page="home"
  jsonLd={[homeJsonLd.trim()]}
  bodyClass="tm-home"
>
  <section class="app-intro tm-container tm-intro">
    <div class="tm-intro__copy">
      <p class="tm-intro__display" aria-hidden="true">Tell the kitchen what you <Wash>can't eat.</Wash></p>
      <h1 class="app-title">Generate your Japanese restaurant card</h1>
      <p class="app-lede">Pick your allergies and diet below — your card builds live as you choose. Show it on your phone or download a PNG to keep offline.</p>
      <p class="app-safety-note">Best used as a safety net — when possible, plan around dedicated GF/allergy-friendly restaurants.</p>
      <h2 class="site-seo-heading">Free Japanese restaurant cards for food allergies, vegetarian, vegan, halal &amp; gluten-free travelers</h2>
    </div>
    <Illustration class="tm-intro__ill" src={counter} loading="eager" sizes="(max-width: 900px) 100vw, 42vw"
      alt="Watercolour sketch: a traveller at a small ramen counter holds up a phone, and the chef leans in to read it" />
  </section>

  <main class="main-content tm-container" id="builder">
    <div class="app-grid">
      <section class="selection-panel" aria-label="Card options">
        <div class="panel-section" id="panel-allergens">
          <h2 class="panel-heading"><button class="panel-toggle" aria-expanded="true" aria-controls="allergens-content" type="button"><span class="panel-title">Allergens</span><Fragment set:html={chevron} /></button></h2>
          <div class="panel-body" id="allergens-content">
            <p class="chip-legend"><i aria-hidden="true"></i>Outlined: Japan's mandatory allergens, always on packaged-food labels</p>
            <div class="chip-grid" role="group" aria-label="Select allergens"></div>
          </div>
        </div>
        <div class="panel-section" id="panel-diet">
          <h2 class="panel-heading"><button class="panel-toggle" aria-expanded="true" aria-controls="diet-content" type="button"><span class="panel-title">Diet</span><Fragment set:html={chevron} /></button></h2>
          <div class="panel-body" id="diet-content">
            <p class="field-hint">Select multiple at once — e.g. gluten-free + pescatarian.</p>
            <div class="pattern-list" role="group" aria-label="Select dietary pattern"></div>
          </div>
        </div>
        <div class="panel-section" id="panel-severity">
          <h2 class="panel-heading"><button class="panel-toggle" aria-expanded="true" aria-controls="severity-content" type="button"><span class="panel-title">Severity</span><Fragment set:html={chevron} /></button></h2>
          <div class="panel-body" id="severity-content">
            <p class="field-hint">When checked, the card warns that even trace amounts can be life-threatening and asks staff to use separate utensils.</p>
            <div class="severity-options" role="group" aria-label="Select severity">
              <label class="severity-option"><input type="checkbox" id="severity-toggle" name="severity"><span class="severity-label">Severe allergy</span></label>
            </div>
          </div>
        </div>
        <div class="panel-section" id="panel-optional">
          <h2 class="panel-heading"><button class="panel-toggle" aria-expanded="false" aria-controls="optional-content" type="button"><span class="panel-title">Name &amp; custom item</span><Fragment set:html={chevron} /></button></h2>
          <div class="panel-body hidden" id="optional-content">
            <div class="optional-fields">
              <div class="field-group">
                <label for="name-input" class="field-label">Your first name (optional)</label>
                <input id="name-input" type="text" class="text-input" placeholder="e.g. Sarah" autocomplete="given-name" maxlength="40">
              </div>
              <div class="field-group">
                <label for="custom-input" class="field-label">Custom item to add to card</label>
                <textarea id="custom-input" class="text-input textarea-input" placeholder="Paste any text (in any language) as-is on the card" rows="2" maxlength="200"></textarea>
              </div>
            </div>
          </div>
        </div>
        <div class="panel-tools"><button type="button" class="clear-btn" id="clear-btn">Clear all</button></div>
      </section>

      <section class="card-preview-section" aria-label="Card preview" aria-live="polite">
        <div class="card-preview-header">
          <p class="preview-label">Your card</p>
          <label class="english-toggle-label"><input type="checkbox" id="english-toggle" checked><span>Show English</span></label>
        </div>
        <div class="card" id="card" tabindex="0" aria-label="Japanese restaurant card preview" lang="ja"></div>
      </section>
    </div>
  </main>

  <div class="action-bar" role="toolbar" aria-label="Card actions">
    <button type="button" class="btn btn--ghost btn--action" id="copy-btn">
      <span class="btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"></path><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"></path></svg></span>
      <span class="btn-text">Copy link</span>
    </button>
    <button type="button" class="btn btn--primary btn--action" id="download-btn">
      <span class="btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"></path><polyline points="7 11 12 16 17 11"></polyline><path d="M5 20h14"></path></svg></span>
      <span class="btn-text">Download PNG</span>
    </button>
    <button type="button" class="btn btn--ghost btn--action" id="print-btn">
      <span class="btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V4h10v5"></path><rect x="4" y="9" width="16" height="7" rx="1"></rect><path d="M7 14h10v6H7z"></path></svg></span>
      <span class="btn-text">Print</span>
    </button>
  </div>

  <div class="tm-home-more">
    <section class="tm-container home-why" aria-labelledby="home-why-h">
      <div class="home-why__copy">
        <p class="tm-kicker">Why a card, not a phrasebook</p>
        <h2 class="tm-display home-why__h" id="home-why-h">The ingredients nobody thinks to mention.</h2>
        <div class="home-why__item"><BrushGlyph text="だし" size={52} /><p>Fish stock under “vegetable” dishes, miso soup and most broths. Vegan and vegetarian cards rule it out by name.</p></div>
        <div class="home-why__item"><BrushGlyph text="醤油" size={52} /><p>Standard soy sauce is brewed with wheat, and tamari can contain wheat too. The gluten-free card asks for soy sauce made without wheat, or none at all.</p></div>
        <div class="home-why__item"><BrushGlyph text="みりん" size={52} /><p>Sweet rice wine in glazes and teriyaki. The halal card lists mirin and cooking sake.</p></div>
      </div>
      <Illustration src={table} sizes="(max-width: 900px) 100vw, 50vw"
        alt="Watercolour sketch of a set meal on a wooden table: miso soup, grilled fish, rice, pickles, soy sauce, green tea, an open travel notebook and a passport"
        caption="Miso soup is made with dashi, the soy sauce contains wheat, and the fish is often glazed with mirin." />
    </section>

    <section class="home-guides" aria-labelledby="home-guides-h">
      <div class="tm-container home-guides__inner">
        <div class="home-guides__head">
          <BrushGlyph text="旅" size={110} />
          <div>
            <p class="tm-kicker">Guides</p>
            <h2 class="tm-display home-guides__h" id="home-guides-h">Read before you fly.</h2>
          </div>
        </div>
        <div class="home-guides__grid">
          <Illustration src={konbini} sizes="(max-width: 900px) 100vw, 50vw"
            alt="Watercolour sketch: a hand turns over an onigiri in a convenience store to read the label on the back"
            caption="Japan's allergen labels list what's inside packaged food. Restaurants have no such rule." />
          <div class="home-guides__list">
            <h3 class="home-guides__sub">Allergies</h3>
            <GuideList guides={allergyGuides} />
            <a class="tm-link" href="/guides/">All guides</a>
          </div>
        </div>
      </div>
    </section>

    <FeaturedStrip eventSuffix="home" />
  </div>

  <script is:inline src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" defer></script>
  <script is:inline src="/data.js"></script>
  <script is:inline src="/app.js"></script>
</BaseLayout>

<style>
  .home-why { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 32px 56px; align-items: center; padding-top: 96px; padding-bottom: 80px; }
  .home-why__copy { display: flex; flex-direction: column; gap: 24px; }
  .home-why__h { margin: 0; font-size: clamp(2rem, 3.4vw, 2.75rem); line-height: 1.1; }
  .home-why__item { display: grid; grid-template-columns: 120px 1fr; gap: 16px; align-items: start; }
  .home-why__item p { margin: 0; color: var(--tm-ink-muted); }
  .home-guides { background: var(--tm-paper-warm); border-top: 1px solid var(--tm-rule); }
  .home-guides__inner { padding-top: 88px; padding-bottom: 88px; display: flex; flex-direction: column; gap: 40px; }
  .home-guides__head { display: flex; align-items: flex-end; gap: 18px; }
  .home-guides__h { margin: 4px 0 0; font-size: clamp(2rem, 3.4vw, 2.9rem); line-height: 1.08; }
  .home-guides__grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 32px 56px; align-items: start; }
  .home-guides__list { display: flex; flex-direction: column; gap: 14px; }
  .home-guides__sub { margin: 0; font-size: 20px; }
  @media (max-width: 900px) {
    .home-why, .home-guides__grid { grid-template-columns: 1fr; }
    .home-why__item { grid-template-columns: 92px 1fr; }
  }
</style>
```
Notes on what changed versus today's builder markup, all intentional and covered by `content-allowlist.json` (Step 6): the emoji in the panel chevrons (▼), the severity label (🚨) and the action buttons (🔗 ⬇ 🖨) are gone; "Copy Link" becomes "Copy link"; step numbers come from a CSS counter (not text). `data.js` and `app.js` are now loaded with absolute paths (`/data.js`, `/app.js`); both resolve identically on `/`.

- [ ] **Step 5: Make the PNG wait for web fonts**

In `public/app.js`, inside `onDownloadClick`, find the call that starts the capture (the `doCapture()` invocation(s); `grep -n "doCapture()" public/app.js`). Wrap each call so it runs after fonts load:
```js
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(doCapture);
```
replacing each bare `doCapture();` call (not the function definition). Keep everything else in `app.js` unchanged.

- [ ] **Step 6: Allowlist the intended text changes, build, check**

`content-allowlist.json`:
```json
[
  { "url": "/", "text": "Allergens ▼", "reason": "Chevron emoji replaced by an SVG icon; label unchanged" },
  { "url": "/", "text": "Diet ▼", "reason": "Chevron emoji replaced by an SVG icon; label unchanged" },
  { "url": "/", "text": "Severity ▼", "reason": "Chevron emoji replaced by an SVG icon; label unchanged" },
  { "url": "/", "text": "Name & custom item ▼", "reason": "Chevron emoji replaced by an SVG icon; label unchanged" },
  { "url": "/", "text": "🚨 Severe allergy", "reason": "Emoji removed from builder chrome; label unchanged" },
  { "url": "/", "text": "🔗 Copy Link", "reason": "Emoji replaced by SVG icon; sentence case" },
  { "url": "/", "text": "⬇ Download PNG", "reason": "Emoji replaced by SVG icon; label unchanged" },
  { "url": "/", "text": "🖨 Print", "reason": "Emoji replaced by SVG icon; label unchanged" }
]
```

```bash
npm test && npm run build && npm run check:seo && npm run check:content
```
Expected: SEO check passes (home title, description, H1 "Generate your Japanese restaurant card", canonical and JSON-LD types unchanged); content check passes. If `check:content` lists a `/` block not in the allowlist above, either restore the text or (only if the change is one of the intended emoji/case changes, with different spacing) correct the allowlist entry to the exact reported text and record a ruling.

- [ ] **Step 7: Walk through the builder in a browser**

`npx astro preview --port 4321`, then with the Playwright browser tools at 1280×800 and 390×844:
- tap Peanut, Shrimp, Egg; switch Severe on → card shows the three items in two columns (one column at 390px), the red warning block, hash `#a=peanut,shrimp,egg&s=severe`;
- toggle Show English off and on; collapse and expand each step;
- open "Name & custom item", type a name → greeting updates;
- Copy link → button turns green briefly with `.btn--success`;
- the legend's outlined chips are exactly the nine mandatory allergens.

- [ ] **Step 8: Compare against the design**

Screenshot `/` at 1280 and 390 and compare by eye with the `CardBuilder` and `CardBuilderMobile` artboards. Expected: same hierarchy (display line, H1, steps 1–4, card with seal and "お店の方へ", dark action pill / bottom bar). List differences you chose to keep in the ledger; fix the rest.

- [ ] **Step 9: Look at the exported PNG (Review Focus 2)**

Click Download PNG with Playwright (`page.waitForEvent('download')`), save it under the scratchpad, and open it with the Read tool. Expected: the card with "お店の方へ To the staff", the 食 seal, items in the web serif font, warning block colours. If html2canvas drops the pseudo-elements or the grid, stop and record the finding; the fix (rendering the header and seal as real elements inside `#card` from `app.js`) is a deviation that needs a ruling.

- [ ] **Step 10: Commit**

```bash
git add src/styles/builder.css src/components/Wash.astro src/components/Illustration.astro src/components/FeaturedStrip.astro src/assets src/pages/index.astro src/pages/_home-jsonld.json public/app.js content-allowlist.json
git commit -m "feat(home): redesigned card builder on / (same app.js, new card and builder design)"
```

---

### Task 11: Redesigned `/allergies/` hub

**Files:**
- Create: `src/layouts/HubLayout.astro`, `src/pages/allergies/_jsonld.json`, `src/pages/allergies/_body.html`
- Modify: `src/pages/allergies/index.astro` (rewrite), `content-allowlist.json`

**Interfaces:**
- Consumes: `BaseLayout`, `Picker`, `ExampleCard`, `Illustration`, `GuideList`, `FeaturedStrip`, `guidesForDiet`, `DIETS`.
- Produces: `HubLayout` props `{ title; description; canonical; jsonLd: string[]; page: string; diet: DietKey; eyebrow: string; h1: string; lede: string; reviewed: string; illustration: { src: ImageMetadata; alt: string; caption?: string }; picker: { allergenKeys: string[]; showSeverity?: boolean; event: string }; example: Partial<CardState>; ctaLabel: string; microcopy?: string; closing: { heading: string; text: string; event: string } }`, default slot = the hub's existing body.

- [ ] **Step 1: Extract the existing head data and body, unchanged**

```bash
f=src/pages/allergies/index.astro
# JSON-LD text (between the script tags) → _jsonld.json
awk '/<script is:inline type="application\/ld\+json">/{f=1;next} /<\/script>/{if(f){exit}} f' $f > src/pages/allergies/_jsonld.json
node -e 'JSON.parse(require("fs").readFileSync("src/pages/allergies/_jsonld.json","utf8")); console.log("json ok")'
# The <main class="al-main"> … </main> block → _body.html (served verbatim inside the layout)
awk '/<main class="al-main">/,/<\/main>/' $f > src/pages/allergies/_body.html
grep -c "<details" src/pages/allergies/_body.html
```
Expected: `json ok`; `7`. The file has exactly one JSON-LD block (FAQPage); if `grep -c 'ld+json' $f` reports more than 1, extract each into its own file and pass them all.

- [ ] **Step 2: Write `HubLayout`**

```astro
---
// src/layouts/HubLayout.astro
import type { ImageMetadata } from 'astro';
import { getCollection } from 'astro:content';
import BaseLayout from './BaseLayout.astro';
import Picker from '../components/Picker.astro';
import ExampleCard from '../components/ExampleCard.astro';
import Illustration from '../components/Illustration.astro';
import GuideList from '../components/GuideList.astro';
import FeaturedStrip from '../components/FeaturedStrip.astro';
import { guidesForDiet } from '../lib/guides';
import { DIETS, type DietKey } from '../data/diets';
import type { CardState } from '../lib/cardData';

interface Props {
  title: string; description: string; canonical: string; jsonLd: string[]; page: string;
  diet: DietKey; eyebrow: string; h1: string; lede: string; reviewed: string;
  illustration: { src: ImageMetadata; alt: string; caption?: string };
  picker: { allergenKeys: string[]; showSeverity?: boolean; event: string };
  example: Partial<CardState>;
  ctaLabel: string;
  microcopy?: string;
  closing: { heading: string; text: string; event: string };
}
const p = Astro.props;
const guides = guidesForDiet(await getCollection('guides'), p.diet);
---
<BaseLayout title={p.title} description={p.description} canonical={p.canonical} page={p.page} current={DIETS[p.diet].hub ?? undefined} jsonLd={p.jsonLd}>
  <section class="tm-container hub-hero">
    <div class="hub-hero__copy">
      <p class="tm-kicker">{p.eyebrow}</p>
      <h1 class="tm-display hub-hero__h1">{p.h1}</h1>
      <p class="hub-hero__lede">{p.lede}</p>
      <p class="hub-hero__reviewed">Last reviewed {p.reviewed} · <a href="/about/#corrections">Corrections</a></p>
    </div>
    <Illustration src={p.illustration.src} alt={p.illustration.alt} caption={p.illustration.caption} loading="eager" sizes="(max-width: 900px) 100vw, 50vw" />
  </section>

  <section class="tm-container hub-pick" aria-label="Start your card">
    <div class="hub-pick__panel">
      <Picker diet={p.diet} allergenKeys={p.picker.allergenKeys} showSeverity={p.picker.showSeverity} ctaLabel={p.ctaLabel} event={p.picker.event} />
      {p.microcopy && <p class="hub-pick__micro">{p.microcopy}</p>}
    </div>
    <div class="hub-pick__card"><ExampleCard state={p.example} /></div>
  </section>

  <div class="tm-container hub-body"><slot /></div>

  {guides.length > 0 && (
    <section class="hub-guides" aria-labelledby="hub-guides-h">
      <div class="tm-container hub-guides__inner">
        <div><p class="tm-kicker">{DIETS[p.diet].name} guides</p><h2 class="tm-display hub-guides__h" id="hub-guides-h">Before you order.</h2></div>
        <GuideList guides={guides} />
      </div>
    </section>
  )}

  <FeaturedStrip eventSuffix={p.page === 'allergies' ? 'strip' : p.page} />

  <section class="hub-cta">
    <div class="tm-container hub-cta__inner">
      <h2 class="tm-display hub-cta__h">{p.closing.heading}</h2>
      <p class="hub-cta__text">{p.closing.text}</p>
      <a class="tm-btn" href={DIETS[p.diet].pattern ? `/#p=${DIETS[p.diet].pattern}` : '/'} data-gc-event={p.closing.event}>{p.ctaLabel}</a>
    </div>
  </section>
</BaseLayout>

<style>
  .hub-hero { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 24px 48px; align-items: center; padding-top: 32px; padding-bottom: 48px; }
  .hub-hero__copy { display: flex; flex-direction: column; gap: 16px; }
  .hub-hero__h1 { margin: 0; font-size: clamp(2.4rem, 4.6vw, 3.6rem); line-height: 1.06; }
  .hub-hero__lede { margin: 0; font-size: 19px; color: var(--tm-ink-muted); max-width: 540px; }
  .hub-hero__reviewed { margin: 0; font-size: 14px; color: var(--tm-ink-faint); }
  .hub-pick { display: grid; grid-template-columns: minmax(0, 6fr) minmax(0, 6fr); gap: 48px 64px; align-items: start; padding-bottom: 88px; }
  .hub-pick__panel { background: var(--tm-paper-warm); border-radius: var(--tm-radius); padding: 32px; }
  .hub-pick__micro { margin: 12px 0 0; font-size: 13px; color: var(--tm-ink-faint); }
  .hub-body { max-width: 860px; padding-bottom: 72px; }
  .hub-guides { background: var(--tm-paper-warm); border-top: 1px solid var(--tm-rule); }
  .hub-guides__inner { padding-top: 72px; padding-bottom: 72px; display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: 32px 56px; }
  .hub-guides__h { margin: 4px 0 0; font-size: clamp(2rem, 3.2vw, 2.6rem); }
  .hub-cta { background: var(--tm-ink); color: #f6f1e7; }
  .hub-cta__inner { padding-top: 72px; padding-bottom: 72px; display: flex; flex-direction: column; align-items: flex-start; gap: 16px; }
  .hub-cta__h { margin: 0; font-size: clamp(2rem, 3.2vw, 2.6rem); color: #fff; }
  .hub-cta__text { margin: 0; max-width: 640px; color: #c9c1b5; }
  @media (max-width: 900px) {
    .hub-hero, .hub-pick, .hub-guides__inner { grid-template-columns: 1fr; }
    .hub-pick__panel { padding: 20px; }
  }
</style>
```

- [ ] **Step 3: Rewrite `src/pages/allergies/index.astro`**

```astro
---
import HubLayout from '../../layouts/HubLayout.astro';
import noren from '../../assets/illustrations/noren.jpg';
import ramen from '../../assets/photos/ramen-shop-no-allergen-signage.png';
import onigiri from '../../assets/photos/onigiri-label-annotated.png';
import { Image } from 'astro:assets';
import jsonLd from './_jsonld.json?raw';
import body from './_body.html?raw';

// Photos are placed after the paragraph whose topic they illustrate.
const RAMEN_AFTER = '<h2>Restaurants that work — and how to order</h2>';
const ONIGIRI_AFTER = '<h2>Convenience stores: your safety net</h2>';
---
<HubLayout
  title="Japan Food Allergy Restaurant Card — Free Generator | tabemasen"
  description="Free Japanese food allergy card for travelers. Pick your allergens, show your waiter. Explains cross-contamination and lists each allergen in kanji staff will recognise — peanut, shellfish, egg, dairy, sesame, soy and more."
  canonical="https://tabemasen.io/allergies/"
  jsonLd={[jsonLd.trim()]}
  page="allergies"
  diet="allergies"
  eyebrow="Free generator"
  h1="Japan food allergy restaurant card"
  lede="Pick your allergens, get a polite Japanese card to show your waiter. Each allergen is listed in kanji staff will recognise, with a clear note about cross-contamination — and a reminder that it's an allergy, not a preference."
  microcopy="No signup · Free"
  reviewed="October 2026"
  illustration={{ src: noren, alt: 'Watercolour sketch: two travellers stop at the entrance of a small restaurant with an indigo noren curtain, a paper lantern and a chalkboard menu' }}
  picker={{ allergenKeys: ['shrimp', 'crab', 'wheat', 'buckwheat', 'egg', 'dairy', 'peanut', 'walnut', 'cashew', 'sesame', 'soy', 'fish'], showSeverity: true, event: 'cta-allergies-hero' }}
  example={{ allergens: ['peanut', 'shrimp', 'egg'], severity: 'severe', showEnglish: true }}
  ctaLabel="Generate my Japanese allergy card →"
  closing={{ heading: 'Ready to generate yours?', text: 'Free, no signup, takes about 30 seconds. Pick the allergens that apply, set severity, and add other dietary needs.', event: 'cta-allergies-footer' }}
>
  <Fragment set:html={body.split(RAMEN_AFTER)[0]} />
  <Fragment set:html={RAMEN_AFTER} />
  <Image class="al-photo" src={ramen} alt="Inside a Japanese tonkotsu ramen shop — the walls are covered in signage for drinks, house rules, and pricing, but no allergen information is displayed anywhere" widths={[480, 860]} sizes="(max-width: 900px) 100vw, 860px" format="webp" />
  <Fragment set:html={body.split(RAMEN_AFTER)[1].split(ONIGIRI_AFTER)[0]} />
  <Fragment set:html={ONIGIRI_AFTER} />
  <Image class="al-photo" src={onigiri} alt="Annotated allergen label on a FamilyMart grilled salmon onigiri wrapper. Callout 1 points to the 名称 and 原材料名 header. Callout 2 highlights the collective allergen summary line (一部に…を含む) within the ingredient list. Callout 3 shows the visual allergen icon chart listing all nine mandatory allergens with icons." widths={[480, 860]} sizes="(max-width: 900px) 100vw, 860px" format="webp" />
  <Fragment set:html={body.split(ONIGIRI_AFTER)[1]} />
</HubLayout>

<style is:global>
  /* Existing /allergies/ body markup (al-*), restyled. Text untouched. */
  .al-main { display: flex; flex-direction: column; gap: 56px; }
  .al-section h2 { margin: 0 0 16px; font-family: var(--tm-font-display); font-weight: 600; font-size: clamp(1.7rem, 2.8vw, 2.2rem); line-height: 1.15; }
  .al-section p { margin: 0 0 14px; color: #2e2f33; font-size: 18px; line-height: 1.75; }
  .al-section a { color: var(--tm-ink); text-decoration-color: var(--tm-shu); text-underline-offset: 3px; }
  .al-feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 24px 32px; }
  .al-feature-card { border-top: 1.5px solid var(--tm-ink); padding-top: 14px; }
  .al-feature-card__title { font-family: var(--tm-font-display); font-weight: 700; font-size: 20px; margin-bottom: 6px; }
  .al-feature-card__title em { font-style: normal; font-weight: 600; color: var(--tm-ink-faint); }
  .al-feature-card__text { font-size: 16px; line-height: 1.65; color: var(--tm-ink-muted); }
  .al-faq { border-bottom: 1px solid var(--tm-rule); }
  .al-faq__item { border-top: 1px solid var(--tm-rule); }
  .al-faq__item summary { min-height: 44px; padding: 16px 0; cursor: pointer; font-weight: 700; font-size: 18px; list-style-position: outside; }
  .al-faq__item p { margin: 0 0 16px; }
  .al-photo { display: block; width: 100%; height: auto; margin: 8px 0 24px; border-radius: var(--tm-radius); }
</style>
```
`lede` and `microcopy` are today's `.al-hero__lede` paragraph and `.al-microcopy` text, verbatim. The photo alt texts are the ones the labeling guide already uses for the same images.

- [ ] **Step 4: Allowlist the intended text changes and check**

Append to `content-allowlist.json`:
```json
  { "url": "/allergies/", "text": "Generate my allergy card →", "reason": "Owner rule: hub CTAs use 'Generate my Japanese [diet] card →'" }
```
```bash
npm test && npm run build && npm run check:seo && npm run check:content
```
Expected: SEO check passes (title, description, H1 "Japan food allergy restaurant card", canonical and `FAQPage`/`Question`/`Answer` types unchanged); content check passes. If another block is reported missing, put the text back on the page rather than allowlisting it, and record a ruling.

- [ ] **Step 5: Look at it**

`npx astro preview --port 4321`; screenshot `/allergies/` at 1280 and 390; compare with `V5Hub` (minus overlays and partner block). Then: tap Egg + Cashew + Severe in the picker → the button's `href` is `/#a=egg,cashew&s=severe`; follow it → `/` shows Egg and Cashew pressed, Severe on.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/HubLayout.astro src/pages/allergies content-allowlist.json
git commit -m "feat(allergies): redesigned hub with picker, example card, guides list; body text unchanged"
```

---

### Task 12: End-to-end smoke and accessibility tests

**Files:**
- Create: `scripts/serve-dist.mjs`, `playwright.config.mjs`, `e2e/site.spec.mjs`
- Modify: `package.json` (devDependencies, script `test:e2e`), `.github/workflows/site.yml` (e2e step), `.gitignore` (`test-results/`, `playwright-report/`)

**Interfaces:**
- Produces: `npm run test:e2e` (serves `dist/` on port 4322 and runs Playwright).

- [ ] **Step 1: Install**

```bash
npm install -D @playwright/test@^1.64 @axe-core/playwright@^4.13
npx playwright install chromium
```

- [ ] **Step 2: Write the static server and config**

```js
// scripts/serve-dist.mjs — tiny static server for e2e (astro preview detaches in Astro 7).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = 'dist';
const port = Number(process.env.PORT ?? 4322);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff' };

createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, path);
  try {
    const s = await stat(file);
    if (s.isDirectory()) {
      if (!path.endsWith('/')) { res.writeHead(301, { Location: `${path}/` }); return res.end(); }
      file = join(file, 'index.html');
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  }
}).listen(port, () => console.log(`serving dist on http://localhost:${port}`));
```

```js
// playwright.config.mjs
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
```
Add `"test:e2e": "playwright test"` to `package.json` scripts and `test-results/` and `playwright-report/` to `.gitignore`.

- [ ] **Step 3: Write the tests**

```js
// e2e/site.spec.mjs
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
```

- [ ] **Step 4: Run them**

```bash
npm run build && npm run test:e2e
```
Expected: all pass in both projects. A failure is either a real bug (fix the code, with a unit test where one applies) or a test assumption that does not match `app.js` (for example the severity label being clickable): fix the test only if the app behaviour is the one the spec wants, and record a ruling.

- [ ] **Step 5: Run e2e in CI**

In `.github/workflows/site.yml`, after `npm run check:content`, add:
```yaml
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

- [ ] **Step 6: Commit**

```bash
git add scripts/serve-dist.mjs playwright.config.mjs e2e package.json package-lock.json .gitignore .github/workflows/site.yml
git commit -m "test(e2e): smoke, builder, picker, PNG, print and axe checks"
```

---

### Task 13: Owner review, docs, PR B

**Files:**
- Modify: `README.md`, `CHANGELOG.md`, spec §8 (item 14)

- [ ] **Step 1: Owner review (stop point)**

Run `npm run build && npx astro preview --port 4321` and ask the owner to review `/`, `/allergies/`, `/guides/` and one legacy page (e.g. `/vegan/`) on desktop and phone, and to list design quirks. Fix each quirk as its own commit (with a test where behaviour changes). Record "Owner quirks: <list>" in the ledger.

- [ ] **Step 2: Docs**

`README.md`: add `npm run check:content` and `npm run test:e2e` to the Quick start block, and a short "Design system" paragraph: tokens in `src/styles/tokens.css` (`--tm-*`), fonts via Fontsource, components in `src/components/`, the card's CSS in `src/styles/card.css` (also used by PNG export and print), guides in `src/content/guides/`.

`CHANGELOG.md` (top, today's date):
```markdown
- design(home): the card builder in the new design. The card itself has a new look (seal, "To the staff", items in two columns, warning and note blocks) that also applies to the PNG download and print. Same wording, same links, same shared-card URLs.
- design(allergies): /allergies/ redesigned: pick allergens right on the page and continue on the builder; example card; allergy guides list; photos. Every paragraph and FAQ unchanged.
- a11y: the viewport no longer blocks zooming on redesigned pages.
```

Spec §8, add:
```markdown
14. **Picker analytics keep existing names.** The `/allergies/` picker button fires `cta-allergies-hero` and the closing CTA `cta-allergies-footer` (today's names), not `picker-go:allergies`, so GoatCounter history continues. Other hubs follow the same rule with their existing names.
```

- [ ] **Step 3: Full verification**

```bash
npm test && npm run build && npm run check:seo && npm run check:content && npm run test:e2e
```
Expected: everything passes. Paste the summary lines into the PR body.

- [ ] **Step 4: Commit, push, open PR B** (ask the owner before pushing)

```bash
git add README.md CHANGELOG.md docs/superpowers/specs/2026-10-12-astro-migration-and-redesign-design.md
git commit -m "docs: design system notes, changelog, spec amendment for analytics names"
git push origin astro-redesign
gh pr create --base main --head astro-redesign --title "M2 slice 1 · Part B: card builder and /allergies/ redesign" --body-file - <<'EOF'
## What
- `/`: card builder in the new design; new card design (live, PNG, print). `app.js` unchanged except waiting for web fonts before PNG capture.
- `/allergies/`: hero with illustration, picker that hands selections to the builder, example card, existing body text restyled, allergy guides list, photos.
- E2E: smoke on all pages (375 + 1280), builder, shared link, mandatory chips, PNG, print, picker (with and without JS), mobile menu, axe on /, /allergies/, /guides/.

## SEO and content
- `check:seo`: titles, descriptions, H1s, canonicals and JSON-LD types unchanged (allowlist still empty).
- `check:content` against `slice1-base`: every text block kept; intended changes listed in `content-allowlist.json` (emoji removed from builder chrome, "Copy Link" → "Copy link", CTA wording per the long-form rule).

## Verification
<paste outputs and the owner-quirk list>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01UpttBQPap9JzyZfAZEcyqK
EOF
```
Expected: PR URL printed; CI passes. After the owner merges: watch the deploy, run `npm run smoke:live -- https://tabemasen.io`, and in Search Console request indexing for `/`, `/allergies/` and `/guides/`.

---

## After this slice

Next plans, one each: labeling guide → MDX + `GuideLayout` (and `KeyTakeaways`, `LabelFigure`, `CardCta`, `Faq`, `llms.txt` generation); food allergies in Japanese → MDX; halal hub (+ certification guide); vegan hub; gluten-free hub + celiac; about/featured restyle and deletion of `styles.css`/`nav.js`.
