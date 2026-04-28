# Japan Allergy & Dietary Card Generator — PRD

**Status:** Ready for implementation
**Audience:** Claude Code (autonomous build)
**Deployment target:** GitHub Pages (static site, no backend)

---

## 1. Problem & Opportunity

Tourists in Japan with food allergies, religious dietary requirements, or lifestyle restrictions (vegan, vegetarian, gluten-free) struggle to communicate their needs at restaurants. Existing solutions are paid apps, scattered Google Docs, or low-quality printable PDFs. Many travellers don't know that:

- Japanese "vegetarian" food often contains **dashi** (fish/bonito stock).
- Standard **soy sauce contains wheat** (gluten issue).
- **Mirin contains alcohol** (halal issue).
- Even "vegetable broth" frequently includes katsuo dashi.

We will ship a free, fast, mobile-first web app that generates a polite, accurate Japanese restaurant card the user can show on their phone or print. One page, no signup, no tracking.

## 2. Goals & Non-Goals

### Goals
- Generate a Japanese-language restaurant card from user-selected restrictions in under 30 seconds.
- Mobile-first — the primary use case is showing the phone screen to a waiter.
- Fully static, deployable to GitHub Pages with no build step.
- Shareable via URL (selections encoded in the URL hash).
- Downloadable as a PNG for offline use.
- Polished enough to be linkable from r/JapanTravel, r/JapanTravelTips, r/Tokyo, r/JapanTravelAdvice.

### Non-Goals (v1)
- Restaurant search / recommendations.
- User accounts, saved profiles, history.
- Languages other than Japanese (English UI, Japanese output only).
- Translation of restaurant menus.
- Offline-first PWA (regular site is fine; works offline once loaded).
- Backend, database, or analytics beyond a privacy-respecting page-view counter (skip for v1).

## 3. Target User

**Primary:** English-speaking tourist, 20–60, in Japan for 1–3 weeks, with at least one dietary restriction. Likely on mobile, possibly with limited data, in a restaurant *right now*.

**Secondary:** Japan-bound traveller researching pre-trip, looking to print or screenshot cards to bring along.

## 4. Core User Story

> As a tourist with a peanut allergy, I open the site on my phone, tap "Peanut" and "Severe allergy", see the generated Japanese card, and show it to the waiter. I can also screenshot it or download a PNG to keep on my phone for the rest of the trip.

## 5. Functional Requirements

### 5.1 Selection
- User can select one or more **allergens** from a list (multi-select chips).
- User can select **one** dietary pattern (vegetarian / vegan / pescatarian / halal / kosher / gluten-free), or none. Patterns and allergens combine.
- User can mark severity: **"Allergy (medical)"** vs **"Preference"**. Default: Allergy if any allergen selected, Preference if only a dietary pattern.
- User can add a free-text custom item (English input, displayed as-is on the card with a note that it's user-provided text — don't fake-translate it).
- User can optionally enter their first name to personalise the card greeting.

### 5.2 Card Output
- Card renders live as the user makes selections — no "Generate" button.
- Card uses real, natural Japanese (translations provided in §7).
- Card has a clear visual hierarchy: greeting → restriction statement → bulleted list of items → polite question → thank you.
- For severe allergies, a red warning line is added: 重度のアレルギーで、少量でも命に関わります。

### 5.3 Sharing & Export
- **Copy link** button — copies a URL with selections encoded in the hash (e.g. `#a=peanut,wheat&p=vegetarian&s=severe`). Loading that URL pre-selects everything.
- **Download PNG** button — exports the card as an image using `html2canvas` (loaded from CDN). Filename: `japan-card-YYYY-MM-DD.png`.
- **Print** button — opens print dialog with a print-stylesheet that hides controls and shows only the card.

### 5.4 Persistence
- User selections persist in `localStorage` so reopening the site restores the last card.
- A "Clear" button resets state.

## 6. UI / UX Requirements

### Layout (mobile portrait, primary)
1. **Header:** Title ("Japan Restaurant Card"), one-line tagline ("Show this to your waiter"), tiny GitHub link.
2. **Selection panel:** Tabs or accordions for *Allergens* / *Diet* / *Severity* / *Optional*.
3. **Live card preview:** Large, high-contrast, Japanese-first. This is the hero of the page.
4. **Action buttons:** Copy link · Download PNG · Print. Sticky at bottom on mobile.
5. **Footer:** Disclaimer (see §10), source link, "Built by a fellow traveller" line.

