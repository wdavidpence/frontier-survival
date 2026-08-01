/**
 * Pure trapdoor open/close helper (MC-breadth).
 */

export function isTrapdoor(blockId, closedId, openId) {
  return blockId === closedId || blockId === openId;
}

export function isTrapdoorOpen(blockId, openId) {
  return blockId === openId;
}

/** @returns {number|null} */
export function toggleTrapdoor(blockId, closedId, openId) {
  if (blockId === closedId) return openId;
  if (blockId === openId) return closedId;
  return null;
}

/**
 * Half placement: top vs bottom from pitch (reuse slab convention).
 * @param {number} pitch
 */
export function trapdoorHalfFromPitch(pitch) {
  const p = Number(pitch);
  if (!Number.isFinite(p)) return 'bottom';
  return p < -0.15 ? 'top' : 'bottom';
}
