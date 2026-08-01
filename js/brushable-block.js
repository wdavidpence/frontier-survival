/**
 * Pure brushable block dust progress (MC archaeology).
 */

export const BRUSH_STAGES = 4;

/**
 * @typedef {{ progress: number, itemId: number|null }} BrushableState
 */

export function createBrushable(itemId = null) {
  return { progress: 0, itemId: itemId == null ? null : itemId };
}

/**
 * Brush one step; returns { state, extracted } when complete.
 * @param {BrushableState} state
 * @param {number} [amount=0.25]
 */
export function brushStep(state, amount = 0.25) {
  const s = state || createBrushable();
  const a = Math.max(0, Number(amount) || 0);
  s.progress = Math.min(1, (Number(s.progress) || 0) + a);
  if (s.progress >= 1) {
    const itemId = s.itemId;
    s.progress = 0;
    s.itemId = null;
    return { state: s, extracted: itemId, done: true };
  }
  return { state: s, extracted: null, done: false };
}

export function brushStage(progress) {
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  return Math.min(BRUSH_STAGES - 1, Math.floor(p * BRUSH_STAGES));
}
