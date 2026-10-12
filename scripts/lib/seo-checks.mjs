import { parse as parseHtml } from 'parse5';
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

const safeDecode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

export function resolveInternal(href, pageUrl, site = SITE) {
  if (/^(mailto:|tel:|javascript:|data:)/i.test(href) || href.startsWith('#')) return null;
  let u;
  try { u = new URL(href, site + pageUrl); } catch { return null; }
  if (u.origin !== site) return null;
  return safeDecode(u.pathname);
}

export function pageBasicsProblems(url, facts) {
  if (facts.refresh) return [];
  return ['title', 'description', 'h1', 'canonical']
    .filter((f) => !facts[f])
    .map((f) => `${url}: missing ${f}`);
}

export function allowlistProblems(allowlist) {
  const problems = [];
  allowlist.changes.forEach((c, i) => {
    const id = `seo-allowlist.json changes[${i}] (${c.url} ${c.field})`;
    if (!c.reason) problems.push(`${id}: missing reason`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date ?? '')) problems.push(`${id}: date must be YYYY-MM-DD`);
  });
  allowlist.knownBrokenLinks.forEach((k, i) => {
    if (!k.reason) problems.push(`seo-allowlist.json knownBrokenLinks[${i}] (${k.from} -> ${k.href}): missing reason`);
  });
  return problems;
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

const decodeEntities = (s) => s.replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// og:, twitter: and article: meta (link previews). Keyed by property/name; values entity-decoded.
// A key that repeats (article:tag) becomes an array in document order; single keys stay strings.
export function socialMeta(html) {
  const out = {};
  for (const [tag] of html.matchAll(/<meta\s[^>]*>/gi)) {
    const key = tag.match(/\b(?:property|name)="((?:og|twitter|article):[^"]+)"/i)?.[1];
    const content = tag.match(/\bcontent="([^"]*)"/i)?.[1];
    if (!key || content === undefined) continue;
    const value = decodeEntities(content);
    if (!(key in out)) out[key] = value;
    else out[key] = [...[].concat(out[key]), value];   // repeated key (article:tag): keep all, in order
  }
  return out;
}

// Every legacy social value must survive unchanged; tags added since are fine.
export function socialProblems(baseline, current) {
  const problems = [];
  for (const [url, before] of Object.entries(baseline)) {
    const now = current[url] ?? {};
    for (const [key, value] of Object.entries(before)) {
      if (JSON.stringify(now[key]) === JSON.stringify(value)) continue;
      problems.push(`${url}: ${key} changed\n    was: ${JSON.stringify(value)}\n    now: ${JSON.stringify(now[key] ?? null)}`);
    }
  }
  return problems;
}

// Google wants FAQPage answers to match what the page shows. Each Question name and
// Answer text must appear word for word in the visible text (whitespace collapsed).
const INLINE = new Set(['a', 'strong', 'em', 'b', 'i', 'span', 'code', 'abbr', 'small', 'sup', 'sub', 'mark', 'q', 'cite', 'time', 'kbd']);
const HIDDEN = new Set(['script', 'style', 'template', 'head', 'noscript']);
const squash = (s) => s.replace(/\s+/g, ' ').trim();

function visibleText(html) {
  let out = '';
  (function walk(n) {
    for (const c of n.childNodes ?? []) {
      if (c.nodeName === '#text') out += c.value;
      else if (c.tagName && !HIDDEN.has(c.tagName)) {
        const block = !INLINE.has(c.tagName);
        if (block) out += ' ';
        walk(c);
        if (block) out += ' ';
      }
    }
  })(parseHtml(html));
  return squash(out);
}

function faqQuestions(html) {
  const out = [];
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    if (node['@type'] === 'FAQPage') for (const q of [node.mainEntity ?? []].flat()) out.push(q);
    for (const v of Object.values(node)) if (typeof v === 'object') visit(v);
  };
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { visit(JSON.parse(m[1])); } catch { /* reported by pageProblems */ }
  }
  return out;
}

export function faqProblems(url, html) {
  const text = visibleText(html);
  const problems = [];
  for (const q of faqQuestions(html)) {
    const name = squash(q.name ?? '');
    const answer = squash(q.acceptedAnswer?.text ?? '');
    if (!text.includes(name)) problems.push(`${url}: FAQ JSON-LD question "${name}" is not on the page`);
    else if (!text.includes(answer)) problems.push(`${url}: FAQ JSON-LD answer to "${name}" is not the visible answer text`);
  }
  return problems;
}
