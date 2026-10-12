// What a reader (and a search engine) gets from a built page: its text blocks in order,
// its links in order (target, analytics event, new tab), image alts, aria-labels,
// analytics events and JSON-LD. check:content compares the build against the committed
// content-snapshot.json, so any copy, link or order change shows up in review.
import { parse } from 'parse5';
import { textBlocks } from './text-blocks.mjs';

const attr = (el, name) => el.attrs?.find((a) => a.name === name)?.value;
function walk(node, fn) {
  for (const c of node.childNodes ?? []) { if (c.tagName) { fn(c); walk(c.tagName === 'template' ? c.content : c, fn); } }
}

export function pageSnapshot(html) {
  const links = [], alts = [], labels = [], events = [], jsonld = [];
  walk(parse(html), (el) => {
    const href = el.tagName === 'a' ? attr(el, 'href') : undefined;
    const event = attr(el, 'data-gc-event');
    if (href != null) {
      links.push(`${href}${event ? ` [${event}]` : ''}${attr(el, 'target') === '_blank' ? ' (new tab)' : ''}`);
    } else if (event) events.push(event);
    if (el.tagName === 'img' && attr(el, 'alt')) alts.push(attr(el, 'alt'));
    if (attr(el, 'aria-label')) labels.push(attr(el, 'aria-label'));
    if (el.tagName === 'script' && attr(el, 'type') === 'application/ld+json') {
      jsonld.push(JSON.parse(el.childNodes.map((t) => t.value ?? '').join('')));
    }
  });
  return { blocks: textBlocks(html, { unique: false }), links, alts, labels, events, jsonld };
}

// Ordered diff (longest common subsequence). A block that only changed position is
// reported once as "moved"; everything else as removed (-) or added (+).
function listDiff(label, before = [], after = []) {
  const n = before.length, m = after.length;
  const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    L[i][j] = before[i] === after[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  }
  const removed = [], added = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (before[i] === after[j]) { i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) removed.push(before[i++]);
    else added.push(after[j++]);
  }
  while (i < n) removed.push(before[i++]);
  while (j < m) added.push(after[j++]);
  const out = [];
  for (const x of removed) {
    const k = added.indexOf(x);
    if (k !== -1) { added.splice(k, 1); out.push(`~ ${label} moved: ${x}`); }
    else out.push(`- ${label}: ${x}`);
  }
  for (const x of added) out.push(`+ ${label}: ${x}`);
  return out;
}

export function snapshotDiff(before, after) {
  const out = ['blocks', 'links', 'alts', 'labels', 'events']
    .flatMap((k) => listDiff(k.replace(/s$/, ''), before[k], after[k]));
  if (JSON.stringify(before.jsonld) !== JSON.stringify(after.jsonld)) out.push('JSON-LD changed');
  return out;
}
