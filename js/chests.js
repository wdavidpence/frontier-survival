/**
 * Chest storage map helpers — pure.
 */
import { emptySlots, cloneSlots, addItems } from './inventory.js?v=186';

export const CHEST_SIZE = 9;

export function chestKey(x, y, z) {
  return `${x | 0},${y | 0},${z | 0}`;
}

export function emptyChestSlots() {
  return emptySlots(CHEST_SIZE);
}

/** @param {Map|Record} chests */
export function getChestSlots(chests, key) {
  if (!chests) return emptyChestSlots();
  const raw = chests instanceof Map ? chests.get(key) : chests[key];
  if (!raw) return emptyChestSlots();
  const slots = cloneSlots(raw);
  while (slots.length < CHEST_SIZE) slots.push({ id: null, count: 0 });
  return slots.slice(0, CHEST_SIZE);
}

export function setChestSlots(chests, key, slots) {
  const clean = cloneSlots(slots).slice(0, CHEST_SIZE);
  if (chests instanceof Map) {
    chests.set(key, clean);
    return chests;
  }
  return { ...chests, [key]: clean };
}

export function exportChests(chests) {
  if (!chests) return [];
  if (chests instanceof Map) return [...chests.entries()];
  return Object.entries(chests);
}

export function importChests(entries) {
  const m = new Map();
  if (!Array.isArray(entries)) return m;
  for (const e of entries) {
    if (Array.isArray(e) && e.length === 2) m.set(String(e[0]), cloneSlots(e[1] || []));
  }
  return m;
}

/** Deposit one from player hotbar/slot into chest */
export function depositOne(playerSlots, pIndex, chestSlots) {
  const ps = cloneSlots(playerSlots);
  const cs = cloneSlots(chestSlots);
  while (cs.length < CHEST_SIZE) cs.push({ id: null, count: 0 });
  const src = ps[pIndex];
  if (!src || src.id == null || src.count <= 0) {
    return { ok: false, playerSlots: ps, chestSlots: cs };
  }
  let dest = cs.findIndex((s) => s.id === src.id && s.count > 0 && s.count < 64);
  if (dest < 0) dest = cs.findIndex((s) => !s.id || s.count <= 0);
  if (dest < 0) return { ok: false, playerSlots: ps, chestSlots: cs, error: 'chest full' };
  const id = src.id;
  src.count -= 1;
  if (src.count <= 0) ps[pIndex] = { id: null, count: 0 };
  if (!cs[dest].id || cs[dest].count <= 0) cs[dest] = { id, count: 1 };
  else cs[dest].count += 1;
  return { ok: true, playerSlots: ps, chestSlots: cs };
}

export function withdrawOne(playerSlots, chestSlots, cIndex) {
  const ps = cloneSlots(playerSlots);
  const cs = cloneSlots(chestSlots);
  const src = cs[cIndex];
  if (!src || src.id == null || src.count <= 0) {
    return { ok: false, playerSlots: ps, chestSlots: cs };
  }
  const id = src.id;
  const add = addItems(ps, id, 1);
  if (add.leftover > 0) {
    return { ok: false, playerSlots: ps, chestSlots: cs, error: 'inventory full' };
  }
  src.count -= 1;
  if (src.count <= 0) cs[cIndex] = { id: null, count: 0 };
  return { ok: true, playerSlots: add.slots, chestSlots: cs };
}
