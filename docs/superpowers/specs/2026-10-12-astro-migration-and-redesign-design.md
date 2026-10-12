# Astro migration and redesign (Draft 5 "sumi ink" + guides)

- **Date:** 2026-10-12
- **Branch:** `astro-redesign` (long-lived)
- **Design reference:** tabemasen redesign canvas, page "Draft 5 — sumi ink": https://claude.ai/artifact/HViaYEm78Qezy2foQpWwFZ (artboards `V5Home`, `V5HomeMobile`, `V5Hub`, `V5Guide`)

## 1. Intent

tabemasen becomes a publication about **eating in Japan with a dietary restriction**: the card generator stays the product, and a growing body of guides brings in planning-stage search traffic, builds topical authority, and later carries disclosed partner placements.

To get there the site moves from hand-written static HTML to Astro with a build step, then adopts the Draft 5 design and a guides structure.

### Success criteria

1. Every URL that exists today keeps working, with unchanged `<title>`, meta description, H1, canonical and structured data unless a change is deliberate and recorded.
2. Shared card links (`/#a=…&p=…&s=…&n=…&c=…&en=…`) keep decoding exactly as today.
3. A new guide is one `.mdx` file; its hub listings, breadcrumbs, structured data, sitemap entry and `llms.txt` entry are generated.
4. Adding a hub for a new diet is one data entry plus one page using the shared hub template.
5. Each production change is a small PR that can be reverted on its own, so ranking movements can be attributed.

### Decisions taken during brainstorming

| Topic | Decision |
|---|---|
| Delivery | Two milestones. M1 = Astro port with identical output, merged to `main`. M2 = redesign rolled out in slices, each merged separately. |
| Card builder location | Full builder (`app.js`) on `/` only. Hubs get a lightweight **picker** that builds a `/#…` link and sends the user to `/`. |
| Mandarin branch | Out of scope. `feat/mandarin-language-support` is not ported; rebuild later as a feature. |
| Guide authoring | MDX content collection with validated frontmatter. |
| Taxonomy | Guides carry `diets: string[]` (many-to-many); empty = "Eating in Japan". New guides live at `/guides/<slug>/`. |
| Hosting | GitHub Pages, deployed by GitHub Actions. No real 301s (`/gluten-free/` keeps canonical + meta refresh). |
| Previews | Local only (`npm run build && npm run preview`). |
| Styling | Plain CSS + design tokens, Astro scoped component styles. No Tailwind. |
| Fonts | Self-hosted via Fontsource (no Google Fonts requests). |

## 2. Current state (baseline)

- 12 URLs, each a hand-written `index.html` (300–1,350 lines), all sharing `/styles.css` (1,490 lines):
  `/`, `/allergies/`, `/allergies/labeling-guide/`, `/allergies/food-allergies-in-japanese/`, `/halal/`, `/halal/certification-guide/`, `/vegan/`, `/gluten-free-japan/`, `/gluten-free/` (redirect stub: canonical + meta refresh, intentionally not `noindex`), `/celiac/`, `/featured/`, `/about/`.
