# Milestone 1: Astro Port (Identical Output) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build tabemasen.io with Astro and deploy it through GitHub Actions while every served file stays equivalent to today's site.

**Architecture:** Each of the 12 hand-written `index.html` pages moves verbatim into `src/pages/**/index.astro` with every `<script>` and `<style>` marked `is:inline`, so Astro emits them untouched. Every other deployed file moves into `public/`. A comparison script proves equivalence against the git tag `pre-astro` (normalised HTML for pages, bytes for everything else), and an SEO check guards titles, descriptions, H1s, canonicals, structured data, links and the sitemap from here on.

**Tech Stack:** Astro ^7.3.8 (static output), Node 22 (>= 22.12), parse5 ^8, Vitest ^5, GitHub Actions + GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-12-astro-migration-and-redesign-design.md` (§3 Milestone 1 and §6 SEO safeguards). This plan amends §3 in one place, recorded in Task 7: M1 does **not** introduce `LegacyLayout`. Every page's head, header and footer differ (active nav state, analytics event names, footer link lists, inline style blocks), so extracting a shared layout cannot keep output identical without a prop for nearly every line, and Milestone 2 replaces header, footer and layouts anyway.

## Global Constraints

- Work on branch `astro-redesign`. Never push to `main` directly; M1 reaches `main` through one PR.
- Every URL that exists today keeps working: `/`, `/about/`, `/allergies/`, `/allergies/food-allergies-in-japanese/`, `/allergies/labeling-guide/`, `/celiac/`, `/featured/`, `/gluten-free/`, `/gluten-free-japan/`, `/halal/`, `/halal/certification-guide/`, `/vegan/`.
- No copy, markup or style changes to any page in M1. `npm run compare` must report zero differences before the PR is opened.
- `data.js` stays the single source of truth for Japanese strings and stays a plain browser script (`window.CARD_DATA`).
- The shared-card hash format (`#a=…&p=…&s=…&n=…&c=…&en=…`) must keep working unchanged.
- Astro config: `output: 'static'`, `build.format: 'directory'`, `trailingSlash: 'always'`, `site: 'https://tabemasen.io'`, `compressHTML: false`.
- Node version in `.nvmrc`: `22`.
- Commits end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01UpttBQPap9JzyZfAZEcyqK
  ```

## Review Focus

1. **Trailing-slash-less URLs** (`/gluten-free`, `/allergies`) get real clicks in Search Console; after deploy they must still redirect to the slash URL. Pinned by `scripts/smoke-live.mjs` in Task 7.
2. **The `/gluten-free/` redirect must carry the hash** (`/gluten-free/#p=gluten-free` → `/gluten-free-japan/#p=gluten-free`) so old shared links keep their card. Pinned by the manual preview checklist in Task 7 (the redirect is client-side JS, so only a browser proves it).
3. **The custom domain must survive the switch to Actions deploys:** `CNAME` must be inside `dist/`, and `https://tabemasen.io/` must answer 200 after the first Actions deploy. Pinned by the statics byte-compare (Task 3) and `smoke-live.mjs` (Task 7).
4. **Markdown files GitHub Pages currently renders through Jekyll** (`/README.html`, `/CHANGELOG.html`, `/REQUIREMENTS.html`) will stop being served. Not indexed or linked, but must be a known, recorded change. Pinned by the pre-merge live check in Task 7.
5. **Relative asset paths on `/`** (`data.js`, `app.js`, `styles.css`, no leading slash) must still resolve after the move to `public/`. Pinned by the SEO link check (Task 5) and the builder walkthrough in Task 7.

---

## File Structure

| Path | Responsibility |
|---|---|
| `package.json`, `package-lock.json` | Dependencies and npm scripts |
| `astro.config.mjs` | Astro build settings |
| `tsconfig.json` | Astro TypeScript defaults (editor support) |
| `vitest.config.mjs` | Test runner config |
| `.nvmrc` | Node version for local and CI |
| `public/**` | Every deployed non-page file, moved unchanged |
| `src/pages/**/index.astro` | The 12 pages, verbatim plus `is:inline` |
| `scripts/lib/normalize-html.mjs` | HTML → canonical line-per-node text for comparison |
| `scripts/lib/compare.mjs` | Classify legacy files; find first difference |
| `scripts/compare-build.mjs` | CLI: `dist/` vs tag `pre-astro` |
| `scripts/lib/astro-inline.mjs` | Add `is:inline` to `<script>`/`<style>` tags |
| `scripts/port-legacy-pages.mjs` | CLI: apply `markInline` to every `src/pages/**/*.astro` |
| `scripts/lib/page-facts.mjs` | Extract title, description, H1, canonical, robots, JSON-LD types, links |
| `scripts/lib/seo-checks.mjs` | Pure check functions (baseline diff, page problems, link resolution, sitemap) |
| `scripts/lib/dist-pages.mjs` | Find built pages in `dist/` and map them to URLs |
| `scripts/seo-baseline.mjs` | CLI: write `seo-baseline.json` |
| `scripts/check-seo.mjs` | CLI: run all SEO checks against `dist/` |
| `seo-baseline.json`, `seo-allowlist.json` | Recorded baseline and deliberate exceptions |
| `scripts/smoke-live.mjs` | CLI: HTTP checks against a deployed origin |
| `tests/*.test.mjs` | Vitest unit tests for the libs |
| `.github/workflows/site.yml` | CI build/checks; deploy on `main` |

---

### Task 1: Astro scaffold and static files in `public/`

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.mjs`, `.nvmrc`
- Modify: `.gitignore`
- Move (git mv): `analytics.js app.js data.js nav.js styles.css favicon.svg CNAME robots.txt sitemap.xml llms.txt llms-full.txt assets/` → `public/`

**Interfaces:**
- Consumes: nothing.
- Produces: npm scripts `dev`, `build`, `preview`, `test`, `compare`, `seo:baseline`, `check:seo`, `smoke:live` (later tasks create the script files they point to); git tag `pre-astro` pointing at `a5d5b21` (the last pre-Astro `main` commit).

- [ ] **Step 1: Tag the legacy baseline**

```bash
git tag pre-astro a5d5b21
git show --stat pre-astro | head -3
```
Expected: shows commit `a5d5b21 Merge pull request #11 …`. (The tag is pushed with the branch in Task 6.)

- [ ] **Step 2: Create `.nvmrc`**

```
22
```

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "tabemasen",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "compare": "node scripts/compare-build.mjs",
    "seo:baseline": "node scripts/seo-baseline.mjs",
    "check:seo": "node scripts/check-seo.mjs",
    "smoke:live": "node scripts/smoke-live.mjs"
  }
}
```

- [ ] **Step 4: Install dependencies**

```bash
npm install astro@^7.3.8
npm install -D vitest@^5 parse5@^8
```
Expected: `package-lock.json` created, `node_modules/` present, no errors.

- [ ] **Step 5: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

// Milestone 1: the pages are the legacy HTML verbatim. Nothing here may
// change their output; scripts/compare-build.mjs is the proof.
export default defineConfig({
  site: 'https://tabemasen.io',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: false,
  devToolbar: { enabled: false },
});
```

