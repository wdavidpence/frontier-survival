/**
 * Web Worker for chunk generation — runs terrain synthesis off the main thread.
 * Self-contained: re-implements only what _generateChunk needs (hash2, fbm, heightAt, biomeAt).
 * Receives { cx, cz, seed } on 'message', posts back Uint8Array chunk data.
 */

// ── Minimal noise helpers (copies of gen.js + biomes.js logic) ──────────────

function hash2(x, z) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function smoothNoise(x, z) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  return (
    hash2(x0, z0) +
    (hash2(x0 + 1, z0) - hash2(x0, z0)) * sx +
    (hash2(x0, z0 + 1) - hash2(x0, z0)) * sz +
    (hash2(x0 + 1, z0 + 1) - hash2(x0 + 1, z0) - hash2(x0, z0 + 1) + hash2(x0, z0)) * sx * sz
  );
}

function fbm(x, z, octaves = 4) {
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

const WORLD_SCALE = 0.5;
function starterCoastBlend(x, z) {
  return Math.max(0, Math.min(1, 1 - Math.hypot(x, z) / 168));
}
function heightAt(x, z, seed = 0) {
  const sx = x * 0.03 * WORLD_SCALE + seed * 17.1;
  const sz = z * 0.03 * WORLD_SCALE + seed * 9.7;
  const h = fbm(sx, sz, 5);
  const ridge = Math.abs(fbm(sx * 0.5 + 20, sz * 0.5 - 10, 3) - 0.5) * 2;
  let y = 18 + h * 16 + ridge * 8;
  const coast = fbm(x * 0.01 * WORLD_SCALE + 3, z * 0.01 * WORLD_SCALE + 7, 3);
  if (coast < 0.44) {
    const depth = (0.44 - coast) / 0.44;
    y -= depth * depth * 26;
  }
  if (coast < 0.38) {
    const isle = fbm(x * 0.05 * WORLD_SCALE + seed * 3.1, z * 0.05 * WORLD_SCALE + seed * 5.7, 3);
    if (isle > 0.7) {
      const peak = 16 + 1 + Math.floor((isle - 0.7) * 28);
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

function biomeAt(x, z, seed = 0) {
  const h = heightAt(x, z, seed);
  const coast = fbm(x * 0.01 * WORLD_SCALE + 3, z * 0.01 * WORLD_SCALE + 7, 3);
  const isle = fbm(x * 0.05 * WORLD_SCALE + seed * 3.1, z * 0.05 * WORLD_SCALE + seed * 5.7, 3);
  if (h < 16 - 1) return 'ocean';
  const starter = starterCoastBlend(x, z);
  if (starter > 0.12 && h >= 16) {
    if (h <= 16 + 1) return 'shore';
    return 'tropical';
  }
  if (h >= 16 && h <= 16 + 7 && coast < 0.4 && isle > 0.7) return 'tropical';
  if (h < 20) return 'shore';
  const dryness = fbm(
    x * 0.015 * WORLD_SCALE + seed * 31.3,
    z * 0.015 * WORLD_SCALE + seed * 22.7,
    4,
  );
  if (h > 30 && dryness < 0.35) return 'tundra';
  if (dryness > 0.65) return 'desert';
  return 'forest';
}

// ── Block IDs (must match blocks.js) ────────────────────────────────────────

// Must match js/blocks.js exactly — wrong IDs corrupt async gen.
const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
  LOG: 6,
  LEAVES: 7,
  PLANKS: 8,
  COBBLE: 9,
  SANDSTONE: 10,
  SNOW: 11,
  ICE: 12,
  COAL_ORE: 13,
  TORCH: 14,
  CAMPFIRE: 15,
  BEDROCK: 16,
  BED: 17,
  IRON_ORE: 18,
  BUSH: 19,
  FARMLAND: 20,
  CROP: 21,
  CHEST: 22,
  LADDER: 23,
  FENCE: 24,
  SNARE: 25,
  PUMPKIN: 26,
  DOOR_CLOSED: 27,
  DOOR_OPEN: 28,
  GLASS: 29,
  CLAY: 30,
  BRICKS: 31,
  FURNACE: 32,
  WIRE: 33,
  LAMP: 34,
  GENERATOR: 35,
  ICE_BOX: 36,
  WALL: 37,
  LAVA: 38,
  CLAY_DEEP_ORE: 39,
  SULFUR_ORE: 40,
  OIL_SEEP: 41,
  SPRUCE_LOG: 42,
  SPRUCE_LEAVES: 43,
  SEQUOIA_LOG: 44,
  SEQUOIA_LEAVES: 45,
  STAIRS_WOOD: 46,
  SLAB_WOOD: 47,
  CORAL: 48,
  KELP: 49,
  SEAGRASS: 50,
};

const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 48;
const SEA_LEVEL = 16;

// ── Chunk generation (mirrors World._generateChunk) ─────────────────────────

function generateChunkData(cx, cz, seed) {
  const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);

  function idx(lx, y, lz) {
    return (lz * WORLD_HEIGHT + y) * CHUNK_SIZE + lx;
  }

  const baseX = cx * CHUNK_SIZE;
  const baseZ = cz * CHUNK_SIZE;

  for (let lz = 0; lz < CHUNK_SIZE; lz++) {
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const x = baseX + lx;
      const z = baseZ + lz;
      const h = heightAt(x, z, seed);
      const biome = biomeAt(x, z, seed);

      for (let y = 0; y < WORLD_HEIGHT; y++) {
        let id = BLOCK.AIR;
        if (y === 0) id = BLOCK.BEDROCK;
        else if (y > h) {
          if (y <= SEA_LEVEL) id = BLOCK.WATER;
        } else if (y === h) {
          if (biome === 'shore' || biome === 'desert' || biome === 'ocean') id = BLOCK.SAND;
          else if (biome === 'tundra') id = BLOCK.SNOW;
          else id = BLOCK.GRASS;
        } else if (y > h - 4) {
          if (biome === 'desert' || biome === 'shore' || biome === 'ocean' || biome === 'tropical') id = BLOCK.SAND;
          else id = BLOCK.DIRT;
        } else {
          id = BLOCK.STONE;
          if (y < h - 6 && hash2(x + y * 3, z + seed) > 0.97) id = BLOCK.COAL_ORE;
          if (y < h - 10 && y > 4 && hash2(x * 2 + y, z + seed * 5) > 0.985) id = BLOCK.IRON_ORE;
          if (y >= 2 && y <= 8 && hash2(x + y * 13, z * 7 + seed * 3) > 0.982) id = BLOCK.CLAY_DEEP_ORE;
          if (y >= 3 && y <= h - 5) {
            if (hash2(x + y * 7, z + seed * 3) > 0.991) id = BLOCK.AIR;
          }
        }
        data[idx(lx, y, lz)] = id;
      }

      // Trees
      if (h > SEA_LEVEL + 1) {
        const th = hash2(x * 3 + (seed | 0), z * 5 + 19);
        let treeChance = 0;
        if (biome === 'forest') treeChance = 0.018;
        else if (biome === 'shore') treeChance = 0.028;
        else if (biome === 'tundra') treeChance = 0.012;
        else if (biome === 'tropical') treeChance = 0.018;
        if (th > 1 - treeChance) {
          if (biome === 'tropical' || biome === 'shore') _placePalm(data, idx, lx, h + 1, lz);
          else _placeTree(data, idx, lx, h + 1, lz);
        }
      }

      populateOceanColumn(data, idx, lx, h, lz, x, z, biome, seed);

      // Berry bushes
      if (
        (biome === 'forest' || biome === 'shore') &&
        h > SEA_LEVEL + 1 &&
        data[idx(lx, h, lz)] === BLOCK.GRASS &&
        data[idx(lx, h + 1, lz)] === BLOCK.AIR &&
        hash2(x + 91, z * 3 + (seed | 0)) > 0.94
      ) {
        data[idx(lx, h + 1, lz)] = BLOCK.BUSH;
      }

      // Clay deposits near shore
      if (biome === 'shore' || (h >= SEA_LEVEL && h <= SEA_LEVEL + 3 && biome !== 'tundra')) {
        if (hash2(x + 33, z + seed) > 0.93) {
          const surface = data[idx(lx, h, lz)];
          if (surface === BLOCK.GRASS || surface === BLOCK.DIRT || surface === BLOCK.SAND) {
            data[idx(lx, h, lz)] = BLOCK.CLAY;
          }
        }
      }
    }
  }

  // Lava tubes
  _carveLavaTubes(data, idx, baseX, baseZ, seed);

  return data;
}

function _placePalm(data, idx, lx, y, lz) {
  const trunkH = 5 + Math.floor(hash2(lx + 21, lz + 13) * 3);
  for (let i = 0; i < trunkH; i++) {
    const ty = y + i;
    if (ty >= WORLD_HEIGHT) break;
    data[idx(lx, ty, lz)] = BLOCK.LOG;
  }
  const top = y + trunkH - 1;
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const tx = lx + dx;
    const tz = lz + dz;
    const ty = top + (Math.abs(dx) + Math.abs(dz) > 1 ? 0 : 1);
    if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE || ty < 0 || ty >= WORLD_HEIGHT) continue;
    if (data[idx(tx, ty, tz)] === BLOCK.AIR) data[idx(tx, ty, tz)] = BLOCK.LEAVES;
  }
}

