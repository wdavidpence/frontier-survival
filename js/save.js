/**
 * Save game serialization — pure logic (no DOM).
 * World edits are sparse [x,y,z,id] tuples applied after regen from seed.
 */

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'frontier_survival_save_v1';

/**
 * @param {object} state
 * @param {number} state.seed
 * @param {number} state.mode
 * @param {object} state.survival
 * @param {object} state.time — { elapsed, weather, weatherTimer, dayLengthSec }
 * @param {object} state.player — { x,y,z, yaw, pitch, hotbarIndex, slots }
 * @param {Array<[number,number,number,number]>} state.edits
 */
export function buildSavePayload(state) {
  return {
    v: SAVE_VERSION,
    savedAt: Date.now(),
    seed: state.seed,
    mode: state.mode || 'survival',
    survival: {
      health: state.survival.health,
      maxHealth: state.survival.maxHealth,
      hunger: state.survival.hunger,
      maxHunger: state.survival.maxHunger,
      stamina: state.survival.stamina,
      maxStamina: state.survival.maxStamina,
      bodyTemp: state.survival.bodyTemp,
      sleep: state.survival.sleep,
      wetness: state.survival.wetness,
      warmthFromClothes: state.survival.warmthFromClothes || 0,
      dead: !!state.survival.dead,
      causeOfDeath: state.survival.causeOfDeath || null,
    },
    time: {
      elapsed: state.time.elapsed,
      weather: state.time.weather,
      weatherTimer: state.time.weatherTimer,
      dayLengthSec: state.time.dayLengthSec,
    },
    player: {
      x: state.player.x,
      y: state.player.y,
      z: state.player.z,
      yaw: state.player.yaw,
      pitch: state.player.pitch,
      hotbarIndex: state.player.hotbarIndex,
      slots: (state.player.slots || []).map((s) => ({
        id: s.id,
        count: s.count,
        ...(s.age != null ? { age: s.age } : {}),
      })),
      equipment: state.player.equipment || { head: null, chest: null, feet: null },
    },
    edits: state.edits || [],
    animals: Array.isArray(state.animals) ? state.animals : [],
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
  if (data.v !== SAVE_VERSION) return { ok: false, error: `unsupported version ${data.v}` };
  if (typeof data.seed !== 'number') return { ok: false, error: 'missing seed' };
  if (!data.player || typeof data.player.x !== 'number') return { ok: false, error: 'missing player' };
  if (!data.survival) return { ok: false, error: 'missing survival' };
  if (!data.time) return { ok: false, error: 'missing time' };
  if (!Array.isArray(data.edits)) data.edits = [];
  if (!Array.isArray(data.animals)) data.animals = [];
  if (!Array.isArray(data.player.slots)) return { ok: false, error: 'missing slots' };
  if (!data.player.equipment || typeof data.player.equipment !== 'object') {
    data.player.equipment = { head: null, chest: null, feet: null };
  }
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
