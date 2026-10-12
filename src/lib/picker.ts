// Same order and separators as app.js encodeHash(), so links decode with parseHash().
export function buildPickerHref({ pattern, allergens, severe }: { pattern: string | null; allergens: string[]; severe: boolean }): string {
  const parts: string[] = [];
  if (allergens.length) parts.push(`a=${allergens.join(',')}`);
  if (pattern) parts.push(`p=${pattern}`);
  if (severe) parts.push('s=severe');
  return parts.length ? `/#${parts.join('&')}` : '/';
}