- Builder only on `/`: `data.js` (all Japanese strings; source of truth) + `app.js` (state, hash sync, `localStorage`, PNG export via html2canvas from cdnjs, print). Landings link to `/#p=<diet>`.
- Diet keys in `data.js`: `vegetarian`, `vegan`, `pescatarian`, `halal`, `kosher`, `gluten-free`. Allergen keys include `shrimp crab wheat buckwheat egg dairy peanut walnut almond cashew pistachio soy sesame fish shellfish chicken beef pork gelatin kiwi peach apple mushroom garlic onion oats`.
- `nav.js`, `analytics.js` (GoatCounter wrapper; never sends card content), GoatCounter script tag.
- Hand-maintained `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, `CNAME`, favicons, `assets/`.
- Deployed by GitHub Pages "Deploy from branch" (`main`, root). No CI.
- `CHANGE_REQUESTS_V1.md` and `README.md` state "no build step, no framework"; this project deliberately reverses that and updates both.

## 3. Milestone 1 — Astro port, identical output

### Goal

The built HTML for every URL equals today's HTML after whitespace and attribute-order normalisation. Only the production mechanism changes.

### Setup

- Astro (current stable), `output: 'static'`, `build.format: 'directory'`, `trailingSlash: 'always'`, `site: 'https://tabemasen.io'`.
- `package.json`, `package-lock.json`, `.nvmrc` (Node 22). `.gitignore` gains `node_modules/`, `dist/`, `.astro/`.
- `src/pages/` mirrors the URL list one to one (`src/pages/allergies/labeling-guide/index.astro`, etc.), including `src/pages/gluten-free/index.astro`.
- `public/` holds files that must stay byte-identical in M1: `styles.css`, `app.js`, `data.js`, `nav.js`, `analytics.js`, `favicon.svg`, `assets/`, `CNAME`, `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`.

### Shared layout

- **Amended 2026-10-12 (M1 plan):** M1 does not extract a shared layout. Every page's head, header and footer differ (active nav state, analytics event names, footer link lists, page-specific inline styles), so a layout could not reproduce them without a prop per line, and Milestone 2 replaces header, footer and layouts. Pages are ported verbatim with `is:inline` on every `<script>`/`<style>`. `LegacyLayout` is introduced in M2 slice 1 for pages not yet redesigned.

### Astro output traps (must hold)

- Every existing `<script>` (including `application/ld+json`) uses `is:inline`, so Astro does not bundle, hoist or rewrite it.
- Every existing inline `<style>` uses `is:inline` (or `is:global` where inlining is not needed), so no scoping hashes are added.
- No Astro integrations that inject markup in M1 (no sitemap integration yet; `public/sitemap.xml` is served as is).
- JSON-LD emitted via `set:html={JSON.stringify(...)}` must reproduce the current JSON; where reformatting would change bytes, keep the original string.

### Verification

- `scripts/compare-build.mjs`: for each of the 12 URLs, read the file from `main` (via `git show pre-astro:<path>`, the tag at `a5d5b21`) and from `dist/`, normalise (collapse runs of whitespace, sort attributes within each tag; HTML comments are kept and compared), and diff. Also byte-compare every `public/` file with its `main` counterpart. Exit non-zero on any difference. Run as `npm run compare`.
- M1 is mergeable only when `npm run compare` reports zero differences.
- One manual pass locally: build a card on `/`, copy link, open it, PNG export, print, follow each landing's `/#p=…` link.

### Deploy

- `.github/workflows/deploy.yml` using `withastro/action` to build, and `actions/deploy-pages` to publish `dist/`.
  - On push to `main`: build + `npm run compare` (M1 only) + deploy.
  - On push to `astro-redesign` and on PRs: build + checks only, never deploy.
- At M1 merge, the repo owner switches GitHub → Settings → Pages → Source from "Deploy from branch" to "GitHub Actions". This is a manual step; the PR description must call it out. `CNAME` ships inside `dist/` from `public/`.
- Rollback: revert the merge commit and switch Pages source back to "Deploy from branch".

### Housekeeping

- README: replace "No build step" quick start with `npm ci`, `npm run dev`, `npm run build`, `npm run preview`; update "Adding a new allergen" (still `data.js`, now under `public/`).
- `CHANGE_REQUESTS_V1.md` is gitignored (local notes); its "no build step" constraint is superseded by this spec.
- At the end of M1, generate `seo-baseline.json` (see §6).

## 4. Milestone 2 — information architecture and content model

### URL map

