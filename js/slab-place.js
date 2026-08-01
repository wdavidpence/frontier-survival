/**
 * Pure slab half-placement helper from look pitch (MC-breadth).
 * Returns 'bottom' | 'top' for which half of the cell to occupy.
 */

/**
 * @param {number} pitch radians; negative typically looks up in right-handed Y-up
 * @param {{ invertUp?: boolean }} [opts]
 */
export function slabHalfFromPitch(pitch, opts = {}) {
  const p = Number(pitch);
  if (!Number.isFinite(p)) return 'bottom';
  // Default: looking upward (negative pitch in many FPS) places top half.
  const upIsNegative = opts.invertUp !== true;
  if (upIsNegative) return p < -0.15 ? 'top' : 'bottom';
  return p > 0.15 ? 'top' : 'bottom';
}

/**
 * Y offset within block cell for mesh/placement (0 = bottom, 0.5 = top).
 * @param {'bottom'|'top'} half
 */
export function slabYOffset(half) {
  return half === 'top' ? 0.5 : 0;
}

/**
 * Encode half into a small meta int for future world storage (0 bottom, 1 top).
 * @param {'bottom'|'top'} half
 */
export function slabHalfMeta(half) {
  return half === 'top' ? 1 : 0;
}

export function slabHalfFromMeta(meta) {
  return (meta | 0) === 1 ? 'top' : 'bottom';
}
