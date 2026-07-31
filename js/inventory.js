/**
 * Stack inventory — pure logic (unit-testable).
 * slots: Array<{ id: number|null, count: number }>
 */
import { maxStack, ITEM } from './items.js?v=210';
import { BLOCK } from './blocks.js?v=210';

export const HOTBAR_SIZE = 9;
export const BAG_SIZE = 18;
export const INV_SIZE = HOTBAR_SIZE + BAG_SIZE;

export function emptySlots(n = INV_SIZE) {
  return Array.from({ length: n }, () => ({ id: null, count: 0 }));
}

export function createStarterInventory(rationCount = 6) {
  const slots = emptySlots();
  const n = Math.max(0, rationCount | 0);
  if (n > 0) {
    slots[0] = { id: ITEM.RATION, count: n };
    // Survive the first night: light, fuel, forage
    slots[1] = { id: BLOCK.TORCH, count: 8 };
    slots[2] = { id: ITEM.STICK, count: 12 };
    slots[3] = { id: ITEM.BERRIES, count: 8 };
  }
  return slots;
}

/**
 * @param {Array<{id:number|null,count:number}>} slots
 * @param {number} id
 * @param {number} count
 * @returns {{ ok: boolean, slots: typeof slots, leftover: number }}
 */
export function addItems(slots, id, count) {
  if (!id || count <= 0) return { ok: true, slots: cloneSlots(slots), leftover: 0 };
  const next = cloneSlots(slots);
  const stackMax = maxStack(id);
  let left = count;

  // fill existing stacks
  for (let i = 0; i < next.length && left > 0; i++) {
    if (next[i].id === id && next[i].count < stackMax) {
      const space = stackMax - next[i].count;
      const add = Math.min(space, left);
      next[i].count += add;
      left -= add;
    }
  }
  // empty slots
  for (let i = 0; i < next.length && left > 0; i++) {
    if (next[i].id == null || next[i].count <= 0) {
      const add = Math.min(stackMax, left);
      next[i] = { id, count: add };
      left -= add;
    }
  }
  return { ok: left === 0, slots: next, leftover: left };
}

/**
 * @param {Array<{id:number|null,count:number}>} slots
 * @param {number} id
 * @param {number} count
 */
export function removeItems(slots, id, count) {
  if (!id || count <= 0) return { ok: true, slots: cloneSlots(slots) };
  if (countItems(slots, id) < count) return { ok: false, slots: cloneSlots(slots) };
  const next = cloneSlots(slots);
  let left = count;
  // remove from end first so hotbar stays stable-ish
  for (let i = next.length - 1; i >= 0 && left > 0; i--) {
    if (next[i].id !== id) continue;
    const take = Math.min(next[i].count, left);
    next[i].count -= take;
    left -= take;
    if (next[i].count <= 0) next[i] = { id: null, count: 0 };
  }
  return { ok: true, slots: next };
}

export function countItems(slots, id) {
  let n = 0;
  for (const s of slots) {
    if (s.id === id) n += s.count;
  }
  return n;
}

/**
 * @param {Array<{id:number|null,count:number}>} slots
 * @param {Array<{id:number,count:number}>} reqs
 */
export function hasIngredients(slots, reqs) {
  for (const r of reqs) {
    if (countItems(slots, r.id) < r.count) return false;
  }
  return true;
}

/**
 * Consume ingredients then add outputs.
 * @returns {{ ok: boolean, slots: Array, error?: string }}
 */
export function craftWith(slots, ingredients, results) {
  if (!hasIngredients(slots, ingredients)) {
    return { ok: false, slots: cloneSlots(slots), error: 'missing ingredients' };
  }
  let next = cloneSlots(slots);
  for (const r of ingredients) {
    const rem = removeItems(next, r.id, r.count);
    if (!rem.ok) return { ok: false, slots: cloneSlots(slots), error: 'missing ingredients' };
    next = rem.slots;
  }
  for (const r of results) {
    const add = addItems(next, r.id, r.count);
    next = add.slots;
    if (add.leftover > 0) {
      return { ok: false, slots: cloneSlots(slots), error: 'inventory full' };
    }
  }
  return { ok: true, slots: next };
}

export function cloneSlots(slots) {
  return slots.map((s) => {
    const out = { id: s.id, count: s.count };
    if (s.age != null) out.age = s.age;
    if (s.dur != null) out.dur = s.dur;
    return out;
  });
}

export function getHotbarStack(slots, index) {
  if (index < 0 || index >= HOTBAR_SIZE) return { id: null, count: 0 };
  return slots[index] || { id: null, count: 0 };
}

/** Consume 1 from hotbar slot if matches expected id or any placeable */
export function consumeFromHotbar(slots, hotbarIndex, amount = 1) {
  const next = cloneSlots(slots);
  const s = next[hotbarIndex];
  if (!s || s.id == null || s.count < amount) {
    return { ok: false, slots: next, id: null };
  }
  const id = s.id;
  s.count -= amount;
  if (s.count <= 0) next[hotbarIndex] = { id: null, count: 0 };
  return { ok: true, slots: next, id };
}

export function splitStack(slots, index) {
  const next = cloneSlots(slots);
  const s = next[index];
  if (!s || s.id == null || s.count < 2) return { ok: false, slots: next };
  const half = Math.floor(s.count / 2);
  let empty = -1;
  for (let i = 0; i < next.length; i++) {
    if (next[i].id == null || next[i].count <= 0) { empty = i; break; }
  }
  if (empty < 0) return { ok: false, slots: next, error: 'no space' };
  s.count -= half;
  const ns = { id: s.id, count: half };
  if (s.dur != null) ns.dur = s.dur;
  if (s.age != null) ns.age = s.age;
  next[empty] = ns;
  return { ok: true, slots: next };
}