| Type | URL | Content |
|---|---|---|
| Home | `/` | Full builder, "what the staff will read" card section, ingredients section, guides teaser, partner slot, recommended-by strip |
| Hubs | `/allergies/`, `/halal/`, `/vegan/`, `/gluten-free-japan/` | Title + illustration, picker, existing body copy, "Guides for this diet", partner slot |
| Legacy guides | `/allergies/labeling-guide/`, `/allergies/food-allergies-in-japanese/`, `/halal/certification-guide/`, `/celiac/` | Same URLs, set by `permalink` frontmatter |
| New guides | `/guides/<slug>/` | All guides written from now on |
| Guides index | `/guides/` (new) | All guides grouped by diet plus "Eating in Japan"; diet filter via links (`/guides/#vegan` anchors, no client framework) |
| Other | `/about/`, `/featured/` | Restyled, content unchanged; `/about/` gains a "Partner policy" section |
| Redirect stub | `/gluten-free/` | Unchanged mechanism (canonical + meta refresh + script, not `noindex`) |

Hubs keep their current `<title>`, meta description, H1 and body copy; only layout and surrounding modules change.

### Diets and hubs (`src/data/diets.ts`)

One entry per diet, keyed by the `data.js` pattern key plus `allergies`. `glyph` is the brush-written label used by `BrushGlyph` on hubs and guide lists:

```ts
export const diets = {
  allergies:    { name: 'Allergies',            glyph: '卵', hub: '/allergies/' },
  halal:        { name: 'Halal',                glyph: '豚', hub: '/halal/' },
  vegan:        { name: 'Vegan',                glyph: '菜', hub: '/vegan/' },
  vegetarian:   { name: 'Vegetarian',           glyph: '菜', hub: null },
  pescatarian:  { name: 'Pescatarian',          glyph: '魚', hub: null },
  kosher:       { name: 'Kosher',               glyph: 'コーシャ', hub: null },
  'gluten-free':{ name: 'Gluten-free & coeliac',glyph: '麦', hub: '/gluten-free-japan/' },
} as const;
```

- `hub: null` means no hub page yet: the diet's guides appear on `/guides/` and link to `/#p=<key>`.
- Adding a hub = set `hub`, add `src/pages/<hub>/index.astro` using `HubLayout`. Guideline (not enforced): add a hub when Search Console shows demand and there are at least 2–3 guides for it.
- Builder preset for a hub picker: `allergies` → no pattern preset; every other key → `p=<key>`.

### Guide collection (`src/content/guides/*.mdx`)

Frontmatter, validated with a Zod schema in `src/content.config.ts`:

| Field | Type | Notes |
|---|---|---|
| `title` | string | `<title>` and H1 unless `h1` given |
| `h1` | string? | For legacy guides whose H1 differs from title |
| `description` | string | Meta description |
| `diets` | `DietKey[]` | Empty = "Eating in Japan" |
| `primaryDiet` | `DietKey?` | Breadcrumb parent; required when `diets.length > 1` |
| `permalink` | string? | Legacy URLs only; otherwise `/guides/<slug>/` |
| `published` | date | |
| `reviewed` | date | Shown as "Last reviewed", feeds `dateModified` and sitemap `lastmod` |
| `author` | string | Default `Nik` |
| `illustration` | `{ src, alt, signs?, captions? }?` | Header illustration (see `Illustration`) |
| `faq` | `{ q, a }[]?` | Rendered and emitted as FAQPage JSON-LD |
| `draft` | boolean | Default false; drafts are not built in production |

Reading time is computed from the body. Build fails on schema errors, duplicate permalinks, or a permalink that collides with a page route.

### Generated from the collection

- Hub "Guides for this diet" lists and the `/guides/` index.
- Breadcrumbs (Home › Diet hub › Guide; Home › Guides › Guide when no hub) and BreadcrumbList JSON-LD.
- Article JSON-LD (`headline`, `datePublished`, `dateModified`, `author`, `publisher` → existing Organization `@id`).
- "Keep reading" (same `primaryDiet` first, then shared diets, then newest).
- `sitemap.xml` (`@astrojs/sitemap`, `lastmod` from `reviewed` for guides) — replaces `public/sitemap.xml`.
- `llms.txt` (endpoint `src/pages/llms.txt.ts`) — replaces `public/llms.txt`. `llms-full.txt` stays hand-written in `public/`.

