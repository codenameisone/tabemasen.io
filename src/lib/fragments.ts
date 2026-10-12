// Pages keep their copy in raw HTML fragments; build-time inserts go at an explicit
// marker, and the build fails if a copy edit removes or duplicates it.
export function insertAtMarker(html: string, marker: string, insert: string): string {
  const count = html.split(marker).length - 1;
  if (count !== 1) throw new Error(`insertAtMarker: expected ${marker} once in the fragment, found ${count}`);
  return html.replace(marker, () => insert);
}
