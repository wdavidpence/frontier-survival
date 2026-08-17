/**
 * Pure timing contract for block harvesting.
 *
 * Values are time multipliers relative to breaking a log by hand. A lower
 * result means a faster harvest. Unknown IDs return null from every lookup.
 */

export const BLOCK_CLASS = Object.freeze({
  LOG: 'log',
  DIRT: 'dirt',
  SAND: 'sand',
  STONE: 'stone',
  COAL_ORE: 'coal_ore',
  METAL_ORE: 'metal_ore',
});

export const BLOCK_CLASSES = Object.freeze(Object.values(BLOCK_CLASS));

/** Stable non-mining work seams. Keep these string IDs save/worker friendly. */
export const WORK_CLASS = Object.freeze({
  FARMING: 'farming',
  PREP: 'prep',
  WOODWORKING: 'woodworking',
  MASONRY: 'masonry',
});

export const WORK_CLASSES = Object.freeze(Object.values(WORK_CLASS));

export const TOOL_TIER = Object.freeze({
  HAND: 'hand',
  WOOD: 'wood',
  STONE: 'stone',
  COPPER: 'copper',
  IRON: 'iron',
  STEEL: 'steel',
  DIAMOND: 'diamond',
});

export const TOOL_TIERS = Object.freeze(Object.values(TOOL_TIER));

export const BARE_HAND_TIME_MULTIPLIERS = Object.freeze({
  [BLOCK_CLASS.LOG]: 1,
  [BLOCK_CLASS.DIRT]: 2 / 3,
  [BLOCK_CLASS.SAND]: 2 / 3,
  [BLOCK_CLASS.STONE]: 2,
  [BLOCK_CLASS.COAL_ORE]: 2,
  [BLOCK_CLASS.METAL_ORE]: 4,
});

export const TOOL_TIME_MULTIPLIERS = Object.freeze({
  [TOOL_TIER.HAND]: 1,
  [TOOL_TIER.WOOD]: 0.9,
  [TOOL_TIER.STONE]: 0.8,
  [TOOL_TIER.COPPER]: 0.7,
  [TOOL_TIER.IRON]: 0.6,
  [TOOL_TIER.STEEL]: 0.5,
  [TOOL_TIER.DIAMOND]: 0.4,
});

const REQUIRED_TOOL_BY_WORK = Object.freeze({
  [WORK_CLASS.FARMING]: 'hoe',
  [WORK_CLASS.PREP]: 'spade',
  [WORK_CLASS.WOODWORKING]: 'axe',
  [WORK_CLASS.MASONRY]: 'mason',
  // Legacy mining classes remain explicit so adapters can preserve old timing.
  [BLOCK_CLASS.LOG]: 'axe',
  [BLOCK_CLASS.DIRT]: 'spade',
  [BLOCK_CLASS.SAND]: 'spade',
  [BLOCK_CLASS.STONE]: 'pick',
  [BLOCK_CLASS.COAL_ORE]: 'pick',
  [BLOCK_CLASS.METAL_ORE]: 'pick',
});

function lookup(table, id) {
  if (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(table, id)) return null;
  return table[id];
}

export function bareHandTimeMultiplier(blockClass) {
  return lookup(BARE_HAND_TIME_MULTIPLIERS, blockClass);
}

export function toolTimeMultiplier(toolTier) {
  return lookup(TOOL_TIME_MULTIPLIERS, toolTier);
}

/** Return the stable held-tool category required by a work seam. */
export function requiredToolForWork(workClass) {
  return lookup(REQUIRED_TOOL_BY_WORK, workClass);
}

/**
 * Return the deterministic tier speed for a supported work seam.
 * Work classes intentionally share the existing mining tier ratios; the
 * mine-tier adapter is responsible for checking the held tool category.
 */
export function workTimeMultiplier(workClass, toolTier) {
  if (!WORK_CLASSES.includes(workClass)) return null;
  return toolTimeMultiplier(toolTier);
}

export function harvestTimeMultiplier(blockClass, toolTier) {
  const blockTime = bareHandTimeMultiplier(blockClass);
  const toolTime = toolTimeMultiplier(toolTier);
  if (blockTime === null || toolTime === null) return null;
  return blockTime * toolTime;
}

/**
 * Compare two tools on one block class.
 * Returns first-tool time divided by second-tool time, or null for bad IDs.
 */
export function compareHarvestTimes(blockClass, firstToolTier, secondToolTier) {
  const firstTime = harvestTimeMultiplier(blockClass, firstToolTier);
  const secondTime = harvestTimeMultiplier(blockClass, secondToolTier);
  if (firstTime === null || secondTime === null) return null;
  return firstTime / secondTime;
}
