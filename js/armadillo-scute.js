/**
 * Pure armadillo scute drop chance (MC 1.20.5+).
 */

export const ARMADILLO_SCUTE_CHANCE = 0.2;

/**
 * Roll scute drop when brushing / shedding.
 * @param {number} [chance=ARMADILLO_SCUTE_CHANCE]
 * @param {() => number} [rng]
 */
export function armadilloScuteDrop(chance = ARMADILLO_SCUTE_CHANCE, rng = Math.random) {
  const c = Math.max(0, Math.min(1, Number(chance) || 0));
  const roll = typeof rng === 'function' ? rng() : Math.random();
  return roll <= c ? 1 : 0;
}

/**
 * Scutes needed for wolf armor craft.
 */
export const WOLF_ARMOR_SCUTE_COST = 6;

export function canCraftWolfArmor(scuteCount) {
  return (scuteCount | 0) >= WOLF_ARMOR_SCUTE_COST;
}
