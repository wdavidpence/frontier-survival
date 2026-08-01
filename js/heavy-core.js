/**
 * Pure heavy core mace craft ingredient flag (MC 1.21).
 */

export const HEAVY_CORE_ID = 'heavy_core';

/**
 * Whether inventory/craft grid contains heavy core (by name or id).
 * @param {Array<{id?:number,name?:string}|null|undefined>} slots
 */
export function hasHeavyCore(slots) {
  const list = Array.isArray(slots) ? slots : [];
  for (const s of list) {
    if (!s) continue;
    const n = String(s.name || s.id || '').toLowerCase();
    if (n.includes('heavy_core') || n.includes('heavycore') || n === HEAVY_CORE_ID) return true;
  }
  return false;
}

/**
 * Mace craft: needs heavy core + breeze rod (names).
 */
export function canCraftMace(slots) {
  const list = Array.isArray(slots) ? slots : [];
  let core = false;
  let rod = false;
  for (const s of list) {
    if (!s) continue;
    const n = String(s.name || s.id || '').toLowerCase();
    if (n.includes('heavy_core') || n.includes('heavycore')) core = true;
    if (n.includes('breeze_rod') || n.includes('breezerod')) rod = true;
  }
  return core && rod;
}
