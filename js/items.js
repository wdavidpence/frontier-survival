/**
 * Unified item/block IDs for inventory stacks.
 * Blocks: 0–99 (see blocks.js). Items: 100+.
 */
import { BLOCK, BLOCK_PROPS } from './blocks.js?v=187';

export const ITEM = {
  STICK: 100,
  RATION: 101,
  WOOD_PICK: 102,
  WOOD_AXE: 103,
  STONE_PICK: 104,
  COAL: 105,
  RAW_MEAT: 106,
  COOKED_MEAT: 107,
  HIDE: 108,
  CLOTH: 109,
  FUR_HAT: 110,
  WOOL_COAT: 111,
  FUR_BOOTS: 112,
  WOOD_SPEAR: 113,
  STONE_AXE: 114,
  BERRIES: 115,
  SEEDS: 116,
  WHEAT: 117,
  BREAD: 118,
  IRON_INGOT: 119,
  IRON_PICK: 120,
  IRON_AXE: 121,
  BOW: 122,
  ARROW: 123,
  ROTTEN_MEAT: 124,
  BOAT: 125,
  FISHING_ROD: 126,
  RAW_FISH: 127,
  COOKED_FISH: 128,
  APPLE: 129,
  FERTILIZER: 130,
  COMPASS: 131,
  SHIELD: 132,
  SALVE: 133,
  EGG: 134,
  FEATHER: 135,
  LEATHER_VEST: 136,
  PUMPKIN: 137,
  PUMPKIN_SOUP: 138,
  CHARCOAL: 139,
  CLAY_BALL: 140,
  BRICK: 141,
  BANDAGE: 142,
  WOOD_SWORD: 143,
  BUCKET: 144,
  WATER_BUCKET: 145,
  MAP: 146,
  ICE_BOX: 147,
};

/** @type {Record<number, {
 *  name: string,
 *  color: [number,number,number],
 *  placeable?: boolean,
 *  placeAs?: number,
 *  edible?: number,
 *  eatDamage?: number,
 *  cookable?: number,
 *  smeltable?: number,
 *  tool?: 'pick'|'axe'|'hand'|'weapon'|'bow'|'shield'|'rod',
 *  mineMult?: number,
 *  melee?: number,
 *  meleeRange?: number,
 *  maxStack?: number,
 *  equipSlot?: 'head'|'chest'|'feet',
 *  warmth?: number,
 *  plantable?: boolean
 * }>} */
