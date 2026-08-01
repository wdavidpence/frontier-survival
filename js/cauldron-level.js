/**
 * Pure cauldron water level 0..3 (MC-breadth).
 */

export const CAULDRON_LEVEL_MAX = 3;

export function clampCauldronLevel(level) {
  const n = Number(level);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(CAULDRON_LEVEL_MAX, Math.floor(n)));
}

/** Add one bottle/bucket unit; returns leftover units not added. */
export function cauldronFill(level, amount = 1) {
  const cur = clampCauldronLevel(level);
  const add = Math.max(0, amount | 0);
  const next = Math.min(CAULDRON_LEVEL_MAX, cur + add);
  return { level: next, leftover: add - (next - cur) };
}

/** Remove one unit; returns { level, took }. */
export function cauldronDrain(level, amount = 1) {
  const cur = clampCauldronLevel(level);
  const want = Math.max(0, amount | 0);
  const took = Math.min(cur, want);
  return { level: cur - took, took };
}

export function cauldronIsFull(level) {
  return clampCauldronLevel(level) >= CAULDRON_LEVEL_MAX;
}

export function cauldronIsEmpty(level) {
  return clampCauldronLevel(level) <= 0;
}

/** Fill fraction for meshing 0..1. */
export function cauldronFillFraction(level) {
  return clampCauldronLevel(level) / CAULDRON_LEVEL_MAX;
}
