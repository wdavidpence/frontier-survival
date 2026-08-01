/**
 * Pure fence-gate open/close helper (MC-breadth).
 * Pass closed/open block ids from BLOCK when wiring.
 */

export function isFenceGate(blockId, closedId, openId) {
  return blockId === closedId || blockId === openId;
}

export function isGateOpen(blockId, openId) {
  return blockId === openId;
}

/** @returns {number|null} next id */
export function toggleFenceGate(blockId, closedId, openId) {
  if (blockId === closedId) return openId;
  if (blockId === openId) return closedId;
  return null;
}

/**
 * Facing 0..3 from yaw (same quadrants as door-hinge).
 * @param {number} yaw
 */
export function gateFacingFromYaw(yaw) {
  const y = Number(yaw);
  if (!Number.isFinite(y)) return 0;
  let a = ((y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  const deg = (a * 180) / Math.PI;
  if (deg >= -45 && deg < 45) return 0;
  if (deg >= 45 && deg < 135) return 1;
  if (deg >= -135 && deg < -45) return 3;
  return 2;
}
