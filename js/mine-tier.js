/**
 * Pure mine-tier helper wrapping tool-tiers for harvest checks / speed.
 * Additive — does not change game mine path until a wire card imports it.
 */
import { BLOCK } from './blocks.js?v=289';
import {
  BLOCK_CLASS,
  WORK_CLASS,
  TOOL_TIER,
  harvestTimeMultiplier,
  bareHandTimeMultiplier,
  requiredToolForWork,
  workTimeMultiplier,
} from './harvest-balance.js?v=3';
import { propsOf } from './items.js?v=248';
import { tierForItem, HARVEST_LEVEL, speedForItem, tierMeetsRequirement } from './tool-tiers.js?v=222';
import { oreDropEntry, primaryOreDropId } from './ore-drops.js?v=220';

const HARVEST_CLASS_BY_BLOCK = new Map([
  [BLOCK.LOG, BLOCK_CLASS.LOG],
  [BLOCK.SPRUCE_LOG, BLOCK_CLASS.LOG],
  [BLOCK.SEQUOIA_LOG, BLOCK_CLASS.LOG],
  [BLOCK.PLANKS, BLOCK_CLASS.LOG],
  [BLOCK.STAIRS_WOOD, BLOCK_CLASS.LOG],
  [BLOCK.SLAB_WOOD, BLOCK_CLASS.LOG],
  [BLOCK.DIRT, BLOCK_CLASS.DIRT],
  [BLOCK.GRASS, BLOCK_CLASS.DIRT],
  [BLOCK.FARMLAND, BLOCK_CLASS.DIRT],
  [BLOCK.DAMP_SOIL, BLOCK_CLASS.DIRT],
  [BLOCK.SAND, BLOCK_CLASS.SAND],
  [BLOCK.STONE, BLOCK_CLASS.STONE],
  [BLOCK.COBBLE, BLOCK_CLASS.STONE],
  [BLOCK.SANDSTONE, BLOCK_CLASS.STONE],
  [BLOCK.BRICKS, BLOCK_CLASS.STONE],
  [BLOCK.WALL, BLOCK_CLASS.STONE],
  [BLOCK.COAL_ORE, BLOCK_CLASS.COAL_ORE],
  [BLOCK.IRON_ORE, BLOCK_CLASS.METAL_ORE],
  [BLOCK.CLAY_DEEP_ORE, BLOCK_CLASS.METAL_ORE],
  [BLOCK.SULFUR_ORE, BLOCK_CLASS.METAL_ORE],
  [BLOCK.OIL_SEEP, BLOCK_CLASS.METAL_ORE],
]);

/** Current player-visible work seams; mining classes stay legacy strings. */
const WORK_CLASS_BY_BLOCK = new Map([
  [BLOCK.CROP, WORK_CLASS.FARMING],
  [BLOCK.FARMLAND, WORK_CLASS.FARMING],
  [BLOCK.DIRT, WORK_CLASS.PREP],
  [BLOCK.GRASS, WORK_CLASS.PREP],
  [BLOCK.SAND, WORK_CLASS.PREP],
  [BLOCK.CLAY, WORK_CLASS.PREP],
  [BLOCK.DAMP_SOIL, WORK_CLASS.PREP],
  [BLOCK.LOG, WORK_CLASS.WOODWORKING],
  [BLOCK.SPRUCE_LOG, WORK_CLASS.WOODWORKING],
  [BLOCK.SEQUOIA_LOG, WORK_CLASS.WOODWORKING],
  [BLOCK.PLANKS, WORK_CLASS.WOODWORKING],
  [BLOCK.STAIRS_WOOD, WORK_CLASS.WOODWORKING],
  [BLOCK.SLAB_WOOD, WORK_CLASS.WOODWORKING],
  [BLOCK.LEAVES, WORK_CLASS.WOODWORKING],
  [BLOCK.ROOTS, WORK_CLASS.WOODWORKING],
  [BLOCK.STICK_PILE, WORK_CLASS.WOODWORKING],
  [BLOCK.SPRUCE_LEAVES, WORK_CLASS.WOODWORKING],
  [BLOCK.SEQUOIA_LEAVES, WORK_CLASS.WOODWORKING],
  [BLOCK.PALM_LEAVES, WORK_CLASS.WOODWORKING],
  // Natural stone families retain pick priority. Masonry priority applies to
  // authored brick/wall construction blocks where provenance is explicit.
  [BLOCK.STONE, BLOCK_CLASS.STONE],
  [BLOCK.COBBLE, BLOCK_CLASS.STONE],
  [BLOCK.SANDSTONE, BLOCK_CLASS.STONE],
  [BLOCK.BRICKS, WORK_CLASS.MASONRY],
  [BLOCK.WALL, WORK_CLASS.MASONRY],
  [BLOCK.COAL_ORE, BLOCK_CLASS.COAL_ORE],
  [BLOCK.IRON_ORE, BLOCK_CLASS.METAL_ORE],
  [BLOCK.CLAY_DEEP_ORE, BLOCK_CLASS.METAL_ORE],
  [BLOCK.SULFUR_ORE, BLOCK_CLASS.METAL_ORE],
  [BLOCK.OIL_SEEP, BLOCK_CLASS.METAL_ORE],
]);