### Partners (`src/data/partners.ts`)

```ts
{ id, name, diets: DietKey[] | 'all', url, pitch, kind: 'tour' | 'class' | 'insurance' | 'other' }
```

- `PartnerSlot` renders only when at least one real entry matches; no placeholders ship.
- Links use `rel="sponsored noopener"`. Every slot carries: "Partner link: we may earn a commission. It never changes what the card says or which guides we write."
- `/about/` gains "Partner policy" explaining selection and disclosure.

### Out of scope

Mandarin cards, a CMS, site search, comments, new hubs beyond the four, changes to `data.js` wording, and the Search Console title/description CTR fixes (done as separate small PRs, see §6).

## 5. Milestone 2 — design system and components

### Tokens (`src/styles/tokens.css`)

From Draft 5:

- Colour: `--paper #ffffff`, `--paper-warm #f6f1e7`, `--ink #1d1d1f`, `--ink-muted #45474d`, `--ink-faint` (start `#5c5348`, adjust until 4.5:1 on both papers), `--shu #c4412b`, `--shu-dark #a8361f`, `--shu-soft #f7e7e0`, `--warning-ink #9b2f18`, `--ai #2c3a57`, `--rule #ddd4c3`.
- Type: `--font-display` Shippori Mincho; `--font-body` Zen Kaku Gothic New; `--font-brush` Yuji Syuku. No handwriting font; annotations use `--font-display` in `--shu`.
- Spacing scale (4px base), radii (4px default, 999px chips), max content width 1440px with 64px desktop / 16px mobile gutters.

`src/styles/global.css` holds resets, base typography and link styles. Components use scoped `<style>`. Legacy `/styles.css` is loaded only by pages still on `LegacyLayout` and is deleted in the last slice.

### Fonts

Fontsource packages for the three families, imported in `BaseLayout`. Japanese families are served as unicode-range subsets, so a page downloads only the slices it uses. `font-display: swap`. No requests to Google Fonts.

### Components (`src/components/`)

| Component | Purpose |
|---|---|
| `SiteHeader`, `SiteFooter` | New nav: Guides, Allergies, Halal, Vegan, Gluten-free, "Make my card" |
| `SealMark` | 食 hanko logo |
| `Breadcrumbs` | Visual + BreadcrumbList JSON-LD |
| `Wash` | Watercolour highlight behind inline text; `soft` variant |
| `BrushGlyph` | Large brush kanji, optional reading/gloss |
| `Illustration` | Image (via `astro:assets`) + overlay `signs[]` (Japanese lettered onto blank signs: text, box in %, colour, vertical) + `captions[]` (Japanese, gloss, position in %, leader line). Overlays are `aria-hidden`; the image carries the alt text. |
| `ExampleCard` | Static card rendering (Japanese + optional English) with optional margin notes |
| `Picker` | Chips for a diet's relevant options + severity toggle + "Generate my Japanese [diet] card →". Progressive enhancement: the button is an `<a href="/#p=<diet>">`; a small script appends `a=`/`s=` from the selected chips. Reads allergen keys and labels from `data.js` at build time (imported as a module copy, see below). |
| `GuideCard`, `GuideList` | Guide teasers and grouped lists |
| `CardCta` | In-article call to the builder, diet-aware |
| `PartnerSlot` | See §4 |
| `LabelFigure` | Annotated Japanese food label (rows + highlighted span + note) |
| `KeyTakeaways`, `Faq` | Article modules; `Faq` emits FAQPage JSON-LD |

Layouts: `BaseLayout` (head, fonts, header/footer, analytics), `HubLayout`, `GuideLayout` (sticky table of contents generated from `h2`s, header illustration, meta line, Article JSON-LD), `LegacyLayout` (from M1, until the last slice).

### Sharing `data.js` with build-time code

