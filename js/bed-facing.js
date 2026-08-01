/**
 * Pure bed facing from yaw (MC-breadth).
 */

/** @typedef {'north'|'south'|'east'|'west'} BedFacing */

/**
 * @param {number} yaw
 * @returns {BedFacing}
 */
export function bedFacingFromYaw(yaw) {
  const y = Number(yaw);
  if (!Number.isFinite(y)) return 'south';
  let a = ((y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  const deg = (a * 180) / Math.PI;
  if (deg >= -45 && deg < 45) return 'south';
  if (deg >= 45 && deg < 135) return 'west';
  if (deg >= -135 && deg < -45) return 'east';
  return 'north';
}

export function bedFacingMeta(facing) {
  switch (facing) {
    case 'south': return 0;
    case 'west': return 1;
    case 'north': return 2;
    case 'east': return 3;
    default: return 0;
  }
}

export function bedFacingFromMeta(meta) {
  return ['south', 'west', 'north', 'east'][meta & 3] || 'south';
}

/** Foot vs head cell offset along facing (unit step). */
export function bedHeadOffset(facing) {
  switch (facing) {
    case 'north': return { x: 0, z: -1 };
    case 'south': return { x: 0, z: 1 };
    case 'east': return { x: 1, z: 0 };
    case 'west': return { x: -1, z: 0 };
    default: return { x: 0, z: 1 };
  }
}
