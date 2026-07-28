/**
 * Wildlife simulation — pure movement/AI helpers + manager.
 * Prey flee; predators hunt (worse at night). Meat drops on death.
 */
import { isSolid, BLOCK } from './blocks.js';
import { hash2 } from './gen.js';

export const SPECIES = {
  hare: {
    id: 'hare',
    name: 'Hare',
    hp: 8,
    speed: 5.2,
    hostile: false,
    fleeRange: 11,
    senseRange: 14,
    damage: 0,
    attackRange: 0,
    attackCd: 99,
    meatMin: 1,
    meatMax: 1,
    color: [0.72, 0.62, 0.48],
    scale: [0.45, 0.35, 0.55],
    count: 10,
  },
  deer: {
    id: 'deer',
    name: 'Deer',
    hp: 22,
    speed: 4.6,
    hostile: false,
    fleeRange: 13,
    senseRange: 16,
    damage: 0,
    attackRange: 0,
    attackCd: 99,
    meatMin: 2,
    meatMax: 3,
    color: [0.55, 0.38, 0.22],
    scale: [0.7, 0.95, 1.1],
    count: 6,
  },
  wolf: {
    id: 'wolf',
    name: 'Wolf',
    hp: 30,
    speed: 4.8,
    hostile: true,
    fleeRange: 0,
    senseRange: 9,
    nightSense: 18,
    damage: 10,
    attackRange: 1.4,
    attackCd: 1.35,
    meatMin: 1,
    meatMax: 2,
    color: [0.35, 0.35, 0.4],
    scale: [0.55, 0.55, 0.95],
    count: 3,
  },
};

function groundY(world, x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  for (let y = 40; y >= 1; y--) {
    const id = world.getBlock(xi, y, zi);
    if (isSolid(id) && id !== BLOCK.LEAVES) {
      // don't stand in water column top
      if (id === BLOCK.WATER) continue;
      return y + 1;
    }
  }
  return 20;
}

