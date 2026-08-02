/**
 * Pure mine-tier helper wrapping tool-tiers for harvest checks / speed.
 * Additive — does not change game mine path until a wire card imports it.
 */
import { tierForItem, HARVEST_LEVEL, speedForItem, tierMeetsRequirement } from './tool-tiers.js?v=240';
import { oreDropEntry, primaryOreDropId } from './ore-drops.js?v=240';

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
