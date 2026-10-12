// What a reader (and a search engine) gets from a built page: its text blocks in order,
// link targets, image alts, analytics events and JSON-LD. check:content compares the
// build against the committed content-snapshot.json, so any copy change shows up in review.
import { parse } from 'parse5';
import { textBlocks } from './text-blocks.mjs';

const attr = (el, name) => el.attrs?.find((a) => a.name === name)?.value;
function walk(node, fn) {
  for (const c of node.childNodes ?? []) { if (c.tagName) { fn(c); walk(c.tagName === 'template' ? c.content : c, fn); } }
}
const sortedUnique = (xs) => [...new Set(xs)].sort();

export function pageSnapshot(html) {
  const links = [], alts = [], events = [], jsonld = [];
  walk(parse(html), (el) => {
    if (el.tagName === 'a' && attr(el, 'href') != null) links.push(attr(el, 'href'));
    if (el.tagName === 'img' && attr(el, 'alt')) alts.push(attr(el, 'alt'));
    if (attr(el, 'data-gc-event')) events.push(attr(el, 'data-gc-event'));
    if (el.tagName === 'script' && attr(el, 'type') === 'application/ld+json') {
      jsonld.push(JSON.parse(el.childNodes.map((t) => t.value ?? '').join('')));
    }
  });
  return { blocks: textBlocks(html, { unique: false }), links: sortedUnique(links), alts, events: sortedUnique(events), jsonld };
}

// Multiset difference, so losing one of two identical blocks still counts.
function listDiff(label, before, after) {
  const left = new Map();
  for (const x of after) left.set(x, (left.get(x) ?? 0) + 1);
  const out = [];
  for (const x of before) {
    if (left.get(x)) left.set(x, left.get(x) - 1);
    else out.push(`- ${label}: ${x}`);
  }
  for (const [x, n] of left) for (let i = 0; i < n; i++) out.push(`+ ${label}: ${x}`);
  return out;
}

export function snapshotDiff(before, after) {
  const out = [
    ...listDiff('block', before.blocks, after.blocks),
    ...listDiff('link', before.links, after.links),
    ...listDiff('alt', before.alts, after.alts),
    ...listDiff('event', before.events, after.events),
  ];
  if (JSON.stringify(before.jsonld) !== JSON.stringify(after.jsonld)) out.push('JSON-LD changed');
  return out;
}
