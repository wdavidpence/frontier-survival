/**
 * Deterministic tropical ecology pass shared by sync and worker-backed chunks.
 * It runs after base chunk data arrives so both generation paths converge on the
 * same plant and edible-root distribution without duplicating worker logic.
 */
import { BLOCK } from './blocks.js?v=295';
import { biomeAt, BIOME } from './biomes.js?v=272';
import { hash2 } from './gen.js?v=327';

export const TROPICAL_ECOLOGY = Object.freeze({
  mushroomChance: 0.003,
  tuberChance: 0.012,
  bromeliadChance: 0.026,
  heliconiaChance: 0.022,
  taroChance: 0.024,
  pandanusChance: 0.016,
  pneumatophoreChance: 0.30,
  banyanChance: 0.010,
});

const SEA_LEVEL = 16;
const WORLD_HEIGHT = 48;
const CHUNK_SIZE = 16;
const AIR = BLOCK.AIR;
const SURFACE = new Set([BLOCK.GRASS, BLOCK.DIRT, BLOCK.SAND, BLOCK.MANGROVE_MUD, BLOCK.DAMP_SOIL]);
const SOIL = new Set([BLOCK.DIRT, BLOCK.SAND, BLOCK.MANGROVE_MUD, BLOCK.DAMP_SOIL]);
const idx = (lx, y, lz) => lx + CHUNK_SIZE * (lz + CHUNK_SIZE * y);
const inside = (lx, y, lz) => lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE && y >= 0 && y < WORLD_HEIGHT;

function put(data, lx, y, lz, id) {
  if (!inside(lx, y, lz) || data[idx(lx, y, lz)] !== AIR) return false;
  data[idx(lx, y, lz)] = id;
  return true;
}

function hasTreeNearby(data, lx, h, lz) {
  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (!inside(lx + dx, h + 1, lz + dz)) continue;
      for (let y = h + 1; y <= Math.min(WORLD_HEIGHT - 1, h + 7); y++) {
        const id = data[idx(lx + dx, y, lz + dz)];
        if (id === BLOCK.LOG || id === BLOCK.MANGROVE_LOG || id === BLOCK.LEAVES || id === BLOCK.MANGROVE_LEAVES) return true;
      }
    }
  }
  return false;
}

function actualSurfaceY(data, lx, lz) {
  for (let y = WORLD_HEIGHT - 2; y >= SEA_LEVEL + 1; y--) {
    if (SURFACE.has(data[idx(lx, y, lz)])) return y;
  }
  return -1;
}

function findTuberY(data, lx, h, lz) {
  for (let y = h - 1; y >= Math.max(1, h - 4); y--) {
    if (SOIL.has(data[idx(lx, y, lz)])) return y;
  }
  return -1;
}

/**
 * Add bounded tropical forms and underground food patches in-place.
 * @param {Uint8Array} data
 * @param {{baseX:number,baseZ:number,seed:number}} options
 */
export function applyTropicalEcology(data, { baseX = 0, baseZ = 0, seed = 0 } = {}) {
  if (!data || typeof data.length !== 'number') return data;
  let mushroomCount = 0;
  let tuberCount = 0;
  for (let lz = 0; lz < CHUNK_SIZE; lz++) {
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const x = baseX + lx;
      const z = baseZ + lz;
      const biome = biomeAt(x, z, seed);
      const h = actualSurfaceY(data, lx, lz);
      if (h < SEA_LEVEL + 5) {
        if (biome === BIOME.MANGROVE && h >= SEA_LEVEL - 1 && hash2(x * 71 + seed, z * 79 + seed * 3) > 1 - TROPICAL_ECOLOGY.pneumatophoreChance) {
          put(data, lx, Math.max(SEA_LEVEL, h + 1), lz, BLOCK.PNEUMATOPHORE);
        }
        continue;
      }
      const surface = data[idx(lx, h, lz)];
      if (!SURFACE.has(surface) || data[idx(lx, h + 1, lz)] !== AIR) continue;
      const roll = hash2(x * 53 + seed * 7, z * 59 + seed * 11);
      const roll2 = hash2(x * 61 + seed * 13, z * 67 + seed * 17);
      const roll3 = hash2(x * 73 + seed * 19, z * 83 + seed * 23);
      const tropical = biome === BIOME.TROPICAL;
      const forest = biome === BIOME.FOREST;
      const shore = biome === BIOME.SHORE;
      const mangrove = biome === BIOME.MANGROVE;
      const nearTree = hasTreeNearby(data, lx, h, lz);

      // Localized damp-floor mushrooms: one per chunk at most, never a carpet.
      if ((forest || tropical) && mushroomCount === 0 && surface !== BLOCK.SAND && roll < TROPICAL_ECOLOGY.mushroomChance) {
        if (put(data, lx, h + 1, lz, BLOCK.MUSHROOM)) mushroomCount++;
        continue;
      }
      // Tree-attached bromeliad proxy: the custom silhouette reads as a rosette
      // while placement stays in the host cell for safe voxel collision.
      if ((forest || tropical) && nearTree && roll2 < TROPICAL_ECOLOGY.banyanChance) {
        put(data, lx, h + 1, lz, BLOCK.BANYAN_ROOTS);
        continue;
      }
      if ((forest || tropical) && nearTree && roll2 < TROPICAL_ECOLOGY.banyanChance + TROPICAL_ECOLOGY.bromeliadChance) {
        put(data, lx, h + 1, lz, BLOCK.BROMELIAD);
        continue;
      }
      if ((forest || tropical) && roll3 < TROPICAL_ECOLOGY.heliconiaChance) {
        put(data, lx, h + 1, lz, BLOCK.HELICONIA);
        continue;
      }
      if ((tropical || shore || mangrove) && roll3 < TROPICAL_ECOLOGY.taroChance) {
        put(data, lx, h + 1, lz, BLOCK.TARO);
        continue;
      }
      if ((shore || tropical) && roll < TROPICAL_ECOLOGY.pandanusChance) {
        put(data, lx, h + 1, lz, BLOCK.PANDANUS);
        continue;
      }
      // Diggable root foods sit beneath the first natural soil pocket.
      const tuberY = findTuberY(data, lx, h, lz);
      if ((tropical || shore) && tuberCount < 2 && tuberY > 0 && roll2 > 1 - TROPICAL_ECOLOGY.tuberChance) {
        const variant = Math.floor(roll3 * 4);
        data[idx(lx, tuberY, lz)] = [BLOCK.CASSAVA_TUBER, BLOCK.YAUTIA_CORM, BLOCK.YAM_TUBER, BLOCK.BATATA_TUBER][variant];
        tuberCount++;
      }
    }
  }
  return data;
}

export function tropicalPlantIds() {
  return [BLOCK.BROMELIAD, BLOCK.HELICONIA, BLOCK.TARO, BLOCK.PANDANUS, BLOCK.PNEUMATOPHORE, BLOCK.BANYAN_ROOTS];
}

export function tropicalTuberIds() {
  return [BLOCK.CASSAVA_TUBER, BLOCK.YAUTIA_CORM, BLOCK.YAM_TUBER, BLOCK.BATATA_TUBER];
}