function dist2(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

export function meatDropCount(spec, rng = Math.random) {
  const a = spec.meatMin | 0;
  const b = spec.meatMax | 0;
  if (b <= a) return a;
  return a + Math.floor(rng() * (b - a + 1));
}

/**
 * @param {import('./world.js').World} world
 */
export class FaunaSystem {
  constructor(world, seed = 1) {
    this.world = world;
    this.seed = seed;
    /** @type {Array<object>} */
    this.animals = [];
    this._nextId = 1;
    this._spawnInitial();
  }

  _spawnInitial() {
    const r = this.world.radiusChunks * 16 - 4;
    let n = 0;
    for (const spec of Object.values(SPECIES)) {
      let placed = 0;
      let attempts = 0;
      while (placed < spec.count && attempts < spec.count * 12) {
        attempts++;
        const ang = hash2(this.seed + n + attempts, placed * 17 + spec.id.length) * Math.PI * 2;
        // predators prefer outer ring
        const minR = spec.hostile ? 22 : 10;
        const rad = minR + hash2(placed + 3, this.seed + n + attempts) * Math.max(4, r - minR);
        const x = Math.cos(ang) * rad;
        const z = Math.sin(ang) * rad;
        if (Math.hypot(x, z) < minR) continue;
        const y = groundY(this.world, x, z);
        if (this.world.getBlock(x, y - 1, z) === BLOCK.WATER) continue;
        this.animals.push(this._make(spec, x, y, z));
        placed++;
        n++;
      }
    }
  }

  /** Push wildlife away from a point (spawn safety). */
  clearNear(x, z, radius = 14) {
    const r2 = radius * radius;
    this.animals = this.animals.filter((a) => {
      if (a.dead) return false;
      return dist2(a.x, a.z, x, z) >= r2;
    });
  }

  _make(spec, x, y, z) {
    return {
      id: this._nextId++,
      type: spec.id,
      x,
      y,
      z,
      vx: 0,
      vz: 0,
      hp: spec.hp,
      maxHp: spec.hp,
      yaw: Math.random() * Math.PI * 2,
      state: 'wander',
      attackTimer: 0,
      wanderT: Math.random() * 3,
      targetX: x,
      targetZ: z,
      dead: false,
    };
  }

  getSpec(type) {
    return SPECIES[type] || SPECIES.hare;
  }

  /**
   * @param {number} dt
   * @param {{x:number,y:number,z:number}} player
   * @param {boolean} isNight
   * @returns {{ playerDamage: number, kills: object[] }}
   */
  tick(dt, player, isNight) {
    let playerDamage = 0;
    const kills = [];
    const px = player.x;
    const pz = player.z;

    for (const a of this.animals) {
      if (a.dead) continue;
      const spec = this.getSpec(a.type);
      a.attackTimer = Math.max(0, a.attackTimer - dt);

      const d2 = dist2(a.x, a.z, px, pz);
      const dist = Math.sqrt(d2);
      const sense = isNight && spec.nightSense ? spec.nightSense : spec.senseRange;

      if (spec.hostile) {
        if (dist < sense) {
          a.state = 'chase';
        } else if (a.state === 'chase' && dist > sense + 6) {
          a.state = 'wander';
        }
      } else {
        if (dist < spec.fleeRange) a.state = 'flee';
        else if (a.state === 'flee' && dist > spec.fleeRange + 5) a.state = 'wander';
      }

      let wishX = 0;
      let wishZ = 0;
      let speed = spec.speed;

      if (a.state === 'flee') {
        const dx = a.x - px;
        const dz = a.z - pz;
        const len = Math.hypot(dx, dz) || 1;
        wishX = dx / len;
        wishZ = dz / len;
        speed *= 1.15;
      } else if (a.state === 'chase') {
        const dx = px - a.x;
        const dz = pz - a.z;
        const len = Math.hypot(dx, dz) || 1;
        wishX = dx / len;
        wishZ = dz / len;
        if (isNight) speed *= 1.12;
        if (dist < spec.attackRange && a.attackTimer <= 0) {
          playerDamage += spec.damage;
          a.attackTimer = spec.attackCd;
        }
      } else {
        // wander
        a.wanderT -= dt;
        if (a.wanderT <= 0) {
          a.wanderT = 2 + Math.random() * 4;
          const ang = Math.random() * Math.PI * 2;
          a.targetX = a.x + Math.cos(ang) * (3 + Math.random() * 6);
          a.targetZ = a.z + Math.sin(ang) * (3 + Math.random() * 6);
        }
        const dx = a.targetX - a.x;
        const dz = a.targetZ - a.z;
        const len = Math.hypot(dx, dz);
        if (len > 0.4) {
          wishX = dx / len;
          wishZ = dz / len;
          speed *= 0.45;
        }
      }

      a.vx = wishX * speed;
      a.vz = wishZ * speed;
      if (wishX || wishZ) a.yaw = Math.atan2(wishX, wishZ);

      // integrate with simple collision
      let nx = a.x + a.vx * dt;
      let nz = a.z + a.vz * dt;
      const gy = groundY(this.world, nx, nz);
      // block if would enter solid at body
      if (isSolid(this.world.getBlock(nx, gy, nz)) || isSolid(this.world.getBlock(nx, gy + 1, nz))) {
        nx = a.x;
        nz = a.z;
      }
      // water slow / avoid deep
      if (this.world.getBlock(nx, gy - 1, nz) === BLOCK.WATER) {
        nx = a.x * 0.7 + nx * 0.3;
        nz = a.z * 0.7 + nz * 0.3;
      }
      a.x = nx;
      a.z = nz;
      a.y = groundY(this.world, a.x, a.z);

      // world bounds soft
      const lim = this.world.radiusChunks * 16 - 2;
      a.x = Math.max(-lim, Math.min(lim, a.x));
      a.z = Math.max(-lim, Math.min(lim, a.z));
    }

    // remove long-dead
    this.animals = this.animals.filter((a) => !a.dead || a._corpseT === undefined || a._corpseT > 0);
    for (const a of this.animals) {
      if (a.dead && a._corpseT !== undefined) a._corpseT -= dt;
    }

    return { playerDamage, kills };
  }

  /**
   * Melee / projectile hit test along a ray (first animal).
   * @returns {{ animal: object, dist: number } | null}
   */
  rayHit(origin, dir, maxDist = 4) {
    let best = null;
    let bestD = maxDist;
    for (const a of this.animals) {
      if (a.dead) continue;
      const spec = this.getSpec(a.type);
      // approximate body center
      const cy = a.y + spec.scale[1] * 0.5;
      const ox = a.x - origin.x;
      const oy = cy - origin.y;
      const oz = a.z - origin.z;
      const t = ox * dir.x + oy * dir.y + oz * dir.z;
      if (t < 0 || t > bestD) continue;
      const px = origin.x + dir.x * t;
      const py = origin.y + dir.y * t;
      const pz = origin.z + dir.z * t;
      const rad = 0.55 * Math.max(spec.scale[0], spec.scale[2]);
      const ddx = px - a.x;
      const ddy = py - cy;
      const ddz = pz - a.z;
      if (ddx * ddx + ddy * ddy + ddz * ddz <= rad * rad) {
        bestD = t;
        best = { animal: a, dist: t };
      }
    }
    return best;
  }

  /**
   * @returns {{ killed: boolean, meat: number, name: string } | null}
   */
  damageAnimal(animal, amount) {
    if (!animal || animal.dead) return null;
    animal.hp -= amount;
    animal.state = this.getSpec(animal.type).hostile ? 'chase' : 'flee';
    if (animal.hp > 0) return { killed: false, meat: 0, name: this.getSpec(animal.type).name };
    animal.dead = true;
    animal._corpseT = 0.05;
    const spec = this.getSpec(animal.type);
    const meat = meatDropCount(spec);
    // remove immediately after loot
    animal._corpseT = 0;
    return { killed: true, meat, name: spec.name, type: animal.type };
  }

  exportState() {
    return this.animals
      .filter((a) => !a.dead)
      .map((a) => ({
        id: a.id,
        type: a.type,
        x: a.x,
        y: a.y,
        z: a.z,
        hp: a.hp,
        yaw: a.yaw,
        state: a.state,
      }));
  }

  importState(list) {
    if (!Array.isArray(list) || !list.length) return;
    this.animals = [];
    let maxId = 1;
    for (const s of list) {
      const spec = this.getSpec(s.type);
      if (!spec) continue;
      const a = this._make(spec, s.x, s.y, s.z);
      a.id = s.id || a.id;
      a.hp = s.hp ?? spec.hp;
      a.yaw = s.yaw || 0;
      a.state = s.state || 'wander';
      this.animals.push(a);
      maxId = Math.max(maxId, a.id + 1);
    }
    this._nextId = maxId;
  }

  living() {
    return this.animals.filter((a) => !a.dead);
  }
}
