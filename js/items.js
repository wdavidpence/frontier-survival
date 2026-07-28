/**
 * Unified item/block IDs for inventory stacks.
 * Blocks: 0–99 (see blocks.js). Items: 100+.
 */
import { BLOCK, BLOCK_PROPS } from './blocks.js';

export const ITEM = {
  STICK: 100,
  RATION: 101,
  WOOD_PICK: 102,
  WOOD_AXE: 103,
  STONE_PICK: 104,
  COAL: 105,
  RAW_MEAT: 106,
  COOKED_MEAT: 107,
};

/** @type {Record<number, {
 *  name: string,
 *  color: [number,number,number],
 *  placeable?: boolean,
 *  placeAs?: number,
 *  edible?: number,
 *  eatDamage?: number,
 *  cookable?: number,
 *  tool?: 'pick'|'axe'|'hand'|'weapon',
 *  mineMult?: number,
 *  melee?: number,
 *  maxStack?: number
 * }>} */
export const ITEM_PROPS = {
  [ITEM.STICK]: { name: 'Stick', color: [0.55, 0.4, 0.22], maxStack: 64, melee: 3 },
  [ITEM.RATION]: { name: 'Dried Ration', color: [0.72, 0.55, 0.3], edible: 28, maxStack: 16 },
  [ITEM.WOOD_PICK]: { name: 'Wood Pick', color: [0.65, 0.5, 0.28], tool: 'pick', mineMult: 2.2, maxStack: 1, melee: 5 },
  [ITEM.WOOD_AXE]: { name: 'Wood Axe', color: [0.6, 0.42, 0.2], tool: 'axe', mineMult: 2.4, maxStack: 1, melee: 7 },
  [ITEM.STONE_PICK]: { name: 'Stone Pick', color: [0.55, 0.55, 0.58], tool: 'pick', mineMult: 3.4, maxStack: 1, melee: 6 },
  [ITEM.COAL]: { name: 'Coal', color: [0.18, 0.18, 0.2], maxStack: 64 },
  [ITEM.RAW_MEAT]: {
    name: 'Raw Meat',
    color: [0.75, 0.28, 0.28],
    edible: 10,
    eatDamage: 4,
    cookable: ITEM.COOKED_MEAT,
    maxStack: 16,
  },
  [ITEM.COOKED_MEAT]: {
    name: 'Cooked Meat',
    color: [0.55, 0.32, 0.18],
    edible: 38,
    maxStack: 16,
  },
};

export function propsOf(id) {
  if (id == null) return null;
  if (ITEM_PROPS[id]) return ITEM_PROPS[id];
  if (BLOCK_PROPS[id]) {
    const b = BLOCK_PROPS[id];
    return {
      name: b.name,
      color: b.color,
      placeable: id !== BLOCK.AIR && id !== BLOCK.WATER && id !== BLOCK.BEDROCK,
      placeAs: id,
      maxStack: 64,
    };
  }
  return null;
}

export function displayName(id) {
  return propsOf(id)?.name || `Item ${id}`;
}

export function maxStack(id) {
  return propsOf(id)?.maxStack || 64;
}

export function isPlaceable(id) {
  const p = propsOf(id);
  return !!(p && p.placeable);
}

export function placeBlockId(id) {
  const p = propsOf(id);
  if (!p?.placeable) return null;
  return p.placeAs ?? id;
}

/** Preferred tool type for a block */
export function preferredTool(blockId) {
  if (blockId === BLOCK.LOG || blockId === BLOCK.PLANKS || blockId === BLOCK.LEAVES) return 'axe';
  if (
    blockId === BLOCK.STONE ||
    blockId === BLOCK.COBBLE ||
    blockId === BLOCK.COAL_ORE ||
    blockId === BLOCK.SANDSTONE
  ) return 'pick';
  return 'hand';
}

/**
 * @param {number|null} heldId
 * @param {number} blockId
 */
export function mineMultiplier(heldId, blockId) {
  const p = propsOf(heldId);
  const need = preferredTool(blockId);
  if (!p?.tool) return 1;
  if (p.tool === need) return p.mineMult || 2;
  if (p.tool === 'pick' && need === 'hand') return 1.2;
  if (p.tool === 'axe' && need === 'hand') return 1.15;
  return 1.05;
}

/** Drop id when breaking a world block (may be item). */
export function dropForBlock(blockId) {
  if (blockId === BLOCK.COAL_ORE) return ITEM.COAL;
  if (blockId === BLOCK.LEAVES) {
    // rare stick from leaves
    return null; // handled with rng externally
  }
  const d = BLOCK_PROPS[blockId]?.drops;
  if (d === undefined) return blockId;
  return d;
}
