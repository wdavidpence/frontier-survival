/**
 * Pure shulker box 27-slot nested inventory helper (MC-breadth).
 */

/**
 * @typedef {{ id: number, count: number }|null} Slot
 */

export function createShulkerSlots(size = 27) {
  const n = Math.max(1, size | 0);
  return Array.from({ length: n }, () => null);
}

export function shulkerAdd(slots, id, count, maxStack = 64) {
  let left = Math.max(0, count | 0);
  if (left <= 0 || id == null) return 0;
  const max = Math.max(1, maxStack | 0);
  for (const s of slots) {
    if (!s || s.id !== id || s.count >= max) continue;
    const take = Math.min(max - s.count, left);
    s.count += take;
    left -= take;
    if (left <= 0) return 0;
  }
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] && slots[i].count > 0) continue;
    const take = Math.min(max, left);
    slots[i] = { id, count: take };
    left -= take;
    if (left <= 0) return 0;
  }
  return left;
}

export function shulkerCount(slots, id) {
  let n = 0;
  for (const s of slots) if (s && s.id === id) n += s.count;
  return n;
}

export function shulkerIsEmpty(slots) {
  return slots.every((s) => !s || s.count <= 0);
}
