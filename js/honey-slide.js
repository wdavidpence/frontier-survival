/**
 * Pure honey block slide slow factor (MC-breadth).
 */

export const HONEY_SLIDE_FACTOR = 0.4;
export const HONEY_JUMP_FACTOR = 0.5;

/**
 * Horizontal speed multiplier when standing on honey.
 * @param {boolean} onHoney
 * @param {number} [factor=HONEY_SLIDE_FACTOR]
 */
export function honeyMoveMult(onHoney, factor = HONEY_SLIDE_FACTOR) {
  if (!onHoney) return 1;
  const f = Number(factor);
  return Number.isFinite(f) ? Math.max(0.05, Math.min(1, f)) : HONEY_SLIDE_FACTOR;
}

/**
 * Jump velocity multiplier on honey.
 */
export function honeyJumpMult(onHoney, factor = HONEY_JUMP_FACTOR) {
  if (!onHoney) return 1;
  const f = Number(factor);
  return Number.isFinite(f) ? Math.max(0.05, Math.min(1, f)) : HONEY_JUMP_FACTOR;
}

/**
 * Slide velocity when walking off honey edge (downward cling).
 * @param {boolean} sliding
 * @param {number} [vy=-0.05]
 */
export function honeySlideVy(sliding, vy = -0.05) {
  return sliding ? (Number.isFinite(vy) ? vy : -0.05) : 0;
}
