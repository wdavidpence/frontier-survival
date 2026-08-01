/**
 * Pure bogged arrow poison tip chance (MC 1.21).
 */

export const BOGGED_POISON_CHANCE = 0.5;
export const BOGGED_POISON_SEC = 4;

/**
 * @param {number} [chance=BOGGED_POISON_CHANCE]
 * @param {() => number} [rng]
 * @returns {{ poison: boolean, durationSec: number }}
 */
export function boggedArrowTip(chance = BOGGED_POISON_CHANCE, rng = Math.random) {
  const c = Math.max(0, Math.min(1, Number(chance) || 0));
  const roll = typeof rng === 'function' ? rng() : Math.random();
  if (roll <= c) {
    return { poison: true, durationSec: BOGGED_POISON_SEC };
  }
  return { poison: false, durationSec: 0 };
}

export function boggedArrowDamage(base = 2) {
  return Math.max(0, Number(base) || 2);
}
