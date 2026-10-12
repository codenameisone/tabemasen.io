// Pages keep their copy in raw HTML fragments; build-time inserts go at an explicit
// marker, and the build fails if a copy edit removes or duplicates it.
export function insertAtMarker(html: string, marker: string, insert: string): string {
  const count = html.split(marker).length - 1;
  if (count !== 1) throw new Error(`insertAtMarker: expected ${marker} once in the fragment, found ${count}`);
  return html.replace(marker, () => insert);
}

// Splits a fragment at markers (each exactly once, in this order) so components can go between the parts.
export function splitAtMarkers(html: string, markers: string[]): string[] {
  let last = -1;
  for (const m of markers) {
    const count = html.split(m).length - 1;
    if (count !== 1) throw new Error(`splitAtMarkers: expected ${m} once in the fragment, found ${count}`);
    const at = html.indexOf(m);
    if (at < last) throw new Error(`splitAtMarkers: ${m} is out of order`);
    last = at;
  }
  const parts: string[] = [];
  let rest = html;
  for (const m of markers) {
    const i = rest.indexOf(m);
    parts.push(rest.slice(0, i));
    rest = rest.slice(i + m.length);
  }
  parts.push(rest);
  return parts;
}
