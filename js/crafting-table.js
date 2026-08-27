/** Dedicated crafting-table block registration for the unified voxel catalog. */
import { BLOCK, BLOCK_PROPS } from './blocks.js?v=295';

export const CRAFTING_TABLE = 78;

// Keep the existing block module identity so every caller (world, items,
// player, mesher) observes the same registered block without a catalog fork.
if (BLOCK.CRAFTING_TABLE == null) BLOCK.CRAFTING_TABLE = CRAFTING_TABLE;
if (!BLOCK_PROPS[CRAFTING_TABLE]) {
  BLOCK_PROPS[CRAFTING_TABLE] = {
    name: 'Crafting Table',
    solid: true,
    transparent: false,
    hardness: 1.2,
    color: [0.52, 0.30, 0.14],
    topColor: [0.72, 0.48, 0.24],
    drops: CRAFTING_TABLE,
  };
}