`data.js` stays the single source of truth and keeps working as a browser global for `app.js`. For build-time use (picker chip labels, `ExampleCard`), a tiny loader `src/lib/cardData.ts` evaluates `public/data.js` in a sandboxed `vm` context at build time and returns `CARD_DATA`. No duplication of strings.

### The builder on `/`

Restyled through CSS only. Every ID and class `app.js` queries is preserved. The hash format, `localStorage` keys, PNG export and print keep their behaviour. Before html2canvas captures, `app.js` awaits `document.fonts.ready` so the PNG uses the web fonts (the only `app.js` change in M2).

### Illustrations

- Source files in `src/assets/illustrations/` (counter, konbini, noren, table exist from the design canvas; the watercolour wash in `src/assets/wash.png`).
- Each has a sidecar `<name>.md` noting it was generated with Figma AI (model, date, prompt).
- Signs are generated blank and lettered in code; no AI-rendered text ships.
- Still needed before their slices: halal hub, vegan hub, gluten-free hub, `/guides/` index.

### Analytics

Existing GoatCounter event names unchanged. New: `picker-go:<diet>` and `guide-cta:<slug>`. Never include allergen selections or card text in event names (existing rule in `analytics.js`).

### Accessibility

WCAG 2.2 AA contrast on both papers; 44px minimum touch targets; real `<button>`/`<a>`; `lang="ja"` on Japanese text; decorative glyphs `aria-hidden`; every illustration has alt text; `prefers-reduced-motion` respected for any motion.

### Copy corrections carried from the design review

- Remove "The gluten-free card asks for tamari" (the card stopped suggesting tamari in `d935fa8`); use wording consistent with the current gluten-free card.
- Design quirks the owner flags later are added to the plan as tasks of the slice they touch.

## 6. Rollout, SEO safeguards, testing

### Branching and slices

`astro-redesign` is long-lived. M1 merges to `main` as one PR. Each M2 slice is a PR from `astro-redesign` (or a short branch off it) to `main`, merged only after the previous slice has had about two weeks in Search Console.

1. **Foundation + allergies:** tokens, fonts, components, layouts, guide collection, `/guides/`, new header/footer site-wide (legacy pages keep old body styles), `/`, `/allergies/`, `/allergies/labeling-guide/`, `/allergies/food-allergies-in-japanese/`.
2. **Halal:** `/halal/`, `/halal/certification-guide/`, first new halal guides.
3. **Vegan:** `/vegan/`.
4. **Gluten-free:** `/gluten-free-japan/`, `/celiac/`.
5. **About + featured**, then delete `styles.css`, `LegacyLayout`, and unused legacy assets.

### SEO safeguards

- `seo-baseline.json`, captured from M1's `dist/`: for each URL, `title`, meta description, H1, canonical, `robots` meta, and the list of JSON-LD `@type`s.
- `npm run check:seo` (runs in CI on every build) fails when:
  - a baseline URL is missing from `dist/`;
  - a baseline field differs and the URL+field is not listed in `seo-allowlist.json` (each entry has a reason and date);
  - any JSON-LD block fails to parse;
  - any built page has `noindex` (no page has it today);
  - any internal link or asset reference resolves to a missing file;
  - `sitemap.xml` lacks a built, indexable URL.
- After each slice deploys: request indexing for changed URLs in Search Console; compare 14-day clicks and average position before/after.
- Search Console CTR fixes (labeling guide, `/halal/`, `/celiac/` titles and descriptions) are separate small PRs that update `seo-allowlist.json`, never bundled with a design slice.

### Testing

- **M1:** `npm run compare` (identical output) is the gate; plus the manual builder pass.
- **M2:**
  - Vitest: picker link builder; round-trip test that every link it produces decodes to the intended state with `app.js`'s `parseHash` logic (extracted into a testable function without changing behaviour).
  - Build-time: content schema, permalink collisions.
  - Playwright (375px and 1280px): every URL loads without console errors; builder flow on `/`; picker on each hub lands on `/` with the expected selections; PNG export completes without throwing; one `@axe-core/playwright` pass per template (home, hub, guide, guides index) with no serious/critical violations.
  - `npm run check:seo` as above.

