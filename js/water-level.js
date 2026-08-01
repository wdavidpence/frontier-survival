/**
 * Pure water level 0..7 helper (MC-breadth fluid meta).
 */

export const WATER_LEVEL_MAX = 7;

/**
 * Clamp level to 0..max (0 = source, max = thinnest).
 * @param {number} level
 * @param {number} [max=WATER_LEVEL_MAX]
 */
export function clampWaterLevel(level, max = WATER_LEVEL_MAX) {
  const m = Math.max(0, max | 0);
  const n = Number(level);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(m, Math.floor(n)));
}

/**
 * Next level when flowing outward (thinner).
 * @param {number} level
 */
export function flowOutLevel(level) {
  const L = clampWaterLevel(level);
  if (L >= WATER_LEVEL_MAX) return null;
  return L + 1;
}

/**
 * Whether cell is a full source.
 */
export function isWaterSource(level) {
  return clampWaterLevel(level) === 0;
}

/**
 * Blend two levels (min = deeper).
 */
export function mergeWaterLevels(a, b) {
  return Math.min(clampWaterLevel(a), clampWaterLevel(b));
}

/**
 * Rough fill fraction 1..0 for meshing (source full).
 */
export function waterFillFraction(level) {
  const L = clampWaterLevel(level);
  return 1 - L / (WATER_LEVEL_MAX + 1);
}