export const ITEM_PROPS = {
  [ITEM.STICK]: { name: 'Stick', color: [0.55, 0.4, 0.22], maxStack: 64, melee: 3, meleeRange: 3.2 },
  [ITEM.RATION]: { name: 'Dried Ration', color: [0.72, 0.55, 0.3], edible: 28, maxStack: 16 },
  [ITEM.WOOD_PICK]: { name: 'Wood Pick', color: [0.65, 0.5, 0.28], tool: 'pick', mineMult: 2.2, maxStack: 1, melee: 5, meleeRange: 3.4 },
  [ITEM.WOOD_AXE]: { name: 'Wood Axe', color: [0.6, 0.42, 0.2], tool: 'axe', mineMult: 2.4, maxStack: 1, melee: 7, meleeRange: 3.5 },
  [ITEM.STONE_PICK]: { name: 'Stone Pick', color: [0.55, 0.55, 0.58], tool: 'pick', mineMult: 3.4, maxStack: 1, melee: 6, meleeRange: 3.4 },
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
  [ITEM.HIDE]: { name: 'Hide', color: [0.55, 0.4, 0.28], maxStack: 32 },
  [ITEM.CLOTH]: { name: 'Cloth', color: [0.85, 0.82, 0.75], maxStack: 32 },
  [ITEM.FUR_HAT]: {
    name: 'Fur Hat',
    color: [0.65, 0.45, 0.3],
    maxStack: 1,
    equipSlot: 'head',
    warmth: 4,
  },
  [ITEM.WOOL_COAT]: {
    name: 'Wool Coat',
    color: [0.45, 0.5, 0.62],
    maxStack: 1,
    equipSlot: 'chest',
    warmth: 8,
    armor: 2,
  },
  [ITEM.FUR_BOOTS]: {
    name: 'Fur Boots',
    color: [0.4, 0.28, 0.18],
    maxStack: 1,
    equipSlot: 'feet',
    warmth: 3,
  },
  [ITEM.WOOD_SPEAR]: {
    name: 'Wood Spear',
    color: [0.7, 0.55, 0.32],
    tool: 'weapon',
    maxStack: 1,
    melee: 11,
    meleeRange: 5.2,
  },
  [ITEM.STONE_AXE]: {
    name: 'Stone Axe',
    color: [0.5, 0.5, 0.52],
    tool: 'axe',
    mineMult: 3.5,
    maxStack: 1,
    melee: 9,
    meleeRange: 3.6,
  },
  [ITEM.BERRIES]: { name: 'Berries', color: [0.7, 0.15, 0.25], edible: 12, maxStack: 32 },
  [ITEM.SEEDS]: { name: 'Seeds', color: [0.7, 0.65, 0.3], maxStack: 64, plantable: true },
  [ITEM.WHEAT]: { name: 'Wheat', color: [0.85, 0.75, 0.3], maxStack: 64 },
  [ITEM.BREAD]: { name: 'Bread', color: [0.78, 0.58, 0.32], edible: 32, maxStack: 16 },
  [ITEM.IRON_INGOT]: { name: 'Iron Ingot', color: [0.7, 0.72, 0.78], maxStack: 64 },
  [ITEM.IRON_PICK]: {
    name: 'Iron Pick',
    color: [0.72, 0.74, 0.8],
    tool: 'pick',
    mineMult: 5.0,
    maxStack: 1,
    melee: 8,
    meleeRange: 3.5,
  },
  [ITEM.IRON_AXE]: {
    name: 'Iron Axe',
    color: [0.68, 0.7, 0.76],
    tool: 'axe',
    mineMult: 5.2,
    maxStack: 1,
    melee: 11,
    meleeRange: 3.6,
  },
  [ITEM.BOW]: {
    name: 'Bow',
    color: [0.55, 0.4, 0.22],
    tool: 'bow',
    maxStack: 1,
    melee: 2,
    meleeRange: 2.5,
  },
  [ITEM.ARROW]: { name: 'Arrow', color: [0.75, 0.75, 0.7], maxStack: 64 },
  [ITEM.ROTTEN_MEAT]: {
    name: 'Rotten Meat',
    color: [0.4, 0.45, 0.25],
    edible: 6,
    eatDamage: 12,
    maxStack: 16,
  },
  [ITEM.BOAT]: { name: 'Boat', color: [0.55, 0.4, 0.22], maxStack: 1 },
  [ITEM.FISHING_ROD]: { name: 'Fishing Rod', color: [0.5, 0.4, 0.25], tool: 'rod', maxStack: 1, durability: 80 },
  [ITEM.RAW_FISH]: {
    name: 'Raw Fish',
    color: [0.55, 0.7, 0.85],
    edible: 12,
    eatDamage: 2,
    cookable: ITEM.COOKED_FISH,
    maxStack: 16,
  },
  [ITEM.COOKED_FISH]: { name: 'Cooked Fish', color: [0.85, 0.65, 0.4], edible: 30, maxStack: 16 },
  [ITEM.APPLE]: { name: 'Apple', color: [0.85, 0.2, 0.15], edible: 16, maxStack: 16 },
  [ITEM.FERTILIZER]: { name: 'Fertilizer', color: [0.45, 0.35, 0.2], maxStack: 32 },
  [ITEM.COMPASS]: { name: 'Compass', color: [0.7, 0.7, 0.75], maxStack: 1 },
  [ITEM.SHIELD]: {
    name: 'Shield',
    color: [0.55, 0.45, 0.35],
    tool: 'shield',
    maxStack: 1,
    durability: 120,
    melee: 2,
    meleeRange: 2.2,
  },
  [ITEM.SALVE]: { name: 'Healing Salve', color: [0.7, 0.85, 0.55], maxStack: 8, heal: 25 },
  [ITEM.EGG]: { name: 'Egg', color: [0.92, 0.9, 0.82], edible: 14, maxStack: 16 },
  [ITEM.FEATHER]: { name: 'Feather', color: [0.9, 0.9, 0.92], maxStack: 64 },
  [ITEM.LEATHER_VEST]: {
    name: 'Leather Vest',
    color: [0.5, 0.35, 0.22],
    maxStack: 1,
    equipSlot: 'chest',
    warmth: 5,
    armor: 6,
  },
  [ITEM.PUMPKIN]: {
    name: 'Pumpkin',
    color: [0.9, 0.55, 0.12],
    edible: 18,
    placeable: true,
    placeAs: BLOCK.PUMPKIN,
    maxStack: 16,
  },
  [ITEM.PUMPKIN_SOUP]: { name: 'Pumpkin Soup', color: [0.95, 0.7, 0.3], edible: 40, maxStack: 8 },
  [ITEM.CHARCOAL]: { name: 'Charcoal', color: [0.22, 0.22, 0.24], maxStack: 64 },
  [ITEM.CLAY_BALL]: { name: 'Clay Ball', color: [0.42, 0.38, 0.3], maxStack: 64 },
  [ITEM.BRICK]: { name: 'Brick', color: [0.7, 0.3, 0.2], maxStack: 64 },
  [ITEM.BANDAGE]: { name: 'Bandage', color: [0.95, 0.93, 0.9], maxStack: 16, bandage: true },
  [ITEM.WOOD_SWORD]: { name: 'Wood Sword', color: [0.72, 0.55, 0.32], tool: 'weapon', melee: 13, meleeRange: 3.8, maxStack: 1 },
  [ITEM.BUCKET]: { name: 'Bucket', color: [0.55, 0.55, 0.6], maxStack: 16 },
  [ITEM.WATER_BUCKET]: { name: 'Water Bucket', color: [0.25, 0.45, 0.85], maxStack: 1 },
  [ITEM.MAP]: { name: 'Map', color: [0.75, 0.7, 0.5], maxStack: 1 },
  [ITEM.ICE_BOX]: { name: 'Ice Box', color: [0.7, 0.85, 0.95], maxStack: 8, placeable: true, placeAs: BLOCK.ICE_BOX },
};

