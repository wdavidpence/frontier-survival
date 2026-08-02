/**
 * Pure banner dye layer flags (MC-breadth).
 */
export const BANNER_MAX_LAYERS = 6;
export function createBannerPattern(baseColor = 'white') {
  return { base: String(baseColor || 'white'), layers: [] };
}
export function addBannerLayer(banner, pattern, color) {
  const b = banner || createBannerPattern();
  if ((b.layers?.length || 0) >= BANNER_MAX_LAYERS) return { ok: false, banner: b, error: 'max' };
  const p = String(pattern || '').trim();
  const c = String(color || '').trim();
  if (!p || !c) return { ok: false, banner: b, error: 'need pattern+color' };
  b.layers = [...(b.layers || []), { pattern: p, color: c }];
  return { ok: true, banner: b };
}
export function bannerLayerCount(banner) {
  return banner?.layers?.length || 0;
}
