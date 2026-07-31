/**
 * Pure coop helpers (no DOM / Three.js).
 */

/**
 * @param {{x?:number,y?:number,z?:number,position?:{x:number,y:number,z:number}}|null|undefined} a
 * @param {{x?:number,y?:number,z?:number,position?:{x:number,y:number,z:number}}|null|undefined} b
 * @param {number} [maxDist=4.5]
 * @returns {boolean}
 */
export function wouldPartnerNearForSleep(a, b, maxDist = 4.5) {
  if (!a || !b) return false;
  const ax = Number.isFinite(a.x) ? a.x : a.position?.x;
  const ay = Number.isFinite(a.y) ? a.y : a.position?.y;
  const az = Number.isFinite(a.z) ? a.z : a.position?.z;
  const bx = Number.isFinite(b.x) ? b.x : b.position?.x;
  const by = Number.isFinite(b.y) ? b.y : b.position?.y;
  const bz = Number.isFinite(b.z) ? b.z : b.position?.z;
  if (![ax, ay, az, bx, by, bz].every((n) => Number.isFinite(n))) return false;
  const md = Number.isFinite(maxDist) && maxDist > 0 ? maxDist : 4.5;
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  return dx * dx + dy * dy + dz * dz <= md * md;
}

/**
 * Coop dual-pass render distance bias (see docs/roadmap/coop-perf-budget.md).
 * @param {number} sliderRd settings.renderDistance (2–10)
 * @returns {number} effective chunk/fog radius integer >= 2
 */
export function effectiveCoopRenderDistance(sliderRd) {
  const rd = Number(sliderRd);
  const base = Number.isFinite(rd) ? rd : 5;
  return Math.max(2, Math.min(10, Math.round(base) - 2));
}

/**
 * Coop session over when both survival states are dead.
 * @param {{dead?: boolean}|null|undefined} s1
 * @param {{dead?: boolean}|null|undefined} s2
 * @returns {boolean}
 */
export function isBothPlayersDown(s1, s2) {
  return !!(s1 && s1.dead && s2 && s2.dead);
}

/**
 * Count living partners among up to two survival states.
 * @param {{dead?: boolean}|null|undefined} s1
 * @param {{dead?: boolean}|null|undefined} s2
 * @returns {number} 0..2
 */
export function livingPartnerCount(s1, s2) {
  let n = 0;
  if (s1 && !s1.dead) n += 1;
  if (s2 && !s2.dead) n += 1;
  return n;
}

