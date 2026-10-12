// Astro bundles <script> and scopes <style> unless told not to. Legacy pages
// must come out byte-for-byte, so every such tag is opted out with is:inline.
const OPENING = /<(script|style)(?=[\s>])(?![^>]*\bis:inline\b)/g;

export function markInline(source) {
  return source.replace(OPENING, '<$1 is:inline');
}
