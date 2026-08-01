/**
 * Pure torchflower crop age 0..1 (MC-breadth).
 */

export const TORCHFLOWER_AGE_MAX = 1;
export const TORCHFLOWER_GROW_SEC = 80;

export function clampTorchflowerAge(age) {
  const n = Number(age);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(TORCHFLOWER_AGE_MAX, n));
}

export function torchflowerAdvance(age, dtSec, growSec = TORCHFLOWER_GROW_SEC) {
  const a = clampTorchflowerAge(age);
  if (a >= TORCHFLOWER_AGE_MAX) return TORCHFLOWER_AGE_MAX;
  const dt = Math.max(0, Number(dtSec) || 0);
  const full = Math.max(1, Number(growSec) || TORCHFLOWER_GROW_SEC);
  return Math.min(TORCHFLOWER_AGE_MAX, a + dt / full);
}

export function torchflowerIsMature(age) {
  return clampTorchflowerAge(age) >= TORCHFLOWER_AGE_MAX;
}
