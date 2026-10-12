import { parse } from 'parse5';

const collapse = (s) => s.replace(/[ \t\n\r\f]+/g, ' ').trim();

export function pageFacts(html) {
  const facts = {
    title: null, description: null, h1: null, canonical: null, robots: null,
    jsonLdTypes: [], jsonLdErrors: [], links: [], refresh: false,
  };
  visit(parse(html), (el) => {
    const a = Object.fromEntries(el.attrs.map((x) => [x.name, x.value]));
    switch (el.tagName) {
      case 'title': facts.title ??= collapse(textOf(el)); break;
      case 'h1': facts.h1 ??= collapse(textOf(el)); break;
      case 'meta':
        if (a.name === 'description') facts.description ??= a.content ?? '';
        if (a.name === 'robots') facts.robots ??= a.content ?? '';
        if ((a['http-equiv'] ?? '').toLowerCase() === 'refresh') facts.refresh = true;
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
