/**
 * Pure hopper buffer queue (MC-breadth item transfer).
 */

/**
 * @typedef {{ id: number, count: number }|null} Slot
 */

export function createHopperBuffer(size = 5) {
  const n = Math.max(1, size | 0);
  return { size: n, slots: Array.from({ length: n }, () => null) };
}

/**
 * Push stack into hopper; returns leftover count.
 */
export function hopperInsert(buf, id, count, maxStack = 64) {
  let left = Math.max(0, count | 0);
  if (left <= 0 || id == null) return 0;
  const max = Math.max(1, maxStack | 0);
  for (const s of buf.slots) {
    if (!s || s.id !== id || s.count >= max) continue;
    const take = Math.min(max - s.count, left);
    s.count += take;
    left -= take;
    if (left <= 0) return 0;
  }
  for (let i = 0; i < buf.slots.length; i++) {
    if (buf.slots[i] && buf.slots[i].count > 0) continue;
    const take = Math.min(max, left);
    buf.slots[i] = { id, count: take };
    left -= take;
    if (left <= 0) return 0;
  }
  return left;
}

/**
 * Pull up to n items from front-most non-empty slot.
 * @returns {{ id: number, count: number }|null}
 */
export function hopperExtract(buf, n = 1) {
  const want = Math.max(1, n | 0);
  for (let i = 0; i < buf.slots.length; i++) {
    const s = buf.slots[i];
    if (!s || s.count <= 0) continue;
    const take = Math.min(want, s.count);
    s.count -= take;
    const out = { id: s.id, count: take };
    if (s.count <= 0) buf.slots[i] = null;
    return out;
  }
  return null;
}

export function hopperItemCount(buf) {
  let n = 0;
  for (const s of buf.slots) if (s) n += s.count;
  return n;
}
