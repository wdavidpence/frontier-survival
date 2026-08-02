/**
 * Pure warden anger 0..150.
 */
export const WARDEN_ANGER_MAX = 150;
export function clampWardenAnger(a) {
  const n = Math.floor(Number(a) || 0);
  return Math.max(0, Math.min(WARDEN_ANGER_MAX, n));
}
export function wardenAngerAdd(a, delta) {
  return clampWardenAnger(clampWardenAnger(a) + (delta | 0));
}
export function wardenIsAngry(a, threshold = 80) {
  return clampWardenAnger(a) >= threshold;
}
