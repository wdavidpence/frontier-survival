/**
 * Pure item-frame display state (MC-breadth).
 */

/**
 * @typedef {{ itemId: number|null, rotation: number }} ItemFrameState
 */

export function createItemFrame(itemId = null, rotation = 0) {
  return {
    itemId: itemId == null ? null : itemId,
    rotation: ((rotation | 0) % 8 + 8) % 8,
  };
}

export function setFrameItem(frame, itemId) {
  const f = frame || createItemFrame();
  f.itemId = itemId == null ? null : itemId;
  f.rotation = 0;
  return f;
}

export function clearFrameItem(frame) {
  return setFrameItem(frame, null);
}

/** Rotate display 45° steps (0..7). */
export function rotateFrame(frame, delta = 1) {
  const f = frame || createItemFrame();
  if (f.itemId == null) return f;
  f.rotation = ((f.rotation + (delta | 0)) % 8 + 8) % 8;
  return f;
}

export function frameHasItem(frame) {
  return !!(frame && frame.itemId != null);
}
