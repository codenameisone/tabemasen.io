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
