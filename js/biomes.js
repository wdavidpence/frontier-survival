/** Pure biome classifier — no game.js coupling. */
import { heightAt, fbm, WORLD_SCALE, starterCoastBlend, bviLandformAt, ARCHIPELAGO_COAST_THRESHOLD, ARCHIPELAGO_ISLAND_THRESHOLD } from './gen.js?v=317';

export const BIOME = {
  OCEAN: 'ocean',
  TROPICAL: 'tropical',
  MANGROVE: 'mangrove',
  SHORE: 'shore',
  FOREST: 'forest',
  DESERT: 'desert',
  TUNDRA: 'tundra',
};

const SEA = 16; // must match World.SEA_LEVEL

/** A warm, tidal wetland pocket that grows out of the tropical coast. */
export function mangroveAt(x, z, seed = 0) {
  const h = heightAt(x, z, seed);
  // Keep the authored Iron Ravine sightline open for the first expedition.
  if (Math.hypot(x - 42, z - 51) < 8) return false;
  if (h < SEA || h > SEA + 8 || starterCoastBlend(x, z) <= 0.12) return false;
  // Authored approach shelf: the tropical route opens into the wetland instead
  // of asking procedural noise to place the first readable grove by chance.
  if (x >= 46 && x <= 68 && z >= 52 && z <= 72 && h <= SEA + 8) return true;
  if (h > SEA + 4) return false;
  const wet = fbm(
    x * 0.025 * WORLD_SCALE + seed * 7.3,
    z * 0.025 * WORLD_SCALE - seed * 4.1,
    3,
  );
  const tide = fbm(
    x * 0.045 * WORLD_SCALE - seed * 2.7,
    z * 0.045 * WORLD_SCALE + seed * 5.9,
    2,
  );
  return wet > 0.57 && tide > 0.38;
}

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
  const bvi = bviLandformAt(x, z);
  const starter = starterCoastBlend(x, z);
  if (starter > 0.12 && h >= SEA) {
    if (mangroveAt(x, z, seed)) return BIOME.MANGROVE;
    if (h <= SEA + 1 || (bvi.cayInfluence > 0 && h <= SEA + 3)) return BIOME.SHORE;
    return BIOME.TROPICAL;
  }

  if (bvi.influence > 0 && h >= SEA) {
    if (mangroveAt(x, z, seed)) return BIOME.MANGROVE;
    if (h <= SEA + 3) return BIOME.SHORE;
    if (h <= SEA + 24) return BIOME.TROPICAL;
  }

  // Distant terrain outside the modeled chain keeps the legacy tropical fallback.
  if (Math.hypot(x - 30, z + 2) > 170
    && h >= SEA && h <= SEA + 24
    && coast < ARCHIPELAGO_COAST_THRESHOLD && isle > ARCHIPELAGO_ISLAND_THRESHOLD) {
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
    case BIOME.MANGROVE:
      return +9;
    default:
      return 0;
  }
}
