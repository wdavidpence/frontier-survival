/**
 * Pure frog biome variants.
 */
export const FROG_VARIANTS = ['temperate', 'warm', 'cold'];
export function frogVariantForTemp(tempC) {
  const t = Number(tempC);
  if (!Number.isFinite(t)) return 'temperate';
  if (t >= 25) return 'warm';
  if (t <= 5) return 'cold';
  return 'temperate';
}
export function isFrogVariant(name) {
  return FROG_VARIANTS.includes(String(name || '').toLowerCase());
}
