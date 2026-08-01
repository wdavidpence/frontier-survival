/**
 * Pure powder snow sink rate helper (MC-breadth).
 */

export const POWDER_SNOW_SINK = 0.9;
export const POWDER_SNOW_FREEZE_SEC = 7;

/**
 * Vertical sink speed while in powder snow (blocks/sec downward).
 * @param {boolean} inSnow
 * @param {boolean} wearingLeather boots exception
 * @param {number} [sink=POWDER_SNOW_SINK]
 */
export function powderSnowSinkVy(inSnow, wearingLeather = false, sink = POWDER_SNOW_SINK) {
  if (!inSnow || wearingLeather) return 0;
  const s = Number(sink);
  return Number.isFinite(s) ? -Math.abs(s) : -POWDER_SNOW_SINK;
}

/**
 * Freeze progress 0..1 after dt in snow.
 * @param {number} freeze01
 * @param {number} dtSec
 * @param {boolean} inSnow
 * @param {number} [fullSec=POWDER_SNOW_FREEZE_SEC]
 */
export function powderSnowFreezeProgress(freeze01, dtSec, inSnow, fullSec = POWDER_SNOW_FREEZE_SEC) {
  let f = Math.max(0, Math.min(1, Number(freeze01) || 0));
  const dt = Math.max(0, Number(dtSec) || 0);
  const full = Math.max(0.1, Number(fullSec) || POWDER_SNOW_FREEZE_SEC);
  if (inSnow) f = Math.min(1, f + dt / full);
  else f = Math.max(0, f - dt / (full * 0.5));
  return f;
}

export function powderSnowFrozen(freeze01) {
  return (Number(freeze01) || 0) >= 1;
}
