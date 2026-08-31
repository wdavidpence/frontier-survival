/**
 * Unified item/block IDs for inventory stacks.
 * Blocks: 0–99 (see blocks.js). Items: 100+.
 */
import { BLOCK, BLOCK_PROPS } from './blocks.js?v=298';

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
  COCONUT: 148,
  PALM_FROND: 158,
  FISH_BAIT: 159,
  TROPICAL_FISH: 160,
  COOKED_TROPICAL_FISH: 161,
  RAW_CRAB: 162,
  COOKED_CRAB: 163,
  FLOTATION: 164,
  CANTEEN: 165,
  EMPTY_CANTEEN: 166,
  BAMBOO: 167,
  PLANT_FIBER: 168,
  WILDFLOWER: 169,
  WOOL: 170,
  SHEARS: 171,
  YUCA: 172,
  COOKED_YUCA: 173,
  YAUTIA: 174,
  COOKED_YAUTIA: 175,
  NYAME: 176,
  COOKED_NYAME: 177,
  BATATA: 178,
  COOKED_BATATA: 179,
  HONEY: 180,
  HONEYCOMB: 181,
  BEESWAX: 182,
  WOOD_HOE: 149,
  STONE_HOE: 150,
  IRON_HOE: 151,
  WOOD_SPADE: 152,
  STONE_SPADE: 153,
  IRON_SPADE: 154,
  WOOD_MASON: 155,
  STONE_MASON: 156,
  IRON_MASON: 157,
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
 *  tool?: 'pick'|'axe'|'hoe'|'spade'|'mason'|'hand'|'weapon'|'bow'|'shield'|'rod',
 *  mineMult?: number,
 *  workMult?: number,
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
    eatDamage: 2,
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
  [ITEM.WOOD_HOE]: { name: 'Wood Hoe', color: [0.65, 0.5, 0.28], tool: 'hoe', mineMult: 2.3, workMult: 2.3, maxStack: 1 },
  [ITEM.STONE_HOE]: { name: 'Stone Hoe', color: [0.55, 0.55, 0.58], tool: 'hoe', mineMult: 3.45, workMult: 3.45, maxStack: 1 },
  [ITEM.IRON_HOE]: { name: 'Iron Hoe', color: [0.72, 0.74, 0.8], tool: 'hoe', mineMult: 5.1, workMult: 5.1, maxStack: 1 },
  [ITEM.WOOD_SPADE]: { name: 'Wood Spade', color: [0.65, 0.5, 0.28], tool: 'spade', mineMult: 2.3, workMult: 2.3, maxStack: 1 },
  [ITEM.STONE_SPADE]: { name: 'Stone Spade', color: [0.55, 0.55, 0.58], tool: 'spade', mineMult: 3.45, workMult: 3.45, maxStack: 1 },
  [ITEM.IRON_SPADE]: { name: 'Iron Spade', color: [0.72, 0.74, 0.8], tool: 'spade', mineMult: 5.1, workMult: 5.1, maxStack: 1 },
  [ITEM.WOOD_MASON]: { name: 'Wood Mason Tool', color: [0.65, 0.5, 0.28], tool: 'mason', mineMult: 2.3, workMult: 2.3, maxStack: 1 },
  [ITEM.STONE_MASON]: { name: 'Stone Mason Tool', color: [0.55, 0.55, 0.58], tool: 'mason', mineMult: 3.45, workMult: 3.45, maxStack: 1 },
  [ITEM.IRON_MASON]: { name: 'Iron Mason Tool', color: [0.72, 0.74, 0.8], tool: 'mason', mineMult: 5.1, workMult: 5.1, maxStack: 1 },
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
    eatDamage: 5,
    maxStack: 16,
  },
  [ITEM.BOAT]: { name: 'Boat', color: [0.55, 0.4, 0.22], maxStack: 1 },
  [ITEM.FISHING_ROD]: { name: 'Fishing Rod', color: [0.5, 0.4, 0.25], tool: 'rod', maxStack: 1, durability: 80 },
  [ITEM.RAW_FISH]: {
    name: 'Raw Fish',
    color: [0.55, 0.7, 0.85],
    edible: 12,
    eatDamage: 1,
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
  [ITEM.COCONUT]: { name: 'Coconut', color: [0.38, 0.24, 0.12], edible: 24, maxStack: 16 },
  [ITEM.PALM_FROND]: { name: 'Palm Frond', color: [0.2, 0.58, 0.24], maxStack: 32 },
  [ITEM.FISH_BAIT]: { name: 'Fish Bait', color: [0.62, 0.42, 0.2], maxStack: 32 },
  [ITEM.TROPICAL_FISH]: {
    name: 'Tropical Fish', color: [0.95, 0.35, 0.12], edible: 10, eatDamage: 1,
    cookable: ITEM.COOKED_TROPICAL_FISH, maxStack: 16,
  },
  [ITEM.COOKED_TROPICAL_FISH]: { name: 'Cooked Tropical Fish', color: [0.95, 0.58, 0.22], edible: 28, maxStack: 16 },
  [ITEM.RAW_CRAB]: {
    name: 'Raw Crab', color: [0.82, 0.22, 0.12], edible: 8, eatDamage: 1,
    cookable: ITEM.COOKED_CRAB, maxStack: 16,
  },
  [ITEM.COOKED_CRAB]: { name: 'Cooked Crab', color: [0.92, 0.42, 0.18], edible: 26, maxStack: 16 },
  [ITEM.FLOTATION]: { name: 'Coconut-Fiber Float', color: [0.72, 0.58, 0.32], maxStack: 1, flotation: true },
  [ITEM.CANTEEN]: { name: 'Fresh Water Canteen', color: [0.20, 0.48, 0.82], maxStack: 1, drinkable: 58, drinkStamina: 18 },
  [ITEM.EMPTY_CANTEEN]: { name: 'Empty Canteen', color: [0.28, 0.34, 0.42], maxStack: 1, refillable: true },
  [ITEM.BAMBOO]: { name: 'Bamboo', color: [0.42, 0.72, 0.25], maxStack: 64, placeable: true, placeAs: BLOCK.BAMBOO },
  [ITEM.PLANT_FIBER]: { name: 'Plant Fiber', color: [0.35, 0.68, 0.28], maxStack: 64 },
  [ITEM.WILDFLOWER]: { name: 'Wildflower', color: [0.92, 0.55, 0.72], maxStack: 64, placeable: true },
  [ITEM.WOOL]: { name: 'Wool', color: [0.88, 0.86, 0.78], maxStack: 32 },
  [ITEM.SHEARS]: { name: 'Shears', color: [0.72, 0.76, 0.84], tool: 'hand', maxStack: 1, durability: 80 },
  [ITEM.YUCA]: { name: 'Yuca (Cassava)', color: [0.78, 0.64, 0.42], edible: 16, eatDamage: 1, cookable: ITEM.COOKED_YUCA, maxStack: 16 },
  [ITEM.COOKED_YUCA]: { name: 'Cooked Yuca', color: [0.92, 0.78, 0.50], edible: 34, maxStack: 16 },
  [ITEM.YAUTIA]: { name: 'Yautia (Malanga)', color: [0.68, 0.54, 0.42], edible: 17, eatDamage: 1, cookable: ITEM.COOKED_YAUTIA, maxStack: 16 },
  [ITEM.COOKED_YAUTIA]: { name: 'Cooked Yautia', color: [0.82, 0.68, 0.52], edible: 35, maxStack: 16 },
  [ITEM.NYAME]: { name: 'Ñame (Yam)', color: [0.72, 0.55, 0.32], edible: 18, eatDamage: 1, cookable: ITEM.COOKED_NYAME, maxStack: 16 },
  [ITEM.COOKED_NYAME]: { name: 'Cooked Ñame', color: [0.88, 0.70, 0.40], edible: 36, maxStack: 16 },
  [ITEM.BATATA]: { name: 'Batata (Sweet Potato)', color: [0.76, 0.34, 0.22], edible: 20, cookable: ITEM.COOKED_BATATA, maxStack: 16 },
  [ITEM.COOKED_BATATA]: { name: 'Cooked Batata', color: [0.94, 0.48, 0.26], edible: 38, maxStack: 16 },
  [ITEM.HONEY]: { name: 'Wild Honey', color: [1.0, 0.66, 0.12], edible: 24, heal: 5, maxStack: 16 },
  [ITEM.HONEYCOMB]: { name: 'Honeycomb', color: [1.0, 0.76, 0.18], maxStack: 32 },
  [ITEM.BEESWAX]: { name: 'Beeswax', color: [1.0, 0.84, 0.42], maxStack: 32 },
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
  if (blockId === BLOCK.LOG || blockId === BLOCK.PLANKS || blockId === BLOCK.LEAVES || blockId === BLOCK.PALM_LEAVES || blockId === BLOCK.BUSH)
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
  // Wood blocks are deliberately slow by hand (or with the wrong tool), so
  // the matching axe has a clear gameplay payoff without changing other
  // block/tool relationships.
  if (need === 'axe' && p?.tool !== 'axe') return 0.15;
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
  if (blockId === BLOCK.LEAVES || blockId === BLOCK.PALM_LEAVES) {
    return null; // handled with rng externally
  }
  if (blockId === BLOCK.CHEST) return BLOCK.CHEST;
  if (blockId === BLOCK.LADDER) return BLOCK.LADDER;
  if (blockId === BLOCK.FENCE) return BLOCK.FENCE;
  if (blockId === BLOCK.SNARE) return BLOCK.SNARE;
  if (blockId === BLOCK.PUMPKIN) return ITEM.PUMPKIN;
  if (blockId === BLOCK.BATATA_TUBER) return ITEM.BATATA;
  if (blockId === BLOCK.CASSAVA_TUBER) return ITEM.YUCA;
  if (blockId === BLOCK.YAUTIA_CORM) return ITEM.YAUTIA;
  if (blockId === BLOCK.YAM_TUBER) return ITEM.NYAME;
  if (blockId === BLOCK.BROMELIAD || blockId === BLOCK.HELICONIA || blockId === BLOCK.TARO || blockId === BLOCK.PANDANUS || blockId === BLOCK.PNEUMATOPHORE || blockId === BLOCK.BANYAN_ROOTS) return ITEM.PLANT_FIBER;
  if (blockId === BLOCK.COCONUT) return ITEM.COCONUT;
  if (blockId === BLOCK.BAMBOO) return ITEM.BAMBOO;
  if (blockId === BLOCK.WILDFLOWER) return ITEM.WILDFLOWER;
  if (blockId === BLOCK.FERN || blockId === BLOCK.LILY_PAD) return ITEM.PLANT_FIBER;
  if (blockId === BLOCK.VINES || blockId === BLOCK.TALL_GRASS || blockId === BLOCK.SEAGRASS || blockId === BLOCK.KELP) return ITEM.PLANT_FIBER;
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