- [ ] **Step 6: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 7: Create `vitest.config.mjs`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/**/*.test.mjs'] },
});
```

- [ ] **Step 8: Extend `.gitignore`**

Append:
```
node_modules/
dist/
.astro/
```

- [ ] **Step 9: Move the static files**

```bash
mkdir -p public
git mv analytics.js app.js data.js nav.js styles.css favicon.svg CNAME robots.txt sitemap.xml llms.txt llms-full.txt assets public/
git status --short | head -40
```
Expected: renames only (`R  analytics.js -> public/analytics.js`, …). Root `index.html` and the page folders are untouched.

- [ ] **Step 10: Build**

```bash
npm run build
ls dist dist/assets | head -30
```
Expected: build completes (Astro may warn that no pages were found) and `dist/` contains `CNAME`, `app.js`, `data.js`, `styles.css`, `assets/…`. If instead Astro exits with an error because there are no routes, do not add a placeholder page (it would ship). Commit without a build and note it in the commit message; the first build that must succeed is Task 4 Step 7.

- [ ] **Step 11: Commit**

```bash
git add .nvmrc package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.mjs .gitignore public
git commit -m "build: Astro scaffold; move deployed static files to public/"
```

---

### Task 2: HTML normaliser

**Files:**
- Create: `scripts/lib/normalize-html.mjs`
- Test: `tests/normalize-html.test.mjs`

**Interfaces:**
- Consumes: `parse5`.
- Produces: `normalizeHtml(html: string): string`. One node per line, indented two spaces per depth; attributes sorted by name; boolean attributes printed bare (`defer`); runs of ASCII whitespace (space, tab, CR, LF, FF) collapsed to one space and trimmed in text and comments; empty text nodes dropped; `U+00A0` preserved (it is not ASCII whitespace). Two documents are "identical" when their normalised strings are equal.

- [ ] **Step 1: Write the failing tests**

```js
// tests/normalize-html.test.mjs
import { describe, it, expect } from 'vitest';
import { normalizeHtml } from '../scripts/lib/normalize-html.mjs';

const doc = (body, head = '<title>t</title>') =>
  `<!DOCTYPE html><html lang="en"><head>${head}</head><body>${body}</body></html>`;

describe('normalizeHtml', () => {
  it('ignores whitespace differences between tags and inside text', () => {
    expect(normalizeHtml(doc('<p>Hello   world</p>\n\n<p>x</p>')))
      .toBe(normalizeHtml(doc('<p>Hello world</p><p>x</p>')));
  });

  it('ignores attribute order', () => {
    expect(normalizeHtml(doc('<a href="/" class="x">a</a>')))
      .toBe(normalizeHtml(doc('<a class="x" href="/">a</a>')));
  });

  it('treats defer and defer="" as the same', () => {
    expect(normalizeHtml(doc('<script src="/a.js" defer></script>')))
      .toBe(normalizeHtml(doc('<script defer="" src="/a.js"></script>')));
  });

  it('treats &nbsp; and a literal no-break space as the same', () => {
    expect(normalizeHtml(doc('<p>a&nbsp;b</p>')))
      .toBe(normalizeHtml(doc('<p>a b</p>')));
  });

  it('does not treat a no-break space as an ordinary space', () => {
    expect(normalizeHtml(doc('<p>a&nbsp;b</p>')))
      .not.toBe(normalizeHtml(doc('<p>a b</p>')));
  });

  it('detects changed text', () => {
    expect(normalizeHtml(doc('<h1>Allergy card</h1>')))
      .not.toBe(normalizeHtml(doc('<h1>Allergy cards</h1>')));
  });

  it('keeps and compares comments', () => {
    expect(normalizeHtml(doc('<!-- one --><p>x</p>')))
      .not.toBe(normalizeHtml(doc('<!-- two --><p>x</p>')));
  });

  it('detects a changed attribute value', () => {
    expect(normalizeHtml(doc('<link rel="canonical" href="https://tabemasen.io/a/">', '')))
      .not.toBe(normalizeHtml(doc('<link rel="canonical" href="https://tabemasen.io/b/">', '')));
  });

  it('detects changed script and style content', () => {
    expect(normalizeHtml(doc('<script>var a = 1;</script>')))
      .not.toBe(normalizeHtml(doc('<script>var a = 2;</script>')));
    expect(normalizeHtml(doc('', '<style>.a { color: red; }</style>')))
      .not.toBe(normalizeHtml(doc('', '<style>.a { color: blue; }</style>')));
  });

  it('detects an added attribute such as an Astro scope class', () => {
    expect(normalizeHtml(doc('<p>x</p>')))
      .not.toBe(normalizeHtml(doc('<p data-astro-cid-abc123>x</p>')));
  });

  it('prints one node per line', () => {
    expect(normalizeHtml(doc('<p>x</p>')).split('\n')).toEqual([
      '<!doctype html>',
      '<html lang="en">',
      '  <head>',
      '    <title>',
      '      t',
      '    </title>',
      '  </head>',
      '  <body>',
      '    <p>',
      '      x',
      '    </p>',
      '  </body>',
      '</html>',
    ]);
  });
});
```

- [ ] **Step 2: Run the tests and see them fail**

Run: `npx vitest run tests/normalize-html.test.mjs`
Expected: FAIL, "Failed to load url ../scripts/lib/normalize-html.mjs" (module does not exist).

- [ ] **Step 3: Implement**

```js
// scripts/lib/normalize-html.mjs
import { parse } from 'parse5';

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'source', 'track', 'wbr',
]);

// ASCII whitespace only: U+00A0 (&nbsp;) is content and must survive.
const collapse = (s) => s.replace(/[ \t\n\r\f]+/g, ' ').trim();
const escAttr = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const escText = (v) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function normalizeHtml(html) {
  const out = [];
  walk(parse(html), 0, out);
  return out.join('\n');
}

