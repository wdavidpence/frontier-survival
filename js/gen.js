import { BLOCK, BLOCK_PROPS } from './blocks.js?v=285';

// Register expanded ore IDs dynamically if not present
if (BLOCK) {
  if (!BLOCK.GOLD_ORE) BLOCK.GOLD_ORE = 56;
  if (!BLOCK.DIAMOND_ORE) BLOCK.DIAMOND_ORE = 57;
  if (!BLOCK.EMERALD_ORE) BLOCK.EMERALD_ORE = 58;
  if (!BLOCK.LAPIS_ORE) BLOCK.LAPIS_ORE = 59;
  if (!BLOCK.REDSTONE_ORE) BLOCK.REDSTONE_ORE = 60;
}
if (BLOCK_PROPS) {
  if (!BLOCK_PROPS[56]) BLOCK_PROPS[56] = { name: 'Gold Ore', solid: true, transparent: false, hardness: 2.8, color: [0.85, 0.72, 0.22], drops: 56 };
  if (!BLOCK_PROPS[57]) BLOCK_PROPS[57] = { name: 'Diamond Ore', solid: true, transparent: false, hardness: 3.5, color: [0.25, 0.85, 0.95], drops: 57 };
  if (!BLOCK_PROPS[58]) BLOCK_PROPS[58] = { name: 'Emerald Ore', solid: true, transparent: false, hardness: 3.2, color: [0.15, 0.85, 0.35], drops: 58 };
  if (!BLOCK_PROPS[59]) BLOCK_PROPS[59] = { name: 'Lapis Ore', solid: true, transparent: false, hardness: 2.2, color: [0.15, 0.25, 0.78], drops: 59 };
  if (!BLOCK_PROPS[60]) BLOCK_PROPS[60] = { name: 'Redstone Ore', solid: true, transparent: false, hardness: 2.5, color: [0.85, 0.15, 0.15], light: 4, drops: 60 };
}

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

/** Ridge noise for sharp mountain ranges with deep valleys */
export function ridgeNoise(x, z, octaves = 4) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    let val = smoothNoise(x * freq, z * freq);
    val = 1.0 - Math.abs(val * 2 - 1);
    val *= val;
    sum += val * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** Deterministic 3D hash */
export function hash3(x, y, z) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1446710189);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** Smooth 3D Noise */
export function smoothNoise3D(x, y, z) {
  const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z);
  const fx = x - x0, fy = y - y0, fz = z - z0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const sz = fz * fz * (3 - 2 * fz);

  const c000 = hash3(x0, y0, z0);
  const c100 = hash3(x0 + 1, y0, z0);
  const c010 = hash3(x0, y0 + 1, z0);
  const c110 = hash3(x0 + 1, y0 + 1, z0);
  const c001 = hash3(x0, y0, z0 + 1);
  const c101 = hash3(x0 + 1, y0, z0 + 1);
  const c011 = hash3(x0, y0 + 1, z0 + 1);
  const c111 = hash3(x0 + 1, y0 + 1, z0 + 1);

  const u00 = c000 + (c100 - c000) * sx;
  const u10 = c010 + (c110 - c010) * sx;
  const u01 = c001 + (c101 - c001) * sx;
  const u11 = c011 + (c111 - c011) * sx;

  const v0 = u00 + (u10 - u00) * sy;
  const v1 = u01 + (u11 - u01) * sy;

  return v0 + (v1 - v0) * sz;
}

export function noise3D(x, y, z, octaves = 2) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += smoothNoise3D(x * freq, y * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** 3D Cave carving test */
export function isCaveBlock(x, y, z, seed = 0, surfaceY = 32) {
  if (y <= 1 || y >= surfaceY - 1) return false;
  const cNoise1 = noise3D(x * 0.04 + seed * 2.7, y * 0.06 + seed * 1.3, z * 0.04 + seed * 3.9, 2);
  const cNoise2 = noise3D(x * 0.04 + 50.0, y * 0.06 + 25.0, z * 0.04 - 50.0, 2);
  const d1 = Math.abs(cNoise1 - 0.5);
  const d2 = Math.abs(cNoise2 - 0.5);
  return (d1 * d1 + d2 * d2) < 0.012;
}

/** River carving flow map */
export function riverCarving(x, z, seed = 0) {
  const rx = x * 0.007 * WORLD_SCALE + seed * 12.3;
  const rz = z * 0.007 * WORLD_SCALE + seed * 8.4;
  const rNoise = fbm(rx, rz, 4);
  const distToRiver = Math.abs(rNoise - 0.5) * 2;
  if (distToRiver < 0.12) {
    const depthFactor = 1 - (distToRiver / 0.12);
    const smoothDepth = depthFactor * depthFactor * (3 - 2 * depthFactor);
    return smoothDepth * 7;
  }
  return 0;
}

/** Biome blend factors */
export function getBiomeFactors(x, z, seed = 0) {
  const sx = x * 0.01 * WORLD_SCALE + seed * 4.1;
  const sz = z * 0.01 * WORLD_SCALE + seed * 9.3;
  const temp = fbm(sx, sz, 3);
  const humidity = fbm(sx + 50, sz - 30, 3);
  return { temp, humidity };
}

export function biomeBlendWeight(x, z, seed = 0) {
  const { temp, humidity } = getBiomeFactors(x, z, seed);
  const tSmooth = temp * temp * (3 - 2 * temp);
  const hSmooth = humidity * humidity * (3 - 2 * humidity);
  return { tSmooth, hSmooth };
}

/** Sea level constant shared with world (keep in sync with World.SEA_LEVEL). */
export const GEN_SEA_LEVEL = 16;

/** <1 stretches continents so travel covers more varied terrain before looping patterns. */
export const WORLD_SCALE = 0.5; // ~2x larger landforms (4x area feel of noise)

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
  return Math.max(0, Math.min(1, 1 - Math.hypot(x, z) / 240));
}

