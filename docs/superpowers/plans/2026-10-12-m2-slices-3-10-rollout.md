# M2 Slices 3–10: Remaining Pages Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every remaining legacy page onto the new design, one page per slice, with the same guarantees as slices 1–2, adding an illustration to every guide or hub that has none; then retire the legacy stylesheet.

**Architecture:** Guides reuse `GuideLayout` + extracted verbatim fragments + a per-page body stylesheet (reference implementation: `/allergies/labeling-guide/`, slice 2). Hubs reuse `HubLayout` + `Picker` (live preview) + the extracted verbatim body (reference implementation: `/allergies/`, slice 1). About and featured use `BaseLayout` + extracted fragments. Each slice ends on its own stacked branch and PR; **nothing is merged** (owner instruction, 2026-10-12).

**Tech Stack:** Astro ^7.3.8, parse5, Vitest + container API, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-10-12-astro-migration-and-redesign-design.md` (§8 and §9 bind for every slice; this plan applies §9's guide approach to the other guides and §8's hub approach to the other hubs).

## Global Constraints

- Owner instruction: rework the pages one by one without stopping; same criteria; the only additions are illustrations where a guide/hub has none; **do not merge anything**.
- For every page: `npm run check:seo` passes with `seo-allowlist.json` `"changes": []` (title, description, H1, canonical, robots, JSON-LD types unchanged); `npm run check:content` passes against `slice1-base`; every word, element order and heading of the page body stays; fragments are extracted programmatically (`scripts/lib/extract-html.mjs`), never retyped.
- Allowed text changes, each allowlisted in `content-allowlist.json` with a reason: CTA button wording to the long form "Generate my Japanese [diet] card →" (allergy, halal, vegan, gluten-free, celiac); decorative phone-mockup text removed from heroes (handled by excluding the mockup's container in `content-manifest.json`, as `/allergies/` does with `.al-phone-stage`).
- Analytics names on existing elements are kept verbatim (`cta-<page>-hero|mid|mid-2|footer|inline-*`, `coffee-<page>`, `cta-<page>-nav`, `featured-*`). Hub pickers fire the page's existing hero event; the picker's builder link fires `cta-<page>-builder`.
- Hub pickers start empty (no allergens, severity off) with the diet's pattern applied; chips, preview card and both links share one state; works without JS.
- Colour is never the only cue (shape/marker/text as well); tokens `--tm-*`; no Google Fonts; no emoji in new chrome; touch targets ≥ 44px; contrast ≥ 4.5:1; no Japanese overlaid on illustrations.
- Illustrations: watercolour files from `/private/tmp/claude-501/-Users-iwakuralane-dev-tabemasen/1599d119-79b4-4f69-89d0-6e341b91af91/scratchpad/img2/` copied into `src/assets/illustrations/` with a `.md` sidecar (model gemini-3.1-flash-image via Figma AI, 2026-10-12, prompt, "levelled to white"; halal-street also "faint marks on the noren retouched").
- **Stage only the files you change; never `git add -A` / `git add .`.**
- Commits end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01UpttBQPap9JzyZfAZEcyqK
  ```

## Review Focus

1. **Guides without a contents list** must not render an empty sidebar column or empty `<aside>` landmark (slice 2 review finding). Pinned by Slice 3 Task A's container test.
2. **Pages whose inline styles use retired `styles.css` variables** (`var(--color-…)`, `var(--font-…)`, `var(--space-…)`, `var(--radius-…)`) must still render once `styles.css` is gone. Pinned in every migrate task by a grep of the extracted fragments for `var(--` and a shim rule for each variable found.
3. **In-page anchors** (`href="#…"`) inside every migrated body must still resolve. Pinned by each slice's e2e "every in-page link resolves" test.
4. **Mid-page CTAs inside bodies** (`*-mid-cta`) keep their events and link to the right builder state (`/` or `/#p=<pattern>`). Pinned by each slice's e2e CTA test.
5. **Retiring `styles.css`** must not break the `/gluten-free/` redirect stub, which links it. Pinned by Slice 10's check that no built page references `/styles.css` or `/nav.js` before deletion.

