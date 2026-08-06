/**
 * Pure torch light falloff by distance (MC-breadth).
 */

/**
 * Intensity 0..1 at distance d from torch.
 * @param {number} distance
 * @param {number} [range=8]
 * @param {number} [power=2] quadratic-ish falloff
 */
export function torchFalloff(distance, range = 8, power = 2) {
  const dn = Number(distance);
  const rn = Number(range);
  const pn = Number(power);
  const d = Math.max(0, Number.isFinite(dn) ? dn : 0);
  const r = Math.max(0.01, Number.isFinite(rn) ? rn : 8);
  const p = Math.max(0.5, Number.isFinite(pn) ? pn : 2);
  if (d >= r) return 0;
  const t = 1 - d / r;
  return Math.max(0, Math.min(1, t ** p));
}

/**
 * Whether a sample point is lit above threshold.
 * @param {number} distance
 * @param {number} [range=8]
 * @param {number} [min=0.05]
 */
export function isTorchLit(distance, range = 8, min = 0.05) {
  return torchFalloff(distance, range) >= min;
}

/**
 * Sum contribution from multiple torches (clamped).
 * @param {number[]} distances
 * @param {number} [range=8]
 */
export function torchLightSum(distances, range = 8) {
  let s = 0;
  const arr = Array.isArray(distances) ? distances : [];
  for (const d of arr) s += torchFalloff(d, range);
  return Math.max(0, Math.min(1, s));
}