export function heightAt(x, z, seed = 0) {
  const sx = x * 0.03 * WORLD_SCALE + seed * 17.1;
  const sz = z * 0.03 * WORLD_SCALE + seed * 9.7;
  const h = fbm(sx, sz, 5);
  const rVal = ridgeNoise(sx * 0.5 + 20, sz * 0.5 - 10, 4);
  const ridge = Math.abs(rVal - 0.5) * 2;
  let y = 18 + h * 16 + ridge * 8;

  const riverErosion = riverCarving(x, z, seed);
  y -= riverErosion;

  // Broad ocean / shelf: lower coast noise → deeper water
  const coast = fbm(x * 0.01 * WORLD_SCALE + 3, z * 0.01 * WORLD_SCALE + 7, 3);
  if (coast < 0.50) {
    const depth = (0.50 - coast) / 0.50; // 0..1
    y -= depth * depth * 26;
  }

  // Tropical island peaks inside wet basins
  if (coast < 0.42) {
    const isle = fbm(x * 0.05 * WORLD_SCALE + seed * 3.1, z * 0.05 * WORLD_SCALE + seed * 5.7, 3);
    if (isle > 0.66) {
      const peak = GEN_SEA_LEVEL + 1 + Math.floor((isle - 0.66) * 28);
      y = Math.max(y, peak);
    }
  }

  const starterBlend = starterCoastBlend(x, z);
  if (starterBlend > 0) {
    const shelf = 8 + fbm(x * 0.018 * WORLD_SCALE + 41, z * 0.018 * WORLD_SCALE - 17, 3) * 16;
    y = y * (1 - starterBlend) + shelf * starterBlend;
  }

  return Math.floor(y);
}

/** Improved Ore Distribution calculation */
export function getOreBlock(x, y, z, surfaceY, seed = 0, biome = 'forest') {
  if (y >= surfaceY - 3 || y < 2) return null;

  // Ore vein directionality: angled plane equation
  const angle = (seed % 100) * 0.0628;
  const p1 = Math.sin(x * 0.28 * Math.cos(angle) + y * 0.45 * Math.sin(angle) + z * 0.28 * Math.sin(angle + 1));
  const p2 = Math.cos(x * 0.22 * Math.sin(angle) + y * 0.38 * Math.cos(angle) + z * 0.22 * Math.cos(angle + 2));
  const planeVein = p1 * p1 + p2 * p2;

  // 1. Diamond Ore (very deep: y < 16, clustered angled veins)
  if (y < 16) {
    const dRoll = hash2(Math.floor(x / 2) + y * 7, Math.floor(z / 2) + seed * 13);
    if (dRoll > 0.962 && planeVein < 0.28) return BLOCK.DIAMOND_ORE || 57;
    const rRoll = hash2(x + y * 11, z + seed * 17);
    if (rRoll > 0.968 && planeVein < 0.35) return BLOCK.REDSTONE_ORE || 60;
  }

  // 2. Gold Ore (deep: y < 24)
  if (y < 24) {
    const gRoll = hash2(Math.floor(x / 2) + y * 5, Math.floor(z / 2) + seed * 19);
    if (gRoll > 0.972 && planeVein < 0.25) return BLOCK.GOLD_ORE || 56;
  }

  // 3. Emerald Ore (rare in mountain biomes where surfaceY > 28)
  if (surfaceY > 28 && y < surfaceY - 4 && y > 8) {
    const eRoll = hash2(x * 13 + y * 29, z * 17 + seed * 31);
    if (eRoll > 0.990) return BLOCK.EMERALD_ORE || 58;
  }

  // 4. Lapis Ore (hills / medium depth: y < 30 and y > 8)
  if (y < 30 && y > 8) {
    const lRoll = hash2(Math.floor(x / 2) + y * 3, Math.floor(z / 2) + seed * 23);
    if (lRoll > 0.982 && planeVein < 0.18) return BLOCK.LAPIS_ORE || 59;
  }

  // 5. Iron Ore (y < surfaceY - 8, directional veins)
  if (y < surfaceY - 8 && y > 3) {
    const iRoll = hash2(Math.floor(x / 2) + y * 3, Math.floor(z / 2) + seed * 5);
    if (iRoll > 0.958 && planeVein < 0.42) return BLOCK.IRON_ORE;
  }

  // 6. Coal Ore (y < surfaceY - 4, larger clusters)
  if (y < surfaceY - 4) {
    const cRoll = hash2(Math.floor(x / 3) + y * 2, Math.floor(z / 3) + seed);
    if (cRoll > 0.94) return BLOCK.COAL_ORE;
  }

  // 7. Deep Clay & Sulfur
  if (y >= 2 && y <= 8 && hash2(x + y * 13, z * 7 + seed * 3) > 0.982) return BLOCK.CLAY_DEEP_ORE;
  if (y < 20 && y > 4 && hash2(x * 3 + y * 7, z * 5 + seed * 11) > 0.988) return BLOCK.SULFUR_ORE;

  return null;
}