---

## Pages and their parameters

| Slice | Page | Type | Prefix | Phone mockup to exclude | Illustration (alt) | CTA wording change | Hub picker |
|---|---|---|---|---|---|---|---|
| 3 | `/allergies/food-allergies-in-japanese/` | guide (no contents list) | `fa-` | `.fa-phone-stage` if present (check) | `bakery.jpg` — "Watercolour sketch: at a Japanese bakery counter, a traveller holds up a small card and the shop assistant leans in to read it" | "Generate my allergy card →" → "Generate my Japanese allergy card →" | — |
| 4 | `/halal/` | hub | `hl-` | `.hl-phone-stage` (check) | `halal-street.jpg` — "Watercolour sketch: a Muslim traveller couple read a standing menu board outside a small Japanese restaurant on an evening street" | "Generate my halal card →" → "Generate my Japanese halal card →" | diet `halal`; chips `shrimp crab wheat buckwheat egg dairy peanut walnut cashew sesame soy fish`; `showSeverity: false` |
| 5 | `/halal/certification-guide/` | guide (has contents list `.cg-toc`) | `cg-` | none | `cert-door.jpg` — "Watercolour sketch: a hand slides open a Japanese restaurant door with a round sticker and a small plaque on the glass" | footer "Generate my halal card →" → "Generate my Japanese halal card →"; inline links unchanged | — |
| 6 | `/vegan/` | hub | `vg-` | `.vg-phone-stage` (check) | `shojin.jpg` — "Watercolour sketch: a Buddhist temple vegetarian meal of small dishes on a red lacquered tray, a moss garden beyond the paper door" | "Generate my vegan card →" → "Generate my Japanese vegan card →" | diet `vegan`; chips `wheat buckwheat peanut walnut cashew sesame soy`; `showSeverity: false` |
| 7 | `/gluten-free-japan/` | hub | `gf-` | `.gf-phone-stage` (check) | `sushi.jpg` — "Watercolour sketch: a sushi counter with nigiri, rice, green tea and two small soy sauce bottles, the chef working behind" | "Generate my gluten-free card →" → "Generate my Japanese gluten-free card →" | diet `gluten-free`; chips `egg dairy soy sesame buckwheat peanut shrimp crab fish`; `showSeverity: true` |
| 8 | `/celiac/` | guide (no contents list) | `ce-` | `.ce-phone-stage` (check) | `supermarket.jpg` — "Watercolour sketch: a traveller in a Japanese supermarket aisle turns over a packet of rice crackers to read the label" | "Generate my celiac card →" → "Generate my Japanese celiac card →" | — |
| 9 | `/about/`, `/featured/` | pages | `ab-`, `ft-` | `.ab-phone-stage` if present | none (not guides) | none (already "Generate my Japanese restaurant card →") | — |
| 10 | cleanup | — | — | — | — | — | — |

"(check)" = confirm the mockup's container class with `grep -o 'class="[a-z]*-phone[a-z_-]*"' <page> | sort -u` and exclude its outermost container; if a page has no mockup container, skip the exclusion.

---

## Shared procedure M (migrate one page) — used by every slice's Task A

Inputs: the page's row above. Reference implementations to read first: guides → `src/pages/allergies/labeling-guide/index.astro`, `scripts/extract-labeling-guide.mjs`, `src/styles/guide-body.css`; hubs → `src/pages/allergies/index.astro`, `src/layouts/HubLayout.astro`; pages → `src/pages/guides/index.astro` + `BaseLayout`.