function walk(node, depth, out) {
  const pad = '  '.repeat(depth);
  for (const child of node.childNodes ?? []) {
    if (child.nodeName === '#documentType') {
      out.push(`<!doctype ${child.name}>`);
    } else if (child.nodeName === '#comment') {
      out.push(`${pad}<!-- ${collapse(child.data)} -->`);
    } else if (child.nodeName === '#text') {
      const text = collapse(child.value);
      if (text) out.push(pad + escText(text));
    } else if (child.tagName) {
      const attrs = [...child.attrs]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((a) => (a.value === '' ? ` ${a.name}` : ` ${a.name}="${escAttr(a.value)}"`))
        .join('');
      out.push(`${pad}<${child.tagName}${attrs}>`);
      walk(child.tagName === 'template' ? child.content : child, depth + 1, out);
      if (!VOID.has(child.tagName)) out.push(`${pad}</${child.tagName}>`);
    }
  }
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `npx vitest run tests/normalize-html.test.mjs`
Expected: 11 passed.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/normalize-html.mjs tests/normalize-html.test.mjs
git commit -m "test(build): HTML normaliser for legacy-vs-Astro comparison"
```

---

### Task 3: `npm run compare` (dist vs `pre-astro`)

**Files:**
- Create: `scripts/lib/compare.mjs`, `scripts/compare-build.mjs`
- Test: `tests/compare.test.mjs`

**Interfaces:**
- Consumes: `normalizeHtml` (Task 2); git tag `pre-astro` (Task 1).
- Produces:
  - `classifyLegacyFiles(paths: string[]): { pages: string[], statics: string[] }`. Pages are `index.html` files; statics are all other deployed files; repo-only files (`*.md`, `docs/**`, `.gitignore`, `.github/**`) are excluded.
  - `firstDifference(a: string, b: string): null | { line: number, expected: string, actual: string }`.
  - CLI `npm run compare`: exits 0 only if every legacy page normalises identically and every legacy static file is byte-identical in `dist/`. Env `COMPARE_REF` overrides the ref (default `pre-astro`).

- [ ] **Step 1: Write the failing tests**

```js
// tests/compare.test.mjs
import { describe, it, expect } from 'vitest';
import { classifyLegacyFiles, firstDifference } from '../scripts/lib/compare.mjs';

describe('classifyLegacyFiles', () => {
  it('splits pages from statics and drops repo-only files', () => {
    const result = classifyLegacyFiles([
      '.gitignore', 'CHANGELOG.md', 'README.md', 'docs/superpowers/specs/x.md',
      '.github/workflows/site.yml',
      'index.html', 'allergies/index.html', 'allergies/labeling-guide/index.html',
      'CNAME', 'app.js', 'assets/og-image.png', 'llms.txt', 'sitemap.xml',
    ]);
    expect(result.pages).toEqual(['index.html', 'allergies/index.html', 'allergies/labeling-guide/index.html']);
    expect(result.statics).toEqual(['CNAME', 'app.js', 'assets/og-image.png', 'llms.txt', 'sitemap.xml']);
  });

  it('does not treat a file merely ending in index.html as a page', () => {
    expect(classifyLegacyFiles(['notindex.html']).statics).toEqual(['notindex.html']);
  });
});

describe('firstDifference', () => {
  it('returns null for equal strings', () => {
    expect(firstDifference('a\nb', 'a\nb')).toBeNull();
  });

  it('reports the first differing line, 1-based', () => {
    expect(firstDifference('a\nb\nc', 'a\nB\nc')).toEqual({ line: 2, expected: 'b', actual: 'B' });
  });

  it('reports a missing tail', () => {
    expect(firstDifference('a\nb', 'a')).toEqual({ line: 2, expected: 'b', actual: '<end of file>' });
  });
});
```

- [ ] **Step 2: Run the tests and see them fail**

Run: `npx vitest run tests/compare.test.mjs`
Expected: FAIL, module `../scripts/lib/compare.mjs` not found.

- [ ] **Step 3: Implement the library**

```js
// scripts/lib/compare.mjs
const REPO_ONLY = [/\.md$/, /^docs\//, /^\.gitignore$/, /^\.github\//];

export function classifyLegacyFiles(paths) {
  const pages = [];
  const statics = [];
  for (const path of paths) {
    if (REPO_ONLY.some((re) => re.test(path))) continue;
    const isPage = path === 'index.html' || path.endsWith('/index.html');
    (isPage ? pages : statics).push(path);
  }
  return { pages, statics };
}

export function firstDifference(a, b) {
  const x = a.split('\n');
  const y = b.split('\n');
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) {
    if (x[i] !== y[i]) {
      return { line: i + 1, expected: x[i] ?? '<end of file>', actual: y[i] ?? '<end of file>' };
    }
  }
  return null;
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `npx vitest run tests/compare.test.mjs`
Expected: 5 passed.

- [ ] **Step 5: Implement the CLI**

```js
// scripts/compare-build.mjs
// Proves Milestone 1's promise: dist/ serves what the legacy site served.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeHtml } from './lib/normalize-html.mjs';
import { classifyLegacyFiles, firstDifference } from './lib/compare.mjs';

const ref = process.env.COMPARE_REF ?? 'pre-astro';
const dist = 'dist';

const git = (...args) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
const tree = git('ls-tree', '-r', '--name-only', ref).toString('utf8').trim().split('\n');
const { pages, statics } = classifyLegacyFiles(tree);

let failures = 0;
const fail = (msg) => { failures++; console.error(msg); };

for (const path of pages) {
  const built = join(dist, path);
  if (!existsSync(built)) { fail(`MISSING page  ${path}`); continue; }
  const before = normalizeHtml(git('show', `${ref}:${path}`).toString('utf8'));
  const after = normalizeHtml(readFileSync(built, 'utf8'));
  const diff = firstDifference(before, after);
  if (diff) {
    fail(`DIFF    page  ${path} (normalised line ${diff.line})\n  ${ref}: ${diff.expected}\n  dist: ${diff.actual}`);
  } else {
    console.log(`ok      page  ${path}`);
  }
}

for (const path of statics) {
  const built = join(dist, path);
  if (!existsSync(built)) { fail(`MISSING file  ${path}`); continue; }
  if (Buffer.compare(git('show', `${ref}:${path}`), readFileSync(built)) !== 0) {
    fail(`DIFF    file  ${path} (bytes differ)`);
  } else {
    console.log(`ok      file  ${path}`);
  }
}

console.log(`\n${pages.length} pages, ${statics.length} files compared against ${ref}: ${failures} problem(s).`);
process.exit(failures ? 1 : 0);
```

- [ ] **Step 6: Run it against the current build**

```bash
npm run build && npm run compare; echo "exit $?"
```
Expected: every `file` line is `ok`; all 12 `page` lines are `MISSING page` (pages are not ported yet); `exit 1`. If any `file` line is `DIFF` or `MISSING`, fix the move in Task 1 before continuing. (If Task 1 recorded that Astro cannot build with zero routes, skip this run; Task 4 Step 7 runs it.)

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/compare.mjs scripts/compare-build.mjs tests/compare.test.mjs
git commit -m "build: npm run compare checks dist/ against the pre-astro tag"
```

---

### Task 4: Port the 12 pages

**Files:**
- Create: `scripts/lib/astro-inline.mjs`, `scripts/port-legacy-pages.mjs`
- Test: `tests/astro-inline.test.mjs`
- Move (git mv): every `**/index.html` page → `src/pages/**/index.astro`

**Interfaces:**
- Consumes: `npm run compare` (Task 3).
- Produces: `markInline(source: string): string`, which inserts ` is:inline` directly after the tag name of every `<script` and `<style` opening tag that lacks it. It is idempotent and leaves closing tags and similarly named words alone. `src/pages/**/index.astro` for all 12 URLs.

- [ ] **Step 1: Write the failing tests**

```js
// tests/astro-inline.test.mjs
import { describe, it, expect } from 'vitest';
import { markInline } from '../scripts/lib/astro-inline.mjs';

describe('markInline', () => {
  it('marks a bare script', () => {
    expect(markInline('<script>location.replace("/")</script>'))
      .toBe('<script is:inline>location.replace("/")</script>');
  });

  it('marks a src-only script (Astro would otherwise bundle it)', () => {
    expect(markInline('<script src="data.js"></script>'))
      .toBe('<script is:inline src="data.js"></script>');
  });

  it('marks JSON-LD and multi-line attribute lists', () => {
    expect(markInline('<script type="application/ld+json">{}</script>'))
      .toBe('<script is:inline type="application/ld+json">{}</script>');
    expect(markInline('<script data-goatcounter="x"\n        async src="//gc.zgo.at/count.js"></script>'))
      .toBe('<script is:inline data-goatcounter="x"\n        async src="//gc.zgo.at/count.js"></script>');
  });

  it('marks style blocks', () => {
    expect(markInline('<style>\n.a{}\n</style>')).toBe('<style is:inline>\n.a{}\n</style>');
  });

  it('is idempotent', () => {
    const once = markInline('<script src="a.js"></script><style>.a{}</style>');
    expect(markInline(once)).toBe(once);
  });

  it('leaves closing tags and look-alike words alone', () => {
    expect(markInline('<p>scripts and styles</p></script></style><scripted>'))
      .toBe('<p>scripts and styles</p></script></style><scripted>');
  });
});
```

- [ ] **Step 2: Run the tests and see them fail**

Run: `npx vitest run tests/astro-inline.test.mjs`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the transform and the CLI**

```js
// scripts/lib/astro-inline.mjs
// Astro bundles <script> and scopes <style> unless told not to. Legacy pages
// must come out byte-for-byte, so every such tag is opted out with is:inline.
const OPENING = /<(script|style)(?=[\s>])(?![^>]*\bis:inline\b)/g;

export function markInline(source) {
  return source.replace(OPENING, '<$1 is:inline');
}
```

```js
// scripts/port-legacy-pages.mjs
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { markInline } from './lib/astro-inline.mjs';

function astroFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return astroFiles(path);
    return path.endsWith('.astro') ? [path] : [];
  });
}

