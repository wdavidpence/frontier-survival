/** Pure biome classifier — no game.js coupling. */
import { heightAt, fbm, WORLD_SCALE, starterCoastBlend } from './gen.js?v=285';

export const BIOME = {
  OCEAN: 'ocean',
  TROPICAL: 'tropical',
  SHORE: 'shore',
  FOREST: 'forest',
  DESERT: 'desert',
  TUNDRA: 'tundra',
};

const SEA = 16; // must match World.SEA_LEVEL

/**
 * Return biome string for world coordinates (x, z) given seed.
 * - ocean: deep floor below sea (open water columns)
 * - tropical: sandy islands / atolls in warm coastal basins
 * - shore: near sea level beaches
 * - desert / tundra / forest: inland
 */
export function biomeAt(x, z, seed = 0) {
  const h = heightAt(x, z, seed);
  const coast = fbm(x * 0.01 * WORLD_SCALE + 3, z * 0.01 * WORLD_SCALE + 7, 3);
  const isle = fbm(x * 0.05 * WORLD_SCALE + seed * 3.1, z * 0.05 * WORLD_SCALE + seed * 5.7, 3);

  // Open ocean basins
  if (h < SEA - 1) return BIOME.OCEAN;

  // Starter island shelf: warm tropical land + wet beach lip (palms, sand, coast first)
  const starter = starterCoastBlend(x, z);
  if (starter > 0.12 && h >= SEA) {
    if (h <= SEA + 1) return BIOME.SHORE;
    return BIOME.TROPICAL;
  }

  // Tropical islands: modest land bumps in wet coastal noise
  if (
    h >= SEA &&
    h <= SEA + 7 &&
    coast < 0.4 &&
    isle > 0.7
  ) {
    return BIOME.TROPICAL;
  }

  // Shore shelf / beach
  if (h < 20) return BIOME.SHORE;

  const dryness = fbm(
    x * 0.015 * WORLD_SCALE + seed * 31.3,
    z * 0.015 * WORLD_SCALE + seed * 22.7,
    4,
  );

  if (h > 30 && dryness < 0.35) return BIOME.TUNDRA;
  if (dryness > 0.65) return BIOME.DESERT;

  return BIOME.FOREST;
}

/**
 * Ambient temperature offset (°C) for a biome.
 */
export function ambientTempOffset(biome) {
  switch (biome) {
    case BIOME.DESERT:
      return +8;
    case BIOME.TUNDRA:
      return -10;
    case BIOME.SHORE:
      return +2;
    case BIOME.OCEAN:
      return +1;
    case BIOME.TROPICAL:
      return +11;
    default:
      return 0;
  }
}