### Error handling

- Picker works without JavaScript (plain link with diet preset).
- Illustration overlays degrade to the bare image if CSS container queries are unsupported (text hidden rather than misplaced).
- PNG export keeps its existing failure handling and analytics event.

## 7. Open items owned by the user

- Switch GitHub Pages source to "GitHub Actions" at M1 merge.
- Choose and sign up for partner programmes before any `PartnerSlot` goes live (none ship until `partners.ts` has real entries).
- Approve illustration prompts/results for the halal, vegan, gluten-free hubs and `/guides/` (Figma AI credits).

## 8. Amendments (2026-10-12, before planning M2 slice 1)

Decisions taken with the owner after M1 shipped. Where they conflict with §4–§6, this section wins.

1. **Home H1 stays** "Generate your Japanese restaurant card". Draft 5's "Tell the kitchen what you can't eat." is a display line above it (`aria-hidden`, not a heading).
2. **Guide conversions are their own slices.** Slice 1 builds the guide collection, listings and `/guides/`, but the four existing guides keep their current bodies (new header and footer only). Each guide moves to MDX and `GuideLayout` in its own PR, labeling guide first. `GuideLayout`, `KeyTakeaways`, `LabelFigure`, `CardCta` and `Faq` are built in that first conversion slice, not in slice 1.
3. **No Japanese overlaid on illustrations.** `Illustration` renders the image and an optional `figcaption` below it. No lettered signs, no positioned captions. (Baking correct kanji into the artwork is possible later; it is not planned.)
4. **Partner placements are deferred.** No `PartnerSlot`, no `partners.ts`, no "Partner policy" section until real partners exist.
5. **Existing content is preserved in full** on every page that is restyled: every heading, paragraph, list item, table cell, FAQ question and answer. Enforced by `npm run check:content` (see 9 below). The only allowed text changes are listed in `content-allowlist.json` with a reason.
6. **Photos and illustrations are mixed.** The existing photos (`assets/onigiri-label-annotated.png`, `assets/ramen-shop-no-allergen-signage.png`) are reused alongside the watercolours.
7. **The card has a design**: "Card + builder" page on the design canvas (`CardBuilder`, `CardBuilderMobile`, `CardLong`). Its CSS targets the class names `app.js` renders, so the same stylesheet styles the live card, the PNG export and print. The builder keeps every ID and class `app.js` uses; emoji in the builder chrome (🚨 🔗 ⬇ 🖨) become text and stroke icons.
8. **Mandatory allergens are flagged in `data.js`** (`mandatory: true`); shipped in PR #13 before slice 1.
9. **Content preservation check.** `npm run check:content` extracts text blocks (headings, paragraphs, list items, table cells, summaries, figcaptions, blockquotes) from each page listed in `content-manifest.json` at a git ref (the slice's base tag) and from `dist/`, and fails if any block from the ref is missing from the new page and not allowlisted.
10. **Legacy pages keep being full documents.** Instead of a `LegacyLayout`, each not-yet-redesigned page swaps its old header and footer markup for the `SiteHeader` and `SiteFooter` components and drops `nav.js`. Its body and inline styles stay as they are.
11. **Design tokens are prefixed `--tm-`** so they never collide with `styles.css` custom properties on legacy pages.
12. **`sitemap.xml` is generated by an endpoint** (`src/pages/sitemap.xml.ts`) in the existing format (`loc`, `changefreq`, `priority`, `lastmod` where known), not by `@astrojs/sitemap`, so the URL GSC knows stays `/sitemap.xml`. `llms.txt` generation waits until the first MDX guide exists; until then it is edited by hand.
13. **Hub CTAs use the long form** "Generate my Japanese [diet] card →" (owner's standing rule), including the existing `/allergies/` hero and closing CTAs.