function _placeTree(data, idx, lx, y, lz) {
  const trunkH = 4 + Math.floor(hash2(lx + 11, lz + 7) * 4);
  for (let i = 0; i < trunkH; i++) {
    const ty = y + i;
    if (ty >= WORLD_HEIGHT) break;
    data[idx(lx, ty, lz)] = BLOCK.LOG;
  }
  const top = y + trunkH - 1;
  const radius = 2 + (hash2(lx + 3, lz + 9) > 0.55 ? 1 : 0);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
        if (dist > radius + 1) continue;
        if (dx === 0 && dz === 0 && dy < 0) continue;
        if (dy === 2 && (Math.abs(dx) > 1 || Math.abs(dz) > 1)) continue;
        const tx = lx + dx;
        const ty2 = top + dy;
        const tz = lz + dz;
        if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE || ty2 < 0 || ty2 >= WORLD_HEIGHT) continue;
        if (data[idx(tx, ty2, tz)] === BLOCK.AIR) data[idx(tx, ty2, tz)] = BLOCK.LEAVES;
      }
    }
  }
  const peak = top + 3;
  if (peak < WORLD_HEIGHT && lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
    const i = idx(lx, peak, lz);
    if (data[i] === BLOCK.AIR) data[i] = BLOCK.LEAVES;
  }
}

