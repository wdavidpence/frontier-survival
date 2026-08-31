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
 * Return the hit door cell plus its stacked partner, if any.
 * Village doors occupy two cells; toggling one must toggle both.
 */
export function pairedDoorCells(getBlock, x, y, z, closedId, openId) {
  const isDoor = (id) => id === closedId || id === openId;
  const cells = [{ x, y, z }];
  if (typeof getBlock !== 'function') return cells;
  if (isDoor(getBlock(x, y + 1, z))) cells.push({ x, y: y + 1, z });
  if (isDoor(getBlock(x, y - 1, z))) cells.push({ x, y: y - 1, z });
  return cells;
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
