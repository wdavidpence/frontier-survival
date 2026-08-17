/**
 * Pure tool-tier table module.
 * Defines the material tiers used by tools (pick, axe) in this game.
 */

import { ITEM } from './items.js?v=246';

/** Tier names in ascending order. */
export const TIER_ORDER = ['wood', 'stone', 'iron'];

/** Map item id -> tier name (only tools). */
export const ITEM_TIER = {
  [ITEM.WOOD_PICK]: 'wood',
  [ITEM.WOOD_AXE]: 'wood',
  [ITEM.STONE_PICK]: 'stone',
  [ITEM.STONE_AXE]: 'stone',
  [ITEM.IRON_PICK]: 'iron',
  [ITEM.IRON_AXE]: 'iron',
  [ITEM.WOOD_HOE]: 'wood',
  [ITEM.STONE_HOE]: 'stone',
  [ITEM.IRON_HOE]: 'iron',
  [ITEM.WOOD_SPADE]: 'wood',
  [ITEM.STONE_SPADE]: 'stone',
  [ITEM.IRON_SPADE]: 'iron',
  [ITEM.WOOD_MASON]: 'wood',
  [ITEM.STONE_MASON]: 'stone',
  [ITEM.IRON_MASON]: 'iron',
};

/** Map tier name -> numeric harvest level (1-based, higher = can mine harder blocks). */
export const HARVEST_LEVEL = {
  wood: 1,
  stone: 2,
  iron: 3,
};

/** Map tier name -> average tool speed multiplier (mineMult average of pick+axe). */
export const TOOL_SPEED_MULTIPLIER = {
  wood: 2.3,   // (2.2 + 2.4) / 2
  stone: 3.45, // (3.4 + 3.5) / 2
  iron: 5.1,   // (5.0 + 5.2) / 2
};

/** Map tier name -> max durability for tools of that tier (from durability.js). */
export const TIER_DURABILITY = {
  wood: 60,
  stone: 100,
  iron: 180,
};

/**
 * Return the tier name for a given item id, or null if not a known tool.
 */
export function tierForItem(itemId) {
  return ITEM_TIER[itemId] ?? null;
}

/**
 * Return the numeric index of a tier in TIER_ORDER, or -1 if unknown.
 */
export function tierIndex(tierName) {
  return TIER_ORDER.indexOf(tierName);
}

/**
 * Return true if `higher` tier can harvest blocks requiring `lower` tier.
 */
export function tierMeetsRequirement(higher, lower) {
  return tierIndex(higher) >= tierIndex(lower) && tierIndex(higher) >= 0;
}

/**
 * Return the speed multiplier for a specific item id (falls back to 1 if not a tool).
 */
export function speedForItem(itemId) {
  const tier = ITEM_TIER[itemId];
  if (!tier) return 1;
  return TOOL_SPEED_MULTIPLIER[tier];
}
