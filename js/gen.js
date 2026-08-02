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
 * Terrain height. Deep ocean basins when coastal noise is low;
 * tropical island peaks rise back above sea in those basins.
 */
/** <1 stretches continents so travel covers more varied terrain before looping patterns. */
export const WORLD_SCALE = 0.5; // ~2x larger landforms (4x area feel of noise)

export function heightAt(x, z, seed = 0) {
  const sx = x * 0.03 * WORLD_SCALE + seed * 17.1;
  const sz = z * 0.03 * WORLD_SCALE + seed * 9.7;
  const h = fbm(sx, sz, 5);
  const ridge = Math.abs(fbm(sx * 0.5 + 20, sz * 0.5 - 10, 3) - 0.5) * 2;
  let y = 18 + h * 16 + ridge * 8;

  // Broad ocean / shelf: lower coast noise → deeper water
  const coast = fbm(x * 0.01 * WORLD_SCALE + 3, z * 0.01 * WORLD_SCALE + 7, 3);
  if (coast < 0.44) {
    const depth = (0.44 - coast) / 0.44; // 0..1
    y -= depth * depth * 26;
  }

  // Tropical island peaks inside wet basins
  if (coast < 0.38) {
    const isle = fbm(x * 0.05 * WORLD_SCALE + seed * 3.1, z * 0.05 * WORLD_SCALE + seed * 5.7, 3);
    if (isle > 0.7) {
      const peak = GEN_SEA_LEVEL + 1 + Math.floor((isle - 0.7) * 28);
      y = Math.max(y, peak);
    }
  }

  return Math.floor(y);
}

/**
 * Additive underground shaping score. Broad fields make galleries and
 * chambers, while the y-dependent hash breaks up perfectly flat tunnels.
 */
export function caveDensityAt(x, y, z, seed = 0) {
  if (y < 4 || y > 42) return 0;
  const tunnel = fbm(
    x * 0.055 + seed * 13.7 + y * 0.12,
    z * 0.055 - seed * 9.1 - y * 0.09,
    3,
  );
  const chamber = fbm(
    x * 0.022 - seed * 5.1 + y * 0.035,
    z * 0.022 + seed * 7.3 - y * 0.025,
    3,
  );
  const ribs = hash2(x + y * 31 + seed * 17, z - y * 17 - seed * 23);
  return tunnel * 0.62 + chamber * 0.28 + ribs * 0.1;
}

/** Return a deterministic ore family for the additive vein pass, or null. */
export function oreVeinAt(x, y, z, seed = 0) {
  const local = hash2(x + y * 13 + seed * 29, z - y * 17 - seed * 31);
  const cellY = Math.floor(y / 5);
  const cellX = Math.floor(x / 4);
  const cellZ = Math.floor(z / 4);
  const node = hash2(cellX + seed * 19 + cellY * 7, cellZ - seed * 23);
  if (y >= 5 && y <= 22 && node > 0.965 && local > 0.65) return 'iron';
  if (y >= 5 && y <= 28 && node > 0.93 && local > 0.55) return 'coal';
  return null;
}
