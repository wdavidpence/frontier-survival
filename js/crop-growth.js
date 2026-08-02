/**
 * Pure crop growth table (MC-breadth). Game currently uses ~90s; this catalogs stages.
 */

export const CROP_STAGES = [
  { id: 'seed', min: 0, max: 0.25, label: 'sprout' },
  { id: 'young', min: 0.25, max: 0.6, label: 'growing' },
  { id: 'tall', min: 0.6, max: 1, label: 'almost ripe' },
  { id: 'ripe', min: 1, max: 2, label: 'ripe' },
];

/** Default seconds from plant (0) to ripe (1). */
export const CROP_MATURE_SECONDS = 90;

/**
 * Advance growth fraction.
 * @param {number} g 0..1
 * @param {number} dtSec
 * @param {number} [matureSec=CROP_MATURE_SECONDS]
 */
export function advanceCropGrowth(g, dtSec, matureSec = CROP_MATURE_SECONDS) {
  const cur = Math.max(0, Math.min(1, Number(g) || 0));
  const dt = Math.max(0, Number(dtSec) || 0);
  const mature = Math.max(1, Number(matureSec) || CROP_MATURE_SECONDS);
  return Math.min(1, cur + dt / mature);
}

export function cropStageAt(g) {
  const v = Number(g) || 0;
  for (const s of CROP_STAGES) {
    if (v >= s.min && v < s.max) return s;
  }
  return CROP_STAGES[CROP_STAGES.length - 1];
}

export function isCropRipe(g) {
  return (Number(g) || 0) >= 1;
}
