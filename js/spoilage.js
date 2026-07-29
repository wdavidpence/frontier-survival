/**
 * Inventory stack spoilage helpers — pure.
 * Optional slot.age seconds for spoilable items.
 */

import { ITEM } from './items.js';
import { cloneSlots } from './inventory.js';

export const SPOIL_SECONDS = 420; // ~one game day default real-time window

export function isSpoilable(id) {
  return id === ITEM.RAW_MEAT;
}

/**
 * Age spoilable stacks and convert expired raw meat to rotten.
 * @param {Array<{id:number|null,count:number,age?:number}>} slots
 * @param {number} dt
 * @param {number} [spoilAfter]
 */
export function tickSpoilage(slots, dt, spoilAfter = SPOIL_SECONDS) {
  const next = cloneSlots(slots).map((s) => ({ ...s, age: s.age || 0 }));
  let spoiled = 0;
  for (const s of next) {
    if (!isSpoilable(s.id) || s.count <= 0) {
      if (s.age) s.age = 0;
      continue;
    }
    s.age = (s.age || 0) + dt;
    if (s.age >= spoilAfter) {
      const n = s.count;
      s.id = ITEM.ROTTEN_MEAT;
      s.count = n;
      s.age = 0;
      spoiled += n;
    }
  }
  return { slots: next, spoiled };
}

/**
 * When adding spoilable items, start age at 0.
 */
export function withFreshAge(slot) {
  if (!slot || slot.id == null) return slot;
  if (isSpoilable(slot.id)) return { ...slot, age: slot.age || 0 };
  const { age, ...rest } = slot;
  return rest;
}