/** Hand-time bands for new work seams, aligned to the harvest contract. */
const WORK_BASE_MULTIPLIER = Object.freeze({
  [WORK_CLASS.FARMING]: 2 / 3,
  [WORK_CLASS.PREP]: 2 / 3,
  [WORK_CLASS.WOODWORKING]: 1,
  [WORK_CLASS.MASONRY]: 2,
});

/** Return the harvest contract class for a known block, or null safely. */
export function harvestClassForBlock(blockId) {
  return HARVEST_CLASS_BY_BLOCK.get(blockId) ?? null;
}

/** Return a contract tool tier; bare hands and unknown items use hand. */
export function toolTierForHeld(itemId) {
  return tierForItem(itemId) ?? TOOL_TIER.HAND;
}

/** Return the stable gameplay tool category held by an item, or hand. */
export function toolTypeForHeld(itemId) {
  const tool = propsOf(itemId)?.tool;
  return ['axe', 'pick', 'hoe', 'spade', 'mason'].includes(tool) ? tool : 'hand';
}

/** Return the work seam for a real block, or null safely. */
export function workClassForBlock(blockId) {
  return WORK_CLASS_BY_BLOCK.get(blockId) ?? null;
}

/** Return exact harvest duration in seconds, or null for an unknown block. */
export function harvestDurationForBlock(blockId, itemId, baseSeconds = 4.2) {
  const blockClass = harvestClassForBlock(blockId);
  if (blockClass === null) return null;
  return baseSeconds * harvestTimeMultiplier(blockClass, toolTierForHeld(itemId));
}

/**
 * Apply specialized work speed only when the held category matches. Legacy
 * mining classes retain their exact harvest ratios and pick behavior.
 */
export function workDurationForBlock(blockId, itemId, baseSeconds = 4.2) {
  const workClass = workClassForBlock(blockId);
  if (workClass === null) return null;
  const handMultiplier = WORK_BASE_MULTIPLIER[workClass] ?? bareHandTimeMultiplier(workClass);
  if (handMultiplier === null || handMultiplier === undefined) return null;
  const handDuration = baseSeconds * handMultiplier;
  const requiredTool = requiredToolForWork(workClass);
  if (toolTypeForHeld(itemId) !== requiredTool) return handDuration;

  const tier = toolTierForHeld(itemId);
  if (Object.prototype.hasOwnProperty.call(WORK_BASE_MULTIPLIER, workClass)) {
    return handDuration * workTimeMultiplier(workClass, tier);
  }
  return baseSeconds * harvestTimeMultiplier(workClass, tier);
}

/**
 * Effective mine speed multiplier for a held item id.
 * @param {number|null|undefined} itemId
 */
export function mineSpeedForHeld(itemId) {
  if (itemId == null) return 1;
  return speedForItem(itemId);
}

/**
 * Whether held tool meets ore table min harvest tier (if ore known).
 * Unknown blocks → true (do not block non-ore).
 * @param {number} blockId
 * @param {number|null|undefined} itemId
 */
export function canHarvestBlock(blockId, itemId) {
  const ore = oreDropEntry(blockId);
  if (!ore?.minHarvestTier) return true;
  const tier = tierForItem(itemId);
  if (!tier) return ore.minHarvestTier === 'wood'; // bare hand only wood-tier ores if ever
  return tierMeetsRequirement(tier, ore.minHarvestTier);
}

/**
 * Numeric harvest level of held tool (0 if none).
 * @param {number|null|undefined} itemId
 */
export function harvestLevelForHeld(itemId) {
  const tier = tierForItem(itemId);
  if (!tier) return 0;
  return HARVEST_LEVEL[tier] ?? 0;
}

export function preferredToolForOre(blockId) {
  return oreDropEntry(blockId)?.tool ?? null;
}

/**
 * Prefer pure ore-drops catalog, else call legacyDropFn(blockId).
 * Game/mine path should call this to avoid circular imports with items.js.
 * @param {number} blockId
 * @param {(id:number)=>any} legacyDropFn
 */
export function resolveBlockDrop(blockId, legacyDropFn) {
  const ore = primaryOreDropId(blockId);
  if (ore != null) return ore;
  return typeof legacyDropFn === 'function' ? legacyDropFn(blockId) : blockId;
}
