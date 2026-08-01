/**
 * Pure loom banner layer stub (MC-breadth).
 */

export const LOOM_MAX_LAYERS = 6;

/**
 * @typedef {{ pattern: string, color: string }} BannerLayer
 */

export function createBannerLayers() {
  return [];
}

/**
 * @param {BannerLayer[]} layers
 * @param {string} pattern
 * @param {string} color
 */
export function addBannerLayer(layers, pattern, color) {
  const L = Array.isArray(layers) ? layers.slice() : [];
  if (L.length >= LOOM_MAX_LAYERS) return { ok: false, layers: L, error: 'max layers' };
  const p = String(pattern || '').trim();
  const c = String(color || '').trim();
  if (!p || !c) return { ok: false, layers: L, error: 'need pattern and color' };
  L.push({ pattern: p, color: c });
  return { ok: true, layers: L };
}

export function removeTopBannerLayer(layers) {
  const L = Array.isArray(layers) ? layers.slice() : [];
  if (!L.length) return { ok: false, layers: L, error: 'empty' };
  L.pop();
  return { ok: true, layers: L };
}

export function bannerLayerCount(layers) {
  return Array.isArray(layers) ? layers.length : 0;
}
