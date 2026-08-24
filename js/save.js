/**
 * Save game serialization — pure logic (no DOM).
 * World edits are sparse [x,y,z,id] tuples applied after regen from seed.
 */

export const SAVE_VERSION = 2;
export const SAVE_KEY = 'frontier_survival_save_v1';

function packPlayer(player) {
  if (!player) return null;
  return {
    x: player.x,
    y: player.y,
    z: player.z,
    yaw: player.yaw,
    pitch: player.pitch,
    hotbarIndex: player.hotbarIndex,
    slots: (player.slots || []).map((s) => ({
      id: s.id,
      count: s.count,
      ...(s.age != null ? { age: s.age } : {}),
      ...(s.dur != null ? { dur: s.dur } : {}),
    })),
    equipment: player.equipment || { head: null, chest: null, feet: null },
  };
}

function packSurvival(survival) {
  if (!survival) return null;
  return {
    health: survival.health,
    maxHealth: survival.maxHealth,
    hunger: survival.hunger,
    maxHunger: survival.maxHunger,
    stamina: survival.stamina,
    maxStamina: survival.maxStamina,
    bodyTemp: survival.bodyTemp,
    sleep: survival.sleep,
    wetness: survival.wetness,
    warmthFromClothes: survival.warmthFromClothes || 0,
    dead: !!survival.dead,
    causeOfDeath: survival.causeOfDeath || null,
    bleed: survival.bleed || 0,
  };
}

function packBoat(boat) {
  if (!boat || typeof boat !== 'object') return null;
  const fields = ['x', 'y', 'z', 'yaw', 'vx', 'vz'];
  if (!fields.every((key) => typeof boat[key] === 'number' && Number.isFinite(boat[key]))) return null;
  const rider = boat.mounted && boat.rider === 'p1' ? 'p1' : null;
  return { x: boat.x, y: boat.y, z: boat.z, yaw: boat.yaw, vx: boat.vx, vz: boat.vz, rider, mounted: rider !== null };
}

function parseBoat(boat) {
  if (!boat || typeof boat !== 'object') return null;
  const fields = ['x', 'y', 'z', 'yaw', 'vx', 'vz'];
  if (!fields.every((key) => typeof boat[key] === 'number' && Number.isFinite(boat[key]))) return null;
  const rider = boat.mounted === true && boat.rider === 'p1' ? 'p1' : null;
  return { x: boat.x, y: boat.y, z: boat.z, yaw: boat.yaw, vx: boat.vx, vz: boat.vz, rider, mounted: rider !== null };
}

/**
 * @param {object} state
 * @param {number} state.seed
 * @param {string} [state.mode]
 * @param {string} [state.playMode]
 * @param {object} state.survival
 * @param {object} [state.survival2]
 * @param {object} state.time
 * @param {object} state.player
 * @param {object} [state.player2]
 * @param {object} [state.boat]
 * @param {Array} state.edits
 * @param {object} [state.destination]
 * @param {object} [state.pressure]
 * @param {object} [state.workshop]
 */
export function buildSavePayload(state) {
  return {
    v: SAVE_VERSION,
    savedAt: Date.now(),
    seed: state.seed,
    mode: state.mode || 'survival',
    playMode: state.playMode === 'coop' ? 'coop' : 'solo',
    survival: packSurvival(state.survival),
    survival2: packSurvival(state.survival2),
    time: {
      elapsed: state.time.elapsed,
      weather: state.time.weather,
      weatherTimer: state.time.weatherTimer,
      dayLengthSec: state.time.dayLengthSec,
    },
    player: packPlayer(state.player),
    player2: packPlayer(state.player2),
    boat: packBoat(state.boat),
    edits: state.edits || [],
    animals: Array.isArray(state.animals) ? state.animals : [],
    stats: state.stats || undefined,
    achievements: state.achievements || undefined,
    crops: state.crops || undefined,
    chests: state.chests || undefined,
    destination: state.destination,
    pressure: state.pressure,
    workshop: state.workshop,
    spawnPos: state.spawnPos || undefined,
    castawayArrival: state.castawayArrival || undefined,
  };
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, data: object } | { ok: false, error: string }}
 */
export function parseSavePayload(raw) {
  if (raw == null) return { ok: false, error: 'empty' };
  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return { ok: false, error: 'invalid json' };
    }
  }
  if (!data || typeof data !== 'object') return { ok: false, error: 'not object' };
  if (data.v !== 1 && data.v !== 2) return { ok: false, error: `unsupported version ${data.v}` };
  if (typeof data.seed !== 'number') return { ok: false, error: 'missing seed' };
  if (!data.player || typeof data.player.x !== 'number') return { ok: false, error: 'missing player' };
  if (!data.survival) return { ok: false, error: 'missing survival' };
  if (!data.time) return { ok: false, error: 'missing time' };
  if (!Array.isArray(data.edits)) data.edits = [];
  if (!Array.isArray(data.animals)) data.animals = [];
  data.boat = parseBoat(data.boat);
  if (data.destination == null) data.destination = null;
  if (data.pressure == null) data.pressure = null;
  if (data.workshop == null) data.workshop = null;
  if (!Array.isArray(data.player.slots)) return { ok: false, error: 'missing slots' };
  if (!data.player.equipment || typeof data.player.equipment !== 'object') {
    data.player.equipment = { head: null, chest: null, feet: null };
  }
  if (data.playMode !== 'coop') data.playMode = 'solo';
  if (data.player2 && typeof data.player2.x === 'number') {
    if (!Array.isArray(data.player2.slots)) data.player2.slots = [];
    if (!data.player2.equipment || typeof data.player2.equipment !== 'object') {
      data.player2.equipment = { head: null, chest: null, feet: null };
    }
  } else {
    data.player2 = null;
  }
  if (!data.survival2 || typeof data.survival2 !== 'object') data.survival2 = null;
  // sanitize edits
  data.edits = data.edits.filter(
    (e) =>
      Array.isArray(e) &&
      e.length === 4 &&
      e.every((n) => typeof n === 'number' && Number.isFinite(n)),
  );
  return { ok: true, data };
}

export function serializeSave(state) {
  return JSON.stringify(buildSavePayload(state));
}

export function deserializeSave(json) {
  return parseSavePayload(json);
}

/** localStorage adapters (injectable for tests) */
export function writeSaveToStorage(json, storage = globalThis.localStorage, key = SAVE_KEY) {
  if (!storage) return { ok: false, error: 'no storage' };
  try {
    storage.setItem(key, json);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export function readSaveFromStorage(storage = globalThis.localStorage, key = SAVE_KEY) {
  if (!storage) return { ok: false, error: 'no storage' };
  try {
    const raw = storage.getItem(key);
    if (!raw) return { ok: false, error: 'no save' };
    return parseSavePayload(raw);
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export function clearSaveStorage(storage = globalThis.localStorage, key = SAVE_KEY) {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function hasSave(storage = globalThis.localStorage, key = SAVE_KEY) {
  try {
    return !!(storage && storage.getItem(key));
  } catch {
    return false;
  }
}
