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
export function socialMeta(html) {
  const out = {};
  for (const [tag] of html.matchAll(/<meta\s[^>]*>/gi)) {
    const key = tag.match(/\b(?:property|name)="((?:og|twitter|article):[^"]+)"/i)?.[1];
    const content = tag.match(/\bcontent="([^"]*)"/i)?.[1];
    if (key && content !== undefined) out[key] = decodeEntities(content);
  }
  return out;
}

// Every legacy social value must survive unchanged; tags added since are fine.
export function socialProblems(baseline, current) {
  const problems = [];
  for (const [url, before] of Object.entries(baseline)) {
    const now = current[url] ?? {};
    for (const [key, value] of Object.entries(before)) {
      if (now[key] === value) continue;
      problems.push(`${url}: ${key} changed\n    was: ${JSON.stringify(value)}\n    now: ${JSON.stringify(now[key] ?? null)}`);
    }
  }
  return problems;
}