for (const path of astroFiles('src/pages')) {
  const before = readFileSync(path, 'utf8');
  const after = markInline(before);
  if (after !== before) writeFileSync(path, after);
  console.log(`${after === before ? 'unchanged' : 'marked   '} ${path}`);
}
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `npx vitest run tests/astro-inline.test.mjs`
Expected: 6 passed.

- [ ] **Step 5: Move the pages (history-preserving)**

```bash
mkdir -p src/pages
for p in about allergies allergies/food-allergies-in-japanese allergies/labeling-guide celiac featured gluten-free gluten-free-japan halal halal/certification-guide vegan; do
  mkdir -p "src/pages/$p"
  git mv "$p/index.html" "src/pages/$p/index.astro"
done
git mv index.html src/pages/index.astro
find src/pages -name '*.astro' | sort
```
Expected: 12 files listed; the old page folders are now empty (git does not track empty folders; delete any leftover empty directories with `find . \( -path ./node_modules -o -path ./.git \) -prune -o -type d -empty -print -delete`).

- [ ] **Step 6: Mark scripts and styles inline**

```bash
node scripts/port-legacy-pages.mjs
grep -c "is:inline" src/pages/index.astro src/pages/gluten-free/index.astro src/pages/vegan/index.astro
```
Expected: 12 `marked` lines and counts 7, 1, 5. Every page's `is:inline` count must equal its number of `<script`/`<style` opening tags on `pre-astro`:

| Page | Tags |
|---|---|
| `index`, `celiac`, `gluten-free-japan`, `allergies/food-allergies-in-japanese`, `allergies/labeling-guide`, `halal/certification-guide` | 7 |
| `about`, `allergies`, `featured`, `halal`, `vegan` | 5 |
| `gluten-free` | 1 |

Check all of them: `for f in $(find src/pages -name '*.astro'); do echo "$(grep -o 'is:inline' $f | wc -l) $f"; done`

- [ ] **Step 7: Build and compare**

```bash
npm run build && npm run compare
```
Expected: `12 pages, N files compared against pre-astro: 0 problem(s).` and exit 0.

If a page reports `DIFF`, read the two printed lines. Known Astro behaviours and their fixes:
- An added `data-astro-cid-*` attribute or rewritten `<style>` means a `<style>` was missed. Run the port script again and check for `<style` written in unusual case.
- A missing or moved `<script>` means a script was bundled. Same fix.
- A differing `<!doctype>` or `<html>` attribute means Astro altered the document shell. Inspect `dist/<path>`, then set the matching option in `astro.config.mjs` and record why in a comment.
- Do **not** edit page content to make the diff go away; the fix belongs in the transform or the config.

- [ ] **Step 8: Commit**

```bash
git add -A src/pages scripts/lib/astro-inline.mjs scripts/port-legacy-pages.mjs tests/astro-inline.test.mjs
git commit -m "build: port the 12 legacy pages to Astro unchanged (is:inline scripts/styles)"
```

---

### Task 5: SEO baseline and `npm run check:seo`

**Files:**
- Create: `scripts/lib/page-facts.mjs`, `scripts/lib/seo-checks.mjs`, `scripts/lib/dist-pages.mjs`, `scripts/seo-baseline.mjs`, `scripts/check-seo.mjs`, `seo-baseline.json` (generated), `seo-allowlist.json`
- Test: `tests/page-facts.test.mjs`, `tests/seo-checks.test.mjs`

