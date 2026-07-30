/**
 * Wildlife simulation — pure movement/AI helpers + manager.
 * Prey flee; predators hunt (worse at night). Meat drops on death.
 */
import { isSolid, BLOCK } from './blocks.js?v=182';
import { hash2 } from './gen.js?v=182';

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
    feedItem: 'berries', // ITEM.BERRIES
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
    feedItem: 'berries', // ITEM.BERRIES
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
    feedItem: 'raw_meat', // ITEM.RAW_MEAT (hostile — never tameable)
    color: [0.35, 0.35, 0.4],
    scale: [0.55, 0.55, 0.95],
    count: 3,
  },
  bear: {
    id: 'bear',
    name: 'Bear',
    hp: 55,
    speed: 3.9,
    hostile: true,
    fleeRange: 0,
    senseRange: 11,
    nightSense: 16,
    damage: 16,
    attackRange: 1.6,
    attackCd: 1.6,
    meatMin: 3,
    meatMax: 5,
    color: [0.45, 0.28, 0.14],
    scale: [0.9, 1.1, 1.4],
    count: 2,
  },
  bird: {
    id: 'bird',
    name: 'Bird',
    hp: 4,
    speed: 6.5,
    hostile: false,
    fleeRange: 10,
    senseRange: 12,
    damage: 0,
    attackRange: 0,
    attackCd: 99,
    meatMin: 0,
    meatMax: 0,
    egg: true,
    feather: true,
    color: [0.35, 0.45, 0.75],
    scale: [0.28, 0.22, 0.35],
    count: 8,
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
    this._respawnAcc = 0;
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
   * @param {{ senseMult?: number, damageMult?: number }} [opts]
   * @returns {{ playerDamage: number, kills: object[] }}
   */
  tick(dt, player, isNight, opts = {}) {
    let playerDamage = 0;
    const kills = [];
    const px = player.x;
    const pz = player.z;
    const senseMult = opts.senseMult ?? 1;
    const damageMult = opts.damageMult ?? 1;

    for (const a of this.animals) {
      if (a.dead) continue;
      const spec = this.getSpec(a.type);
      a.attackTimer = Math.max(0, a.attackTimer - dt);

      const d2 = dist2(a.x, a.z, px, pz);
      const dist = Math.sqrt(d2);
      const sense = (isNight && spec.nightSense ? spec.nightSense : spec.senseRange) * senseMult;

      if (spec.hostile) {
        if (!a.tamed && dist < sense) {
          a.state = 'chase';
        } else if (a.state === 'chase' && dist > sense + 6) {
          a.state = 'wander';
        }
      } else {
        if (a.tamed) {
            // Tamed — don't flee from player
        } else if (a._calmT > 0) { a._calmT -= dt; }
        else if (dist < spec.fleeRange) a.state = 'flee';
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
          playerDamage += spec.damage * damageMult;
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
   * @returns {{ killed: boolean, meat: number, hide: number, egg?: number, feather?: number, name: string, type?: string } | null}
   */
  damageAnimal(animal, amount) {
    if (!animal || animal.dead) return null;
    animal.hp -= amount;
    animal.state = this.getSpec(animal.type).hostile ? 'chase' : 'flee';
    if (animal.hp > 0) return { killed: false, meat: 0, hide: 0, name: this.getSpec(animal.type).name };
    animal.dead = true;
    animal._corpseT = 0;
    const spec = this.getSpec(animal.type);
    const meat = meatDropCount(spec);
    let hide = 0;
    if (animal.type === 'deer') hide = 1 + (Math.random() < 0.5 ? 1 : 0);
    else if (animal.type === 'hare') hide = Math.random() < 0.65 ? 1 : 0;
    else if (animal.type === 'wolf') hide = Math.random() < 0.4 ? 1 : 0;
    else if (animal.type === 'bear') hide = 2 + (Math.random() < 0.5 ? 1 : 0);
    let egg = 0;
    let feather = 0;
    if (spec.egg) egg = Math.random() < 0.75 ? 1 : 0;
    if (spec.feather) feather = 1 + (Math.random() < 0.5 ? 1 : 0);
    return { killed: true, meat, hide, egg, feather, name: spec.name, type: animal.type };
  }

  /** Count living of type */
  countLiving(type) {
    return this.animals.filter((a) => !a.dead && (!type || a.type === type)).length;
  }

  /**
   * Slow prey respawn (SC ecology pressure fix).
   * @param {number} dt
   * @param {{x:number,z:number}} player
   */
  tickRespawn(dt, player) {
    this._respawnAcc += dt;
    if (this._respawnAcc < 25) return;
    this._respawnAcc = 0;
    const r = this.world.radiusChunks * 16 - 6;
    for (const spec of Object.values(SPECIES)) {
      if (spec.hostile) continue;
      const living = this.countLiving(spec.id);
      if (living >= spec.count) continue;
      // spawn far from player
      for (let attempt = 0; attempt < 8; attempt++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = 18 + Math.random() * Math.max(6, r - 18);
        const x = Math.cos(ang) * rad;
        const z = Math.sin(ang) * rad;
        if (dist2(x, z, player.x, player.z) < 14 * 14) continue;
        const y = groundY(this.world, x, z);
        if (this.world.getBlock(x, y - 1, z) === BLOCK.WATER) continue;
        this.animals.push(this._make(spec, x, y, z));
        break;
      }
    }
  }

  /** Snare trap damage when animal stands on SNARE block */
  applySnares(dt) {
    let hits = 0;
    for (const a of this.animals) {
      if (a.dead) continue;
      const id = this.world.getBlock(a.x, a.y, a.z);
      const idFeet = this.world.getBlock(a.x, a.y - 0.1, a.z);
      if (id === BLOCK.SNARE || idFeet === BLOCK.SNARE) {
        a._snareT = (a._snareT || 0) + dt;
        if (a._snareT >= 0.7) {
          a._snareT = 0;
          a.hp -= 6;
          a.state = this.getSpec(a.type).hostile ? 'chase' : 'flee';
          hits++;
          if (a.hp <= 0) {
            a.dead = true;
            a._corpseT = 0;
          }
        }
      }
    }
    return hits;
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

/** Item name → ITEM ID lookup for feedItem matching. */
const _FEED_ID = { berries: 115, raw_meat: 106 };

/**
 * Pure check — can this animal eat this item?
 * Non-hostile animals accept their species feedItem. Hostile (wolf, bear) never tameable
 * but can still be fed their feedItem for calm only.
 * @param {object} animal — { type, _tame?, tamed? }
 * @param {number|string} itemId — ITEM.BERRIES, ITEM.RAW_MEAT, or string name
 * @returns {boolean}
 */
export function canFeed(animal, itemId) {
  if (!animal || animal.dead) return false;
  const spec = SPECIES[animal.type];
  if (!spec || !spec.feedItem) return false;
  const feedId = typeof itemId === 'number' ? itemId : _FEED_ID[itemId];
  const feedName = typeof itemId === 'number'
    ? Object.keys(_FEED_ID).find((k) => _FEED_ID[k] === itemId)
    : itemId;
  return spec.feedItem === feedName || spec.feedItem === String(feedId);
}

/**
 * Pure — attempt to feed an animal. Mutates the animal object in place.
 * Sets _calmT (temporary calm state duration) and _tame progress (0–100).
 * When tame >= 100, marks animal.tamed = true. Hostile animals get calm but
 * no tame progress (never tameable).
 * @param {object} animal — { type, _tame?, tamed?, dead? }
 * @param {number|string} itemId — ITEM.BERRIES, ITEM.RAW_MEAT, or string name
 * @returns {{ fed: boolean, calmT: number, tameProgress: number, tamed: boolean }}
 */
export function tryFeed(animal, itemId) {
  if (!animal || animal.dead) return { fed: false, calmT: 0, tameProgress: 0, tamed: !!animal.tamed };
  const spec = SPECIES[animal.type];
  if (!spec || !spec.feedItem) return { fed: false, calmT: 0, tameProgress: 0, tamed: !!animal.tamed };

  const feedId = typeof itemId === 'number' ? itemId : _FEED_ID[itemId];
  const feedName = typeof itemId === 'number'
    ? Object.keys(_FEED_ID).find((k) => _FEED_ID[k] === itemId)
    : itemId;

  if (spec.feedItem !== feedName && spec.feedItem !== String(feedId)) {
    return { fed: false, calmT: 0, tameProgress: 0, tamed: !!animal.tamed };
  }

  // Feed accepted — calm for 60s, tame progress +15 (hostile gets no tame)
  animal._calmT = Math.max(animal._calmT || 0, 60);
  let tameProgress = animal._tame || 0;

  if (!spec.hostile) {
    tameProgress = Math.min(100, tameProgress + 15);
    animal._tame = tameProgress;

    // Non-hostile animals become tamed at 100
    if (tameProgress >= 100) {
      animal.tamed = true;
    }
  }

  return { fed: true, calmT: animal._calmT, tameProgress, tamed: !!animal.tamed };
}
