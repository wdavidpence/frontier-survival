/** Deterministic value noise for terrain */
/** Deterministic 2D hash in [0,1). Integer-safe (float mul collapsed to ~0.5 for large coords). */
export function hash2(x, z) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function smoothNoise(x, z) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const a = hash2(x0, z0);
  const b = hash2(x0 + 1, z0);
  const c = hash2(x0, z0 + 1);
  const d = hash2(x0 + 1, z0 + 1);
  const u = a + (b - a) * sx;
  const v = c + (d - c) * sx;
  return u + (v - u) * sz;
}

export function fbm(x, z, octaves = 4) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += smoothNoise(x * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** Sea level constant shared with world (keep in sync with World.SEA_LEVEL). */
export const GEN_SEA_LEVEL = 16;

/**
 * Terrain height. The travel field is deliberately ocean-dominant: a broad
 * coastal basin becomes water unless a high-isle sample punches through it.
 * The starter shelf and authored shore bay below are kept as explicit safety
 * contracts rather than accidental noise.
 */
/** <1 stretches landforms so islands remain readable while travel stays wet. */
export const WORLD_SCALE = 0.5;
export const ARCHIPELAGO_COAST_THRESHOLD = 0.60;
export const ARCHIPELAGO_ISLAND_THRESHOLD = 0.68;
// Legacy coast < 0.56 / isle > 0.54 was tightened into the constants above.

/** Numeric IDs are kept here so the pure seam can be mirrored by the worker. */
export const EXPOSED_ORE = Object.freeze({ COAL: 13, IRON: 18, COPPER: 56, DIAMOND: 57 });

/** Deterministic forest-floor dressing, kept pure so sync and worker terrain agree. */
export function forestFloorDetail(x, z, seed, biome, height, surfaceId, aboveId) {
  if (!['forest', 'tropical', 'shore'].includes(biome) || height <= GEN_SEA_LEVEL + 1 || aboveId !== 0) return null;
  const roll = hash2(x * 29 + seed * 7, z * 31 + seed * 11);
  if (surfaceId !== 1 && surfaceId !== 2 && surfaceId !== 4) return null;
  if (roll > 0.975) return 'mushroom';
  if (roll > 0.93) return 'roots';
  if (roll > 0.84) return 'sticks';
  if (roll > 0.74) return 'damp-soil';
  return null;
}

/** Blend the first few chunks toward a low, wet island shelf. */
export function starterCoastBlend(x, z) {
  return Math.max(0, Math.min(1, 1 - Math.hypot(x, z) / 180));
}

export function heightAt(x, z, seed = 0) {
  const sx = x * 0.03 * WORLD_SCALE + seed * 17.1;
  const sz = z * 0.03 * WORLD_SCALE + seed * 9.7;
  const h = fbm(sx, sz, 5);
  const ridge = Math.abs(fbm(sx * 0.5 + 20, sz * 0.5 - 10, 3) - 0.5) * 2;
  // Lower baseline + stronger ridges leaves room for ocean while keeping
  // mountain silhouettes well below the 48-block world ceiling.
  let y = 7 + h * 10 + ridge * 11;

  const coast = fbm(x * 0.01 * WORLD_SCALE + 3, z * 0.01 * WORLD_SCALE + 7, 3);
  const isle = fbm(x * 0.05 * WORLD_SCALE + seed * 3.1, z * 0.05 * WORLD_SCALE + seed * 5.7, 3);
  if (coast < ARCHIPELAGO_COAST_THRESHOLD) {
    const depth = (ARCHIPELAGO_COAST_THRESHOLD - coast) / ARCHIPELAGO_COAST_THRESHOLD;
    y -= depth * depth * 30;
  }
  if (coast < ARCHIPELAGO_COAST_THRESHOLD && isle > ARCHIPELAGO_ISLAND_THRESHOLD) {
    const rise = Math.pow((isle - ARCHIPELAGO_ISLAND_THRESHOLD) / (1 - ARCHIPELAGO_ISLAND_THRESHOLD), 0.58);
    const ridgeCut = fbm(x * 0.022 * WORLD_SCALE + seed * 4.7, z * 0.022 * WORLD_SCALE - seed * 2.3, 3);
    y = Math.max(y, GEN_SEA_LEVEL + 1 + rise * 29 + ridgeCut * 5);
  }

  const starterBlend = starterCoastBlend(x, z);
  if (starterBlend > 0) {
    const shelf = 4 + fbm(x * 0.018 * WORLD_SCALE + 41, z * 0.018 * WORLD_SCALE - 17, 3) * 10;
    y = y * (1 - starterBlend) + shelf * starterBlend;
  }
  // Safe, buildable starter island and the existing authored shore destination.
  if (Math.hypot(x, z) < 18) y = Math.max(y, GEN_SEA_LEVEL);
  if (Math.hypot(x - 26, z - 22) < 9) y = Math.max(y, GEN_SEA_LEVEL);
  if (Math.hypot(x - 42, z - 51) < 8) y = Math.max(y, GEN_SEA_LEVEL + 2);
  // Keep the first walk on the starter island in the same island mask while
  // making the nearby horizon reveal steep tropical relief.
  if (
    Math.hypot(x, z) > 18 &&
    coast < ARCHIPELAGO_COAST_THRESHOLD &&
    isle > ARCHIPELAGO_ISLAND_THRESHOLD
  ) {
    const rise = Math.pow((isle - ARCHIPELAGO_ISLAND_THRESHOLD) / (1 - ARCHIPELAGO_ISLAND_THRESHOLD), 0.62);
    y = Math.max(y, GEN_SEA_LEVEL + 1 + rise * 32);
  }
  return Math.max(1, Math.min(46, Math.floor(y)));
}

/** True only for warm, high, sheared mountain cells with a visible drop. */
export function mountainFaceAt(x, z, seed = 0) {
  const center = heightAt(x, z, seed);
  if (center < GEN_SEA_LEVEL + 10) return false;
  const eastWest = Math.abs(heightAt(x + 2, z, seed) - heightAt(x - 2, z, seed));
  const northSouth = Math.abs(heightAt(x, z + 2, seed) - heightAt(x, z - 2, seed));
  const lowestNeighbor = Math.min(
    heightAt(x - 2, z, seed), heightAt(x + 2, z, seed),
    heightAt(x, z - 2, seed), heightAt(x, z + 2, seed),
  );
  return eastWest + northSouth >= 7 && center - lowestNeighbor >= 4;
}

/**
 * Rare surface-adjacent ore in a mountain face. Returning zero means no ore;
 * every non-zero result is a top/upper-face block of a valid stone cliff.
 */
export function exposedOreAt(x, y, z, seed = 0) {
  const h = heightAt(x, z, seed);
  if (y < h - 1 || y > h || !mountainFaceAt(x, z, seed)) return 0;
  const seam = hash2(x * 41 + z * 17 + seed * 3, z * 43 + y * 19 + seed * 5);
  if (seam <= 0.985) return 0;
  const kind = hash2(x * 13 + seed * 7, z * 17 + y * 3 + seed * 11);
  if (kind > 0.998) return EXPOSED_ORE.DIAMOND;
  if (kind > 0.93) return EXPOSED_ORE.COPPER;
  if (kind > 0.64) return EXPOSED_ORE.IRON;
  return EXPOSED_ORE.COAL;
}

export function tropicalCliffAt(x, z, seed = 0) {
  return mountainFaceAt(x, z, seed);
}
