/**
 * Pure pointed dripstone fall damage scale (MC-breadth).
 */

/**
 * Extra fall damage multiplier when landing on dripstone tip.
 * @param {number} fallDistance blocks
 * @param {boolean} onDripstoneTip
 * @param {number} [mult=2]
 */
export function dripstoneFallDamage(fallDistance, onDripstoneTip, mult = 2) {
  const d = Math.max(0, Number(fallDistance) || 0);
  if (d <= 3) return 0;
  const base = (d - 3) * 2; // rough vanilla-ish
  const m = onDripstoneTip ? Math.max(1, Number(mult) || 2) : 1;
  return base * m;
}

/**
 * Whether dripstone should break when fallen upon from height.
 * @param {number} fallDistance
 * @param {number} [breakAt=12]
 */
export function dripstoneBreaksOnLand(fallDistance, breakAt = 12) {
  return (Number(fallDistance) || 0) >= (Number(breakAt) || 12);
}

/**
 * Stalactite fall harm when hitting entity.
 * @param {number} fallBlocks how far dripstone fell
 */
export function dripstoneStalactiteDamage(fallBlocks) {
  const d = Math.max(0, Number(fallBlocks) || 0);
  return Math.min(40, d * 2);
}
