/**
 * Pure compass bearing toward a target (MC-breadth).
 */

/**
 * Bearing radians from pos to target in XZ plane (atan2).
 * @param {{x:number,z:number}} from
 * @param {{x:number,z:number}} to
 */
export function bearingTo(from, to) {
  const dx = (to?.x ?? 0) - (from?.x ?? 0);
  const dz = (to?.z ?? 0) - (from?.z ?? 0);
  return Math.atan2(dx, dz);
}

/**
 * Shortest yaw delta to face target (radians, -PI..PI).
 * @param {number} yaw current
 * @param {{x:number,z:number}} from
 * @param {{x:number,z:number}} to
 */
export function yawDeltaToTarget(yaw, from, to) {
  const want = bearingTo(from, to);
  let d = want - (Number(yaw) || 0);
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Horizontal distance.
 */
export function horizDistance(from, to) {
  const dx = (to?.x ?? 0) - (from?.x ?? 0);
  const dz = (to?.z ?? 0) - (from?.z ?? 0);
  return Math.hypot(dx, dz);
}

/**
 * Compass needle angle relative to player yaw (0 = ahead).
 */
export function compassNeedleAngle(yaw, from, to) {
  return yawDeltaToTarget(yaw, from, to);
}
