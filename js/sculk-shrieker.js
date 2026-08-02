/**
 * Pure sculk shrieker warning level 0..4.
 */
export const SHRIEKER_WARN_MAX = 4;
export function clampShriekWarning(w) {
  return Math.max(0, Math.min(SHRIEKER_WARN_MAX, Math.floor(Number(w) || 0)));
}
export function shriekerWarn(w) {
  return clampShriekWarning(clampShriekWarning(w) + 1);
}
export function shriekerSpawnsWarden(w) {
  return clampShriekWarning(w) >= SHRIEKER_WARN_MAX;
}
