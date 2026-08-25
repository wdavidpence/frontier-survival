/** Pure building-shape helpers and recipe data for wood stairs/slabs.
 * No game/world/player/main imports — pure data + logic only. */

import { BLOCK } from './blocks.js?v=293';
import { ITEM } from './items.js?v=253';

// ── Shape metadata (pure data, no rendering) ────────────────────────

/**
 * Stair shape descriptors. Each stair has 8 orientations (4 rotations × 2 flips).
 * Returns an array of {x, y, z} offsets describing the solid voxels for a stair shape.
 */
export function stairShape(type = 'normal') {
  // Normal wood stairs: half-block shape (bottom half)
  const shape = [];
  for (let x = 0; x < 8; x++) {
    shape.push({ x, y: 0, z: 0 }); // bottom layer full
    if (x < 4) {
      shape.push({ x, y: 1, z: 0 }); // top layer front half
    }
  }
  return shape;
}

/** Slab shape: returns voxel offsets for a wood slab (half-block height). */
export function slabShape(type = 'normal') {
  const shape = [];
  for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
      shape.push({ x, y: 0, z }); // single layer
    }
  }
  return shape;
}

/** Door shape: returns voxel offsets for a closed wooden door (2 wide × 3 tall). */
export function doorShape(type = 'wood') {
  const shape = [];
  // Bottom block (y=0..1 in voxel coords, stored as y=0)
  for (let x = 0; x < 2; x++) {
    shape.push({ x, y: 0, z: 0 });
  }
  // Middle block (y=1..2 → stored as y=1)
  for (let x = 0; x < 2; x++) {
    shape.push({ x, y: 1, z: 0 });
  }
  // Top block (y=2..3 → stored as y=2)
  for (let x = 0; x < 2; x++) {
    shape.push({ x, y: 2, z: 0 });
  }
  return shape;
}

/** Fence shape: returns voxel offsets for a fence post with connecting rails. */
export function fenceShape(type = 'wood') {
  const shape = [];
  // Post: 1×3 vertical column (x=0, z=0; y=0..2)
  for (let y = 0; y < 3; y++) {
    shape.push({ x: 0, y, z: 0 });
  }
  // Rails connecting to adjacent fences (4 directions at y=1)
  shape.push({ x: -1, y: 1, z: 0 }); // west rail
  shape.push({ x: 1, y: 1, z: 0 });  // east rail
  shape.push({ x: 0, y: 1, z: -1 }); // north rail
  shape.push({ x: 0, y: 1, z: 1 });  // south rail
  return shape;
}

// ── Recipe data helpers ─────────────────────────────────────────────

/** Wood stairs recipe: 3 Planks → 2 Stairs */
export const STAIRS_RECIPE = {
  id: 'stairs_wood',
  name: 'Wood Stairs',
  desc: '3 Planks → 2 Wood Stairs (climbable)',
  ingredients: [{ id: BLOCK.PLANKS, count: 3 }],
  results: [{ id: BLOCK.STAIRS_WOOD, count: 2 }],
};

/** Wood slab recipe: 6 Planks → 3 Slabs */
export const SLAB_RECIPE = {
  id: 'slab_wood',
  name: 'Wood Slabs',
  desc: '6 Planks → 3 Wood Slabs (half-block)',
  ingredients: [{ id: BLOCK.PLANKS, count: 6 }],
  results: [{ id: BLOCK.SLAB_WOOD, count: 3 }],
};

/** Wooden door recipe: 6 Planks → 1 Door */
export const DOOR_RECIPE = {
  id: 'door',
  name: 'Wooden Door',
  desc: '6 Planks → Door (open/close with F)',
  ingredients: [{ id: BLOCK.PLANKS, count: 6 }],
  results: [{ id: BLOCK.DOOR_CLOSED, count: 1 }],
};

/** Wooden fence recipe: 4 Planks + 2 Sticks → 4 Fences */
export const FENCE_RECIPE = {
  id: 'fence',
  name: 'Fence',
  desc: '4 Planks + 2 Sticks → 4 Fences (enclosure)',
  ingredients: [
    { id: BLOCK.PLANKS, count: 4 },
    { id: ITEM.STICK, count: 2 },
  ],
  results: [{ id: BLOCK.FENCE, count: 4 }],
};

// ── Shape lookup helpers (pure data) ────────────────────────────────

/** Get shape type for a block ID. Returns 'stairs', 'slab', 'door', 'fence', or null. */
export function shapeType(blockId) {
  if (blockId === BLOCK.STAIRS_WOOD) return 'stairs';
  if (blockId === BLOCK.SLAB_WOOD) return 'slab';
  if (blockId === BLOCK.DOOR_CLOSED || blockId === BLOCK.DOOR_OPEN) return 'door';
  if (blockId === BLOCK.FENCE) return 'fence';
  return null;
}

/** Get shape array for a block ID. Returns undefined if not a shape block. */
export function getShape(blockId) {
  const type = shapeType(blockId);
  if (type === 'stairs') return stairShape();
  if (type === 'slab') return slabShape();
  if (type === 'door') return doorShape();
  if (type === 'fence') return fenceShape();
  return undefined;
}

/** Check if a block ID is a building shape (stairs/slab/door/fence). */
export function isShapeBlock(blockId) {
  return shapeType(blockId) !== null;
}

/** Get all shape block IDs. */
export function shapeBlockIds() {
  return [BLOCK.STAIRS_WOOD, BLOCK.SLAB_WOOD, BLOCK.DOOR_CLOSED, BLOCK.FENCE];
}

/** Get all shape recipes. */
export function shapeRecipes() {
  return [STAIRS_RECIPE, SLAB_RECIPE, DOOR_RECIPE, FENCE_RECIPE];
}
