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
