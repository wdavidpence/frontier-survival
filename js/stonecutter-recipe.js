/**
 * Pure stonecutter variant picks (MC-breadth).
 */

/** @type {Record<string, string[]>} input block name -> output variant names */
export const STONECUTTER_RECIPES = {
  stone: ['stone_stairs', 'stone_slab', 'stone_bricks'],
  cobble: ['cobble_stairs', 'cobble_slab', 'cobble_wall'],
  sandstone: ['sandstone_stairs', 'sandstone_slab', 'cut_sandstone'],
  planks: ['wood_stairs', 'wood_slab'],
  bricks: ['brick_stairs', 'brick_slab', 'brick_wall'],
};

/**
 * List outputs for an input name (case-insensitive key).
 * @param {string} inputName
 * @returns {string[]}
 */
export function stonecutterOutputs(inputName) {
  const k = String(inputName || '').toLowerCase();
  // fuzzy key match
  for (const key of Object.keys(STONECUTTER_RECIPES)) {
    if (k.includes(key) || key.includes(k)) return STONECUTTER_RECIPES[key].slice();
  }
  return [];
}

/**
 * Whether input has any stonecutter recipes.
 */
export function canStonecut(inputName) {
  return stonecutterOutputs(inputName).length > 0;
}

/**
 * Pick output by index.
 * @param {string} inputName
 * @param {number} index
 * @returns {string|null}
 */
export function stonecutterPick(inputName, index) {
  const outs = stonecutterOutputs(inputName);
  if (!outs.length) return null;
  const i = Math.max(0, Math.min(outs.length - 1, index | 0));
  return outs[i];
}

export function stonecutterRecipeCount(inputName) {
  return stonecutterOutputs(inputName).length;
}
