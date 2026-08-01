/**
 * Pure bow draw charge 0..1 from hold time (MC-breadth).
 */

export const BOW_FULL_DRAW_SEC = 1.0;

/**
 * @param {number} holdSec seconds held
 * @param {number} [fullSec=BOW_FULL_DRAW_SEC]
 * @returns {number} charge in [0,1]
 */
export function bowDrawCharge(holdSec, fullSec = BOW_FULL_DRAW_SEC) {
  const t = Number(holdSec);
  const full = Math.max(0.05, Number(fullSec) || BOW_FULL_DRAW_SEC);
  if (!Number.isFinite(t) || t <= 0) return 0;
  return Math.max(0, Math.min(1, t / full));
}

/**
 * Damage/speed multiplier from charge (min partial shot).
 * @param {number} charge 0..1
 */
export function bowPowerFromCharge(charge) {
  const c = Math.max(0, Math.min(1, Number(charge) || 0));
  // 20% power at tap, 100% at full draw
  return 0.2 + 0.8 * c;
}

/**
 * Whether charge is "full" for UI/VFX.
 * @param {number} charge
 * @param {number} [eps=0.001]
 */
export function isBowFullyDrawn(charge, eps = 0.001) {
  return (Number(charge) || 0) >= 1 - eps;
}
