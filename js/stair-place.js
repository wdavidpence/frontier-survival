/**
 * Pure stair facing from yaw (MC-breadth). Placement wire is follow-up.
 */

/** @typedef {'north'|'south'|'east'|'west'} StairFacing */

/**
 * Map player yaw (radians) to cardinal facing for stairs.
 * Convention: 0 ≈ +Z south-ish depending on engine; we use standard atan2 look.
 * @param {number} yaw
 * @returns {StairFacing}
 */
export function stairFacingFromYaw(yaw) {
  const y = Number(yaw);
  if (!Number.isFinite(y)) return 'south';
  // Normalize to [-PI, PI]
  let a = ((y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  const deg = (a * 180) / Math.PI;
  if (deg >= -45 && deg < 45) return 'south';
  if (deg >= 45 && deg < 135) return 'west';
  if (deg >= -135 && deg < -45) return 'east';
  return 'north';
}

/** Encode facing to meta 0..3 */
export function stairFacingMeta(facing) {
  switch (facing) {
    case 'south': return 0;
    case 'west': return 1;
    case 'north': return 2;
    case 'east': return 3;
    default: return 0;
  }
}

export function stairFacingFromMeta(meta) {
  return ['south', 'west', 'north', 'east'][meta & 3] || 'south';
}

export const STAIR_FACINGS = ['north', 'south', 'east', 'west'];
