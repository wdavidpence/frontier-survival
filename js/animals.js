/**
 * Wildlife simulation — pure movement/AI helpers + manager.
 * Prey flee; predators hunt (worse at night). Meat drops on death.
 */
import { isSolid, BLOCK } from './blocks.js?v=293';
import { hash2 } from './gen.js?v=316';
import { biomeAt, BIOME } from './biomes.js?v=270';

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
    count: 5,
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
    count: 3,
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
    count: 4,
    tropical: true,
  },
  chicken: {
    id: 'chicken',
    name: 'Chicken',
    hp: 8,
    speed: 5.0,
    hostile: false,
    fleeRange: 12,
    senseRange: 13,
    damage: 0,
    attackRange: 0,
    attackCd: 99,
    meatMin: 1,
    meatMax: 2,
    feedItem: 'seeds',
    color: [0.6, 0.4, 0.3],
    scale: [0.55, 0.45, 0.65],
    count: 10,
    tropical: true,
  },
  cow: {
    id: 'cow',
    name: 'Cow',
    hp: 40,
    speed: 3.2,
    hostile: false,
    fleeRange: 10,
    senseRange: 14,
    damage: 0,
    attackRange: 0,
    attackCd: 99,
    meatMin: 2,
    meatMax: 4,
    feedItem: 'berries', // ITEM.BERRIES (herbivore)
    color: [0.55, 0.42, 0.3],
    scale: [1.0, 1.3, 1.6],
    count: 2,
    wideRange: true,
  },
  pig: {
    id: 'pig', name: 'Pig', hp: 20, speed: 3.6, hostile: false,
    fleeRange: 10, senseRange: 13, damage: 0, attackRange: 0, attackCd: 99,
    meatMin: 1, meatMax: 3, feedItem: 'berries', color: [0.82, 0.48, 0.48],
    scale: [0.72, 0.72, 1.08], count: 4, wideRange: true,
  },
  horse: {
    id: 'horse', name: 'Horse', hp: 34, speed: 5.8, hostile: false,
    fleeRange: 13, senseRange: 16, damage: 0, attackRange: 0, attackCd: 99,
    meatMin: 1, meatMax: 2, feedItem: 'berries', color: [0.52, 0.32, 0.18],
    scale: [0.78, 1.22, 1.45], count: 2, wideRange: true,
  },
  sheep: {
    id: 'sheep', name: 'Sheep', hp: 18, speed: 3.1, hostile: false,
    fleeRange: 11, senseRange: 13, damage: 0, attackRange: 0, attackCd: 99,
    meatMin: 1, meatMax: 2, feedItem: 'berries', color: [0.76, 0.72, 0.62],
    scale: [0.76, 0.86, 1.02], count: 3, wideRange: true,
  },
  lamb: {
    id: 'lamb', name: 'Lamb', hp: 10, speed: 3.8, hostile: false,
    fleeRange: 10, senseRange: 12, damage: 0, attackRange: 0, attackCd: 99,
    meatMin: 1, meatMax: 1, feedItem: 'berries', color: [0.86, 0.82, 0.72],
    scale: [0.52, 0.60, 0.72], count: 3, wideRange: true,
  },
  alligator: {
    id: 'alligator',
    name: 'Alligator',
    hp: 45,
    speed: 3.0,
    hostile: true,
    fleeRange: 0,
    senseRange: 12,
    nightSense: 17,
    damage: 14,
    attackRange: 1.5,
    attackCd: 1.5,
    meatMin: 2,
    meatMax: 4,
    feedItem: 'raw_meat', // ITEM.RAW_MEAT (hostile — never tameable)
    color: [0.25, 0.38, 0.18],
    scale: [0.6, 0.55, 1.8],
    count: 3,
    aquatic: true, // comfortable in/near water; spawns near water tiles
    tropical: true,
  },
  fox: {
    id: 'fox',
    name: 'Fox',
    hp: 15,
    speed: 4.2,
    hostile: false,
    fleeRange: 9,
    senseRange: 13,
    damage: 0,
    attackRange: 0,
    attackCd: 99,
    meatMin: 1,
    meatMax: 2,
    feedItem: 'berries', // ITEM.BERRIES (omnivore)
    color: [0.75, 0.42, 0.18],
    scale: [0.4, 0.45, 0.65],
    count: 4,
  },
  boar: {
    id: 'boar',
    name: 'Boar',
    hp: 35,
    speed: 3.8,
    hostile: true,
    fleeRange: 0,
    senseRange: 7, // short fuse — charges when player gets close
    nightSense: 12,
    damage: 12, // tusk charge
    attackRange: 1.3,
    attackCd: 1.5,
    meatMin: 2,
    meatMax: 3,
    feedItem: 'raw_meat', // ITEM.RAW_MEAT (hostile — never tameable)
    color: [0.42, 0.30, 0.18],
    scale: [0.65, 0.7, 1.0], // stocky, low to ground
    count: 4,
  },
  bat: {
    id: 'bat',
    name: 'Bat',
    hp: 6,
    speed: 7.0, // fast flyer
    hostile: false,
    fleeRange: 12,
    senseRange: 15, // echolocation — good awareness
    nightSense: 20, // even better at night (nocturnal)
    damage: 0,
    attackRange: 0,
    attackCd: 99,
    meatMin: 0,
    meatMax: 1,
    wing: true, // drops bat wing on death
    color: [0.28, 0.22, 0.3],
    scale: [0.25, 0.2, 0.35],
    nocturnal: true, // primarily active at night
    count: 5,
  },
  tropical_fish: {
    id: 'tropical_fish', name: 'Tropical Fish', hp: 3, speed: 4.8,
    hostile: false, fleeRange: 7, senseRange: 10, damage: 0, attackRange: 0, attackCd: 99,
    meatMin: 0, meatMax: 1, color: [0.95, 0.35, 0.12], scale: [0.28, 0.22, 0.62], count: 4,
    aquatic: true, school: true, swimDepth: 2.2, tropical: true,
  },
  sea_turtle: {
    id: 'sea_turtle', name: 'Sea Turtle', hp: 24, speed: 2.4,
    hostile: false, fleeRange: 8, senseRange: 12, damage: 0, attackRange: 0, attackCd: 99,
    meatMin: 1, meatMax: 2, color: [0.18, 0.48, 0.3], scale: [0.72, 0.32, 1.05], count: 2,
    aquatic: true, swimDepth: 0.9, tropical: true,
  },
  reef_shark: {
    id: 'reef_shark', name: 'Reef Shark', hp: 42, speed: 3.8,
    hostile: true, fleeRange: 0, senseRange: 8, nightSense: 11, damage: 12, attackRange: 1.5, attackCd: 1.7,
    meatMin: 2, meatMax: 3, color: [0.28, 0.42, 0.5], scale: [0.58, 0.42, 1.55], count: 1,
    aquatic: true, swimDepth: 2.8, cautious: true, tropical: true,
  },
  dolphin: {
    id: 'dolphin', name: 'Dolphin', hp: 18, speed: 5.4, hostile: false,
    fleeRange: 10, senseRange: 15, damage: 0, attackRange: 0, attackCd: 99,
    meatMin: 0, meatMax: 0, color: [0.28, 0.52, 0.68], scale: [0.48, 0.42, 1.35], count: 3,
    aquatic: true, swimDepth: 1.0, tropical: true, playful: true,
  },
  octopus: {
    id: 'octopus', name: 'Octopus', hp: 28, speed: 2.6, hostile: false,
    fleeRange: 8, senseRange: 12, damage: 0, attackRange: 0, attackCd: 99,
    meatMin: 1, meatMax: 2, color: [0.46, 0.18, 0.34], scale: [0.62, 0.72, 0.72], count: 2,
    aquatic: true, swimDepth: 3.6, tropical: true, ink: true,
  },
  crab: {
    id: 'crab', name: 'Reef Crab', hp: 7, speed: 2.2,
    hostile: false, fleeRange: 5, senseRange: 8, damage: 0, attackRange: 0, attackCd: 99,
    meatMin: 1, meatMax: 1, color: [0.82, 0.22, 0.12], scale: [0.42, 0.28, 0.5], count: 2,
    aquatic: true, swimDepth: 0.25, tropical: true,
  },
  parrot: {
    id: 'parrot', name: 'Parrot', hp: 4, speed: 6.2,
    hostile: false, fleeRange: 10, senseRange: 14, damage: 0, attackRange: 0, attackCd: 99,
    meatMin: 0, meatMax: 0, egg: true, feather: true, feedItem: 'seeds',
    color: [0.12, 0.72, 0.38], scale: [0.3, 0.24, 0.38], count: 4, tropical: true,
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

function waterSurfaceY(world, x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  for (let y = 40; y >= 1; y--) {
    if (world.getBlock(xi, y, zi) === BLOCK.WATER) return y;
  }
  return null;
}

function dist2(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

const STARTER_ENCOUNTER_OFFSETS = Object.freeze([
  [8, 14], [8, 12], [10, 14], [6, 14],
  [8, 16], [10, 12], [6, 12], [8, 10],
]);
const STARTER_ENCOUNTER_MIN_RADIUS = 10;
const STARTER_ENCOUNTER_MAX_RADIUS = 16;

/**
 * Find a deterministic, walkable passive encounter just outside the spawn ring.
 * The returned cell is guaranteed to have solid non-water ground and two clear
 * air blocks for the animal; occupied cells are skipped by integer cell.
 * @param {{getBlock:function(number,number,number):number,radiusChunks?:number}} world
 * @param {number} seed
 * @param {Array<{x:number,z:number,dead?:boolean}>} occupied
 * @param {{x?:number,z?:number}} origin
 * @returns {{x:number,y:number,z:number,distance:number}|null}
 */
export function findStarterEncounterSpawn(world, seed = 1, occupied = [], origin = { x: 0, z: 0 }) {
  if (!world || typeof world.getBlock !== 'function') return null;
  const ox = Number.isFinite(origin?.x) ? origin.x : 0;
  const oz = Number.isFinite(origin?.z) ? origin.z : 0;
  const seedIndex = Number.isFinite(seed)
    ? Math.floor(Math.abs(seed)) % STARTER_ENCOUNTER_OFFSETS.length
    : 0;
  const worldRadius = Number.isFinite(world.radiusChunks)
    ? world.radiusChunks * 16 - 4
    : Infinity;
  for (let i = 0; i < STARTER_ENCOUNTER_OFFSETS.length; i++) {
    const [dx, dz] = STARTER_ENCOUNTER_OFFSETS[(seedIndex + i) % STARTER_ENCOUNTER_OFFSETS.length];
    const x = ox + dx;
    const z = oz + dz;
    const distance = Math.hypot(dx, dz);
    if (distance < STARTER_ENCOUNTER_MIN_RADIUS || distance > STARTER_ENCOUNTER_MAX_RADIUS
      || Math.max(Math.abs(x), Math.abs(z)) > worldRadius) continue;
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    if (occupied.some((a) => a && !a.dead && Math.floor(a.x) === xi && Math.floor(a.z) === zi)) continue;
    const y = groundY(world, x, z);
    const ground = world.getBlock(xi, y - 1, zi);
    if (!isSolid(ground) || ground === BLOCK.WATER) continue;
    if (world.getBlock(xi, y, zi) !== BLOCK.AIR || world.getBlock(xi, y + 1, zi) !== BLOCK.AIR) continue;
    return { x, y, z, distance };
  }
  return null;
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
        const minR = spec.aquatic ? 20 : (spec.hostile ? 22 : 10);
        const rad = minR + hash2(placed + 3, this.seed + n + attempts) * Math.max(4, r - minR);
        const x = Math.cos(ang) * rad;
        const z = Math.sin(ang) * rad;
        if (Math.hypot(x, z) < minR) continue;
        const y = groundY(this.world, x, z);
        const localBiome = biomeAt(x, z, this.seed);
        const isTropical = localBiome === BIOME.TROPICAL || localBiome === BIOME.SHORE || localBiome === BIOME.OCEAN;
        if (!spec.wideRange && isTropical !== !!spec.tropical && !spec.aquatic) continue;
        if (!isTropical && spec.tropical && !spec.wideRange) continue;
        // aquatic species prefer water; others avoid it
        if (spec.aquatic) {
          const biome = biomeAt(x, z, this.seed);
          if (biome !== BIOME.OCEAN && biome !== BIOME.TROPICAL) continue;
          if (waterSurfaceY(this.world, x, z) === null) continue;
        } else {
          if (this.world.getBlock(x, y - 1, z) === BLOCK.WATER) continue;
        }
        const animal = this._make(spec, x, y, z);
        if (spec.aquatic) animal.y = waterSurfaceY(this.world, x, z) - (spec.swimDepth || 0.8);
        this.animals.push(animal);
        placed++;
        n++;
      }
    }

    this.ensureStarterEncounterNear(0, 0);
  }

  /** Ensure one passive route encounter is available around an actual player start. */
  ensureStarterEncounterNear(x = 0, z = 0) {
    const hasPassive = this.animals.some((a) => {
      const spec = this.getSpec(a.type);
      return !a.dead && !spec.hostile && Math.hypot(a.x - x, a.z - z) >= STARTER_ENCOUNTER_MIN_RADIUS
        && Math.hypot(a.x - x, a.z - z) <= STARTER_ENCOUNTER_MAX_RADIUS;
    });
    if (hasPassive) return false;
    const authored = findStarterEncounterSpawn(this.world, this.seed, this.animals, { x, z });
    if (!authored) return false;
    const tropicalStart = [BIOME.TROPICAL, BIOME.SHORE, BIOME.OCEAN].includes(biomeAt(x, z, this.seed));
    const preferred = tropicalStart ? [SPECIES.parrot, SPECIES.chicken, SPECIES.bird] : [SPECIES.hare, SPECIES.deer];
    const spec = preferred.find((candidate) => candidate && this.countLiving(candidate.id) < candidate.count);
    if (!spec) return false;
    this.animals.push(this._make(spec, authored.x, authored.y, authored.z));
    return true;
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
    const id = this._nextId++;
    const attentionSeed = hash2(this.seed + id * 13, 71 + spec.id.length);
    const motionSeed = hash2(this.seed + id * 17, 173 + spec.id.length);
    return {
      id,
      type: spec.id,
      x,
      y,
      z,
      vx: 0,
      vz: 0,
      hp: spec.hp,
      maxHp: spec.hp,
      yaw: motionSeed * Math.PI * 2,
      state: 'wander',
      attention: attentionSeed < 0.5 ? 'idle' : 'browse',
      _attentionT: 1.8 + attentionSeed * 2.4,
      _attentionPhase: attentionSeed < 0.5 ? 0 : 1,
      attackTimer: 0,
      wanderT: 1 + motionSeed * 3,
      targetX: x,
      targetZ: z,
      dead: false,
      shearedT: 0,
      nesting: false,
      nestT: spec.id === 'sea_turtle' ? 12 + motionSeed * 16 : 0,
      nestEggs: spec.id === 'sea_turtle' ? 0 : undefined,
      mounted: false,
      juvenileT: 0,
      breedT: 0,
      rootingT: 0,
    };
  }

  getSpec(type) {
    return SPECIES[type] || SPECIES.hare;
  }

  /**
   * @param {number} dt
   * @param {{x:number,y:number,z:number,id?:string}|Array<{x:number,y:number,z:number,id?:string}>} playerOrPlayers
   *   Solo: one player object. Coop: array of players (id 'p1'|'p2'); nearest is targeted.
   * @param {boolean} isNight
   * @param {{ senseMult?: number, damageMult?: number, hostilePolicy?: 'off'|'provoke'|'cautious'|'hunt' }} [opts]
   * @returns {{ playerDamage: number, player2Damage: number, kills: object[] }}
   */
  tick(dt, playerOrPlayers, isNight, opts = {}) {
    let playerDamage = 0;
    let player2Damage = 0;
    const kills = [];
    const list = Array.isArray(playerOrPlayers)
      ? playerOrPlayers.filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.z))
      : playerOrPlayers && Number.isFinite(playerOrPlayers.x)
        ? [{ ...playerOrPlayers, id: playerOrPlayers.id || 'p1' }]
        : [];
    const senseMult = opts.senseMult ?? 1;
    const damageMult = opts.damageMult ?? 1;
    const hostilePolicy = opts.hostilePolicy || 'hunt';

    for (const a of this.animals) {
      if (a.dead) continue;
      const spec = this.getSpec(a.type);
      a.attackTimer = Math.max(0, a.attackTimer - dt);
      if (a.shearedT > 0) a.shearedT = Math.max(0, a.shearedT - dt);
      if (a.juvenileT > 0) a.juvenileT = Math.max(0, a.juvenileT - dt);
      if (a.breedT > 0) a.breedT = Math.max(0, a.breedT - dt);
      if (a.rootingT > 0) a.rootingT = Math.max(0, a.rootingT - dt);
      if (a.mounted) {
        a.vx = 0; a.vz = 0;
        continue;
      }
      if (a.nesting) {
        a.nestT -= dt;
        a.vx = 0; a.vz = 0;
        if (a.nestT <= 0) { a.nesting = false; a.nestT = 34; }
        continue;
      }
      if (spec.id === 'pig' && !a.tamed && a.state === 'wander') {
        a._rootT = (a._rootT ?? (4 + hash2(this.seed + a.id * 5, 441) * 6)) - dt;
        if (a._rootT <= 0) { a.attention = 'browse'; a.rootingT = 3; a._rootT = 7 + hash2(this.seed + a.id * 7, 443) * 5; }
      }
      // Nearest living target among player list (solo = one entry)
      let nearest = null;
      let dist = Infinity;
      for (const pl of list) {
        const d = Math.sqrt(dist2(a.x, a.z, pl.x, pl.z));
        if (d < dist) {
          dist = d;
          nearest = pl;
        }
      }
      const px = nearest ? nearest.x : 0;
      const pz = nearest ? nearest.z : 0;
      const targetId = nearest?.id === 'p2' ? 'p2' : 'p1';
      if (spec.school) {
        const school = this.animals.filter(other => !other.dead && other.type === a.type && Math.hypot(other.x - a.x, other.z - a.z) < 14);
        if (school.length > 1) {
          const cx = school.reduce((sum, other) => sum + other.x, 0) / school.length;
          const cz = school.reduce((sum, other) => sum + other.z, 0) / school.length;
          const scatter = (hash2(this.seed + a.id * 19, 557) - 0.5) * 4;
          a.targetX = cx + scatter;
          a.targetZ = cz - scatter;
        }
      }
      if (spec.id === 'sea_turtle' && a.nestT > 0) {
        a.nestT -= dt;
        if (a.nestT <= 0 && (!nearest || dist > 10)) {
          a.nesting = true;
          a.nestT = 11;
          a.nestEggs = 3;
        }
      }
      const sense = (isNight && spec.nightSense ? spec.nightSense : spec.senseRange) * senseMult;

      if (spec.hostile) {
        const aggro = !!(a.aggro || a._aggro);
        let wantChase = false;
        if (hostilePolicy === 'off' || damageMult <= 0 || senseMult <= 0) {
          wantChase = false;
          if (a.state === 'chase') a.state = 'wander';
          a._chaseTarget = null;
        } else if (a.tamed) {
          wantChase = false;
        } else if (aggro && nearest && dist < sense + 10) {
          wantChase = true;
        } else if (hostilePolicy === 'provoke') {
          // Minecraft-like: only fight back if hit
          wantChase = false;
        } else if (hostilePolicy === 'cautious' && nearest) {
          // Night close approach, or bump into personal space — not free long-range hunt
          const personal = Math.max(2.1, (spec.attackRange || 1.4) * 1.6);
          wantChase = (isNight && dist < sense * 0.38) || dist < personal;
        } else if (hostilePolicy === 'hunt' && nearest && dist < sense) {
          wantChase = true;
        }

        if (wantChase) {
          a.state = 'chase';
          a._chaseTarget = targetId;
        } else if (a.state === 'chase' && (!nearest || dist > sense + 8) && !aggro) {
          a.state = 'wander';
          a._chaseTarget = null;
        } else if (a.state === 'chase' && aggro && (!nearest || dist > sense + 14)) {
          a.state = 'wander';
          // keep aggro memory briefly so they resume if player returns
        }
      } else {
        if (a.tamed) {
            // Tamed — don't flee from player
        } else if (a._calmT > 0) { a._calmT -= dt; }
        else if (nearest && dist < spec.fleeRange) a.state = 'flee';
        else if (a.state === 'flee' && (!nearest || dist > spec.fleeRange + 5)) a.state = 'wander';
      }

      // Passive attention is a deterministic movement band consumed by the
      // renderer's speed01 signal; flee/chase retain their existing speeds.
      if (a.state === 'flee') {
        a.attention = 'flee';
      } else if (a.state === 'chase') {
        a.attention = 'alert';
      } else if (!spec.hostile) {
        if (a.attention === 'flee' || a.attention === 'alert') {
          a.attention = a._attentionPhase ? 'browse' : 'idle';
        }
        a._attentionT -= dt;
        if (a._attentionT <= 0) {
          a._attentionPhase = a._attentionPhase ? 0 : 1;
          a.attention = a._attentionPhase ? 'browse' : 'idle';
          a._attentionT = 1.8 + hash2(
            this.seed + a.id * 13 + a._attentionPhase,
            271 + spec.id.length,
          ) * 2.4;
        }
      }
      if (spec.id === 'pig' && a.rootingT > 0 && a.state === 'wander') a.attention = 'browse';

      let wishX = 0;
      let wishZ = 0;
      let speed = spec.speed;

      if (a.state === 'flee' && nearest) {
        const dx = a.x - px;
        const dz = a.z - pz;
        const len = Math.hypot(dx, dz) || 1;
        wishX = dx / len;
        wishZ = dz / len;
        speed *= 1.15;
      } else if (a.state === 'chase' && nearest) {
        const dx = px - a.x;
        const dz = pz - a.z;
        const len = Math.hypot(dx, dz) || 1;
        wishX = dx / len;
        wishZ = dz / len;
        if (isNight) speed *= 1.12;
        if (dist < spec.attackRange && a.attackTimer <= 0) {
          const amt = spec.damage * damageMult;
          if (targetId === 'p2') player2Damage += amt;
          else playerDamage += amt;
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
          if (!spec.hostile) {
            speed *= a.attention === 'idle' ? 0.14 : a.attention === 'browse' ? 0.52 : 1;
          }
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
      // Aquatic species stay in water columns; land species slow at the edge.
      if (spec.aquatic) {
        const waterY = waterSurfaceY(this.world, nx, nz);
        if (waterY === null) {
          nx = a.x;
          nz = a.z;
        } else {
          a.y = waterY - (spec.swimDepth || 0.8);
        }
      } else if (this.world.getBlock(nx, gy - 1, nz) === BLOCK.WATER) {
        nx = a.x * 0.7 + nx * 0.3;
        nz = a.z * 0.7 + nz * 0.3;
      }
      a.x = nx;
      a.z = nz;
      if (!spec.aquatic) a.y = groundY(this.world, a.x, a.z);

      // Streaming supplies the frontier; retain only an extreme numeric safety limit.
      const lim = 100000;
      a.x = Math.max(-lim, Math.min(lim, a.x));
      a.z = Math.max(-lim, Math.min(lim, a.z));
    }

    // remove long-dead
    this.animals = this.animals.filter((a) => !a.dead || a._corpseT === undefined || a._corpseT > 0);
    for (const a of this.animals) {
      if (a.dead && a._corpseT !== undefined) a._corpseT -= dt;
    }

    return { playerDamage, player2Damage, kills };
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
   * @returns {{ killed: boolean, meat: number, hide: number, egg?: number, feather?: number, wing?: number, name: string, type?: string } | null}
   */
  damageAnimal(animal, amount) {
    if (!animal || animal.dead) return null;
    animal.hp -= amount;
    animal.aggro = true;
    animal._aggro = true;
    animal.state = this.getSpec(animal.type).hostile ? 'chase' : 'flee';
    if (animal.hp > 0) return { killed: false, meat: 0, hide: 0, ink: !!this.getSpec(animal.type).ink, name: this.getSpec(animal.type).name };
    animal.dead = true;
    animal._corpseT = 0;
    const spec = this.getSpec(animal.type);
    const meat = meatDropCount(spec);
    let hide = 0;
    if (animal.type === 'deer') hide = 1 + (Math.random() < 0.5 ? 1 : 0);
    else if (animal.type === 'hare') hide = Math.random() < 0.65 ? 1 : 0;
    else if (animal.type === 'wolf') hide = Math.random() < 0.4 ? 1 : 0;
    else if (animal.type === 'bear') hide = 2 + (Math.random() < 0.5 ? 1 : 0);
    else if (animal.type === 'cow') hide = 2 + (Math.random() < 0.6 ? 1 : 0);
    else if (animal.type === 'alligator') hide = 2 + (Math.random() < 0.7 ? 1 : 0);
    else if (animal.type === 'fox') hide = Math.random() < 0.6 ? 1 : 0;
    else if (animal.type === 'boar') hide = 2 + (Math.random() < 0.6 ? 1 : 0);
    else if (animal.type === 'bat') hide = Math.random() < 0.3 ? 1 : 0;
    let egg = 0;
    let feather = 0;
    let wing = 0;
    if (spec.egg) egg = Math.random() < 0.75 ? 1 : 0;
    if (spec.feather) feather = 1 + (Math.random() < 0.5 ? 1 : 0);
    if (spec.wing) wing = Math.random() < 0.65 ? 1 : 0;
    return { killed: true, meat, hide, egg, feather, wing, name: spec.name, type: animal.type };
  }

  shearAnimal(animal) {
    if (!animal || animal.dead || !['sheep', 'lamb'].includes(animal.type)) return { ok: false, wool: 0, reason: 'not-shearable' };
    if ((animal.shearedT || 0) > 0) return { ok: false, wool: 0, reason: 'fleece-regrowing' };
    animal.shearedT = animal.type === 'lamb' ? 55 : 75;
    return { ok: true, wool: animal.type === 'lamb' ? 1 : 2, regrowT: animal.shearedT };
  }

  findBreedPartner(animal) {
    if (!animal || animal.dead || !animal.tamed || (animal.breedT || 0) > 0) return null;
    return this.animals.find(other => other !== animal && !other.dead && other.type === animal.type && other.tamed && (other.breedT || 0) <= 0 && Math.hypot(other.x - animal.x, other.z - animal.z) <= 4.5) || null;
  }

  breedAnimal(animal) {
    const partner = this.findBreedPartner(animal);
    if (!partner) return { ok: false, child: null };
    const spec = this.getSpec(animal.type);
    const child = this._make(spec, (animal.x + partner.x) * 0.5, Math.min(animal.y, partner.y), (animal.z + partner.z) * 0.5);
    child.tamed = true;
    child.juvenileT = 120;
    child.breedT = 120;
    animal.breedT = 120;
    partner.breedT = 120;
    this.animals.push(child);
    return { ok: true, child, partner };
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
    // practical band derived from typical fog/view range so passive prey
    // respawn just past sight rather than at map-spanning distances
    const RESPAWN_MIN_RADIUS = 18;
    const RESPAWN_MAX_RADIUS = 42;
    for (const spec of Object.values(SPECIES)) {
      if (spec.hostile) continue;
      const living = this.countLiving(spec.id);
      if (living >= spec.count) continue;
      // spawn out of immediate view, but within the practical band
      for (let attempt = 0; attempt < 8; attempt++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = RESPAWN_MIN_RADIUS + Math.random() * (RESPAWN_MAX_RADIUS - RESPAWN_MIN_RADIUS);
        const x = player.x + Math.cos(ang) * rad;
        const z = player.z + Math.sin(ang) * rad;
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
        shearedT: a.shearedT || 0,
        nesting: !!a.nesting,
        nestT: a.nestT || 0,
        nestEggs: a.nestEggs || 0,
        juvenileT: a.juvenileT || 0,
        breedT: a.breedT || 0,
        rootingT: a.rootingT || 0,
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
      a.shearedT = Number.isFinite(s.shearedT) ? Math.max(0, s.shearedT) : 0;
      a.nesting = s.nesting === true;
      a.nestT = Number.isFinite(s.nestT) ? Math.max(0, s.nestT) : a.nestT;
      a.nestEggs = Number.isFinite(s.nestEggs) ? Math.max(0, s.nestEggs | 0) : a.nestEggs;
      a.juvenileT = Number.isFinite(s.juvenileT) ? Math.max(0, s.juvenileT) : 0;
      a.breedT = Number.isFinite(s.breedT) ? Math.max(0, s.breedT) : 0;
      a.rootingT = Number.isFinite(s.rootingT) ? Math.max(0, s.rootingT) : 0;
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
const _FEED_ID = { berries: 115, raw_meat: 106, seeds: 116 };

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
