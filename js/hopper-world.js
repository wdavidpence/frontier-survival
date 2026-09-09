/**
 * One hopper tick: pull from above chest slots, push into below chest slots.
 */
import { hopperInsert, hopperExtract, createHopperBuffer } from './hopper-buffer.js?v=1';

export function ensureHopper(h) {
  if (h && h.buf) return h;
  return { buf: createHopperBuffer(5), x: h?.x | 0, y: h?.y | 0, z: h?.z | 0 };
}

function takeFromSlots(slots, n = 1) {
  const list = Array.isArray(slots) ? slots : [];
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    if (!s || s.id == null || s.count <= 0) continue;
    const take = Math.min(n, s.count);
    s.count -= take;
    const id = s.id;
    if (s.count <= 0) {
      s.id = null;
      s.count = 0;
    }
    return { id, count: take };
  }
  return null;
}

function putIntoSlots(slots, id, count) {
  let left = count | 0;
  const list = Array.isArray(slots) ? slots : [];
  for (const s of list) {
    if (!s) continue;
    if (s.id === id && s.count > 0 && s.count < 64) {
      const add = Math.min(64 - s.count, left);
      s.count += add;
      left -= add;
      if (left <= 0) return 0;
    }
  }
  for (const s of list) {
    if (!s || s.id == null || s.count <= 0) {
      if (!s) continue;
      s.id = id;
      s.count = left;
      return 0;
    }
  }
  return left;
}

export function tickHopper(hopper, aboveSlots, belowSlots) {
  const h = ensureHopper(hopper);
  const pulled = takeFromSlots(aboveSlots, 1);
  if (pulled) {
    const leftover = hopperInsert(h.buf, pulled.id, pulled.count);
    if (leftover > 0 && Array.isArray(aboveSlots)) {
      putIntoSlots(aboveSlots, pulled.id, leftover);
    }
  }
  const out = hopperExtract(h.buf, 1);
  if (out && Array.isArray(belowSlots)) {
    const left = putIntoSlots(belowSlots, out.id, out.count);
    if (left > 0) hopperInsert(h.buf, out.id, left);
  }
  return h;
}
