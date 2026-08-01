/**
 * Pure mace smash fall bonus damage (MC 1.21).
 */

/**
 * Extra damage from fall distance when smashing with mace.
 * @param {number} fallDistance blocks
 * @param {number} [baseDamage=5]
 * @param {number} [perBlock=2]
 */
export function maceSmashDamage(fallDistance, baseDamage = 5, perBlock = 2) {
  const fall = Math.max(0, Number(fallDistance) || 0);
  const base = Math.max(0, Number(baseDamage) || 0);
  const per = Math.max(0, Number(perBlock) || 0);
  if (fall < 1.5) return base; // no smash bonus
  const bonus = (fall - 1.5) * per;
  return base + bonus;
}

/**
 * Whether smash density / stun should apply.
 * @param {number} fallDistance
 * @param {number} [minFall=1.5]
 */
export function maceSmashTriggers(fallDistance, minFall = 1.5) {
  return (Number(fallDistance) || 0) >= (Number(minFall) || 1.5);
}

/**
 * Breach armor reduction factor 0..1 (simplified).
 * @param {number} fallDistance
 */
export function maceBreachFactor(fallDistance) {
  const f = Math.max(0, Number(fallDistance) || 0);
  return Math.min(0.5, f * 0.04);
}
