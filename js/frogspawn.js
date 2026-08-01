/**
 * Pure frogspawn hatch timer (MC-breadth).
 */

export const FROGSPAWN_HATCH_SEC = 120;

/**
 * Advance hatch progress 0..1.
 * @param {number} progress01
 * @param {number} dtSec
 * @param {number} [hatchSec=FROGSPAWN_HATCH_SEC]
 * @param {boolean} [inWater=true]
 */
export function frogspawnAdvance(progress01, dtSec, hatchSec = FROGSPAWN_HATCH_SEC, inWater = true) {
  if (!inWater) return Math.max(0, Math.min(1, Number(progress01) || 0));
  const p = Math.max(0, Math.min(1, Number(progress01) || 0));
  const dt = Math.max(0, Number(dtSec) || 0);
  const full = Math.max(1, Number(hatchSec) || FROGSPAWN_HATCH_SEC);
  return Math.min(1, p + dt / full);
}

export function frogspawnHatched(progress01) {
  return (Number(progress01) || 0) >= 1;
}

/** Tadpoles produced on hatch (1-2). */
export function frogspawnTadpoleCount(rng = Math.random) {
  const r = typeof rng === 'function' ? rng() : Math.random();
  return r < 0.5 ? 1 : 2;
}
