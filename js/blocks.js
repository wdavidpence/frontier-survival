/** Block IDs and properties — data-driven for later content packs */
export const BLOCK = {
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
  PALM_LEAVES: 51,
};

/** @type {Record<number, {
 *  name: string,
 *  solid: boolean,
 *  transparent: boolean,
 *  liquid?: boolean,
 *  hardness: number,
 *  color: [number, number, number],
 *  topColor?: [number, number, number],
 *  drops?: number,
 *  light?: number,
 *  heat?: number,
 *  replaceable?: boolean
 * }>} */
export const BLOCK_PROPS = {
  [BLOCK.AIR]: { name: 'Air', solid: false, transparent: true, hardness: 0, color: [0, 0, 0], replaceable: true },
  [BLOCK.GRASS]: { name: 'Grass', solid: true, transparent: false, hardness: 0.6, color: [0.35, 0.55, 0.22], topColor: [0.33, 0.62, 0.28], drops: BLOCK.DIRT },
  [BLOCK.DIRT]: { name: 'Dirt', solid: true, transparent: false, hardness: 0.5, color: [0.45, 0.32, 0.2], drops: BLOCK.DIRT },
  [BLOCK.STONE]: { name: 'Stone', solid: true, transparent: false, hardness: 1.5, color: [0.55, 0.55, 0.58], drops: BLOCK.COBBLE },
  [BLOCK.SAND]: { name: 'Sand', solid: true, transparent: false, hardness: 0.5, color: [0.86, 0.78, 0.55], drops: BLOCK.SAND },
  [BLOCK.WATER]: { name: 'Water', solid: false, transparent: true, liquid: true, hardness: 100, color: [0.15, 0.35, 0.75], replaceable: true },
  [BLOCK.LOG]: { name: 'Log', solid: true, transparent: false, hardness: 1.0, color: [0.4, 0.28, 0.14], topColor: [0.55, 0.42, 0.25], drops: BLOCK.LOG },
  [BLOCK.LEAVES]: { name: 'Leaves', solid: true, transparent: true, hardness: 0.2, color: [0.25, 0.5, 0.22], drops: BLOCK.LEAVES },
  [BLOCK.PLANKS]: { name: 'Planks', solid: true, transparent: false, hardness: 0.8, color: [0.72, 0.58, 0.35], drops: BLOCK.PLANKS },
  [BLOCK.COBBLE]: { name: 'Cobblestone', solid: true, transparent: false, hardness: 1.4, color: [0.48, 0.48, 0.5], drops: BLOCK.COBBLE },
  [BLOCK.SANDSTONE]: { name: 'Sandstone', solid: true, transparent: false, hardness: 1.0, color: [0.78, 0.7, 0.48], drops: BLOCK.SANDSTONE },
  [BLOCK.SNOW]: { name: 'Snow', solid: true, transparent: false, hardness: 0.2, color: [0.92, 0.94, 0.98], drops: BLOCK.SNOW },
  [BLOCK.ICE]: { name: 'Ice', solid: true, transparent: true, hardness: 0.5, color: [0.65, 0.82, 0.95], drops: BLOCK.ICE },
  [BLOCK.COAL_ORE]: { name: 'Coal Ore', solid: true, transparent: false, hardness: 2.0, color: [0.35, 0.35, 0.38], drops: BLOCK.COAL_ORE },
  [BLOCK.TORCH]: { name: 'Torch', solid: false, transparent: true, hardness: 0.1, color: [1.0, 0.75, 0.25], light: 12, heat: 2, drops: BLOCK.TORCH },
  [BLOCK.CAMPFIRE]: { name: 'Campfire', solid: true, transparent: true, hardness: 0.5, color: [0.55, 0.25, 0.1], light: 14, heat: 18, drops: BLOCK.CAMPFIRE },
  [BLOCK.BEDROCK]: { name: 'Bedrock', solid: true, transparent: false, hardness: 999, color: [0.15, 0.15, 0.18] },
  [BLOCK.BED]: { name: 'Bed', solid: true, transparent: true, hardness: 0.4, color: [0.55, 0.2, 0.25], topColor: [0.7, 0.35, 0.4], drops: BLOCK.BED },
  [BLOCK.IRON_ORE]: { name: 'Iron Ore', solid: true, transparent: false, hardness: 2.4, color: [0.55, 0.48, 0.42], drops: BLOCK.IRON_ORE },
  [BLOCK.BUSH]: { name: 'Berry Bush', solid: false, transparent: true, hardness: 0.15, color: [0.22, 0.48, 0.18], topColor: [0.55, 0.15, 0.2], drops: BLOCK.BUSH },
  [BLOCK.FARMLAND]: { name: 'Farmland', solid: true, transparent: false, hardness: 0.45, color: [0.4, 0.28, 0.16], topColor: [0.35, 0.24, 0.12], drops: BLOCK.DIRT },
  [BLOCK.CROP]: { name: 'Crop', solid: false, transparent: true, hardness: 0.1, color: [0.45, 0.7, 0.25], drops: BLOCK.CROP },
  [BLOCK.CHEST]: { name: 'Chest', solid: true, transparent: true, hardness: 1.0, color: [0.55, 0.35, 0.15], topColor: [0.6, 0.4, 0.18], drops: BLOCK.CHEST },
  [BLOCK.LADDER]: { name: 'Ladder', solid: false, transparent: true, hardness: 0.3, color: [0.55, 0.4, 0.2], drops: BLOCK.LADDER, climbable: true },
  [BLOCK.FENCE]: { name: 'Fence', solid: true, transparent: true, hardness: 0.7, color: [0.6, 0.45, 0.25], drops: BLOCK.FENCE },
  [BLOCK.SNARE]: { name: 'Snare', solid: false, transparent: true, hardness: 0.2, color: [0.5, 0.45, 0.3], drops: BLOCK.SNARE },
  [BLOCK.PUMPKIN]: { name: 'Pumpkin', solid: true, transparent: false, hardness: 0.5, color: [0.9, 0.55, 0.12], topColor: [0.35, 0.55, 0.15], drops: BLOCK.PUMPKIN },
  [BLOCK.DOOR_CLOSED]: { name: 'Door', solid: true, transparent: true, hardness: 0.8, color: [0.62, 0.45, 0.25], door: true, drops: BLOCK.DOOR_CLOSED },
  [BLOCK.DOOR_OPEN]: { name: 'Open Door', solid: false, transparent: true, hardness: 0.8, color: [0.62, 0.45, 0.25], door: true, drops: BLOCK.DOOR_CLOSED },
  [BLOCK.GLASS]: { name: 'Glass', solid: true, transparent: true, hardness: 0.3, color: [0.68, 0.78, 0.9], drops: BLOCK.GLASS },
  [BLOCK.CLAY]: { name: 'Clay', solid: true, transparent: false, hardness: 0.5, color: [0.42, 0.38, 0.3] },
  [BLOCK.BRICKS]: { name: 'Bricks', solid: true, transparent: false, hardness: 1.6, color: [0.7, 0.3, 0.2], drops: BLOCK.BRICKS },
  [BLOCK.FURNACE]: { name: 'Furnace', solid: true, transparent: true, hardness: 1.5, color: [0.28, 0.26, 0.24], heat: 12, light: 8, drops: BLOCK.FURNACE },
  [BLOCK.WIRE]: { name: 'Wire', solid: false, transparent: true, hardness: 0.1, color: [0.65, 0.45, 0.12], drops: BLOCK.WIRE },
  [BLOCK.LAMP]: { name: 'Lamp', solid: true, transparent: false, hardness: 0.6, color: [0.75, 0.82, 0.9], drops: BLOCK.LAMP, light: 0 },
  [BLOCK.GENERATOR]: { name: 'Generator', solid: true, transparent: false, hardness: 1.8, color: [0.35, 0.38, 0.42], drops: BLOCK.GENERATOR, light: 4, heat: 2 },
  [BLOCK.ICE_BOX]: { name: 'Ice Box', solid: true, transparent: true, hardness: 0.8, color: [0.65, 0.82, 0.92], drops: BLOCK.ICE_BOX },
  [BLOCK.WALL]: { name: 'Cobble Wall', solid: true, transparent: true, hardness: 1.5, color: [0.5, 0.5, 0.52], drops: BLOCK.WALL },
  [BLOCK.LAVA]: { name: 'Lava', solid: false, transparent: true, liquid: true, hardness: 100, color: [0.95, 0.35, 0.05], light: 15, heat: 25, replaceable: true },
  [BLOCK.CLAY_DEEP_ORE]: { name: 'Deep Clay Ore', solid: true, transparent: false, hardness: 1.8, color: [0.32, 0.28, 0.25], drops: BLOCK.CLAY_DEEP_ORE },
  [BLOCK.SULFUR_ORE]: { name: 'Sulfur Ore', solid: true, transparent: false, hardness: 1.6, color: [0.72, 0.68, 0.28], drops: BLOCK.SULFUR_ORE },
  [BLOCK.OIL_SEEP]: { name: 'Oil Seep', solid: true, transparent: false, hardness: 1.2, color: [0.18, 0.16, 0.14], drops: BLOCK.OIL_SEEP },
  [BLOCK.SPRUCE_LOG]: { name: 'Spruce Log', solid: true, transparent: false, hardness: 1.0, color: [0.28, 0.18, 0.09], topColor: [0.38, 0.26, 0.14], drops: BLOCK.SPRUCE_LOG },
  [BLOCK.SPRUCE_LEAVES]: { name: 'Spruce Leaves', solid: true, transparent: true, hardness: 0.2, color: [0.15, 0.38, 0.18], drops: BLOCK.SPRUCE_LEAVES },
  [BLOCK.SEQUOIA_LOG]: { name: 'Sequoia Log', solid: true, transparent: false, hardness: 1.2, color: [0.42, 0.22, 0.1], topColor: [0.52, 0.35, 0.18], drops: BLOCK.SEQUOIA_LOG },
  [BLOCK.SEQUOIA_LEAVES]: { name: 'Sequoia Leaves', solid: true, transparent: true, hardness: 0.2, color: [0.18, 0.45, 0.15], drops: BLOCK.SEQUOIA_LEAVES },
  [BLOCK.STAIRS_WOOD]: { name: 'Wood Stairs', solid: true, transparent: false, hardness: 0.8, color: [0.72, 0.58, 0.35], drops: BLOCK.STAIRS_WOOD },
  [BLOCK.SLAB_WOOD]: { name: 'Wood Slab', solid: true, transparent: false, hardness: 0.8, color: [0.72, 0.58, 0.35], drops: BLOCK.SLAB_WOOD },
  [BLOCK.CORAL]: { name: 'Coral', solid: true, transparent: false, hardness: 0.8, color: [0.92, 0.38, 0.42], drops: BLOCK.CORAL },
  [BLOCK.KELP]: { name: 'Kelp', solid: false, transparent: true, hardness: 0.1, color: [0.08, 0.38, 0.2], drops: BLOCK.KELP, replaceable: true },
  [BLOCK.SEAGRASS]: { name: 'Seagrass', solid: false, transparent: true, hardness: 0.1, color: [0.12, 0.55, 0.28], drops: BLOCK.SEAGRASS, replaceable: true },
  [BLOCK.PALM_LEAVES]: { name: 'Palm Leaves', solid: true, transparent: true, hardness: 0.2, color: [0.28, 0.58, 0.2], drops: BLOCK.PALM_LEAVES },
};

