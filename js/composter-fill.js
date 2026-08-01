/**
 * Pure composter fill level 0..7 (MC-breadth).
 */

export const COMPOSTER_MAX = 7;

export function clampCompostLevel(level) {
  const n = Number(level);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(COMPOSTER_MAX, Math.floor(n)));
}

/**
 * Add compost chance; returns { level, producedBoneMeal }.
 * @param {number} level
 * @param {number} [chance=0.65] 0..1 success chance (deterministic if chance>=1)
 * @param {() => number} [rng] returns 0..1
 */
export function compostAdd(level, chance = 0.65, rng = Math.random) {
  let L = clampCompostLevel(level);
  if (L >= COMPOSTER_MAX) return { level: L, producedBoneMeal: false, added: false };
  const c = Math.max(0, Math.min(1, Number(chance) || 0));
  const roll = typeof rng === 'function' ? rng() : Math.random();
  if (roll > c) return { level: L, producedBoneMeal: false, added: false };
  L += 1;
  if (L >= COMPOSTER_MAX) {
    return { level: 0, producedBoneMeal: true, added: true };
  }
  return { level: L, producedBoneMeal: false, added: true };
}

export function composterIsFull(level) {
  return clampCompostLevel(level) >= COMPOSTER_MAX;
}

export function compostFillFraction(level) {
  return clampCompostLevel(level) / COMPOSTER_MAX;
}
