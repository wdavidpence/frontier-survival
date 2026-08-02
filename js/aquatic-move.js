/** Dependency-free water navigation helpers for aquatic fauna. */

/**
 * Keep an aquatic entity inside a water volume and world bounds.
 * The caller supplies the authoritative water lookup so this module stays pure.
 */
export function clampAquaticMove(current, next, { isWater, bounds = Infinity } = {}) {
  if (!current || !next || typeof isWater !== 'function') return { ...current };
  const limit = Number.isFinite(bounds) ? Math.max(0, bounds) : Infinity;
  const inBounds = Math.abs(next.x) <= limit && Math.abs(next.z) <= limit;
  if (!inBounds || !isWater(next.x, next.y, next.z)) return { ...current };
  return { x: next.x, y: next.y, z: next.z };
}

/** Return whether a candidate coordinate is a water voxel. */
export function isWaterVoxel(world, x, y, z, waterId = 5) {
  return world?.getBlock?.(Math.floor(x), Math.floor(y), Math.floor(z)) === waterId;
}
