/**
 * Pure smelting/furnace data — no game state, no side effects.
 *
 * Defines:
 *  - SMELT_RECIPES: input id -> { output, count, fuelCost } for furnace smelting
 *  - FUEL_VALUES: item/block id -> burn duration (arbitrary ticks)
 *  - SMELTING_GAPS: documented missing block IDs for follow-up work
 *
 * Uses existing BLOCK/ITEM IDs from blocks.js and items.js.
 */
import { BLOCK } from './blocks.js?v=240';
import { ITEM } from './items.js?v=240';

/**
 * @typedef {{ input: number, output: number, count: number, fuelCost: number }} SmeltRecipe
 */

/**
 * Ore -> ingot / raw material smelting recipes.
 * Each recipe needs fuelCost units of burn time to complete.
 * Mirrors the heat-requiring recipes already in crafting.js:
 *   smelt_iron (BLOCK.IRON_ORE -> ITEM.IRON_INGOT)
 *   glass     (BLOCK.SAND -> BLOCK.GLASS)
 *   brick_smelt (ITEM.CLAY_BALL -> ITEM.BRICK)
 *   charcoal  (BLOCK.LOG -> ITEM.CHARCOAL x2)
 */
/** @type {SmeltRecipe[]} */
const SMELT_RECIPES = [
  // Ore smelting — iron ore to ingot (needs stone-tier or better)
  { input: BLOCK.IRON_ORE, output: ITEM.IRON_INGOT, count: 1, fuelCost: 8 },
  // Material smelting — sand to glass
  { input: BLOCK.SAND, output: BLOCK.GLASS, count: 1, fuelCost: 4 },
  // Material smelting — clay ball to brick
  { input: ITEM.CLAY_BALL, output: ITEM.BRICK, count: 1, fuelCost: 4 },
  // Charcoal production — logs to charcoal
  { input: BLOCK.LOG, output: ITEM.CHARCOAL, count: 2, fuelCost: 6 },
  { input: BLOCK.SPRUCE_LOG, output: ITEM.CHARCOAL, count: 2, fuelCost: 6 },
  { input: BLOCK.SEQUOIA_LOG, output: ITEM.CHARCOAL, count: 2, fuelCost: 7 },
  // Food cooking — smoker consumes these at 2x speed; furnace remains a fallback.
  { input: ITEM.RAW_MEAT, output: ITEM.COOKED_MEAT, count: 1, fuelCost: 8 },
  { input: ITEM.RAW_FISH, output: ITEM.COOKED_FISH, count: 1, fuelCost: 8 },
];

/**
 * Fuel burn durations (arbitrary time units).
 * Higher value = burns longer. 1 unit ~= 0.5 items smelted.
 * Coal is the best fuel; wood/planks are basic alternatives.
 */
/** @type {Record<number, number>} */
export const FUEL_VALUES = {
  [ITEM.COAL]: 80,
  [ITEM.CHARCOAL]: 60,
  [BLOCK.LOG]: 30,
  [BLOCK.SPRUCE_LOG]: 30,
  [BLOCK.SEQUOIA_LOG]: 35,
  [BLOCK.PLANKS]: 15,
};

/**
 * Documented integration gaps — block IDs that exist but lack smelting recipes.
 * These are real blocks in blocks.js with no corresponding ore->ingot path yet.
 */
export const SMELTING_GAPS = [
  { blockId: BLOCK.SULFUR_ORE, note: 'Sulfur Ore (40) — no smelt recipe or output item yet' },
  { blockId: BLOCK.CLAY_DEEP_ORE, note: 'Deep Clay Ore (39) — drops clay but no smelt recipe needed; brick recipe covers it' },
  { blockId: BLOCK.OIL_SEEP, note: 'Oil Seep (41) — no smelt recipe or refined output item yet' },
  // Future Minecraft-breadth gaps (blocks not yet in blocks.js):
  // GOLD_ORE -> GOLD_INGOT, COPPER_ORE -> COPPER_INGOT, RAW_IRON -> IRON_INGOT
  // LAPIS_ORE -> LAPIS_LAZULI, REDSTONE_ORE -> REDSTONE
];

/** Get burn time for a fuel id. Returns 0 if not a valid fuel. */
export function fuelValue(itemId) {
  return FUEL_VALUES[itemId] || 0;
}

/** Check whether an item id is a valid furnace fuel. */
export function isFuel(itemId) {
  return itemId in FUEL_VALUES;
}

/** Check whether an input id has a smelting recipe. */
export function canSmelt(inputId) {
  return SMELT_RECIPES.some((r) => r.input === inputId);
}

/** Look up smelt recipe for a given input id. Returns null if not smeltable. */
export function smeltRecipe(inputId) {
  return SMELT_RECIPES.find((r) => r.input === inputId) || null;
}

/**
 * Check whether you have enough fuel to smelt one unit of the given input.
 * @param {number} inputId - The item/block to smelt.
 * @param {number} fuelAvailable - Burn time available from current fuel source.
 */
export function canAffordSmelt(inputId, fuelAvailable) {
  const recipe = smeltRecipe(inputId);
  if (!recipe) return false;
  return fuelAvailable >= recipe.fuelCost;
}

/** Return a copy of all smelting recipes. */
export function listSmeltRecipes() {
  return SMELT_RECIPES.map((r) => ({ ...r }));
}
