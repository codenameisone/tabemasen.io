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