export function propsOf(id) {
  if (id == null) return null;
  if (ITEM_PROPS[id]) return ITEM_PROPS[id];
  if (BLOCK_PROPS[id]) {
    const b = BLOCK_PROPS[id];
    return {
      name: b.name,
      color: b.color,
      placeable:
        id !== BLOCK.AIR &&
        id !== BLOCK.WATER &&
        id !== BLOCK.BEDROCK &&
        id !== BLOCK.CROP &&
        id !== BLOCK.BUSH,
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
  if (blockId === BLOCK.LOG || blockId === BLOCK.PLANKS || blockId === BLOCK.LEAVES || blockId === BLOCK.BUSH)
    return 'axe';
  if (
    blockId === BLOCK.STONE ||
    blockId === BLOCK.COBBLE ||
    blockId === BLOCK.COAL_ORE ||
    blockId === BLOCK.IRON_ORE ||
    blockId === BLOCK.SANDSTONE
  )
    return 'pick';
  if (blockId === BLOCK.BRICKS || blockId === BLOCK.FURNACE || blockId === BLOCK.CLAY) return 'pick';
  if (blockId === BLOCK.DOOR_CLOSED || blockId === BLOCK.DOOR_OPEN) return 'axe';
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
  if (blockId === BLOCK.IRON_ORE) return BLOCK.IRON_ORE;
  if (blockId === BLOCK.BUSH) return ITEM.BERRIES;
  if (blockId === BLOCK.CROP) return ITEM.WHEAT;
  if (blockId === BLOCK.LEAVES) {
    return null; // handled with rng externally
  }
  if (blockId === BLOCK.CHEST) return BLOCK.CHEST;
  if (blockId === BLOCK.LADDER) return BLOCK.LADDER;
  if (blockId === BLOCK.FENCE) return BLOCK.FENCE;
  if (blockId === BLOCK.SNARE) return BLOCK.SNARE;
  if (blockId === BLOCK.PUMPKIN) return ITEM.PUMPKIN;
  if (blockId === BLOCK.CLAY) return ITEM.CLAY_BALL;
  if (blockId === BLOCK.CLAY_DEEP_ORE) return ITEM.CLAY_BALL;
  if (blockId === BLOCK.DOOR_CLOSED || blockId === BLOCK.DOOR_OPEN) return BLOCK.DOOR_CLOSED;
  if (blockId === BLOCK.GLASS) return BLOCK.GLASS;
  if (blockId === BLOCK.BRICKS) return BLOCK.BRICKS;
  if (blockId === BLOCK.FURNACE) return BLOCK.FURNACE;
  if (blockId === BLOCK.GENERATOR) return BLOCK.GENERATOR;
  if (blockId === BLOCK.ICE_BOX) return BLOCK.ICE_BOX;
  if (blockId === BLOCK.WALL) return BLOCK.WALL;
  if (blockId === BLOCK.WIRE) return BLOCK.WIRE;
  if (blockId === BLOCK.LAMP) return BLOCK.LAMP;
  const d = BLOCK_PROPS[blockId]?.drops;
  if (d === undefined) return blockId;
  return d;
}
