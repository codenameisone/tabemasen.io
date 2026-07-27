# Japan Restaurant Allergy Card

**Generate a free Japanese restaurant card for your food allergies and dietary needs. No signup. Mobile-first. Built for tourists in Japan.**

👉 **Live site:** https://tabemasen.io

---

## Why this exists

Tourists in Japan with food allergies, religious dietary requirements, or lifestyle restrictions (vegan, vegetarian, gluten-free) struggle to communicate their needs at restaurants. Many don't know that:

- Japanese "vegetarian" food often contains **dashi** (fish/bonito stock)
- Standard **soy sauce contains wheat** (gluten issue)
- **Mirin contains alcohol** (halal issue)

This is a free, fast, mobile-first web app that generates a polite, accurate Japanese restaurant card you can show on your phone or print. One page, no signup, no accounts.

Analytics are the bare minimum needed to keep the product working: [GoatCounter](https://www.goatcounter.com/) records page views and a handful of anonymous events — which buttons get used, and whether PNG export is failing. No cookies, no fingerprinting, no cross-site tracking, no ad networks, nothing sold or shared. **Your card never leaves your browser.** Allergens, your name and any custom text live only in the URL fragment and localStorage, neither of which is ever sent to analytics — see `analytics.js`.

---

## Features

- Select from 23 allergens (Japan's 8 mandatory + common others)
- Choose a dietary pattern: Vegetarian · Vegan · Pescatarian · Halal · Kosher · Gluten-free
- Add a custom item (any language, shown as-is)
- Add your name for a personalised greeting
- Live card preview — updates as you tap
- Shareable link (your selections are encoded in the URL)
- Download as PNG for offline use
- Print-friendly stylesheet
- LocalStorage persistence — your selections survive page refresh

---

## Quick start

No build step. Open `index.html` directly in your browser, or serve from GitHub Pages.

```bash
# Serve locally (any static server)
python3 -m http.server 8000
# → open http://localhost:8000
```

Deploy to GitHub Pages: push to `main` branch — enable Pages in repo settings, point to `/`.

---

## Adding a new allergen or language

All content lives in `data.js`. Open it and scroll to the `CARD_DATA` object.

**To add a new allergen:**
```js
{ key: 'peanut', japanese: '落花生（ピーナッツ）', english: 'Peanut' },
```
Add one line — the UI and card will pick it up automatically.

**To add a new dietary pattern**, add to `CARD_DATA.patterns` with:
- `key` — URL-safe identifier
- `statement` — Japanese sentence declaring the restriction
- `exclusions` — array of Japanese item names to add to the card's list
- `note` — (optional) special note appended below the list

**Contributions welcome** — especially native Japanese speakers reviewing translations.

---

## Disclaimer

Translations are checked against common Japanese restaurant phrasing but are not a substitute for medical advice or professional translation. If you have a life-threatening allergy, please carry an EpiPen and a doctor's letter in Japanese.

This card was machine-generated. Please verify with the restaurant. Severe allergy sufferers should travel with a doctor's note in Japanese.

---

## License

MIT
