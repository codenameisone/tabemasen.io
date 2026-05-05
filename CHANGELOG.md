# Changelog

## 2026-05-05

- fix(B1): persist Show English toggle across page reloads — `showEnglish` is now saved to localStorage; previously only read on load, so the toggle silently reverted to off after every reload
- fix(B2): Clear All no longer wipes the Show English preference — clearing selections is for allergens/patterns/custom text, not for display preferences
- fix(B3): iOS Safari PNG share now has a popup-blocker-safe fallback tab — the fallback tab is pre-opened during the user gesture so a later `navigator.share` rejection can navigate to the blob URL instead of being silently blocked

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