**Interfaces:**
- Consumes: `parse5`; a built `dist/` (Task 4).
- Produces:
  - `pageFacts(html: string): { title: string|null, description: string|null, h1: string|null, canonical: string|null, robots: string|null, jsonLdTypes: string[], jsonLdErrors: string[], links: string[] }`
  - `BASELINE_FIELDS = ['title','description','h1','canonical','robots','jsonLdTypes']`
  - `baselineProblems(baseline: Record<url, facts>, current: Record<url, facts>, allowlist): string[]`
  - `pageProblems(url: string, facts): string[]`
  - `resolveInternal(href: string, pageUrl: string, site?: string): string|null` (a decoded pathname, or `null` when external/non-navigational)
  - `linkCandidates(pathname: string): string[]` (files under `dist/` that would satisfy it)
  - `sitemapProblems(sitemapXml: string, indexableUrls: string[], site?: string): string[]`
  - `listDistPages(distDir: string): { url: string, file: string }[]`
  - `seo-allowlist.json` shape: `{ "changes": [{ "url", "field", "reason", "date" }], "knownBrokenLinks": [{ "from", "href", "reason" }] }`

- [ ] **Step 1: Write the failing tests for `pageFacts`**

```js
// tests/page-facts.test.mjs
import { describe, it, expect } from 'vitest';
import { pageFacts } from '../scripts/lib/page-facts.mjs';

const html = `<!DOCTYPE html><html><head>
  <title>  Japan  Allergy Card | tabemasen </title>
  <meta name="description" content="Free card.">
  <link rel="canonical" href="https://tabemasen.io/allergies/">
  <link rel="stylesheet" href="/styles.css">
  <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization"},{"@type":["Article","WebPage"],"author":{"@type":"Person"}}]}</script>
  <script type="application/ld+json">{ broken </script>
  <script src="data.js"></script>
</head><body>
  <h1>Japan food allergy <em>restaurant</em> card</h1><h1>Second</h1>
  <a href="/halal/">Halal</a><img src="/assets/og-image.png" alt="">
</body></html>`;

describe('pageFacts', () => {
  const f = pageFacts(html);

  it('reads title, description and canonical', () => {
    expect(f.title).toBe('Japan Allergy Card | tabemasen');
    expect(f.description).toBe('Free card.');
    expect(f.canonical).toBe('https://tabemasen.io/allergies/');
  });

  it('reads the first H1 as collapsed text including nested elements', () => {
    expect(f.h1).toBe('Japan food allergy restaurant card');
  });

  it('collects JSON-LD @types (nested, arrays) sorted and unique, and parse errors', () => {
    expect(f.jsonLdTypes).toEqual(['Article', 'Organization', 'Person', 'WebPage']);
    expect(f.jsonLdErrors).toHaveLength(1);
  });

  it('returns null robots when absent', () => {
    expect(f.robots).toBeNull();
  });

  it('collects stylesheet, script, anchor and image references but not the canonical', () => {
    expect(f.links).toEqual(['/styles.css', 'data.js', '/halal/', '/assets/og-image.png']);
  });
});
```

- [ ] **Step 2: Write the failing tests for the checks**

```js
// tests/seo-checks.test.mjs
import { describe, it, expect } from 'vitest';
import {
  baselineProblems, pageProblems, resolveInternal, linkCandidates, sitemapProblems,
} from '../scripts/lib/seo-checks.mjs';

const facts = (over = {}) => ({
  title: 'T', description: 'D', h1: 'H', canonical: 'https://tabemasen.io/a/',
  robots: null, jsonLdTypes: ['Article'], jsonLdErrors: [], links: [], ...over,
});
const noAllow = { changes: [], knownBrokenLinks: [] };

describe('baselineProblems', () => {
  it('passes when nothing changed', () => {
    expect(baselineProblems({ '/a/': facts() }, { '/a/': facts() }, noAllow)).toEqual([]);
  });

  it('reports a missing page', () => {
    expect(baselineProblems({ '/a/': facts() }, {}, noAllow)).toEqual(['/a/: page is missing from dist/']);
  });

  it('reports a changed field with old and new values', () => {
    const p = baselineProblems({ '/a/': facts() }, { '/a/': facts({ title: 'T2' }) }, noAllow);
    expect(p).toEqual(['/a/: title changed\n    was: "T"\n    now: "T2"']);
  });

  it('compares jsonLdTypes as lists', () => {
    const p = baselineProblems({ '/a/': facts() }, { '/a/': facts({ jsonLdTypes: ['Article', 'FAQPage'] }) }, noAllow);
    expect(p).toHaveLength(1);
  });

  it('accepts a change listed in the allowlist', () => {
    const allow = { changes: [{ url: '/a/', field: 'title', reason: 'CTR fix', date: '2026-10-12' }], knownBrokenLinks: [] };
    expect(baselineProblems({ '/a/': facts() }, { '/a/': facts({ title: 'T2' }) }, allow)).toEqual([]);
  });

  it('ignores new pages that are not in the baseline', () => {
    expect(baselineProblems({}, { '/new/': facts() }, noAllow)).toEqual([]);
  });
});

describe('pageProblems', () => {
  it('reports JSON-LD parse errors', () => {
    expect(pageProblems('/a/', facts({ jsonLdErrors: ['Unexpected token'] })))
      .toEqual(['/a/: JSON-LD does not parse (Unexpected token)']);
  });

  it('reports noindex in any case', () => {
    expect(pageProblems('/a/', facts({ robots: 'NoIndex, follow' }))).toEqual(['/a/: robots meta contains noindex']);
  });

  it('passes a clean page', () => {
    expect(pageProblems('/a/', facts())).toEqual([]);
  });
});

describe('resolveInternal', () => {
  it('resolves root-relative and page-relative paths', () => {
    expect(resolveInternal('/halal/', '/allergies/')).toBe('/halal/');
    expect(resolveInternal('data.js', '/')).toBe('/data.js');
    expect(resolveInternal('../vegan/', '/allergies/labeling-guide/')).toBe('/allergies/vegan/');
  });

  it('treats absolute links to the own site as internal', () => {
    expect(resolveInternal('https://tabemasen.io/gluten-free-japan/#x', '/gluten-free/')).toBe('/gluten-free-japan/');
  });

  it('strips query and hash, and ignores a pure fragment', () => {
    expect(resolveInternal('/?a=1#p=vegan', '/vegan/')).toBe('/');
    expect(resolveInternal('#corrections', '/about/')).toBeNull();
  });

  it('returns null for external and non-navigational links', () => {
    expect(resolveInternal('https://buymeacoffee.com/iwakuranik', '/')).toBeNull();
    expect(resolveInternal('//gc.zgo.at/count.js', '/')).toBeNull();
    expect(resolveInternal('mailto:hello@tabemasen.io', '/')).toBeNull();
  });

  it('decodes percent-encoding', () => {
    expect(resolveInternal('/a%20b/', '/')).toBe('/a b/');
  });
});

describe('linkCandidates', () => {
  it('maps a directory path to its index.html', () => {
    expect(linkCandidates('/halal/')).toEqual(['halal/index.html']);
    expect(linkCandidates('/')).toEqual(['index.html']);
  });

  it('accepts a file or a directory without trailing slash', () => {
    expect(linkCandidates('/data.js')).toEqual(['data.js', 'data.js/index.html']);
  });
});

describe('sitemapProblems', () => {
  const xml = '<urlset><url><loc>https://tabemasen.io/</loc></url><url><loc>https://tabemasen.io/halal/</loc></url></urlset>';

  it('passes when every indexable URL is listed', () => {
    expect(sitemapProblems(xml, ['/', '/halal/'])).toEqual([]);
  });

  it('reports indexable URLs missing from the sitemap', () => {
    expect(sitemapProblems(xml, ['/', '/halal/', '/vegan/'])).toEqual(['sitemap.xml is missing /vegan/']);
  });

  it('reports sitemap URLs that do not exist', () => {
    expect(sitemapProblems(xml, ['/'])).toEqual(['sitemap.xml lists /halal/, which is not an indexable built page']);
  });
});
```

- [ ] **Step 3: Run the tests and see them fail**

Run: `npx vitest run tests/page-facts.test.mjs tests/seo-checks.test.mjs`
Expected: FAIL, modules not found.

- [ ] **Step 4: Implement `page-facts.mjs`**

```js
// scripts/lib/page-facts.mjs
import { parse } from 'parse5';

const collapse = (s) => s.replace(/[ \t\n\r\f]+/g, ' ').trim();

export function pageFacts(html) {
  const facts = {
    title: null, description: null, h1: null, canonical: null, robots: null,
    jsonLdTypes: [], jsonLdErrors: [], links: [],
  };
  visit(parse(html), (el) => {
    const a = Object.fromEntries(el.attrs.map((x) => [x.name, x.value]));
    switch (el.tagName) {
      case 'title': facts.title ??= collapse(textOf(el)); break;
      case 'h1': facts.h1 ??= collapse(textOf(el)); break;
      case 'meta':
        if (a.name === 'description') facts.description ??= a.content ?? '';
        if (a.name === 'robots') facts.robots ??= a.content ?? '';
        break;
      case 'link':
        if (a.rel === 'canonical') facts.canonical ??= a.href ?? '';
        else if (a.href) facts.links.push(a.href);
        break;
      case 'script':
        if (a.type === 'application/ld+json') {
          try { collectTypes(JSON.parse(textOf(el)), facts.jsonLdTypes); }
          catch (e) { facts.jsonLdErrors.push(e.message); }
        } else if (a.src) facts.links.push(a.src);
        break;
      case 'a': if (a.href) facts.links.push(a.href); break;
      case 'img': case 'source': if (a.src) facts.links.push(a.src); break;
    }
  });
  facts.jsonLdTypes = [...new Set(facts.jsonLdTypes)].sort();
  return facts;
}

function visit(node, fn) {
  for (const child of node.childNodes ?? []) {
    if (!child.tagName) continue;
    fn(child);
    visit(child.tagName === 'template' ? child.content : child, fn);
  }
}

function textOf(el) {
  let s = '';
  (function walk(n) {
    for (const c of n.childNodes ?? []) {
      if (c.nodeName === '#text') s += c.value;
      else walk(c);
    }
  })(el);
  return s;
}

function collectTypes(node, out) {
  if (Array.isArray(node)) { node.forEach((n) => collectTypes(n, out)); return; }
  if (!node || typeof node !== 'object') return;
  if (node['@type']) [].concat(node['@type']).forEach((t) => out.push(t));
  for (const v of Object.values(node)) collectTypes(v, out);
}
```

- [ ] **Step 5: Implement `seo-checks.mjs`**

```js
// scripts/lib/seo-checks.mjs
export const SITE = 'https://tabemasen.io';
export const BASELINE_FIELDS = ['title', 'description', 'h1', 'canonical', 'robots', 'jsonLdTypes'];

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function baselineProblems(baseline, current, allowlist) {
  const problems = [];
  for (const [url, before] of Object.entries(baseline)) {
    const now = current[url];
    if (!now) { problems.push(`${url}: page is missing from dist/`); continue; }
    for (const field of BASELINE_FIELDS) {
      if (same(before[field], now[field])) continue;
      const allowed = allowlist.changes.some((c) => c.url === url && c.field === field);
      if (!allowed) {
        problems.push(`${url}: ${field} changed\n    was: ${JSON.stringify(before[field])}\n    now: ${JSON.stringify(now[field])}`);
      }
    }
  }
  return problems;
}

export function pageProblems(url, facts) {
  const problems = facts.jsonLdErrors.map((e) => `${url}: JSON-LD does not parse (${e})`);
  if (facts.robots && /noindex/i.test(facts.robots)) problems.push(`${url}: robots meta contains noindex`);
  return problems;
}

export function resolveInternal(href, pageUrl, site = SITE) {
  if (/^(mailto:|tel:|javascript:|data:)/i.test(href) || href.startsWith('#')) return null;
  let u;
  try { u = new URL(href, site + pageUrl); } catch { return null; }
  if (u.origin !== site) return null;
  return decodeURIComponent(u.pathname);
}

export function linkCandidates(pathname) {
  const rel = pathname.replace(/^\//, '');
  if (rel === '' || rel.endsWith('/')) return [`${rel}index.html`];
  return [rel, `${rel}/index.html`];
}

export function sitemapProblems(sitemapXml, indexableUrls, site = SITE) {
  const listed = [...sitemapXml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((m) => m[1].replace(site, '') || '/');
  const problems = indexableUrls
    .filter((u) => !listed.includes(u))
    .map((u) => `sitemap.xml is missing ${u}`);
  for (const u of listed) {
    if (!indexableUrls.includes(u)) problems.push(`sitemap.xml lists ${u}, which is not an indexable built page`);
  }
  return problems;
}
```

- [ ] **Step 6: Run the tests and see them pass**

Run: `npx vitest run tests/page-facts.test.mjs tests/seo-checks.test.mjs`
Expected: 24 passed (5 + 19).

- [ ] **Step 7: Implement `dist-pages.mjs`, the baseline CLI and the check CLI**

```js
// scripts/lib/dist-pages.mjs
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export function listDistPages(distDir) {
  const out = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name === 'index.html') {
        const folder = relative(distDir, dir).split(sep).join('/');
        out.push({ url: folder ? `/${folder}/` : '/', file: path });
      }
    }
  })(distDir);
  return out.sort((a, b) => a.url.localeCompare(b.url));
}
```

```js
// scripts/seo-baseline.mjs
// Records what search engines see today. Run once at the end of Milestone 1;
// after that, changes go through seo-allowlist.json, not by re-running this.
import { readFileSync, writeFileSync } from 'node:fs';
import { pageFacts } from './lib/page-facts.mjs';
import { BASELINE_FIELDS } from './lib/seo-checks.mjs';
import { listDistPages } from './lib/dist-pages.mjs';

const baseline = {};
for (const { url, file } of listDistPages('dist')) {
  const facts = pageFacts(readFileSync(file, 'utf8'));
  baseline[url] = Object.fromEntries(BASELINE_FIELDS.map((f) => [f, facts[f]]));
}
writeFileSync('seo-baseline.json', JSON.stringify(baseline, null, 2) + '\n');
console.log(`seo-baseline.json: ${Object.keys(baseline).length} pages`);
```

```js
// scripts/check-seo.mjs
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pageFacts } from './lib/page-facts.mjs';
import { listDistPages } from './lib/dist-pages.mjs';
import {
  SITE, baselineProblems, pageProblems, resolveInternal, linkCandidates, sitemapProblems,
} from './lib/seo-checks.mjs';

const dist = 'dist';
const baseline = JSON.parse(readFileSync('seo-baseline.json', 'utf8'));
const allowlist = JSON.parse(readFileSync('seo-allowlist.json', 'utf8'));

const current = {};
const problems = [];
const indexable = [];

for (const { url, file } of listDistPages(dist)) {
  const facts = pageFacts(readFileSync(file, 'utf8'));
  current[url] = facts;
  problems.push(...pageProblems(url, facts));
  if (facts.canonical === SITE + url && !/noindex/i.test(facts.robots ?? '')) indexable.push(url);

  for (const href of facts.links) {
    const path = resolveInternal(href, url);
    if (path === null) continue;
    if (linkCandidates(path).some((c) => existsSync(join(dist, c)))) continue;
    if (allowlist.knownBrokenLinks.some((k) => k.from === url && k.href === href)) continue;
    problems.push(`${url}: broken internal reference ${href}`);
  }
}

problems.push(...baselineProblems(baseline, current, allowlist));
const sitemapPath = join(dist, 'sitemap.xml');
if (existsSync(sitemapPath)) problems.push(...sitemapProblems(readFileSync(sitemapPath, 'utf8'), indexable));
else problems.push('dist/sitemap.xml is missing');

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  console.error(`\n${problems.length} SEO problem(s).`);
  process.exit(1);
}
console.log(`SEO check passed: ${Object.keys(current).length} pages, ${indexable.length} indexable.`);
```

- [ ] **Step 8: Create the allowlist, generate the baseline, run the check**

`seo-allowlist.json`:
```json
{
  "changes": [],
  "knownBrokenLinks": []
}
```

```bash
npm run build && npm run seo:baseline && npm run check:seo; echo "exit $?"
```
Expected: `seo-baseline.json: 12 pages`. Then either `SEO check passed: 12 pages, 11 indexable.` (`/gluten-free/` canonicalises elsewhere, so it is not indexable), or a list of problems.

If the check reports problems, they already exist on the live site, because Task 4 proved the output is identical. Do **not** change pages in M1. For each problem:
- **Broken internal reference:** add `{ "from": "<url>", "href": "<href>", "reason": "Pre-existing on live site; fix in a separate PR", }` to `knownBrokenLinks`.
- **Sitemap mismatch or JSON-LD error:** stop and report it to the user with the exact message. These need a decision (a real fix PR to `main` versus accepting it), not an allowlist entry.

Re-run until it exits 0. Open `seo-baseline.json` and check that the `/allergies/labeling-guide/` H1 reads `Japan's allergen labeling, explained: what's on the packet vs. what's not on the menu` (with a no-break space before "what's", invisible in most editors).

- [ ] **Step 9: Commit**

```bash
git add scripts/lib/page-facts.mjs scripts/lib/seo-checks.mjs scripts/lib/dist-pages.mjs scripts/seo-baseline.mjs scripts/check-seo.mjs tests/page-facts.test.mjs tests/seo-checks.test.mjs seo-baseline.json seo-allowlist.json
git commit -m "build: SEO baseline and npm run check:seo (titles, H1s, canonicals, JSON-LD, links, sitemap)"
```

---

### Task 6: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/site.yml`

**Interfaces:**
- Consumes: `npm test`, `npm run build`, `npm run compare`, `npm run check:seo`; tag `pre-astro` on the remote.
- Produces: CI on every push and PR; deploys `dist/` to GitHub Pages only on push to `main`.

- [ ] **Step 1: Create the workflow**

```yaml
# .github/workflows/site.yml
name: Site

on:
  push:
    branches: [main, astro-redesign]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: site-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # compare needs the pre-astro tag and its tree
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      # Milestone 1 gate: output identical to the pre-astro site.
      # Remove this step in the first Milestone 2 slice that changes a page.
      - run: npm run compare
      - run: npm run check:seo
      - if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Run the same sequence locally**

```bash
npm ci && npm test && npm run build && npm run compare && npm run check:seo
```
Expected: every command exits 0.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/site.yml
git commit -m "ci: build, test, compare and SEO-check every push; deploy main to Pages"
```

- [ ] **Step 4: Ask the user, then push the branch and the tag**

Pushing is outward-facing: ask first. On approval:
```bash
git push -u origin astro-redesign
git push origin pre-astro
```
Then watch the run: `gh run watch --exit-status`. Expected: the `build` job passes and `deploy` is skipped (not `main`). If `actions/upload-pages-artifact@v3` or another action reports a deprecated major version, bump it to the version the error names and re-run.

---

### Task 7: Docs, live smoke script, verification and PR

**Files:**
- Create: `scripts/smoke-live.mjs`
- Modify: `README.md` ("Quick start" and "Adding a new allergen or language" sections), `CHANGELOG.md` (new dated entry at the top), `docs/superpowers/specs/2026-10-12-astro-migration-and-redesign-design.md` (§3 amendment)

**Interfaces:**
- Consumes: everything above.
- Produces: `npm run smoke:live -- <origin>`, which exits 0 when every URL answers 200, slash-less paths redirect to the slash URL (live origin only), and `data.js`, `app.js`, `styles.css`, `sitemap.xml`, `robots.txt` and `llms.txt` are served.

- [ ] **Step 1: Write `scripts/smoke-live.mjs`**

```js
// scripts/smoke-live.mjs
// Usage: npm run smoke:live -- https://tabemasen.io
//        npm run smoke:live -- http://localhost:4321   (redirect checks skipped)
const origin = (process.argv[2] ?? 'https://tabemasen.io').replace(/\/$/, '');
const live = !/localhost|127\.0\.0\.1/.test(origin);

const pages = ['/', '/about/', '/allergies/', '/allergies/food-allergies-in-japanese/',
  '/allergies/labeling-guide/', '/celiac/', '/featured/', '/gluten-free/', '/gluten-free-japan/',
  '/halal/', '/halal/certification-guide/', '/vegan/'];
const files = ['/data.js', '/app.js', '/styles.css', '/nav.js', '/analytics.js',
  '/sitemap.xml', '/robots.txt', '/llms.txt', '/llms-full.txt', '/assets/og-image.png'];
const slashless = ['/allergies', '/gluten-free', '/halal', '/vegan'];

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failures++; };

for (const path of [...pages, ...files]) {
  const res = await fetch(origin + path, { redirect: 'manual' });
  check(res.status === 200, `${res.status} ${path}`);
}

if (live) {
  for (const path of slashless) {
    const res = await fetch(origin + path, { redirect: 'manual' });
    const to = res.headers.get('location') ?? '';
    check([301, 308].includes(res.status) && to.replace(origin, '') === `${path}/`,
      `${res.status} ${path} -> ${to || '(no location)'}`);
  }
}

console.log(`\n${failures} failure(s) against ${origin}`);
process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Record today's live behaviour before anything changes**

```bash
npm run smoke:live -- https://tabemasen.io
for p in /README.html /CHANGELOG.html /REQUIREMENTS.html; do printf "%s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "https://tabemasen.io$p"; done
```
Expected: the smoke run passes against the current (pre-Astro) site. If it fails, the failing check describes the live site as it is today: adjust the check only if the user confirms that behaviour is intended. Write down the three status codes for the PR description. Any `200` there is a page that will disappear (Jekyll rendered it; Actions deploys don't run Jekyll).

- [ ] **Step 3: Walk through the built site in a browser**

```bash
npm run build && npm run preview
```
Run `npm run smoke:live -- http://localhost:4321` in a second terminal (expected: 0 failures). Then, in a browser at `http://localhost:4321`, check each of these and note the result:
- `/`: tap Peanut, Shrimp, Egg and Severe. The card updates live and the URL hash becomes `#a=…&s=severe`.
- Reload: the selections persist.
- Copy link, open it in a private window: same card.
- Download PNG: a PNG downloads and shows the Japanese text.
- Print preview shows only the card.
- `/vegan/` → its "Generate" link opens `/#p=vegan` with Vegan selected. Repeat for `/halal/` and `/gluten-free-japan/`.
- `/gluten-free/#p=gluten-free` ends on `/gluten-free-japan/#p=gluten-free`.
- DevTools console on `/`, `/allergies/labeling-guide/` and `/halal/`: no errors.

Stop the preview server.

- [ ] **Step 4: Update `README.md`**

Replace the "Quick start" section with:
````markdown
## Quick start

Requires Node 22 (`nvm use`).

```bash
npm ci
npm run dev        # http://localhost:4321 with live reload
npm run build      # static site in dist/
npm run preview    # serve dist/ locally
npm test           # unit tests for the build scripts
npm run check:seo  # titles, H1s, canonicals, JSON-LD, links and sitemap vs seo-baseline.json
```

Pages live in `src/pages/` (one `index.astro` per URL). Files served as-is (scripts, styles, images, `CNAME`, `robots.txt`, `sitemap.xml`, `llms.txt`) live in `public/`.

Deploys run from GitHub Actions on every push to `main` (`.github/workflows/site.yml`).
````

In "Adding a new allergen or language", change `data.js` references to `public/data.js`.

- [ ] **Step 5: Add a `CHANGELOG.md` entry** at the top, matching the file's existing heading style:

```markdown
## 2026-10-12

- Build: the site is now built with Astro and deployed by GitHub Actions. Every page's output is unchanged (verified by `npm run compare` against the `pre-astro` tag). New guard: `npm run check:seo`.
```

- [ ] **Step 6: Amend the spec §3** in `docs/superpowers/specs/2026-10-12-astro-migration-and-redesign-design.md`

Replace the "### Shared layout" subsection body with:
```markdown
- **Amended 2026-10-12 (M1 plan):** M1 does not extract a shared layout. Every page's head, header and footer differ (active nav state, analytics event names, footer link lists, page-specific inline styles), so a layout could not reproduce them without a prop per line, and Milestone 2 replaces header, footer and layouts. Pages are ported verbatim with `is:inline` on every `<script>`/`<style>`. `LegacyLayout` is introduced in M2 slice 1 for pages not yet redesigned.
```
In "### Verification", replace ``(via `git show main:<path>`)`` with ``(via `git show pre-astro:<path>`, the tag at `a5d5b21`)``.
In "### Housekeeping", replace the `CHANGE_REQUESTS_V1.md` bullet with: ``- `CHANGE_REQUESTS_V1.md` is gitignored (local notes); its "no build step" constraint is superseded by this spec.``

- [ ] **Step 7: Run every check and commit**

```bash
npm test && npm run build && npm run compare && npm run check:seo
git add scripts/smoke-live.mjs README.md CHANGELOG.md docs/superpowers/specs/2026-10-12-astro-migration-and-redesign-design.md
git commit -m "docs: Astro build instructions, changelog, live smoke check; amend spec for M1"
```

- [ ] **Step 8: Ask the user, then push and open the PR**

On approval:
```bash
git push
gh pr create --base main --head astro-redesign --title "Milestone 1: build with Astro (identical output)" --body-file - <<'EOF'
## What

The site is now built with Astro and deployed by GitHub Actions. **No page output changes.**

- All 12 pages ported verbatim to `src/pages/**/index.astro` (`is:inline` on every script/style).
- Deployed static files moved to `public/` unchanged.
- `npm run compare`: 12 pages + all static files identical to the `pre-astro` tag.
- `npm run check:seo`: guards titles, descriptions, H1s, canonicals, JSON-LD, internal links and sitemap against `seo-baseline.json`.

## Before merging (repo owner)

1. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Merge. The workflow builds and deploys `main`.
3. Run `npm run smoke:live -- https://tabemasen.io`.

Rollback: revert this merge and set Pages source back to "Deploy from branch" (`main`, `/`).

## Known change

Jekyll no longer runs, so Markdown files GitHub Pages rendered are no longer served: <list from Task 7 Step 2, or "none were served">. None are linked from the site or listed in the sitemap.

## Verification

<paste the Task 7 Step 3 checklist results>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01UpttBQPap9JzyZfAZEcyqK
EOF
```
Expected: the PR URL is printed and CI on the PR passes.

- [ ] **Step 9: After the owner merges, confirm production**

```bash
gh run watch --exit-status
npm run smoke:live -- https://tabemasen.io
```
Expected: the deploy job succeeds and 0 failures. If anything fails, report it to the user with the output and propose the rollback from the PR description. Do not attempt fixes on `main` directly.

---

## After Milestone 1

Milestone 2 is planned slice by slice once M1 is live. Next plan: `docs/superpowers/plans/<date>-m2-slice-1-foundation-and-allergies.md`, covering tokens, fonts, components, layouts (including `LegacyLayout` for unmigrated pages), the guide collection, `/guides/`, the new header and footer, `/`, `/allergies/` and its two guides. It also removes the `npm run compare` CI step.
