# M2 Slice 2: Labeling Guide on the Guide Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put `/allergies/labeling-guide/` into a reusable `GuideLayout` with the Draft 5 look, keeping every word, heading, SEO field and JSON-LD block of the page.

**Architecture:** A tested extraction helper pulls the page's existing hero, notice, contents list, article body and closing CTA out of the legacy source as HTML fragments (verbatim, contents list removed from the body). The page is rebuilt as `GuideLayout` + those fragments; a new `guide-body.css` restyles the existing `lg-*` classes. "Keep reading" comes from the guide collection.

**Tech Stack:** Astro ^7.3.8, parse5, Vitest + `experimental_AstroContainer`, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-10-12-astro-migration-and-redesign-design.md` — **§9 (slice 2)** binds; §8 amendments still apply.

**One deviation from §9, recorded in Task 4:** `check:content` keeps comparing against the existing tag `slice1-base` instead of a new `slice2-base`. The labeling guide's text has not changed since `slice1-base` (only its header/footer, which the manifest already excludes), and the other manifest pages' legacy sources only exist at `slice1-base`. Same protection, no new tag.

## Global Constraints

- Branch `astro-redesign`; the PR is opened by the controller; recommended merge on or after 2026-10-26.
- `npm run check:seo` passes with `seo-allowlist.json` still `"changes": []`: title "Japan Food Allergen Labeling Guide: Mandatory Allergens, Labels & Restaurant Risks | tabemasen", the existing meta description, canonical `https://tabemasen.io/allergies/labeling-guide/`, H1 "Japan's allergen labeling, explained: what's on the packet vs. what's not on the menu" (no-break space before "what's not"), JSON-LD types unchanged.
- `npm run check:content` passes; the only new allowlist entry is `{ "url": "/allergies/labeling-guide/", "text": "Generate my card →" }`.
- Every word, element order and heading of the guide stays; fragments are extracted programmatically, never retyped.
- The closing CTA button reads "Generate my Japanese allergy card →" and keeps `data-gc-event="cta-allergies-labeling-footer"`; header/footer use page name `allergies-labeling`, current nav `/allergies/`.
- Head keeps: `og:type` `article`; `article:section` "Allergies"; `article:tag` "Japan food allergies", "Allergen labeling", "Celiac travel".
- Colour is never the only cue: mandatory kanji cards carry the red dot, recommended a solid outline, unlisted a dashed outline; legend matches; the two label highlights differ by underline style.
- Tokens `--tm-*`; no Google Fonts; no emoji in new chrome; touch targets ≥ 44px; text contrast ≥ 4.5:1.
- **Stage only the files you change. Never `git add -A` or `git add .`** (the working tree holds the owner's untracked files).
- Commits end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01UpttBQPap9JzyZfAZEcyqK
  ```

## Review Focus

1. **The two inline styles in the body that use old `styles.css` variables** (`var(--color-success-light)` on the mock label's summary line, `var(--font-card)` on one centred line) must still render, because the redesigned page no longer loads `styles.css`. Pinned by Task 3's shim rule and its e2e check that the summary line has a non-transparent background.
2. **In-page anchors** (`#mandatory-nine` … `#faq`) must keep working after the contents list moves into the sidebar, including on phones where the header is not sticky. Pinned by Task 4's e2e test that every contents link resolves to an element and clicking one scrolls it into view.
3. **The 2.5 MB annotated onigiri photo** stays as it is (body unchanged) and must not break layout on a 375px screen (no horizontal scroll). Pinned by Task 4's e2e no-horizontal-overflow check.
4. **Malformed legacy head markup** (`twitter:description` is missing its closing `>` in the old file) must not leak into the new head; `BaseLayout` regenerates the tags. Pinned by Task 2's check that the built page has exactly one `twitter:description` meta with the description as content.
5. **"Keep reading" must never list the page itself** and must hide when there is nothing to list. Pinned by Task 1's unit tests for `relatedGuides`.

---

## File Structure

| Path | Responsibility |
|---|---|
| `scripts/lib/extract-html.mjs` | Find/serialize/remove elements in an HTML document (parse5) |
| `scripts/extract-labeling-guide.mjs` | One-off: write the guide's fragments from the legacy source |
| `src/lib/guides.ts` | + `relatedGuides(entries, diet, excludeId)` |
| `src/layouts/GuideLayout.astro` | Guide page frame (hero, notice, sticky contents, body, CTA, Keep reading) |
| `src/styles/guide-body.css` | Restyle of the legacy `lg-*` body classes + old-variable shims |
| `src/pages/allergies/labeling-guide/_*.html`, `_jsonld-*.json` | Extracted fragments (verbatim) |
| `src/pages/allergies/labeling-guide/index.astro` | Rewritten page: GuideLayout + fragments |
| `tests/extract-html.test.mjs`, `tests/guide-layout.test.ts`, `tests/guides.test.ts` | Unit tests |
| `e2e/site.spec.mjs` | + labeling-guide tests |

---

### Task 0: Sync the branch (controller)

- [ ] `git checkout astro-redesign && git fetch origin && git merge --ff-only origin/main` (expect "Already up to date" or a fast-forward), `npm ci && npm test && npm run build && npm run check:seo && npm run check:content`. Expected: all green. Record BASE.

---

### Task 1: `relatedGuides` and `GuideLayout`

**Files:**
- Modify: `src/lib/guides.ts`, `tests/guides.test.ts`
- Create: `src/layouts/GuideLayout.astro`, `tests/guide-layout.test.ts`

**Interfaces:**
- Consumes: `BaseLayout` (props `{ title, description, canonical, page, current?, ogType?, jsonLd?, bodyClass? }`, named slot `head`), `Illustration` (`{ src, alt, caption?, sizes?, loading? }`), `GuideList` (`{ guides }`), `guidesForDiet`, `GuideLike`.
- Produces: `relatedGuides<T extends GuideLike>(entries: T[], diet: DietKey, excludeId: string): T[]` = `guidesForDiet(entries, diet).filter((g) => g.id !== excludeId)`.
- Produces: `GuideLayout` props `{ title: string; description: string; canonical: string; jsonLd: string[]; page: string; current?: string; illustration: { src: ImageMetadata; alt: string; caption?: string }; related: GuideLike-with-description[] }`; named slots `head`, `hero`, `notice`, `toc`, `cta`; default slot = article body. Root classes: `.guide-hero`, `.guide-notice`, `.guide-main` > `.guide-toc` + `.guide-body`, `.guide-related`.

- [ ] **Step 1: Failing unit tests for `relatedGuides`** — append to `tests/guides.test.ts`:

```ts
import { relatedGuides } from '../src/lib/guides';

describe('relatedGuides', () => {
  const list = [g('labeling-guide', ['allergies'], '2026-10-08'), g('phrases', ['allergies'], '2026-10-08'),
    g('halal-cert', ['halal'], '2026-10-08'), g('draft-one', ['allergies'], '2026-10-09', { draft: true })];

  it('lists other guides for the diet, never the current one', () => {
    expect(relatedGuides(list, 'allergies', 'labeling-guide').map((x) => x.id)).toEqual(['phrases']);
  });

  it('returns an empty list when the page is the only guide for the diet', () => {
    expect(relatedGuides(list, 'halal', 'halal-cert')).toEqual([]);
  });
});
```
(`g` is the helper already defined at the top of the file.)

- [ ] **Step 2:** `npx vitest run tests/guides.test.ts` → FAIL (`relatedGuides` is not exported).

- [ ] **Step 3: Implement** in `src/lib/guides.ts`:

```ts
export function relatedGuides<T extends GuideLike>(entries: T[], diet: DietKey, excludeId: string): T[] {
  return guidesForDiet(entries, diet).filter((g) => g.id !== excludeId);
}
```

- [ ] **Step 4:** re-run → PASS.

- [ ] **Step 5: Failing container test for `GuideLayout`**

```ts
// tests/guide-layout.test.ts
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import GuideLayout from '../src/layouts/GuideLayout.astro';
import konbini from '../src/assets/illustrations/konbini.jpg';

const related = [{ id: 'phrases', data: { title: 'Food allergies in Japanese', description: 'Phrases.', diets: ['allergies'], reviewed: new Date('2026-10-08'), permalink: '/allergies/food-allergies-in-japanese/' } }];
const base = {
  title: 'Guide | tabemasen', description: 'D', canonical: 'https://tabemasen.io/allergies/labeling-guide/',
  jsonLd: ['{"@type":"Article"}'], page: 'allergies-labeling', current: '/allergies/',
  illustration: { src: konbini, alt: 'Watercolour sketch: a hand turns over an onigiri', caption: 'Cap.' },
};
const slots = {
  head: '<meta property="article:section" content="Allergies">',
  hero: '<h1>Title</h1>', notice: '<div class="lg-disclaimer">Not advice.</div>',
  toc: '<nav class="lg-toc"><a href="#a">A</a></nav>', default: '<article class="lg-article"><section id="a"><h2>A</h2></section></article>',
  cta: '<section class="lg-cta"><a href="/">Go</a></section>',
};

describe('GuideLayout', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(GuideLayout, { props: { ...base, related }, slots });

  it('emits article metadata and the head slot', () => {
    expect(html).toContain('<meta property="og:type" content="article">');
    expect(html).toContain('<meta property="article:section" content="Allergies">');
    expect(html).toContain('<script type="application/ld+json">{"@type":"Article"}</script>');
  });

  it('places hero, notice, contents and body in their regions, in order', () => {
    expect(html).toMatch(/class="[^"]*guide-hero[\s\S]*<h1>Title<\/h1>[\s\S]*class="[^"]*guide-notice[\s\S]*Not advice\.[\s\S]*class="[^"]*guide-toc[\s\S]*lg-toc[\s\S]*class="[^"]*guide-body[\s\S]*lg-article[\s\S]*lg-cta/);
  });

  it('shows the illustration with its alt text and caption', () => {
    expect(html).toContain('alt="Watercolour sketch: a hand turns over an onigiri"');
    expect(html).toContain('Cap.');
  });

  it('lists related guides under Keep reading', () => {
    expect(html).toContain('Keep reading');
    expect(html).toContain('href="/allergies/food-allergies-in-japanese/"');
  });

  it('hides Keep reading when there is nothing to list', async () => {
    const none = await container.renderToString(GuideLayout, { props: { ...base, related: [] }, slots });
    expect(none).not.toContain('Keep reading');
  });
});
```

- [ ] **Step 6:** `npx vitest run tests/guide-layout.test.ts` → FAIL (cannot resolve the layout).

- [ ] **Step 7: Implement `src/layouts/GuideLayout.astro`**

```astro
---
// Guide page frame. The hero, notice, contents list, body and CTA come in as slots so
// legacy guides can pass their existing markup verbatim and MDX guides can pass components.
import type { ImageMetadata } from 'astro';
import BaseLayout from './BaseLayout.astro';
import Illustration from '../components/Illustration.astro';
import GuideList from '../components/GuideList.astro';
import type { GuideLike } from '../lib/guides';

interface Props {
  title: string; description: string; canonical: string; jsonLd: string[];
  page: string; current?: string;
  illustration: { src: ImageMetadata; alt: string; caption?: string };
  related: (GuideLike & { data: GuideLike['data'] & { description: string } })[];
}
const p = Astro.props;
---
<BaseLayout title={p.title} description={p.description} canonical={p.canonical} page={p.page} current={p.current} ogType="article" jsonLd={p.jsonLd}>
  <Fragment slot="head"><slot name="head" /></Fragment>

  <section class="tm-container guide-hero">
    <div class="guide-hero__copy"><slot name="hero" /></div>
    <Illustration src={p.illustration.src} alt={p.illustration.alt} caption={p.illustration.caption} loading="eager" sizes="(max-width: 900px) 100vw, 44vw" />
  </section>

  <div class="tm-container guide-notice"><slot name="notice" /></div>

  <div class="tm-container guide-main">
    <aside class="guide-toc"><slot name="toc" /></aside>
    <div class="guide-body"><slot /></div>
  </div>

  <slot name="cta" />

  {p.related.length > 0 && (
    <section class="guide-related" aria-labelledby="guide-related-h">
      <div class="tm-container guide-related__inner">
        <h2 class="tm-display guide-related__h" id="guide-related-h">Keep reading</h2>
        <GuideList guides={p.related} />
      </div>
    </section>
  )}
</BaseLayout>

<style>
  .guide-hero { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 24px 56px; align-items: center; padding-top: 32px; padding-bottom: 32px; }
  .guide-notice { padding-bottom: 32px; }
  .guide-main { display: grid; grid-template-columns: 260px minmax(0, 760px); justify-content: space-between; gap: 48px 64px; align-items: start; padding-bottom: 88px; }
  .guide-toc { position: sticky; top: 24px; max-height: calc(100vh - 48px); overflow-y: auto; }
  .guide-related { background: var(--tm-paper-warm); border-top: 1px solid var(--tm-rule); }
  .guide-related__inner { padding-top: 64px; padding-bottom: 64px; display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: 24px 56px; }
  .guide-related__h { margin: 0; font-size: clamp(1.8rem, 3vw, 2.4rem); }
  @media (max-width: 900px) {
    .guide-hero, .guide-main, .guide-related__inner { grid-template-columns: 1fr; }
    .guide-toc { position: static; max-height: none; overflow: visible; }
  }
</style>
```

- [ ] **Step 8:** `npx vitest run tests/guide-layout.test.ts` → PASS (5). If Astro serialises a tag differently from an assertion (e.g. `/>`), adjust the assertion to Astro's actual output, not the layout, and say so in the report. Then `npm test` → all pass.

- [ ] **Step 9: Commit** `feat(guides): GuideLayout and relatedGuides` (stage the four files only).

---

### Task 2: Extract the guide's fragments and rebuild the page on `GuideLayout`

**Files:**
- Create: `scripts/lib/extract-html.mjs`, `tests/extract-html.test.mjs`, `scripts/extract-labeling-guide.mjs`, `src/styles/guide-body.css` (structure-only first pass, see Step 8), and generated `src/pages/allergies/labeling-guide/_hero.html`, `_notice.html`, `_toc.html`, `_body.html`, `_cta.html`, `_jsonld-1.json`, `_jsonld-2.json`, `_jsonld-3.json`
- Modify: `src/pages/allergies/labeling-guide/index.astro` (rewrite), `content-allowlist.json`

**Interfaces:**
- Produces: `outerHTML(html: string, selector: string): string` — serialized first element matching `selector` (`tag`, `.class`, `#id`); throws if none. `outerHTMLWithout(html: string, selector: string, removeSelector: string): string` — same, with every descendant matching `removeSelector` removed. `innerTextOfAll(html: string, selector: string): string[]` — raw text content of every matching element (used for JSON-LD).

- [ ] **Step 1: Failing tests**

```js
// tests/extract-html.test.mjs
import { describe, it, expect } from 'vitest';
import { outerHTML, outerHTMLWithout, innerTextOfAll } from '../scripts/lib/extract-html.mjs';

const doc = `<!DOCTYPE html><html><head>
<script type="application/ld+json">{"a":1}</script><script type="application/ld+json">{"b":2}</script></head><body>
<section class="lg-hero"><div class="lg-hero__inner"><h1 class="t">Japan's allergen labeling, explained: what's on the packet vs.&nbsp;what's not</h1></div></section>
<article class="lg-article"><section id="s1"><p>Keep <em>this</em></p><nav class="lg-toc"><a href="#s1">S1</a></nav></section></article>
</body></html>`;

describe('extract-html', () => {
  it('returns the outer HTML of the first match, nested markup intact', () => {
    expect(outerHTML(doc, '.lg-hero__inner')).toBe('<div class="lg-hero__inner"><h1 class="t">Japan\'s allergen labeling, explained: what\'s on the packet vs.&nbsp;what\'s not</h1></div>');
  });

  it('keeps the no-break space as &nbsp;', () => {
    expect(outerHTML(doc, 'h1')).toContain('vs.&nbsp;what');
  });

  it('removes a descendant from the extracted element', () => {
    const body = outerHTMLWithout(doc, '.lg-article', '.lg-toc');
    expect(body).toContain('<p>Keep <em>this</em></p>');
    expect(body).not.toContain('lg-toc');
  });

  it('collects the raw text of every match', () => {
    expect(innerTextOfAll(doc, 'script')).toEqual(['{"a":1}', '{"b":2}']);
  });

  it('throws when nothing matches', () => {
    expect(() => outerHTML(doc, '.nope')).toThrow(/\.nope/);
  });
});
```

- [ ] **Step 2:** `npx vitest run tests/extract-html.test.mjs` → FAIL (module not found).

- [ ] **Step 3: Implement**

```js
// scripts/lib/extract-html.mjs — pull fragments out of a legacy page, verbatim.
import { parse, serializeOuter } from 'parse5';

const attr = (el, name) => el.attrs?.find((a) => a.name === name)?.value;
function matches(el, sel) {
  if (!el.tagName) return false;
  if (sel.startsWith('.')) return (attr(el, 'class') ?? '').split(/\s+/).includes(sel.slice(1));
  if (sel.startsWith('#')) return attr(el, 'id') === sel.slice(1);
  return el.tagName === sel;
}
function findAll(node, sel, out = []) {
  for (const c of node.childNodes ?? []) {
    if (!c.tagName) continue;
    if (matches(c, sel)) out.push(c);
    findAll(c.tagName === 'template' ? c.content : c, sel, out);
  }
  return out;
}
function first(html, sel) {
  const hit = findAll(parse(html), sel)[0];
  if (!hit) throw new Error(`extract-html: nothing matches ${sel}`);
  return hit;
}
function textOf(el) {
  let s = '';
  (function walk(n) { for (const c of n.childNodes ?? []) { if (c.nodeName === '#text') s += c.value; else walk(c); } })(el);
  return s;
}

export const outerHTML = (html, sel) => serializeOuter(first(html, sel));

export function outerHTMLWithout(html, sel, removeSel) {
  const el = first(html, sel);
  for (const victim of findAll(el, removeSel)) {
    const siblings = victim.parentNode.childNodes;
    siblings.splice(siblings.indexOf(victim), 1);
  }
  return serializeOuter(el);
}

export const innerTextOfAll = (html, sel) => findAll(parse(html), sel).map(textOf);
```

- [ ] **Step 4:** re-run → PASS (5). If parse5's serializer writes `&nbsp;` differently, check `node -e` output and adjust only the `&nbsp;` assertions to the real serializer output (e.g. a literal U+00A0); record why.

- [ ] **Step 5: Write and run the one-off extractor**

```js
// scripts/extract-labeling-guide.mjs — one-off: run once, commit the fragments.
import { readFileSync, writeFileSync } from 'node:fs';
import { outerHTML, outerHTMLWithout, innerTextOfAll } from './lib/extract-html.mjs';

const dir = 'src/pages/allergies/labeling-guide';
const src = readFileSync(`${dir}/index.astro`, 'utf8').replace(/^---[\s\S]*?---\n/, '');
const lds = innerTextOfAll(src, 'script').filter((t) => t.trim().startsWith('{'));
if (lds.length !== 3) throw new Error(`expected 3 JSON-LD blocks, found ${lds.length}`);
lds.forEach((t, i) => { JSON.parse(t); writeFileSync(`${dir}/_jsonld-${i + 1}.json`, t.trim() + '\n'); });

const write = (name, html) => { writeFileSync(`${dir}/${name}`, html + '\n'); console.log(`wrote ${name} (${html.length} chars)`); };
write('_hero.html', outerHTML(src, '.lg-hero__inner'));
write('_notice.html', outerHTML(src, '.lg-disclaimer'));
write('_toc.html', outerHTML(src, '.lg-toc'));
write('_body.html', outerHTMLWithout(src, '.lg-article', '.lg-toc'));
write('_cta.html', outerHTML(src, '.lg-cta').replace('Generate my card →', 'Generate my Japanese allergy card →'));
```
Run: `node scripts/extract-labeling-guide.mjs`. Expected: 5 `wrote` lines, no error. Check: `grep -c 'Generate my Japanese allergy card →' src/pages/allergies/labeling-guide/_cta.html` → 1; `grep -c 'data-gc-event="cta-allergies-labeling-footer"' …/_cta.html` → 1; `grep -c 'lg-toc' …/_body.html` → 0; `grep -c '<section class="lg-section"' …/_body.html` → 14.

- [ ] **Step 6: Rewrite `src/pages/allergies/labeling-guide/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import GuideLayout from '../../../layouts/GuideLayout.astro';
import { relatedGuides } from '../../../lib/guides';
import konbini from '../../../assets/illustrations/konbini.jpg';
import '../../../styles/guide-body.css';
import ld1 from './_jsonld-1.json?raw';
import ld2 from './_jsonld-2.json?raw';
import ld3 from './_jsonld-3.json?raw';
import hero from './_hero.html?raw';
import notice from './_notice.html?raw';
import toc from './_toc.html?raw';
import body from './_body.html?raw';
import cta from './_cta.html?raw';

const related = relatedGuides(await getCollection('guides'), 'allergies', 'labeling-guide');
---
<GuideLayout
  title="Japan Food Allergen Labeling Guide: Mandatory Allergens, Labels & Restaurant Risks | tabemasen"
  description="Japan's 9 mandatory food allergens, how to read a Japanese label, why restaurants aren't required to disclose, and what celiac travelers need to watch for."
  canonical="https://tabemasen.io/allergies/labeling-guide/"
  jsonLd={[ld1.trim(), ld2.trim(), ld3.trim()]}
  page="allergies-labeling"
  current="/allergies/"
  illustration={{ src: konbini, alt: 'Watercolour sketch: a hand turns over an onigiri in a convenience store to read the label on the back', caption: "Japan's allergen labels list what's inside packaged food. Restaurants have no such rule." }}
  related={related}
>
  <Fragment slot="head">
    <meta property="article:section" content="Allergies">
    <meta property="article:tag" content="Japan food allergies">
    <meta property="article:tag" content="Allergen labeling">
    <meta property="article:tag" content="Celiac travel">
  </Fragment>
  <Fragment slot="hero" set:html={hero} />
  <Fragment slot="notice" set:html={notice} />
  <Fragment slot="toc" set:html={toc} />
  <Fragment set:html={body} />
  <Fragment slot="cta" set:html={cta} />
</GuideLayout>
```

- [ ] **Step 7: Allowlist the CTA wording** — append to `content-allowlist.json`:
```json
  { "url": "/allergies/labeling-guide/", "text": "Generate my card →", "reason": "Owner rule: CTAs under a diet hub use 'Generate my Japanese [diet] card →'" }
```

- [ ] **Step 8: Structure-only `guide-body.css`** — create `src/styles/guide-body.css` with just the old-variable shims (Task 3 adds the full restyle):
```css
/* src/styles/guide-body.css — restyle of the legacy lg-* guide body (Task 3 fills this in). */
/* Shims: two inline styles in the guide body use variables from the retired styles.css. */
.lg-article { --font-card: var(--tm-font-display); --color-success-light: #e1eadb; }
```

- [ ] **Step 9: Build and check**
```bash
npm test && npm run build && npm run check:seo && npm run check:content
grep -c 'name="twitter:description"' dist/allergies/labeling-guide/index.html
```
Expected: tests pass; SEO check passed (13 pages, 12 indexable — title, description, H1, canonical, JSON-LD types unchanged); content check passed; the grep prints `1` (Review Focus 4). If `check:content` reports a missing block other than the CTA wording, the extraction dropped text: fix the extractor (test first), never the page text.

- [ ] **Step 10: Commit** `feat(guides): labeling guide on GuideLayout (extracted body, unchanged text)` — stage the new scripts, tests, fragments, page, `guide-body.css`, `content-allowlist.json`.

---

### Task 3: Restyle the guide body (`guide-body.css`) with shape cues

**Files:**
- Modify: `src/styles/guide-body.css`, `e2e/site.spec.mjs`

**Interfaces:**
- Consumes: the extracted body's `lg-*` classes (inventory: `lg-section`, `lg-takeaways(__title|__list)`, `lg-toc(__title|__list)`, `lg-table-wrap`, `lg-table`, `lg-badge--new`/`badge`, `lg-sources`, `lg-chart(__title|__subtitle|__cols|__col--mandatory|__col--recommended|__label|__count|__items)`, `lg-jp-inline`, `lg-label-diagram(__title)`, `lg-label-mock(__header|__ingredients|__tag|__tag--step1..3)`, `hl--individual`, `hl--collective`, `lg-label-steps`, `lg-label-step(--1..3|__num)`, `lg-callout(--warn|--celiac|__title)`, `lg-img(--tall)`, `lg-img__caption`, `lg-kanji-legend(__item|__swatch--mandatory|--recommended|--unlisted)`, `lg-kanji-grid`, `lg-kanji-card(--mandatory|--recommended|--unlisted|__chars|__eng|__rom|__note)`, `lg-phrase(__jp|__rom|__en)`, `lg-food-grid`, `lg-food-card(__jp|__en|__desc)`, `lg-faq`, `lg-faq__item`, `rom`, `jp`; hero `lg-breadcrumb`, `sep`, `lg-hero__eyebrow|__title|__lede|__meta|__meta-dot`; `lg-disclaimer(__inner)`; `lg-cta(__inner)`, `btn`, `btn--ghost`).

- [ ] **Step 1: Failing e2e tests for the shape cues and the shim** — add to `e2e/site.spec.mjs`:

```js
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
```

- [ ] **Step 2:** `npm run build && npx playwright test -g "labeling guide"` → the shape test FAILS (no `::before` dot, borders not set); the shim test passes already (Task 2's shim) — that is expected.

- [ ] **Step 3: Write the restyle** — replace `src/styles/guide-body.css` with:

```css
/* src/styles/guide-body.css — the legacy labeling-guide body (lg-*), restyled. Text untouched. */
/* Shims: two inline styles in the guide body use variables from the retired styles.css. */
.lg-article { --font-card: var(--tm-font-display); --color-success-light: #e1eadb; }

/* ── hero (inside GuideLayout .guide-hero__copy) ── */
.lg-hero__inner { display: flex; flex-direction: column; gap: 14px; }
.lg-breadcrumb { font-size: 14px; color: var(--tm-ink-faint); }
.lg-breadcrumb a { color: var(--tm-ink-faint); }
.lg-breadcrumb .sep { margin: 0 6px; }
.lg-hero__eyebrow { font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--tm-ink-muted); }
.lg-hero__title { margin: 0; font-family: var(--tm-font-display); font-weight: 600; letter-spacing: -0.02em; font-size: clamp(2.1rem, 4.2vw, 3.3rem); line-height: 1.08; }
.lg-hero__lede { margin: 0; font-size: 19px; line-height: 1.6; color: var(--tm-ink-muted); max-width: 620px; }
.lg-hero__meta { display: flex; flex-wrap: wrap; gap: 4px 8px; font-size: 14px; color: var(--tm-ink-faint); }
.lg-hero__meta a { color: var(--tm-ink-faint); }

/* ── notice ── */
.lg-disclaimer { background: var(--tm-paper-warm); border-radius: var(--tm-radius); }
.lg-disclaimer__inner { padding: 14px 18px; font-size: 14px; line-height: 1.6; color: var(--tm-ink-muted); }

/* ── contents list (sidebar) ── */
.lg-toc { display: flex; flex-direction: column; gap: 8px; }
.lg-toc__title { font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--tm-ink-muted); }
.lg-toc__list { margin: 0; padding: 0; list-style: none; counter-reset: toc; }
.lg-toc__list li { counter-increment: toc; border-left: 2px solid var(--tm-rule); }
.lg-toc__list a { display: flex; gap: 8px; min-height: 44px; align-items: center; padding: 6px 0 6px 12px; font-size: 15px; line-height: 1.35; color: var(--tm-ink-muted); text-decoration: none; }
.lg-toc__list a::before { content: counter(toc); font-family: var(--tm-font-display); font-weight: 700; color: var(--tm-shu); min-width: 1.4em; }
.lg-toc__list a:hover { color: var(--tm-ink); }

/* ── article prose ── */
.lg-article { display: flex; flex-direction: column; gap: 48px; }
.lg-article [id] { scroll-margin-top: 24px; }
.lg-section h2 { margin: 0 0 16px; font-family: var(--tm-font-display); font-weight: 600; font-size: clamp(1.7rem, 2.8vw, 2.2rem); line-height: 1.15; }
.lg-section h3 { margin: 28px 0 12px; font-size: 20px; }
.lg-section p, .lg-section li { font-size: 18px; line-height: 1.75; color: #2e2f33; }
.lg-section p { margin: 0 0 16px; }
.lg-section a { color: var(--tm-ink); text-decoration-color: var(--tm-shu); text-underline-offset: 3px; }
.lg-takeaways { border: 1.5px solid var(--tm-ink); border-radius: var(--tm-radius); padding: 22px 26px; }
.lg-takeaways__title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--tm-ink-muted); margin-bottom: 10px; }
.lg-takeaways__list { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
.lg-takeaways__list li { font-size: 17px; line-height: 1.6; }
.lg-section#key-takeaways .lg-toc { display: none; } /* defensive: the contents list now lives in the sidebar */

/* ── tables, badges, sources ── */
.lg-table-wrap { overflow-x: auto; margin: 8px 0 16px; }
.lg-table { width: 100%; border-collapse: collapse; font-size: 16px; }
.lg-table th, .lg-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--tm-rule); vertical-align: top; }
.lg-table th { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: var(--tm-ink-muted); border-bottom: 1.5px solid var(--tm-ink); }
.badge, .lg-badge--new { display: inline-block; margin-left: 6px; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--tm-shu-text); }
.lg-sources { font-size: 13px; line-height: 1.6; color: var(--tm-ink-faint); margin-top: 8px; }
.lg-sources a { color: var(--tm-ink-faint); }

/* ── tiers chart ── */
.lg-chart { background: var(--tm-paper-warm); border-radius: var(--tm-radius); padding: 22px; margin: 8px 0 16px; }
.lg-chart__title { font-family: var(--tm-font-display); font-weight: 700; font-size: 20px; }
.lg-chart__subtitle { font-size: 14px; color: var(--tm-ink-muted); margin-bottom: 14px; }
.lg-chart__cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 16px; }
.lg-chart__col { background: #fff; border-radius: var(--tm-radius); padding: 16px; border: 1.5px solid var(--tm-rule-strong); }
.lg-chart__col--mandatory { border-color: var(--tm-ink); }
.lg-chart__label { font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.lg-chart__count { font-family: var(--tm-font-display); font-weight: 700; font-size: 44px; line-height: 1.1; }
.lg-chart__items { margin: 8px 0 0; padding-left: 18px; columns: 2; column-gap: 16px; }
.lg-chart__items li { font-size: 15px; line-height: 1.6; }
.lg-jp-inline, .jp { font-family: var(--tm-font-display); }
.rom { font-style: italic; color: var(--tm-ink-muted); }

/* ── how to read a label ── */
.lg-label-diagram { border: 1.5px solid var(--tm-ink); border-radius: var(--tm-radius); padding: 20px; margin: 8px 0 20px; display: flex; flex-direction: column; gap: 16px; }
.lg-label-diagram__title { font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--tm-ink-muted); }
.lg-label-mock { background: var(--tm-paper-warm); border-radius: var(--tm-radius); padding: 16px; font-family: var(--tm-font-display); font-size: 16px; line-height: 1.8; display: flex; flex-direction: column; gap: 10px; }
.lg-label-mock__header { font-weight: 700; }
.lg-label-mock__tag { display: inline-flex; align-items: center; margin-left: 8px; padding: 2px 10px; border-radius: var(--tm-radius-pill); background: var(--tm-ink); color: #fff; font-family: var(--tm-font-body); font-size: 12px; font-weight: 700; }
.hl--individual { background: #f7e7a8; text-decoration: underline solid var(--tm-ink) 2px; text-underline-offset: 4px; }
.hl--collective { background: #cfe3c8; text-decoration: underline dotted var(--tm-ink) 2px; text-underline-offset: 4px; }
.lg-label-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: 12px; }
.lg-label-step { font-size: 15px; line-height: 1.5; padding: 12px; border-top: 1.5px solid var(--tm-ink); }
.lg-label-step__num { font-family: var(--tm-font-display); font-weight: 700; color: var(--tm-shu); margin-bottom: 4px; }

/* ── callouts ── */
.lg-callout { border-radius: var(--tm-radius); padding: 16px 18px; margin: 8px 0 16px; background: var(--tm-paper-warm); }
.lg-callout--warn { background: var(--tm-shu-soft); }
.lg-callout--celiac { background: #e1eadb; }
.lg-callout__title { font-weight: 700; margin-bottom: 6px; }
.lg-callout p { margin: 0 0 8px; font-size: 16px; }

/* ── photos ── */
.lg-img { margin: 12px 0 20px; }
.lg-img img { display: block; width: 100%; height: auto; border-radius: var(--tm-radius); }
.lg-img__caption { margin-top: 8px; font-size: 14px; line-height: 1.5; color: var(--tm-ink-faint); }

/* ── kanji cheat sheet: shape as well as colour ── */
.lg-kanji-legend { display: flex; flex-wrap: wrap; gap: 8px 20px; margin: 4px 0 14px; font-size: 14px; color: var(--tm-ink-muted); }
.lg-kanji-legend__item { display: inline-flex; align-items: center; gap: 8px; }
.lg-kanji-legend__swatch { width: 18px; height: 14px; border-radius: 3px; background: #fff; box-sizing: border-box; }
.lg-kanji-legend__swatch--mandatory { border: 1.5px solid var(--tm-ink); position: relative; }
.lg-kanji-legend__swatch--mandatory::after { content: ""; position: absolute; top: 2px; right: 2px; width: 6px; height: 6px; border-radius: 50%; background: var(--tm-shu); }
.lg-kanji-legend__swatch--recommended { border: 1.5px solid var(--tm-ink-muted); }
.lg-kanji-legend__swatch--unlisted { border: 1.5px dashed var(--tm-ink-muted); }
.lg-kanji-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.lg-kanji-card { position: relative; background: #fff; border-radius: var(--tm-radius); padding: 14px; display: flex; flex-direction: column; gap: 2px; }
.lg-kanji-card--mandatory { border: 1.5px solid var(--tm-ink); }
.lg-kanji-card--mandatory::before { content: ""; position: absolute; top: 10px; right: 10px; width: 8px; height: 8px; border-radius: 50%; background: var(--tm-shu); }
.lg-kanji-card--recommended { border: 1.5px solid var(--tm-ink-muted); }
.lg-kanji-card--unlisted { border: 1.5px dashed var(--tm-ink-muted); }
.lg-kanji-card__chars { font-family: var(--tm-font-display); font-weight: 700; font-size: 30px; line-height: 1.2; }
.lg-kanji-card__eng { font-weight: 700; font-size: 15px; }
.lg-kanji-card__rom { font-size: 14px; font-style: italic; color: var(--tm-ink-muted); }
.lg-kanji-card__note { margin-top: 6px; font-size: 13px; line-height: 1.45; color: var(--tm-ink-muted); }

/* ── phrases, foods ── */
.lg-phrase { background: var(--tm-paper-warm); border-radius: var(--tm-radius); padding: 14px 16px; margin: 8px 0; }
.lg-phrase__jp { font-family: var(--tm-font-display); font-weight: 700; font-size: 22px; }
.lg-phrase__rom { font-size: 14px; font-style: italic; color: var(--tm-ink-muted); }
.lg-phrase__en { font-size: 16px; }
.lg-food-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 16px; }
.lg-food-card { border-top: 1.5px solid var(--tm-ink); padding-top: 12px; }
.lg-food-card__jp { font-family: var(--tm-font-display); font-weight: 700; font-size: 22px; }
.lg-food-card__en { font-weight: 700; font-size: 15px; }
.lg-food-card__desc { font-size: 15px; line-height: 1.6; color: var(--tm-ink-muted); margin-top: 4px; }

/* ── FAQ ── */
.lg-faq { border-bottom: 1px solid var(--tm-rule); }
.lg-faq__item { border-top: 1px solid var(--tm-rule); }
.lg-faq__item summary { min-height: 44px; padding: 16px 0; cursor: pointer; font-weight: 700; font-size: 18px; }
.lg-faq__item p { margin: 0 0 16px; }

/* ── closing CTA ── */
.lg-cta { background: var(--tm-ink); color: #f6f1e7; }
.lg-cta__inner { max-width: var(--tm-max); margin: 0 auto; padding: 64px var(--tm-gutter); display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
.lg-cta h2 { margin: 0; font-family: var(--tm-font-display); font-weight: 600; font-size: clamp(1.9rem, 3vw, 2.5rem); color: #fff; }
.lg-cta p { margin: 0; max-width: 640px; color: #c9c1b5; }
.lg-cta .btn { display: inline-flex; align-items: center; min-height: 56px; padding: 0 26px; border-radius: var(--tm-radius); background: var(--tm-shu); color: #fff; font-weight: 700; font-size: 17px; text-decoration: none; }
.lg-cta .btn:hover { background: var(--tm-shu-dark); color: #fff; }
```

- [ ] **Step 4:** `npm run build && npx playwright test -g "labeling guide"` → PASS (both projects). Then `npm test && npm run check:seo && npm run check:content` → pass.

- [ ] **Step 5: Look at it.** `npx astro preview --port 4321`; screenshot `/allergies/labeling-guide/` at 1280 and 375 (top, the label diagram, the kanji cheat sheet, the FAQ and CTA); compare against the `V5Guide` artboard (`/private/tmp/claude-501/-Users-iwakuralane-dev-tabemasen/1599d119-79b4-4f69-89d0-6e341b91af91/scratchpad/tab-v5/project/V5Guide.dc.html`, minus overlays and partner block). Fix spacing/hierarchy issues in `guide-body.css` only; never edit the fragments. Stop the server.

- [ ] **Step 6: Commit** `feat(guides): restyle the labeling guide body; kanji tiers marked by shape` (stage `src/styles/guide-body.css`, `e2e/site.spec.mjs`).

---

### Task 4: Guide e2e, docs, owner review, PR prep

**Files:**
- Modify: `e2e/site.spec.mjs`, `CHANGELOG.md`, spec §9 (one line), `content-manifest.json` (none — see note)

- [ ] **Step 1: Failing/added e2e tests** — add to `e2e/site.spec.mjs`:

```js
test('labeling guide: every contents link targets a section and scrolls to it', async ({ page }) => {
  await page.goto('/allergies/labeling-guide/');
  const hrefs = await page.locator('.guide-toc .lg-toc a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toHaveLength(12);
  for (const href of hrefs) await expect(page.locator(href)).toHaveCount(1);
  await page.locator('.guide-toc .lg-toc a[href="#kanji-cheat-sheet"]').click();
  await expect(page.locator('#kanji-cheat-sheet')).toBeInViewport();
});

test('labeling guide: contents list is sticky on desktop and above the body on phones', async ({ page }, info) => {
  await page.goto('/allergies/labeling-guide/');
  const position = await page.locator('.guide-toc').evaluate((el) => getComputedStyle(el).position);
  if (info.project.name === 'desktop') expect(position).toBe('sticky');
  else {
    expect(position).toBe('static');
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
```
Add `'/allergies/labeling-guide/'` to the existing axe loop (`for (const path of ['/', '/allergies/', '/guides/'])` → include it).

- [ ] **Step 2:** `npm run build && npm run test:e2e` → all pass (both projects). A failure is either a real bug (fix the code, never the fragments) or a test assumption — explain any test change in the report.

- [ ] **Step 3: Docs**
- `CHANGELOG.md`, new heading for the day of the work, line: `- design(guides): the labeling guide in the new design: guide header with illustration, contents list beside the article, restyled sections, kanji tiers marked by shape as well as colour, "Keep reading". Every word, heading and FAQ unchanged.`
- Spec §9 "Safety and testing": replace "compares against the git tag `slice2-base` (created at the start of the slice)" with "compares against `slice1-base` (the guide's text is unchanged since then; no new tag needed)".

- [ ] **Step 4: Full verification**
```bash
npm test && npm run build && npm run check:seo && npm run check:content && npm run test:e2e
```
Expected: all green.

- [ ] **Step 5: Commit** `test(e2e): labeling guide; docs: changelog and spec note` (stage `e2e/site.spec.mjs`, `CHANGELOG.md`, the spec).

- [ ] **Step 6: Owner review (stop point).** Controller starts `npx astro preview --port 4321`, opens `/allergies/labeling-guide/`, and asks the owner for quirks; each quirk becomes its own reviewed fix. Then the controller runs the final whole-branch review, pushes, and opens the PR with the recommended merge date (on or after 2026-10-26) in its description.
