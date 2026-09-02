/**
 * Minecraft-class interaction juice: world drops, sneak, chew, leaf decay.
 * Pure helpers — no DOM / THREE.
 */

export const STAND_EYE = 1.55;
export const SNEAK_EYE = 1.18;
export const STAND_HEIGHT = 1.7;
export const SNEAK_HEIGHT = 1.45;
export const CHEW_SECONDS = 1.15;
export const MINE_PUNCH_SECONDS = 0.28;
export const HOTBAR_NAME_HOLD = 2.2;
export const DROP_PICKUP_DELAY = 0.45;
export const DROP_MAGNET_RANGE = 1.85;
export const DROP_COLLECT_RANGE = 0.9;
export const MAX_WORLD_DROPS = 48;
export const LEAF_SUPPORT_RANGE = 4;

export const LEAF_IDS = Object.freeze([7, 43, 45, 51, 59]);
export const LOG_IDS = Object.freeze([6, 42, 44, 58]);

const LEAF_SET = new Set(LEAF_IDS);
const LOG_SET = new Set(LOG_IDS);

export function isLeafId(id) {
  return LEAF_SET.has(id | 0);
}

export function isLogId(id) {
  return LOG_SET.has(id | 0);
}

export function eyeHeightForSneak(crouching, current = STAND_EYE, dt = 0) {
  const target = crouching ? SNEAK_EYE : STAND_EYE;
  const t = Math.min(1, Math.max(0, dt) * 14);
  return current + (target - current) * t;
}

export function bodyHeightForSneak(crouching, current = STAND_HEIGHT, dt = 0) {
  const target = crouching ? SNEAK_HEIGHT : STAND_HEIGHT;
  const t = Math.min(1, Math.max(0, dt) * 14);
  return current + (target - current) * t;
}

export function sneakHeadroomBlocked(getBlock, x, y, z, isSolidFn) {
  return !!isSolidFn(getBlock(x, y + STAND_HEIGHT - 0.05, z));
}

export function sneakBlocksAxis(onGround, crouching, nextSupported) {
  return !!(onGround && crouching && !nextSupported);
}

export function spawnWorldDrop({
  id,
  count = 1,
  x,
  y,
  z,
  vx = 0,
  vy = 4.2,
  vz = 0,
  pickupDelay = DROP_PICKUP_DELAY,
} = {}) {
  return {
    id,
    count: Math.max(1, count | 0),
    x: Number(x) || 0,
    y: Number(y) || 0,
    z: Number(z) || 0,
    vx: Number(vx) || 0,
    vy: Number(vy) || 0,
    vz: Number(vz) || 0,
    age: 0,
    bob: 0,
    pickupDelay,
  };
}

export function throwDropFromLook(id, count, origin, look, speed = 5.5) {
  const lx = look?.x || 0;
  const ly = look?.y || 0;
  const lz = look?.z || 0;
  return spawnWorldDrop({
    id,
    count,
    x: (origin?.x || 0) + lx * 0.55,
    y: (origin?.y || 0) + ly * 0.55,
    z: (origin?.z || 0) + lz * 0.55,
    vx: lx * speed,
    vy: ly * speed + 2.4,
    vz: lz * speed,
    pickupDelay: 0.7,
  });
}

export function dropVisualY(drop) {
  return (drop?.y || 0) + Math.sin(drop?.bob || 0) * 0.08;
}

export function tickWorldDrop(drop, dt, {
  groundY = 0,
  player = null,
  magnetRange = DROP_MAGNET_RANGE,
  collectRange = DROP_COLLECT_RANGE,
} = {}) {
  if (!drop) return { drop: null, collected: false };
  const step = Math.max(0, Number(dt) || 0);
  drop.age += step;
  drop.bob += step * 4.2;
  drop.vy -= 18 * step;
  drop.x += drop.vx * step;
  drop.y += drop.vy * step;
  drop.z += drop.vz * step;
  const floor = Number(groundY);
  const hover = (Number.isFinite(floor) ? floor : drop.y) + 0.28;
  if (drop.y < hover) {
    drop.y = hover;
    drop.vy *= -0.38;
    drop.vx *= 0.62;
    drop.vz *= 0.62;
    if (Math.abs(drop.vy) < 0.85) drop.vy = 0;
    drop.vx *= 0.84;
    drop.vz *= 0.84;
  }
  let collected = false;
  if (player && drop.age >= drop.pickupDelay) {
    const dx = player.x - drop.x;
    const dy = (player.y + 0.9) - drop.y;
    const dz = player.z - drop.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < magnetRange) {
      const pull = Math.min(1, step * 9);
      drop.x += dx * pull;
      drop.y += dy * pull;
      drop.z += dz * pull;
    }
    collected = dist < collectRange;
  }
  return { drop, collected };
}

export function startChew(itemId) {
  if (itemId == null) return null;
  return { id: itemId, t: 0 };
}

export function tickChew(state, dt) {
  if (!state) return { state: null, done: false, progress: 0, crumb: false };
  const t = state.t + Math.max(0, Number(dt) || 0);
  const progress = Math.min(1, t / CHEW_SECONDS);
  const prevBeats = Math.floor(state.t / 0.22);
  const nextBeats = Math.floor(t / 0.22);
  if (t >= CHEW_SECONDS) {
    return { state: null, done: true, progress: 1, id: state.id, crumb: nextBeats > prevBeats };
  }
  return {
    state: { id: state.id, t },
    done: false,
    progress,
    id: state.id,
    crumb: nextBeats > prevBeats,
  };
}

export function knockbackVelocity(px, pz, ax, az, strength = 7.2) {
  let dx = (px || 0) - (ax || 0);
  let dz = (pz || 0) - (az || 0);
  const len = Math.hypot(dx, dz);
  if (len < 1e-4) {
    dx = 0;
    dz = 1;
  } else {
    dx /= len;
    dz /= len;
  }
  return { x: dx * strength, z: dz * strength, y: 3.15 };
}

export function hotbarNameTick(prevId, nextId, prevT, dt, hold = HOTBAR_NAME_HOLD) {
  if (nextId !== prevId) {
    return { id: nextId, t: nextId == null ? 0 : hold, visible: nextId != null };
  }
  const t = Math.max(0, (prevT || 0) - Math.max(0, Number(dt) || 0));
  return { id: nextId, t, visible: t > 0 && nextId != null };
}

export function leafHasLogSupport(getBlock, x, y, z, range = LEAF_SUPPORT_RANGE) {
  const r = range | 0;
  const ox = x | 0;
  const oy = y | 0;
  const oz = z | 0;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > r) continue;
        if (LOG_SET.has(getBlock(ox + dx, oy + dy, oz + dz) | 0)) return true;
      }
    }
  }
  return false;
}

export function collectUnsupportedLeaves(getBlock, origin, scan = 6, support = LEAF_SUPPORT_RANGE) {
  const out = [];
  const r = scan | 0;
  const ox = origin?.x | 0;
  const oy = origin?.y | 0;
  const oz = origin?.z | 0;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        const x = ox + dx;
        const y = oy + dy;
        const z = oz + dz;
        const id = getBlock(x, y, z) | 0;
        if (!LEAF_SET.has(id)) continue;
        if (!leafHasLogSupport(getBlock, x, y, z, support)) out.push({ x, y, z, id });
      }
    }
  }
  return out;
}

export function staggerLeafDecay(leaves, gap = 0.12) {
  return (leaves || []).map((leaf, i) => ({
    x: leaf.x,
    y: leaf.y,
    z: leaf.z,
    id: leaf.id,
    delay: i * gap,
  }));
}
