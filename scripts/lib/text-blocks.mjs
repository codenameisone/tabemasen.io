import { parse } from 'parse5';

const BLOCK = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'dt', 'dd', 'summary',
  'td', 'th', 'figcaption', 'blockquote', 'caption', 'label', 'button']);
const SKIP = new Set(['script', 'style', 'template']);
const collapse = (s) => s.replace(/[ \t\n\r\f]+/g, ' ').trim();
const attr = (el, name) => el.attrs?.find((a) => a.name === name)?.value;

function matches(el, sel) {
  if (!el.tagName) return false;
  if (sel.startsWith('.')) return (attr(el, 'class') ?? '').split(/\s+/).includes(sel.slice(1));
  if (sel.startsWith('#')) return attr(el, 'id') === sel.slice(1);
  return el.tagName === sel;
}

function findAll(node, selectors, out) {
  for (const c of node.childNodes ?? []) {
    if (!c.tagName) continue;
    if (selectors.some((s) => matches(c, s))) out.push(c);
    else findAll(c, selectors, out);
  }
}

function textOf(el, exclude) {
  let s = '';
  (function walk(n) {
    for (const c of n.childNodes ?? []) {
      if (c.nodeName === '#text') s += c.value;
      else if (c.tagName && !SKIP.has(c.tagName) && !exclude.some((x) => matches(c, x))) walk(c);
    }
  })(el);
  return s;
}

const hasDirectText = (el) => (el.childNodes ?? []).some((c) => c.nodeName === '#text' && c.value.trim());

function collect(el, exclude, out) {
  if (SKIP.has(el.tagName) || exclude.some((x) => matches(el, x))) return;
  if (BLOCK.has(el.tagName) || hasDirectText(el)) {
    const t = collapse(textOf(el, exclude));
    if (t) out.push(t);
    return;
  }
  for (const c of el.childNodes ?? []) if (c.tagName) collect(c, exclude, out);
}

export function textBlocks(html, { include = ['body'], exclude = [] } = {}) {
  const roots = [];
  findAll(parse(html), include, roots);
  const out = [];
  for (const r of roots) collect(r, exclude, out);
  return [...new Set(out)];
}

export function missingBlocks(oldBlocks, newBlocks, allowed) {
  const have = new Set(newBlocks);
  const ok = new Set(allowed);
  return oldBlocks.filter((b) => !have.has(b) && !ok.has(b));
}
