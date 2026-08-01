/**
 * Pure furnace tick state machine (MC-breadth). Uses smelting.js tables.
 * No game/world UI — integrate later via game.js sole owner.
 */
import {
  fuelValue,
  smeltRecipe,
  canSmelt,
} from './smelting.js?v=220';

/**
 * @typedef {{
 *   fuelId: number|null,
 *   fuelUnits: number,
 *   inputId: number|null,
 *   inputCount: number,
 *   outputId: number|null,
 *   outputCount: number,
 *   progress: number,
 *   cookTime: number,
 * }} FurnaceState
 */

export function createFurnaceState() {
  return {
    fuelId: null,
    fuelUnits: 0,
    inputId: null,
    inputCount: 0,
    outputId: null,
    outputCount: 0,
    progress: 0,
    cookTime: 20,
  };
}

/** Insert fuel stack; returns leftover count. */
export function insertFuel(state, itemId, count = 1) {
  const s = state;
  const n = Math.max(0, count | 0);
  if (n <= 0) return 0;
  const burn = fuelValue(itemId);
  if (burn <= 0) return n;
  if (s.fuelId != null && s.fuelId !== itemId && s.fuelUnits > 0) return n;
  s.fuelId = itemId;
  s.fuelUnits += burn * n;
  return 0;
}

/** Insert smeltable input; returns leftover count. */
export function insertInput(state, itemId, count = 1) {
  const s = state;
  const n = Math.max(0, count | 0);
  if (n <= 0) return 0;
  if (!canSmelt(itemId)) return n;
  if (s.inputId != null && s.inputId !== itemId && s.inputCount > 0) return n;
  s.inputId = itemId;
  s.inputCount += n;
  return 0;
}

/**
 * Advance furnace by dt-like units (1 unit ~= 1 fuel unit / cook step).
 * @param {FurnaceState} state
 * @param {number} units
 * @param {number} [speedMult=1] cook speed (smoker/blast use 2)
 */
export function tickFurnace(state, units = 1, speedMult = 1) {
  const s = state;
  let left = Math.max(0, Number(units) || 0);
  const mult = Math.max(0.01, Number(speedMult) || 1);
  while (left > 0) {
    if (s.inputCount <= 0 || s.inputId == null) {
      s.progress = 0;
      break;
    }
    const recipe = smeltRecipe(s.inputId);
    if (!recipe) {
      s.progress = 0;
      break;
    }
    if (s.fuelUnits <= 0) {
      s.progress = 0;
      break;
    }
    // If output occupied by different item, stall
    if (s.outputId != null && s.outputCount > 0 && s.outputId !== recipe.output) {
      break;
    }
    const step = Math.min(left, 1);
    s.fuelUnits = Math.max(0, s.fuelUnits - step);
    s.progress += step * mult;
    left -= step;
    const need = recipe.fuelCost || s.cookTime || 20;
    if (s.progress >= need) {
      s.progress = 0;
      s.inputCount -= 1;
      if (s.inputCount <= 0) s.inputId = null;
      s.outputId = recipe.output;
      s.outputCount += recipe.count || 1;
    }
  }
  if (s.fuelUnits <= 0) s.fuelId = null;
  return s;
}

/** Take all output; returns { id, count } or null. */
export function takeOutput(state) {
  const s = state;
  if (!s.outputId || s.outputCount <= 0) return null;
  const out = { id: s.outputId, count: s.outputCount };
  s.outputId = null;
  s.outputCount = 0;
  return out;
}
