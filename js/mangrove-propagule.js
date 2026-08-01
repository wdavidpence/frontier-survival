/**
 * Pure mangrove propagule hang/grow stages (MC-breadth).
 */

export const PROPAGULE_STAGE_MAX = 4;

export function clampPropaguleStage(stage) {
  const n = Math.floor(Number(stage) || 0);
  return Math.max(0, Math.min(PROPAGULE_STAGE_MAX, n));
}

/**
 * Grow hanging propagule one stage with chance.
 * @param {number} stage
 * @param {number} [chance=0.15]
 * @param {() => number} [rng]
 */
export function propaguleTryGrow(stage, chance = 0.15, rng = Math.random) {
  const s = clampPropaguleStage(stage);
  if (s >= PROPAGULE_STAGE_MAX) return s;
  const c = Math.max(0, Math.min(1, Number(chance) || 0));
  const roll = typeof rng === 'function' ? rng() : Math.random();
  if (roll > c) return s;
  return s + 1;
}

export function propaguleIsMature(stage) {
  return clampPropaguleStage(stage) >= PROPAGULE_STAGE_MAX;
}

/** Can plant in water/mud when mature and dropped. */
export function propaguleCanPlant(stage, inWaterOrMud = true) {
  return propaguleIsMature(stage) && !!inWaterOrMud;
}

export function propaguleHangOffsetY(stage) {
  // visual hang length grows with stage
  return 0.2 + clampPropaguleStage(stage) * 0.15;
}
