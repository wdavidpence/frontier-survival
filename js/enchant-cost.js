/**
 * Pure enchanting level cost curve (MC-breadth stub).
 */

/**
 * XP levels cost for enchanting table shelf power 0..15 and slot 0..2.
 * @param {number} shelves
 * @param {number} slot
 */
export function enchantLevelCost(shelves, slot = 0) {
  const s = Math.max(0, Math.min(15, Math.floor(Number(shelves) || 0)));
  const i = Math.max(0, Math.min(2, Math.floor(Number(slot) || 0)));
  // classic-ish: base grows with shelves; middle/top slots cost more
  const base = 1 + Math.floor(s * 0.6);
  return base + i * (2 + Math.floor(s / 5));
}

/**
 * Max enchantability weight from shelves (0..1).
 */
export function enchantPower01(shelves) {
  const s = Math.max(0, Math.min(15, Number(shelves) || 0));
  return s / 15;
}

/**
 * Whether player levels are enough.
 */
export function canPayEnchant(playerLevels, cost) {
  return (Number(playerLevels) || 0) >= (Number(cost) || 0);
}

/**
 * Apply cost; returns remaining levels (not below 0).
 */
export function payEnchantLevels(playerLevels, cost) {
  const L = Math.max(0, Number(playerLevels) || 0);
  const c = Math.max(0, Number(cost) || 0);
  return Math.max(0, L - c);
}