export function isSolid(id) {
  return !!(BLOCK_PROPS[id] && BLOCK_PROPS[id].solid);
}

export function isTransparent(id) {
  const p = BLOCK_PROPS[id];
  return !p || p.transparent || id === BLOCK.AIR;
}

export function getColor(id, face) {
  const p = BLOCK_PROPS[id] || BLOCK_PROPS[BLOCK.STONE];
  if (face === 'top' && p.topColor) return p.topColor;
  return p.color;
}

export function getHardness(id) {
  return (BLOCK_PROPS[id] && BLOCK_PROPS[id].hardness) || 1;
}

export function getDrop(id) {
  const p = BLOCK_PROPS[id];
  if (!p) return BLOCK.AIR;
  if (p.drops === undefined) return id;
  return p.drops;
}

export function getHeat(id) {
  return (BLOCK_PROPS[id] && BLOCK_PROPS[id].heat) || 0;
}

export function getLight(id) {
  return (BLOCK_PROPS[id] && BLOCK_PROPS[id].light) || 0;
}

export const HOTBAR_DEFAULT = [
  BLOCK.GRASS,
  BLOCK.DIRT,
  BLOCK.STONE,
  BLOCK.LOG,
  BLOCK.PLANKS,
  BLOCK.COBBLE,
  BLOCK.TORCH,
  BLOCK.CAMPFIRE,
  BLOCK.SAND,
];
