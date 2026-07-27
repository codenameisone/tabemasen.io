# Changelog

## 2026-07-27

- feat(analytics): GoatCounter event tracking via new shared `analytics.js`. Exposes `window.tabemasenTrack(name)` and auto-tracks any element carrying `data-gc-event`. Events are queued for up to ~4s while the async `count.js` loads, so events fired at DOMContentLoaded aren't lost
- feat(analytics): CTA clicks tracked per page *and* per slot (`cta-vegan-hero`, `cta-vegan-footer`, …) — GoatCounter stores the event name in the path column and does not record the originating page, so the slot has to live in the name
- feat(analytics): card actions — `card-copy`, `card-download`, `card-print`, plus `card-download-error` on both PNG failure paths, which previously only ever surfaced as an `alert()` the user saw and we didn't
- feat(analytics): `pattern-<key>` on first select of a diet pattern (not on deselect), `builder-engaged` once per page load on first builder interaction, and `arrive-shared` / `arrive-preset-<key>` to separate shared-card links from landing-page CTA arrivals
- feat(analytics): `coffee-<page>` on the Buy me a coffee footer link, so donations are attributable to the page that drove them
- No card content ever reaches analytics: allergens, name and custom text are health data, GoatCounter's default path excludes the hash, and the only dynamic event name is a pattern key validated against `CARD_DATA`
- fix: the three CTAs on `/food-allergies-in-japanese/` linked to `/#p=allergies`, which is not a pattern key (`vegetarian`, `vegan`, `pescatarian`, `halal`, `kosher`, `gluten-free`). It preselected nothing and wrote a junk pattern into localStorage that survived reloads. Now link to `/`
- docs: README no longer claims "no tracking" — replaced with what's actually collected and, more importantly, what isn't: card contents never leave the browser

## 2026-05-07

- feat(T0): site navigation with mobile hamburger and 5 destinations (Generate card, Allergies, Gluten-free, Vegan, Halal). Shared `nav.js` handles aria state, focus, Esc, outside-click, and breakpoint sync. Active page is hardcoded per page; CTA "Generate card" gets emphasised weight.
- feat(T1): `/gluten-free/` landing page with placeholder content — page-specific title/description, OG and Twitter meta, canonical URL, FAQPage JSON-LD, hero/sections/grid/card preview/FAQ/CTA layout, both CTAs deep-link to `/#p=gluten-free` to pre-select the gluten-free pattern on the homepage. Sitemap updated with the new URL.

## 2026-05-05

- revert(B3): no longer pre-open the iOS fallback tab on Safari/DDG. The pre-open consumed transient user activation that `navigator.share` needs, leaving Safari/DDG iOS users staring at a blank tab with no share sheet. Firefox/Chrome iOS still pre-open because they go down the blob-in-tab path
- fix: DDG iOS no longer needs three taps before the share sheet appears. `navigator.canShare({files})` returned false on DDG's cold first call and only warmed up by tap 2-3, sending the first taps down the blob-in-tab path which then silently failed. Replaced the probe with UA classification — Firefox/Chrome iOS use blob-in-tab, everything else on iOS uses share()
- fix(B1): persist Show English toggle across page reloads — `showEnglish` is now saved to localStorage; previously only read on load, so the toggle silently reverted to off after every reload
- fix(B2): Clear All no longer wipes the Show English preference — clearing selections is for allergens/patterns/custom text, not for display preferences
- fix(B3): iOS Safari PNG share now has a popup-blocker-safe fallback tab — the fallback tab is pre-opened during the user gesture so a later `navigator.share` rejection can navigate to the blob URL instead of being silently blocked
- feat(D1): English mirror now defaults to shown — the trust feature is on by default. Hash uses `en=0` to opt out; legacy `en=1` URLs still parse as shown. localStorage with explicit `showEnglish: false` is preserved
- chore: bumped footer version to v1.2
- refactor(T1): syncUI re-queries chip/pattern lists each render — no stale NodeList. Dropped the `cacheEls()` chip/pattern caches; queries are negligible (<25 chips)
- fix(T2): English block no longer clips on long cards — `.card-en` max-height bumped from 800px to 3000px (animation duration 350→500ms to match)
- refactor(T3): rename `.radio-option` / `.radio-label` to `.severity-option` / `.severity-label` (severity is a checkbox now, not a radio group); dropped the now-orphan `input[type="radio"]` selector

## 2026-05-03

- fix: PNG download now works in Firefox on iPhone — replaced `canvas.toDataURL` with `canvas.toBlob` + `URL.createObjectURL` so large data URLs no longer silently fail
- feat: on iOS (all browsers), tapping Download triggers the native share sheet via `navigator.share({ files })` (iOS 15+); older iOS falls back to opening the image in a new tab for long-press save
- fix: sticky hover highlight on allergen and diet chips after tap-to-deselect on mobile — hover styles now gated behind `@media (hover: hover)` so touch devices never apply them
- fix: action bar buttons (Copy Link / Download PNG / Print) now scroll horizontally on narrow screens instead of silently overflowing; button `flex` changed to `1 0 auto` to prevent invisible compression

## 2026-04-29

- fix: allergen and pattern chips now correctly deselect on tap (Android Chrome regression) — `buildAllergenChips()` and `buildPatternButtons()` confirmed running before `cacheEls()` so the cached NodeList is always populated
- content: gluten-free pattern now includes cross-contamination request by default
- content: gluten-free now explicitly lists barley tea and malt as hidden gluten sources
- verify: mushroom allergen confirmed deployed and selectable (きのこ全般 present in allergens list)
- content: added "safety net" framing and Resources section in footer
- feat: English mirror of the card, with toggle to hide
- feat: dietary patterns are now multi-select (e.g. gluten-free + pescatarian); URL hash uses comma-separated `&p=` values; old single-value URLs still work
