/**
 * Pure ore → drop table (MC-breadth). Additive catalog; does not replace items.dropForBlock.
 * Prefer consulting this table when wiring mine drops; existing dropForBlock remains authoritative until wire.
 */
import { BLOCK } from './blocks.js?v=288';
import { ITEM } from './items.js?v=220';

/**
 * @typedef {{ id: number, count: number }} DropStack
 * @typedef {{ drops: DropStack[], tool?: 'pick'|'shovel'|'axe'|null, minHarvestTier?: 'wood'|'stone'|'iron' }} OreDrop
 */

/** @type {Record<number, OreDrop>} */
export const ORE_DROPS = {
  [BLOCK.COAL_ORE]: {
    drops: [{ id: ITEM.COAL, count: 1 }],
    tool: 'pick',
    minHarvestTier: 'wood',
  },
  [BLOCK.IRON_ORE]: {
    drops: [{ id: BLOCK.IRON_ORE, count: 1 }],
    tool: 'pick',
    minHarvestTier: 'stone',
  },
  [BLOCK.SULFUR_ORE]: {
    drops: [{ id: BLOCK.SULFUR_ORE, count: 1 }],
    tool: 'pick',
    minHarvestTier: 'stone',
  },
  [BLOCK.CLAY_DEEP_ORE]: {
    drops: [{ id: ITEM.CLAY_BALL, count: 2 }],
    tool: 'shovel',
    minHarvestTier: 'wood',
  },
};

export function oreDropEntry(blockId) {
  return ORE_DROPS[blockId] ?? null;
}

export function primaryOreDropId(blockId) {
  const e = oreDropEntry(blockId);
  return e?.drops?.[0]?.id ?? null;
}

export function listOreBlockIds() {
  return Object.keys(ORE_DROPS).map(Number);
}

export function isOreBlock(blockId) {
  return oreDropEntry(blockId) != null;
}
