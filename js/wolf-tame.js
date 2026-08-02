/**
 * Pure wolf companion rules: raw-meat taming and sit/follow commands.
 * Runtime movement/combat remains in animals.js.
 */

export const WOLF_TAME_STATES = Object.freeze({
  WILD: 'wild',
  FOLLOW: 'follow',
  SIT: 'sit',
});

export const WOLF_TAME_MAX = 100;
export const WOLF_TAME_FEED_STEP = 25;
export const WOLF_FOLLOW_DISTANCE = 3.2;
export const WOLF_FEED_ITEM = 'raw_meat';
export const WOLF_FEED_ITEM_ID = 106;

function feedName(itemId) {
  if (typeof itemId === 'number') return itemId === WOLF_FEED_ITEM_ID ? WOLF_FEED_ITEM : null;
  return itemId === WOLF_FEED_ITEM ? WOLF_FEED_ITEM : null;
}

export function isWolf(animal) {
  return !!animal && animal.type === 'wolf' && !animal.dead;
}

export function isWolfTamed(animal) {
  return isWolf(animal) && animal.tamed === true;
}

export function wolfState(animal) {
  if (!isWolfTamed(animal)) return WOLF_TAME_STATES.WILD;
  return animal.wolfState === WOLF_TAME_STATES.SIT || animal.state === WOLF_TAME_STATES.SIT
    ? WOLF_TAME_STATES.SIT
    : WOLF_TAME_STATES.FOLLOW;
}

/** Feed a wolf raw meat. Mutates the animal, returning a deterministic result. */
export function feedWolf(animal, itemId) {
  const current = Number(animal?._tame) || 0;
  if (!isWolf(animal) || feedName(itemId) !== WOLF_FEED_ITEM) {
    return { fed: false, tameProgress: current, tamed: !!animal?.tamed, state: wolfState(animal) };
  }
  const tameProgress = Math.min(WOLF_TAME_MAX, current + WOLF_TAME_FEED_STEP);
  animal._tame = tameProgress;
  animal._calmT = Math.max(Number(animal._calmT) || 0, 60);
  if (tameProgress >= WOLF_TAME_MAX) {
    animal.tamed = true;
    animal.wolfState = WOLF_TAME_STATES.FOLLOW;
    animal.state = WOLF_TAME_STATES.FOLLOW;
  }
  return {
    fed: true,
    tameProgress,
    tamed: !!animal.tamed,
    calmT: animal._calmT,
    state: wolfState(animal),
  };
}

/** Toggle a tamed wolf between following and sitting. */
export function toggleWolfSit(animal) {
  if (!isWolfTamed(animal)) return { ok: false, state: WOLF_TAME_STATES.WILD };
  const state = wolfState(animal) === WOLF_TAME_STATES.SIT
    ? WOLF_TAME_STATES.FOLLOW
    : WOLF_TAME_STATES.SIT;
  animal.wolfState = state;
  animal.state = state;
  animal.vx = 0;
  animal.vz = 0;
  return { ok: true, state };
}

/** Pure follow intent used by the fauna integrator. */
export function wolfFollowIntent(animal, target, followDistance = WOLF_FOLLOW_DISTANCE) {
  if (!isWolfTamed(animal) || wolfState(animal) === WOLF_TAME_STATES.SIT || !target) {
    return { move: false, x: 0, z: 0, distance: Infinity };
  }
  // Pure callers (and save-restored entities before placement) may omit a
  // coordinate; treat that as the origin instead of producing NaN intent.
  const animalX = Number.isFinite(animal.x) ? animal.x : 0;
  const animalZ = Number.isFinite(animal.z) ? animal.z : 0;
  const targetX = Number.isFinite(target.x) ? target.x : 0;
  const targetZ = Number.isFinite(target.z) ? target.z : 0;
  const dx = targetX - animalX;
  const dz = targetZ - animalZ;
  const distance = Math.hypot(dx, dz);
  if (!Number.isFinite(distance) || distance <= followDistance) {
    return { move: false, x: 0, z: 0, distance };
  }
  return { move: true, x: dx / distance, z: dz / distance, distance };
}
