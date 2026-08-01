/**
 * Pure pitcher crop age 0..4 (MC-breadth).
 */

export const PITCHER_AGE_MAX = 4;
export const PITCHER_GROW_SEC = 120;

export function clampPitcherAge(age) {
  const n = Math.floor(Number(age) || 0);
  return Math.max(0, Math.min(PITCHER_AGE_MAX, n));
}

/**
 * Advance age by dt; returns new age.
 * @param {number} age
 * @param {number} dtSec
 * @param {number} [growSec=PITCHER_GROW_SEC] time per age step
 */
export function pitcherAdvanceAge(age, dtSec, growSec = PITCHER_GROW_SEC) {
  let a = clampPitcherAge(age);
  if (a >= PITCHER_AGE_MAX) return a;
  const dt = Math.max(0, Number(dtSec) || 0);
  const step = Math.max(1, Number(growSec) || PITCHER_GROW_SEC);
  // fractional store via age + frac in progress? keep integer steps with chance-free accumulation
  // use age as float internally then floor
  const next = Math.min(PITCHER_AGE_MAX, a + dt / step);
  return next;
}

export function pitcherIsMature(age) {
  return clampPitcherAge(age) >= PITCHER_AGE_MAX;
}

export function pitcherPodCount(age) {
  return pitcherIsMature(age) ? 1 : 0;
}
