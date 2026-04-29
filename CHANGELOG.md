# Changelog

## 2026-04-29

- fix: allergen and pattern chips now correctly deselect on tap (Android Chrome regression) — `buildAllergenChips()` and `buildPatternButtons()` confirmed running before `cacheEls()` so the cached NodeList is always populated
