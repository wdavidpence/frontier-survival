/**
 * Pure sculk catalyst charge / spread stub (MC-breadth).
 */

export const SCULK_CHARGE_PER_XP = 1;
export const SCULK_SPREAD_COST = 1;

/**
 * @typedef {{ charge: number }} SculkCatalyst
 */

export function createSculkCatalyst(charge = 0) {
  return { charge: Math.max(0, Math.floor(Number(charge) || 0)) };
}

/** Add charge from mob xp-like value. */
export function sculkAddCharge(cat, xpOrbs = 1) {
  const c = cat || createSculkCatalyst();
  const add = Math.max(0, Math.floor(Number(xpOrbs) || 0)) * SCULK_CHARGE_PER_XP;
  c.charge += add;
  return c;
}

/**
 * Spend charge to spread one sculk block; returns success.
 */
export function sculkTrySpread(cat, cost = SCULK_SPREAD_COST) {
  const c = cat || createSculkCatalyst();
  const need = Math.max(1, cost | 0);
  if (c.charge < need) return { ok: false, catalyst: c };
  c.charge -= need;
  return { ok: true, catalyst: c };
}

export function sculkCanSpread(cat, cost = SCULK_SPREAD_COST) {
  return (cat?.charge || 0) >= Math.max(1, cost | 0);
}
