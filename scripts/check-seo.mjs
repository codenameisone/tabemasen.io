import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pageFacts } from './lib/page-facts.mjs';
import { listDistPages } from './lib/dist-pages.mjs';
import {
  SITE, baselineProblems, pageProblems, resolveInternal, linkCandidates, sitemapProblems,
  pageBasicsProblems, allowlistProblems,
} from './lib/seo-checks.mjs';

const dist = 'dist';
const baseline = JSON.parse(readFileSync('seo-baseline.json', 'utf8'));
const allowlist = JSON.parse(readFileSync('seo-allowlist.json', 'utf8'));

const current = {};
const problems = [];
const indexable = [];

problems.push(...allowlistProblems(allowlist));

const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };

for (const { url, file } of listDistPages(dist)) {
  const facts = pageFacts(readFileSync(file, 'utf8'));
  current[url] = facts;
  problems.push(...pageProblems(url, facts));
  problems.push(...pageBasicsProblems(url, facts));
  if (facts.canonical === SITE + url && !/noindex/i.test(facts.robots ?? '')) indexable.push(url);

  for (const href of facts.links) {
    const path = resolveInternal(href, url);
    if (path === null) continue;
    if (linkCandidates(path).some((c) => isFile(join(dist, c)))) continue;
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