function populateOceanColumn(data, idx, lx, h, lz, x, z, biome, seed) {
  if (h >= SEA_LEVEL || (biome !== 'ocean' && biome !== 'shore' && biome !== 'tropical')) return;
  const floor = data[idx(lx, h, lz)];
  if (floor !== BLOCK.SAND && floor !== BLOCK.DIRT) return;
  const waterY = h + 1;
  if (waterY >= SEA_LEVEL || data[idx(lx, waterY, lz)] !== BLOCK.WATER) return;

  const plantRoll = hash2(x * 11 + seed * 7, z * 13 + 31);
  const shallow = h >= SEA_LEVEL - 5;
  if (shallow && plantRoll > 0.72) {
    data[idx(lx, waterY, lz)] = BLOCK.SEAGRASS;
  } else if (!shallow && plantRoll > 0.78) {
    const kelpHeight = 2 + Math.floor(hash2(x * 17 + 5, z * 19 + seed) * 4);
    for (let y = waterY; y < Math.min(SEA_LEVEL, waterY + kelpHeight); y++) {
      if (data[idx(lx, y, lz)] !== BLOCK.WATER) break;
      data[idx(lx, y, lz)] = BLOCK.KELP;
    }
  }
  if (shallow && hash2(x * 17 + 5, z * 19 + seed) > 0.93) {
    data[idx(lx, waterY, lz)] = BLOCK.KELP;
    if (waterY + 1 < SEA_LEVEL && data[idx(lx, waterY + 1, lz)] === BLOCK.WATER) data[idx(lx, waterY + 1, lz)] = BLOCK.KELP;
  }

  if (shallow && hash2(x * 23 + 17, z * 29 + seed * 3) > 0.84) {
    data[idx(lx, waterY, lz)] = BLOCK.CORAL;
    const reefY = waterY + 1;
    if (reefY < SEA_LEVEL && data[idx(lx, reefY, lz)] === BLOCK.WATER && hash2(x + 41, z * 3 + 7) > 0.45) {
      data[idx(lx, reefY, lz)] = BLOCK.CORAL;
    }
    for (const dx of [-1, 1]) {
      const tx = lx + dx;
      if (tx < 0 || tx >= CHUNK_SIZE) continue;
      if (data[idx(tx, h, lz)] === BLOCK.SAND && data[idx(tx, waterY, lz)] === BLOCK.WATER) {
        data[idx(tx, waterY, lz)] = BLOCK.CORAL;
      }
    }
  }
}

function _carveLavaTubes(data, idx, baseX, baseZ, seed) {
  const tubeY = 4;
  const tubeRadius = 2;

  for (let lz = 0; lz < CHUNK_SIZE; lz++) {
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const wx = baseX + lx;
      const wz = baseZ + lz;

      const tubeCenterX = fbm(wx * 0.04 + seed * 17, wz * 0.04 + seed * 31, 2);
      const tubeCenterZ = fbm(wx * 0.04 + seed * 43, wz * 0.04 + seed * 59, 2);

      const tubeLx = (tubeCenterX * CHUNK_SIZE) % CHUNK_SIZE;
      const tubeLz = (tubeCenterZ * CHUNK_SIZE) % CHUNK_SIZE;

      const dx = lx - tubeLx;
      const dz = lz - tubeLz;
      const dist2d = Math.sqrt(dx * dx + dz * dz);

      const tubePresence = hash2(wx + seed * 7, wz + seed * 13);
      if (tubePresence < 0.85) continue;

      if (dist2d < tubeRadius) {
        const yTop = tubeY + Math.floor(hash2(wx, wz + seed * 5) * 3);
        const lavaLevel = tubeY;

        for (let y = lavaLevel; y <= yTop && y < WORLD_HEIGHT - 1; y++) {
          const i = idx(lx, y, lz);
          const block = data[i];
          if (block === BLOCK.STONE || block === BLOCK.DIRT) {
            if (y === lavaLevel) data[i] = BLOCK.LAVA;
            else if (y < yTop) data[i] = BLOCK.AIR;
          }
        }
      }
    }
  }
}

// ── Worker message handler ──────────────────────────────────────────────────

self.onmessage = function (e) {
  const { cx, cz, seed } = e.data;
  try {
    const data = generateChunkData(cx, cz, seed);
    self.postMessage({ cx, cz, data });
  } catch (err) {
    self.postMessage({ cx, cz, error: err.message });
  }
};
