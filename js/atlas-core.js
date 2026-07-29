/**
 * Pure atlas tile math — no DOM/Three (unit-testable).
 */
import { BLOCK } from './blocks.js';

export const TILE_PX = 32;
export const ATLAS_N = 8;
export const ATLAS_PX = TILE_PX * ATLAS_N;

export const TILE = {
  GRASS_SIDE: 0,
  GRASS_TOP: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
  LOG_SIDE: 6,
  LOG_TOP: 7,
  LEAVES: 8,
  PLANKS: 9,
  COBBLE: 10,
  SANDSTONE: 11,
  SNOW: 12,
  ICE: 13,
  COAL_ORE: 14,
  TORCH: 15,
  CAMPFIRE: 16,
  BEDROCK: 17,
  BED: 18,
  IRON_ORE: 19,
  BUSH: 20,
  FARMLAND: 21,
  CROP: 22,
  CHEST: 23,
  LADDER: 24,
  FENCE: 25,
  CRACK0: 40,
  CRACK1: 41,
  CRACK2: 42,
  CRACK3: 43,
  CRACK4: 44,
  CRACK5: 45,
};

/** UV corners: bl, tl, tr, br in atlas space */
export function tileUVs(tileIndex) {
  const tx = tileIndex % ATLAS_N;
  const ty = (tileIndex / ATLAS_N) | 0;
  const u0 = tx / ATLAS_N + 0.001;
  const u1 = (tx + 1) / ATLAS_N - 0.001;
  const v1 = 1 - ty / ATLAS_N - 0.001;
  const v0 = 1 - (ty + 1) / ATLAS_N + 0.001;
  return [
    [u0, v0],
    [u0, v1],
    [u1, v1],
    [u1, v0],
  ];
}

export function tileForBlock(blockId, faceDir) {
  switch (blockId) {
    case BLOCK.GRASS:
      if (faceDir === 'top') return TILE.GRASS_TOP;
      if (faceDir === 'bottom') return TILE.DIRT;
      return TILE.GRASS_SIDE;
    case BLOCK.DIRT:
      return TILE.DIRT;
    case BLOCK.STONE:
      return TILE.STONE;
    case BLOCK.SAND:
      return TILE.SAND;
    case BLOCK.WATER:
      return TILE.WATER;
    case BLOCK.LOG:
      return faceDir === 'top' || faceDir === 'bottom' ? TILE.LOG_TOP : TILE.LOG_SIDE;
    case BLOCK.LEAVES:
      return TILE.LEAVES;
    case BLOCK.PLANKS:
      return TILE.PLANKS;
    case BLOCK.COBBLE:
      return TILE.COBBLE;
    case BLOCK.SANDSTONE:
      return TILE.SANDSTONE;
    case BLOCK.SNOW:
      return TILE.SNOW;
    case BLOCK.ICE:
      return TILE.ICE;
    case BLOCK.COAL_ORE:
      return TILE.COAL_ORE;
    case BLOCK.TORCH:
      return TILE.TORCH;
    case BLOCK.CAMPFIRE:
      return TILE.CAMPFIRE;
    case BLOCK.BEDROCK:
      return TILE.BEDROCK;
    case BLOCK.BED:
      return TILE.BED;
    case BLOCK.IRON_ORE:
      return TILE.IRON_ORE;
    case BLOCK.BUSH:
      return TILE.BUSH;
    case BLOCK.FARMLAND:
      return faceDir === 'top' ? TILE.FARMLAND : TILE.DIRT;
    case BLOCK.CROP:
      return TILE.CROP;
    case BLOCK.CHEST:
      return TILE.CHEST;
    case BLOCK.LADDER:
      return TILE.LADDER;
    case BLOCK.FENCE:
      return TILE.FENCE;
    default:
      return TILE.STONE;
  }
}

export function crackTileForProgress(p) {
  const stage = Math.min(5, Math.max(0, Math.floor(p * 6)));
  return TILE.CRACK0 + stage;
}

export function atlasTileCount() {
  return Object.keys(TILE).length;
}
