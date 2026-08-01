/**
 * Pure smelting/furnace data — no game state, no side effects.
 *
 * Defines:
 *  - SMOKE_RECIPES: input id -> { output, count } for furnace smelting
 *  - FUEL_VALUES: item/block id -> burn duration (in arbitrary ticks; higher = longer)
 *
 * Uses existing BLOCK/ITEM IDs from blocks.js and items.js.
 */
import { BLOCK } from './blocks.js?v=220';
import { ITEM } from './items.js?v=220';

/**
 * @typedef {{ input: number, output: number, count?: number }} SmeltRecipe
 */

/**
 * Ore -> ingot / raw material smelting recipes.
 * Input id is the block or item placed in the furnace; output is what comes out.
 * Mirrors recipes already defined in crafting.js (smelt_iron, glass, brick_smelt, charcoal).
 */
/** @type {SmeltRecipe[]} */
export const SMELT_RECIPES = [
  // Ore smelting
  { input: BLOCK.IRON_ORE, output: ITEM.IRON_INGOT, count: 1 },
  // Material smelting (sand -> glass, clay -> brick)
  { input: BLOCK.SAND, output: BLOCK.GLASS, count: 1 },
  { input: ITEM.CLAY_BALL, output: ITEM.BRICK, count: 1 },
  // Charcoal production (log -> charcoal)
  { input: BLOCK.LOG, output: ITEM.CHARCOAL, count: 2 },
  { input: BLOCK.SPRUCE_LOG, output: ITEM.CHARCOAL, count: 2 },
  { input: BLOCK.SEQUOIA_LOG, output: ITEM.CHARCOAL, count: 2 },
];

/**
 * Fuel burn durations (arbitrary time units).
 * Higher = burns longer. 1 unit ~= 1 item smelted.
 * Coal/charcoal are the best fuels; wood is basic.
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

/** Look up smelt output for a given input id. Returns null if not smeltable. */
/** @param {number} inputId */
export function findSmeltRecipe(inputId) {
  for (const r of SMELT_RECIPES) {
    if (r.input === inputId) return r;
  }
  return null;
}

/** Check whether an item id is a valid fuel. */
/** @param {number} itemId */
export function isFuel(itemId) {
  return itemId in FUEL_VALUES;
}

/** Get burn duration for a fuel id. Returns 0 if not a fuel. */
/** @param {number} itemId */
export function getFuelBurnTime(itemId) {
  return FUEL_VALUES[itemId] || 0;
}

/** Get all fuel item ids. */
export const FUEL_IDS = Object.keys(FUEL_VALUES).map(Number);

/** Get all smeltable input ids. */
export const SMELTABLE_IDS = SMELT_RECIPES.map((r) => r.input);

// Compatibility helpers (additive) used by smoke + future furnace UI.
export function fuelValue(itemId) {
  return getFuelBurnTime(itemId);
}

export function smeltRecipe(inputId) {
  const r = findSmeltRecipe(inputId);
  if (!r) return null;
  return {
    output: r.output,
    count: r.count ?? 1,
    fuelCost: 20,
  };
}

export function canSmelt(inputId) {
  return findSmeltRecipe(inputId) != null;
}

export function canAffordSmelt(inputId, fuelUnits) {
  const r = smeltRecipe(inputId);
  if (!r) return false;
  return (fuelUnits | 0) >= (r.fuelCost | 0);
}

export function listSmeltRecipes() {
  return SMELT_RECIPES.map((r) => ({
    input: r.input,
    output: r.output,
    count: r.count ?? 1,
    fuelCost: 20,
  }));
}

/** Documented integration gaps (not blockers for pure module). */
export const SMELTING_GAPS = [
  'Furnace block UI tick not wired to these tables',
  'SULFUR_ORE has no ingot output yet',
  'Co-op: furnace opener must bind acting player inventory',
];

