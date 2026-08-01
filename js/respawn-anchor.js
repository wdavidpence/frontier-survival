/**
 * Pure respawn anchor charge 0..4 (MC-breadth).
 */

export const RESPAWN_ANCHOR_MAX = 4;

export function clampAnchorCharge(charge) {
  const n = Number(charge);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(RESPAWN_ANCHOR_MAX, Math.floor(n)));
}

/** Add one glowstone charge; leftover 1 if full. */
export function anchorCharge(charge, amount = 1) {
  const cur = clampAnchorCharge(charge);
  const add = Math.max(0, amount | 0);
  const next = Math.min(RESPAWN_ANCHOR_MAX, cur + add);
  return { charge: next, leftover: add - (next - cur) };
}

/** Consume one charge on respawn use. */
export function anchorDischarge(charge, amount = 1) {
  const cur = clampAnchorCharge(charge);
  const want = Math.max(0, amount | 0);
  const took = Math.min(cur, want);
  return { charge: cur - took, took };
}

export function anchorIsFullyCharged(charge) {
  return clampAnchorCharge(charge) >= RESPAWN_ANCHOR_MAX;
}

export function anchorCanRespawn(charge) {
  return clampAnchorCharge(charge) > 0;
}

export function anchorFillFraction(charge) {
  return clampAnchorCharge(charge) / RESPAWN_ANCHOR_MAX;
}
