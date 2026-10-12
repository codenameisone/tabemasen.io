// scripts/lib/extract-html.mjs — pull fragments out of a legacy page, verbatim.
import { parse, serializeOuter } from 'parse5';

const attr = (el, name) => el.attrs?.find((a) => a.name === name)?.value;
function matches(el, sel) {
  if (!el.tagName) return false;
  if (sel.startsWith('.')) return (attr(el, 'class') ?? '').split(/\s+/).includes(sel.slice(1));
  if (sel.startsWith('#')) return attr(el, 'id') === sel.slice(1);
  return el.tagName === sel;
}
function findAll(node, sel, out = []) {
  for (const c of node.childNodes ?? []) {
    if (!c.tagName) continue;
    if (matches(c, sel)) out.push(c);
    findAll(c.tagName === 'template' ? c.content : c, sel, out);
  }
  return out;
}
function first(html, sel) {
  const hit = findAll(parse(html), sel)[0];
  if (!hit) throw new Error(`extract-html: nothing matches ${sel}`);
  return hit;
}
function textOf(el) {
  let s = '';
  (function walk(n) { for (const c of n.childNodes ?? []) { if (c.nodeName === '#text') s += c.value; else walk(c); } })(el);
  return s;
}

export const outerHTML = (html, sel) => serializeOuter(first(html, sel));

export function outerHTMLWithout(html, sel, removeSel) {
  const el = first(html, sel);
  for (const victim of findAll(el, removeSel)) {
    const siblings = victim.parentNode.childNodes;
    siblings.splice(siblings.indexOf(victim), 1);
  }
  return serializeOuter(el);
}

export const innerTextOfAll = (html, sel) => findAll(parse(html), sel).map(textOf);
