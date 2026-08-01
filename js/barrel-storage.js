/**
 * Pure barrel / small storage slot grid (MC-breadth). Additive to chests.js.
 * No world binding — pure slot ops for tests and future UI.
 */

/**
 * @typedef {{ id: number, count: number }|null} Slot
 */

export function createBarrel(size = 27) {
  const n = Math.max(1, size | 0);
  return { size: n, slots: Array.from({ length: n }, () => null) };
}

export function barrelEmptyCount(barrel) {
  return barrel.slots.filter((s) => !s || s.count <= 0).length;
}

/**
 * Add items into barrel; returns leftover count.
 * @param {{slots: Slot[], size: number}} barrel
 * @param {number} id
 * @param {number} count
 * @param {number} [maxStack=64]
 */
export function barrelAdd(barrel, id, count, maxStack = 64) {
  let left = Math.max(0, count | 0);
  if (left <= 0 || id == null) return 0;
  const max = Math.max(1, maxStack | 0);
  // fill existing stacks
  for (const s of barrel.slots) {
    if (!s || s.id !== id || s.count >= max) continue;
    const room = max - s.count;
    const take = Math.min(room, left);
    s.count += take;
    left -= take;
    if (left <= 0) return 0;
  }
  // empty slots
  for (let i = 0; i < barrel.slots.length; i++) {
    const s = barrel.slots[i];
    if (s && s.count > 0) continue;
    const take = Math.min(max, left);
    barrel.slots[i] = { id, count: take };
    left -= take;
    if (left <= 0) return 0;
  }
  return left;
}

/**
 * Remove up to count of id; returns removed amount.
 */
export function barrelRemove(barrel, id, count) {
  let need = Math.max(0, count | 0);
  let removed = 0;
  if (need <= 0) return 0;
  for (let i = 0; i < barrel.slots.length; i++) {
    const s = barrel.slots[i];
    if (!s || s.id !== id || s.count <= 0) continue;
    const take = Math.min(s.count, need);
    s.count -= take;
    need -= take;
    removed += take;
    if (s.count <= 0) barrel.slots[i] = null;
    if (need <= 0) break;
  }
  return removed;
}

export function barrelCount(barrel, id) {
  let n = 0;
  for (const s of barrel.slots) {
    if (s && s.id === id) n += s.count;
  }
  return n;
}
