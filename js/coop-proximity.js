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
  return Math.max(2, Math.min(16, Math.round(base) - 2));
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

/**
 * Cap device pixel ratio for coop canvas/text-render passes.
 * @param {number} [dpr] window.devicePixelRatio or explicit value
 * @returns {number} clamped to 1..1.5
 */
export function coopPixelRatioCap(dpr) {
  return Math.min((dpr || 1), 1.5);
}

/**
 * Clamp a number to the [0, 1] range, returning 0 for non-finite input.
 * @param {number} n
 * @returns {number} 0..1, always finite
 */
export function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Linear interpolation between two numbers, with t clamped to [0,1].
 * @param {number} a start value
 * @param {number} b end value
 * @param {number} t interpolation factor (clamped to 0..1)
 * @returns {number} a + (b - a) * clamp01(t)
 */
export function lerp(a, b, t) {
  return a + (b - a) * clamp01(t);
}

/**
 * Inverse of lerp; clamps to [0,1]. Degenerate a==b or non-finite -> 0.
 */
export function invLerp(a, b, v) {
  const A = Number(a);
  const B = Number(b);
  const V = Number(v);
  if (![A, B, V].every((n) => Number.isFinite(n))) return 0;
  if (A === B) return 0;
  const t = (V - A) / (B - A);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.min(1, t));
}

