/** Pure biome classifier — no game.js coupling. */
import { heightAt, fbm } from './gen.js?v=212';

export const BIOME = {
  SHORE: 'shore',
  FOREST: 'forest',
  DESERT: 'desert',
  TUNDRA: 'tundra',
};

/**
 * Return biome string for world coordinates (x, z) given seed.
 * Uses heightAt for elevation + a second fbm pass for "aridity" axis.
 * - shore: height near/below sea level (< 20)
 * - desert: arid region (high dryness noise, moderate height)
 * - tundra: cold high elevation
 * - forest: default everywhere else
 */
export function biomeAt(x, z, seed = 0) {
  const h = heightAt(x, z, seed);

  // Shore: near or below sea level
  if (h < 20) return BIOME.SHORE;

  // Aridity axis — independent fbm pass seeded by position
  const dryness = fbm(
    x * 0.015 + seed * 31.3,
    z * 0.015 + seed * 22.7,
    4,
  );

  // Tundra: high elevation AND cool (low dryness maps to cold)
  if (h > 30 && dryness < 0.35) return BIOME.TUNDRA;

  // Desert: arid (high dryness) at moderate-to-high elevation
  if (dryness > 0.65) return BIOME.DESERT;

  return BIOME.FOREST;
}

/**
 * Return ambient temperature offset (°C) for a biome.
 * Applied as an additive bias on top of the day/night cycle in survival.js.
 */
export function ambientTempOffset(biome) {
  switch (biome) {
    case BIOME.DESERT:
      return +8;
    case BIOME.TUNDRA:
      return -10;
    case BIOME.SHORE:
      return +2; // mild coastal breeze
    default:
      return 0; // forest baseline
  }
}
