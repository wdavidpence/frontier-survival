/**
 * Pure breeze charge projectile knockback (MC 1.21).
 */

export const BREEZE_KNOCKBACK = 1.2;
export const BREEZE_DAMAGE = 1.0;

/**
 * Knockback vector away from hit point toward entity.
 * @param {{x:number,y:number,z:number}} from
 * @param {{x:number,y:number,z:number}} to entity
 * @param {number} [strength=BREEZE_KNOCKBACK]
 */
export function breezeKnockback(from, to, strength = BREEZE_KNOCKBACK) {
  const s = Math.max(0, Number(strength) || BREEZE_KNOCKBACK);
  let dx = (to?.x ?? 0) - (from?.x ?? 0);
  let dy = (to?.y ?? 0) - (from?.y ?? 0);
  let dz = (to?.z ?? 0) - (from?.z ?? 0);
  const len = Math.hypot(dx, dy, dz) || 1;
  dx /= len;
  dy /= len;
  dz /= len;
  // slight upward bias
  dy = Math.max(dy, 0.25);
  const n = Math.hypot(dx, dy, dz) || 1;
  return { x: (dx / n) * s, y: (dy / n) * s, z: (dz / n) * s };
}

export function breezeDamage(base = BREEZE_DAMAGE) {
  return Math.max(0, Number(base) || BREEZE_DAMAGE);
}
