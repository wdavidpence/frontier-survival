/**
 * Pure beacon pyramid tier from base size (MC-breadth).
 */

/**
 * Pyramid tier 0..4 from layers of mineral blocks under beacon.
 * Layer n is (2n+1)^2 blocks; we accept min edge length.
 * @param {number} baseEdge odd size of bottom layer (3,5,7,9)
 */
export function beaconTierFromEdge(baseEdge) {
  const e = Math.floor(Number(baseEdge) || 0);
  if (e >= 9) return 4;
  if (e >= 7) return 3;
  if (e >= 5) return 2;
  if (e >= 3) return 1;
  return 0;
}

/**
 * Primary effect slots unlocked by tier.
 */
export function beaconEffectSlots(tier) {
  const t = Math.max(0, Math.min(4, tier | 0));
  return t; // 1..4 primary; tier 4 enables secondary
}

export function beaconHasSecondary(tier) {
  return (tier | 0) >= 4;
}

/**
 * Range in blocks for beam/effects (approx vanilla-ish).
 */
export function beaconRange(tier) {
  const t = Math.max(0, Math.min(4, tier | 0));
  return [0, 20, 30, 40, 50][t] || 0;
}

/**
 * Whether pyramid edge is valid odd size.
 */
export function isValidBeaconEdge(edge) {
  const e = edge | 0;
  return e === 3 || e === 5 || e === 7 || e === 9;
}
