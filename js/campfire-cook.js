/**
 * Pure campfire cook slot progress (MC-breadth).
 */

export const CAMPFIRE_SLOTS = 4;
export const CAMPFIRE_COOK_TIME = 600;

/**
 * @typedef {{ id: number|null, progress: number }} CampfireSlot
 */

export function createCampfireSlots(n = CAMPFIRE_SLOTS) {
  const size = Math.max(1, n | 0);
  return Array.from({ length: size }, () => ({ id: null, progress: 0 }));
}

/**
 * Place item in first empty slot. Returns false if full.
 */
export function campfirePlace(slots, itemId) {
  if (itemId == null) return false;
  for (const s of slots) {
    if (s.id == null) {
      s.id = itemId;
      s.progress = 0;
      return true;
    }
  }
  return false;
}

/**
 * Advance all occupied slots; returns finished item ids.
 * @param {CampfireSlot[]} slots
 * @param {number} dtSec
 * @param {number} [cookTime=CAMPFIRE_COOK_TIME]
 */
export function campfireTick(slots, dtSec, cookTime = CAMPFIRE_COOK_TIME) {
  const dt = Math.max(0, Number(dtSec) || 0);
  const total = Math.max(1, Number(cookTime) || CAMPFIRE_COOK_TIME);
  const done = [];
  for (const s of slots) {
    if (s.id == null) continue;
    s.progress = Math.min(1, s.progress + dt / total);
    if (s.progress >= 1) {
      done.push(s.id);
      s.id = null;
      s.progress = 0;
    }
  }
  return done;
}

export function campfireOccupied(slots) {
  return slots.filter((s) => s.id != null).length;
}
