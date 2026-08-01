/**
 * Pure sniffer egg hatch stages (MC-breadth).
 */

export const SNIFFER_EGG_STAGE_MAX = 2;
export const SNIFFER_EGG_HATCH_SEC = 240;

export function clampSnifferEggStage(stage) {
  const n = Math.floor(Number(stage) || 0);
  return Math.max(0, Math.min(SNIFFER_EGG_STAGE_MAX, n));
}

/**
 * Advance hatch; stage bumps at 0.5 and 1.0 progress.
 * @returns {{ progress: number, stage: number, hatched: boolean }}
 */
export function snifferEggAdvance(progress01, dtSec, hatchSec = SNIFFER_EGG_HATCH_SEC) {
  let p = Math.max(0, Math.min(1, Number(progress01) || 0));
  const dt = Math.max(0, Number(dtSec) || 0);
  const full = Math.max(1, Number(hatchSec) || SNIFFER_EGG_HATCH_SEC);
  p = Math.min(1, p + dt / full);
  const stage = p >= 1 ? 2 : p >= 0.5 ? 1 : 0;
  return { progress: p, stage, hatched: p >= 1 };
}

export function snifferEggHatched(progress01) {
  return (Number(progress01) || 0) >= 1;
}
