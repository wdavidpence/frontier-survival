/**
 * Inventory stack spoilage helpers — pure.
 * Optional slot.age seconds for spoilable items.
 */
import { ITEM } from './items.js?v=201';
import { cloneSlots } from './inventory.js?v=201';

export const SPOIL_SECONDS = 420; // ~one game day default real-time window

/** Spoilable id → rotten product id */
export const SPOIL_MAP = {
  [ITEM.RAW_MEAT]: ITEM.ROTTEN_MEAT,
  [ITEM.RAW_FISH]: ITEM.ROTTEN_MEAT, // SC: rotten fish/meat both foul
};

export function isSpoilable(id) {
  return id != null && SPOIL_MAP[id] != null;
}

/**
 * Age spoilable stacks and convert expired items to rotten product.
 * @param {Array<{id:number|null,count:number,age?:number}>} slots
 * @param {number} dt
 * @param {number} [spoilAfter]
 */
/** @param {number} [rateMult] <1 slows spoilage (ice box) */
export function tickSpoilage(slots, dt, spoilAfter = SPOIL_SECONDS, rateMult = 1) {
  dt = dt * (rateMult > 0 ? rateMult : 1);
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
      s.id = SPOIL_MAP[s.id] || ITEM.ROTTEN_MEAT;
      s.count = n;
      s.age = 0;
      spoiled += n;
    }
  }
  return { slots: next, spoiled };
}

export function withFreshAge(slot) {
  if (!slot || slot.id == null) return slot;
  if (isSpoilable(slot.id)) return { ...slot, age: slot.age || 0 };
  const { age, ...rest } = slot;
  return rest;
}
