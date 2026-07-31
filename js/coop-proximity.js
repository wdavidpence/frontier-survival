/**
 * Pure coop proximity helpers (no DOM / Three.js).
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
