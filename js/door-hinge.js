/**
 * Pure door hinge open/close helper (MC-breadth).
 * Works with BLOCK.DOOR_CLOSED / DOOR_OPEN ids passed in.
 */

/**
 * @param {number} blockId
 * @param {number} closedId
 * @param {number} openId
 */
export function isDoorBlock(blockId, closedId, openId) {
  return blockId === closedId || blockId === openId;
}

export function isDoorOpen(blockId, openId) {
  return blockId === openId;
}

/**
 * Toggle closed <-> open.
 * @returns {number|null} next block id or null if not a door
 */
export function toggleDoor(blockId, closedId, openId) {
  if (blockId === closedId) return openId;
  if (blockId === openId) return closedId;
  return null;
}

/**
 * Optional facing meta 0..3 (for future hinged mesh).
 */
export function doorFacingFromYaw(yaw) {
  const y = Number(yaw);
  if (!Number.isFinite(y)) return 0;
  let a = ((y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  const deg = (a * 180) / Math.PI;
  if (deg >= -45 && deg < 45) return 0;
  if (deg >= 45 && deg < 135) return 1;
  if (deg >= -135 && deg < -45) return 3;
  return 2;
}
