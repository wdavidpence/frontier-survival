/**
 * Simple ballistic projectiles (arrows) — pure step helper.
 */

/**
 * @typedef {{ x:number,y:number,z:number, vx:number,vy:number,vz:number, life:number, damage:number, fromPlayer:boolean }} Projectile
 */

/**
 * @param {{x:number,y:number,z:number}} origin
 * @param {{x:number,y:number,z:number}} dir unit
 * @param {object} [opts]
 * @returns {Projectile}
 */
export function spawnArrow(origin, dir, opts = {}) {
  const speed = opts.speed ?? 28;
  return {
    x: origin.x,
    y: origin.y,
    z: origin.z,
    vx: dir.x * speed,
    vy: dir.y * speed,
    vz: dir.z * speed,
    life: opts.life ?? 2.2,
    damage: opts.damage ?? 14,
    fromPlayer: opts.fromPlayer !== false,
  };
}

/**
 * Integrate one projectile. gravity pulls down.
 * @returns {{ proj: Projectile|null, hitPos: {x:number,y:number,z:number}|null }}
 */
export function stepProjectile(p, dt, gravity = 18) {
  if (!p || p.life <= 0) return { proj: null, hitPos: null };
  const next = { ...p };
  next.vy -= gravity * dt;
  next.x += next.vx * dt;
  next.y += next.vy * dt;
  next.z += next.vz * dt;
  next.life -= dt;
  if (next.life <= 0 || next.y < -5) return { proj: null, hitPos: { x: next.x, y: next.y, z: next.z } };
  return { proj: next, hitPos: { x: next.x, y: next.y, z: next.z } };
}

/** Distance from point to segment-ish body AABB center */
export function hitAnimal(proj, animal, radius = 0.7) {
  if (!animal || animal.dead) return false;
  const cy = animal.y + 0.5;
  const dx = proj.x - animal.x;
  const dy = proj.y - cy;
  const dz = proj.z - animal.z;
  return dx * dx + dy * dy + dz * dz <= radius * radius;
}
