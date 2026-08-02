/**
 * Pure tadpole grow timer.
 */
export const TADPOLE_GROW_SEC = 1200;
export function tadpoleAdvance(age01, dt, full = TADPOLE_GROW_SEC) {
  const a = Math.max(0, Math.min(1, Number(age01) || 0));
  const d = Math.max(0, Number(dt) || 0);
  const f = Math.max(1, Number(full) || TADPOLE_GROW_SEC);
  return Math.min(1, a + d / f);
}
export function tadpoleIsAdult(age01) {
  return (Number(age01) || 0) >= 1;
}