### Visual style
- Clean, minimal, high contrast. No stock photos.
- Japanese text in a serif or rounded-sans web-safe stack: `"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif` for the card body.
- Card background: warm off-white (#FBF8F1 or similar), subtle border. Should look like a paper card, not a dialog box.
- Allergen chips: pill-shaped, tap targets minimum 44×44px.
- Severity warning: red text/background, but not screaming — communicate medical seriousness, not panic.

### Accessibility
- All interactive elements keyboard-accessible.
- Sufficient colour contrast (WCAG AA).
- Screen reader labels on all chips and buttons.
- No motion-heavy animations.

## 7. Content — Japanese Translations

This is the critical content. Use these exact strings. Do not invent translations.

### 7.1 Card structure (template)

```
[Greeting line]
[Restriction statement]
以下のものを食べることができません：
・[item 1]
・[item 2]
・[item 3]
[Optional severity warning]
[Special notes — e.g. dashi, soy sauce]
これらが含まれていない料理はありますか？
ご協力ありがとうございます。
```

### 7.2 Greetings

| Condition | Japanese |
|---|---|
| Default | すみません、お願いがあります。 |
| With name | すみません、私は[NAME]と申します。お願いがあります。 |

### 7.3 Restriction statements

| Type | Japanese | English gloss |
|---|---|---|
| Allergy | 食物アレルギーがあります。 | I have food allergies. |
| Severe allergy | 重度の食物アレルギーがあります。 | I have severe food allergies. |
| Preference / diet | 食事制限があります。 | I have dietary restrictions. |

### 7.4 Allergens (Japan's 8 mandatory + common others)

| Key | Japanese | English |
|---|---|---|
| `shrimp` | えび | Shrimp |
| `crab` | かに | Crab |
| `wheat` | 小麦 | Wheat |
| `buckwheat` | そば | Buckwheat |
| `egg` | 卵 | Egg |
| `dairy` | 乳製品（牛乳、チーズ、バター） | Dairy (milk, cheese, butter) |
| `peanut` | 落花生（ピーナッツ） | Peanut |
| `walnut` | くるみ | Walnut |
| `almond` | アーモンド | Almond |
| `cashew` | カシューナッツ | Cashew |
| `pistachio` | ピスタチオ | Pistachio |
| `soy` | 大豆 | Soy |
| `sesame` | ごま | Sesame |
| `fish` | 魚（さけ、さば、まぐろなど） | Fish (salmon, mackerel, tuna, etc.) |
| `shellfish` | 貝類（あさり、ホタテなど） | Shellfish (clams, scallops, etc.) |
| `chicken` | 鶏肉 | Chicken |
| `beef` | 牛肉 | Beef |
| `pork` | 豚肉 | Pork |
| `gelatin` | ゼラチン | Gelatin |
| `kiwi` | キウイフルーツ | Kiwi |
| `peach` | もも | Peach |
| `apple` | りんご | Apple |
| `mushroom` | きのこ全般 | All mushrooms |

### 7.5 Dietary patterns

Each pattern adds a **statement** and may add **implicit excluded items** and **special notes**.

#### Vegetarian
- Statement: 私はベジタリアンです。
- Implied exclusions: 肉、魚、鶏肉、ハム、ベーコン、魚介類
- Special note: ※だし（特にかつおだし、煮干しだし）にもご注意ください。野菜だしや昆布だしは大丈夫です。

#### Vegan
- Statement: 私はビーガン（完全菜食主義）です。
- Implied exclusions: 肉、魚、鶏肉、卵、乳製品、はちみつ、ゼラチン
- Special note: ※だし（かつおだし、煮干しだし）も食べません。野菜だしや昆布だしは大丈夫です。

#### Pescatarian
- Statement: 私はペスカタリアンです。魚は食べますが、肉と鶏肉は食べません。
- Implied exclusions: 肉、鶏肉、ハム、ベーコン
- Special note: (none)

#### Halal
- Statement: 私はハラル食を守っています。
- Implied exclusions: 豚肉、ハム、ベーコン、アルコール、みりん、料理酒、ラード
- Special note: ※醤油やみそにも少量のアルコールが含まれることがありますのでご注意ください。

#### Kosher
- Statement: 私はコーシャ（ユダヤ教の食事規定）を守っています。
- Implied exclusions: 豚肉、貝類、えび、かに、いか、たこ
- Special note: ※肉と乳製品を一緒に食べることもできません。

#### Gluten-free
- Statement: グルテン（小麦、大麦、ライ麦）を食べることができません。
- Implied exclusions: 小麦、大麦、ライ麦、麺類（うどん、ラーメン、そうめん）、てんぷら、お好み焼き
- Special note: ※醤油には小麦が含まれていることが多いので、たまり醤油やグルテンフリー醤油をお願いします。

### 7.6 Closing

| Element | Japanese |
|---|---|
| Question | これらが含まれていない料理はありますか？ |
| Thanks | ご協力ありがとうございます。 |

### 7.7 Severity warning (only when "Severe" is selected)

```
⚠ 重度のアレルギーで、少量でも命に関わります。
調理器具や油も分けていただけると助かります。
```

## 8. Technical Requirements

### Stack
- **HTML / CSS / vanilla JS.** No framework. No build step.
- **`html2canvas`** via CDN for PNG export.
- **No bundler, no npm, no TypeScript.** Edit-and-refresh.
- Hosted on **GitHub Pages** from `main` branch root or `/docs`.

### File structure
```
/
├── index.html          # single-page app
├── styles.css          # all styles
├── app.js              # all logic
├── data.js             # translation data (export as window.CARD_DATA)
├── favicon.svg         # simple emoji-style icon
├── og-image.png        # 1200x630 social preview (placeholder OK; design later)
├── README.md           # repo readme — see §11
└── LICENSE             # MIT
```

Keep it as four source files. Do not split into a dozen modules.

### Code style
- Plain ES2020+ JS, no transpilation needed (modern browsers only).
- No jQuery, no Lodash, no React, no Vue.
- Use `<template>` elements or string templates — pick one and stick with it.
- Comment the data file generously so future-Nik can add languages or items.

### Performance
- First contentful paint < 1s on 4G.
- Total page weight (excluding `html2canvas`) under 50KB.
- `html2canvas` lazy-loaded only when the user clicks Download PNG.

### URL hash encoding scheme
```
#a=peanut,wheat,dairy&p=vegetarian&s=severe&n=Nik
```
- `a` = comma-separated allergen keys
- `p` = single dietary pattern key
- `s` = `severe` | `mild` (omit for default)
- `n` = URL-encoded name

On load, parse the hash and pre-select. On any change, update the hash without adding to history (`history.replaceState`).

### Testing
No test framework needed for v1. Manually verify:
- All 6 dietary patterns render correctly.
- 3+ allergens combined with a pattern render correctly.
- URL share round-trips.
- PNG download works on iOS Safari, Chrome Android, desktop Chrome, desktop Safari.
- Print preview hides controls.

### Browser support
- Latest Safari, Chrome, Firefox.
- iOS Safari 15+, Chrome Android 100+. (This is the critical mobile path.)
- No IE, no legacy Edge.

## 9. Disclaimer (must appear in footer and on the card)

On the card, in small English text below the Japanese:

> *This card was machine-generated. Please verify with the restaurant. Severe allergy sufferers should travel with a doctor's note in Japanese.*

In the page footer:

> Translations are checked against common Japanese restaurant phrasing but are not a substitute for medical advice or professional translation. If you have a life-threatening allergy, please carry an EpiPen and a doctor's letter.

## 10. SEO / Sharing meta

- `<title>`: "Japan Restaurant Allergy Card — Free Generator"
- Meta description: "Generate a free Japanese restaurant card for your food allergies and dietary needs. No signup. Mobile-first. Built for tourists in Japan."
- Open Graph image: `og-image.png` (placeholder for v1).
- Twitter card: summary_large_image.

## 11. README.md content (for the repo)

Include in the README:
1. One-line description.
2. Live link (GitHub Pages URL).
3. Screenshot.
4. "Why this exists" paragraph.
5. How to add a new allergen / language (point at `data.js`).
6. Disclaimer block.
7. License: MIT.
8. "Contributions welcome — especially native Japanese speakers reviewing translations."

## 12. Acceptance Criteria

The build is done when:
- [ ] All 6 dietary patterns + all allergens in §7.4 are selectable.
- [ ] Card preview updates live as selections change.
- [ ] Card is in correct, polite Japanese matching §7's strings exactly.
- [ ] Severity warning appears when "Severe" is selected.
- [ ] Dashi note appears for vegetarian and vegan.
- [ ] Soy-sauce note appears for gluten-free.
- [ ] Mirin/alcohol note appears for halal.
- [ ] URL share round-trips correctly.
- [ ] PNG download works on iOS Safari and desktop Chrome.
- [ ] Print stylesheet shows only the card.
- [ ] Site is fully usable on a 375px-wide viewport.
- [ ] No console errors or warnings.
- [ ] Disclaimer is visible on both card and footer.
- [ ] README is complete.

## 13. Stretch (do NOT build in v1)

- Add Korean and Thai card outputs for tourists going to those countries.
- Add Chinese (simplified + traditional).
- Restaurant-staff-side QR code that opens an English explanation.
- "Severity" with anaphylaxis emergency phrase ("救急車を呼んでください").
- A few common scenarios pre-filled ("I'm vegetarian", "I have a peanut allergy") as one-tap presets.

---

## Implementation note for Claude Code

Build in this order:
1. `data.js` first — get the translations structure right. This is the source of truth.
2. `index.html` — semantic structure, no styling.
3. `app.js` — selection logic + live preview + hash sync.
4. `styles.css` — make it look like a real product.
5. PNG download + print.
6. Polish, README, deploy instructions.

Commit after each step. Keep commits small and descriptive.