- [ ] **M1. Inventory.** Record in the report: head (title, description, canonical, og:type, any `article:*` meta, number of JSON-LD blocks), body landmarks (`<prefix>-hero`, `__inner`, `__copy`, phone mockup, `<prefix>-main`/`article`, `<prefix>-toc`, `<prefix>-cta`, mid CTAs, trust strips, disclaimers), every `data-gc-event`, every `var(--…)` inside the body, every `href="#…"`, and the full class inventory (`awk '/<body/,0' <file> | grep -o 'class="[^"]*"' | tr ' ' '\n' | sort | uniq -c`).
- [ ] **M2. Extractor (one-off, committed).** `scripts/extract-<page-slug>.mjs` modelled on `scripts/extract-labeling-guide.mjs`, writing `_jsonld-N.json` (assert the count from M1; each parses), `_hero.html` (guides/pages: the hero's text container — `__inner`, or `__copy` when a phone mockup sits beside it), `_notice.html` (if the page has a disclaimer/trust strip outside main), `_toc.html` (if it has a contents list), `_body.html` (main/article; contents list removed if it was inside), `_cta.html` (closing CTA with the button wording changed per the table, event attribute untouched). Assert with greps: new wording present once per CTA, `data-gc-event` values unchanged, no contents list left in the body.
- [ ] **M3. Page.** Rewrite `index.astro`:
  - Guides: `GuideLayout` exactly as the labeling guide (head slot for any `article:*` meta, `hero`/`notice`/`toc`/default/`cta` slots via `<Fragment set:html>`), `related={relatedGuides(await getCollection('guides'), <diet>, '<guide id>')}` (guide ids: `food-allergies-in-japanese`, `halal-certification-guide`, `celiac`; diets: allergies, halal, gluten-free), illustration from the table.
  - Hubs: `HubLayout` exactly as `/allergies/` — `eyebrow`, `h1`, `lede`, `reviewed`, `microcopy` (if the hero has it) copied from the extracted hero by script output, not by hand (print them from the extractor and paste the printed strings); `picker` per the table with `event: 'cta-<page>-hero'`; `example` empty; `ctaLabel` long form; `closing` from the extracted CTA (heading, text, event); body = `_body.html`. If the hero contains text HubLayout has no prop for, add an optional `heroExtra` slot to `HubLayout` rendered under the lede (raw HTML), with a container test.
  - Pages: `BaseLayout` + `<section class="tm-container page-hero">` with `_hero.html` + body + `_cta.html`.
- [ ] **M4. Body stylesheet.** `src/styles/<slug>-body.css` restyling every class in the inventory on `--tm-*` tokens, following `guide-body.css` patterns (serif headings, 18px prose, cards, callouts, tables, FAQ disclosures, CTA blocks), plus one shim rule on the body root for each retired variable found in M1. Wherever the legacy design distinguished items by colour only (tiers, safe/unsafe, yes/no), add a non-colour cue (marker, border style, or icon) and pin it with an e2e computed-style assertion.
- [ ] **M5. Manifest/allowlist.** `content-allowlist.json`: one entry per changed CTA wording (exact old text, reason "Owner rule: long-form CTA"). `content-manifest.json`: for the page's entry add the phone-mockup container to `exclude` (keep `.site-header`, `.site-footer`). Never allowlist any other text.
- [ ] **M6. Guards.** `npm test && npm run build && npm run check:seo && npm run check:content`. Any missing block other than the allowed ones means extraction or layout dropped text: fix it, never the text.
- [ ] **M7. Visual pass.** `npx astro preview --port 4321`, Playwright screenshots at 1280 and 375 (top, a mid-page block, the bottom) into the plan workspace `shots/` as `<slug>-1280.png`, `<slug>-375.png`; fix hierarchy/spacing in the page's stylesheet only.
- [ ] **M8. Commit** `feat(<area>): <page> on the new design (body text unchanged)` staging only the slice's files.

## Shared procedure T (tests, docs) — used by every slice's Task B

- [ ] **T1. E2E** (`e2e/site.spec.mjs`, a `describe('<page>')` block): page loads with no console errors (already covered by the PAGES loop — confirm it's listed); every in-page `href="#…"` link resolves to exactly one element; every CTA (hero/mid/footer/inline) keeps its `data-gc-event` and its href (`/`, `/#p=<pattern>`); no horizontal overflow at 375; for hubs: picker starts empty, tapping a chip updates `#hub-card`, the CTA and builder link hrefs equal and the hand-off matches the builder card (copy the `/allergies/` tests, parameterised by diet/pattern); for guides with a contents list: sticky on desktop, above the body on phones; each colour-cue added in M4 asserted by computed style; add the page to the axe loop.
- [ ] **T2.** `npm run build && npm run test:e2e` → green; then full `npm test && npm run check:seo && npm run check:content`.
- [ ] **T3. Docs.** `CHANGELOG.md` one line under today's heading: `- design(<area>): <page> in the new design[ with a new illustration]. Every word, heading and FAQ unchanged.`; README unchanged unless a new npm script appears.
- [ ] **T4. Commit** `test(e2e): <page>; docs: changelog`.

## Controller procedure per slice

1. Dispatch Task A (procedure M, the slice row) → task review → fix loop.
2. Dispatch Task B (procedure T) → task review → fix loop.
3. Own visual pass of the slice's screenshots (owner review deferred to the PR per owner instruction).
4. Create the stacked branch `m2/<NN>-<slug>` at HEAD, push it, open a PR with base = the previous slice's branch (slice 2's base = `main`), titled "M2 slice NN: <page> (do not merge before <date>)", body = what changed, guard outputs, illustration note, recommended merge order and timing (two weeks of Search Console between merges). **Never merge.**
5. Ledger the slice complete; continue with the next slice without stopping.

---

### Slice 3 — `/allergies/food-allergies-in-japanese/`

#### Task A (procedure M) + GuideLayout fix
Before M3: make `GuideLayout` handle guides with no contents list — render `<aside class="guide-toc">` only when `Astro.slots.has('toc')`, and when absent give `.guide-main` the modifier class `guide-main--solo` (`grid-template-columns: minmax(0, 760px); justify-content: start`). Container test first in `tests/guide-layout.test.ts`: rendering without a `toc` slot produces no `guide-toc` element and a `guide-main--solo` class; with a `toc` slot, unchanged. Then procedure M for the row.

#### Task B (procedure T)

### Slice 4 — `/halal/` (Task A: M; Task B: T)
### Slice 5 — `/halal/certification-guide/` (Task A: M; Task B: T)
Inline links "tabemasen generates this card for free" (events `cta-halal-cert-inline-verify`, `cta-halal-cert-inline-faq`) stay verbatim inside the body.
### Slice 6 — `/vegan/` (Task A: M; Task B: T)
### Slice 7 — `/gluten-free-japan/` (Task A: M; Task B: T)
Two mid CTAs (`cta-gluten-free-mid`, `cta-gluten-free-mid-2`) inside the body: wording to the long form, allowlisted (same old text, one entry covers all occurrences).
### Slice 8 — `/celiac/` (Task A: M; Task B: T)
Celiac CTAs keep `href="/#p=gluten-free"`.
### Slice 9 — `/about/` and `/featured/` (Task A: M for both pages; Task B: T for both)
`/featured/` keeps all `featured-*` events and its two logo images.

### Slice 10 — cleanup
#### Task A
- [ ] `grep -rl 'styles.css\|nav.js' dist/ src/` → only `src/pages/gluten-free/index.astro` (the redirect stub) may remain. Remove its `<link rel="stylesheet" href="/styles.css">` line (the stub's body is a short notice; give it a 4-line inline style block with `--tm-*`-free plain values: max-width 40rem, margin auto, padding 4rem 1.5rem, system-ui font). Its canonical, meta refresh, title and script stay byte-identical.
- [ ] `git rm public/styles.css public/nav.js`; remove the M1 compare script and its tests? **No** — keep `scripts/compare-build.mjs` (history tool); remove `"compare"` from nothing.
- [ ] Guards: `npm test && npm run build && npm run check:seo && npm run check:content && npm run test:e2e`, plus `grep -rl 'styles.css\|nav.js' dist/` → nothing.
- [ ] Commit `chore: retire legacy styles.css and nav.js`.
#### Task B
- [ ] README: remove mentions of `styles.css`/`nav.js` if any; CHANGELOG line; spec §8 add item 18: "All pages are on the new design; `styles.css` and `nav.js` are retired."
- [ ] Commit `docs: legacy stylesheet retired`.
