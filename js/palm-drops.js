/** Pure palm-leaf harvest rules; deterministic for smoke tests and runtime injection. */
import { BLOCK } from './blocks.js?v=293';
import { ITEM } from './items.js?v=253';

/**
 * Resolve a palm leaf break into an item drop.
 * @param {number} blockId
 * @param {number} roll deterministic value in [0, 1)
 * @returns {number|null}
 */
export function palmLeafDrop(blockId, roll) {
  if (blockId !== BLOCK.PALM_LEAVES || !Number.isFinite(roll)) return null;
  if (roll < 0.20) return ITEM.COCONUT;
  if (roll < 0.52) return ITEM.PALM_FROND;
  if (roll < 0.68) return ITEM.STICK;
  return null;
}
