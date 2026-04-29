# Changelog

## 2026-04-29

- fix: allergen and pattern chips now correctly deselect on tap (Android Chrome regression) — `buildAllergenChips()` and `buildPatternButtons()` confirmed running before `cacheEls()` so the cached NodeList is always populated
- content: gluten-free pattern now includes cross-contamination request by default
- content: gluten-free now explicitly lists barley tea and malt as hidden gluten sources
- verify: mushroom allergen confirmed deployed and selectable (きのこ全般 present in allergens list)
- content: added "safety net" framing and Resources section in footer
