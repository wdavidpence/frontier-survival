/** Pure fishing cast state, bite timing, and tropical catch tables. */
import { ITEM } from './items.js?v=250';

export const FISHING_CAST_SECONDS = 2.2;
export const FISHING_CAST_TRAVEL_SECONDS = 0.45;
export const FISHING_BITE_SECONDS = 3.0;
export const FISHING_BITE_FLASH_HZ = 9;

const TROPICAL_CATCHES = Object.freeze([
  Object.freeze({ id: ITEM.RAW_FISH, label: 'Reef Fish', count: 1, weight: 0.40 }),
  Object.freeze({ id: ITEM.TROPICAL_FISH, label: 'Tropical Fish', count: 1, weight: 0.30 }),
  Object.freeze({ id: ITEM.RAW_CRAB, label: 'Reef Crab', count: 1, weight: 0.18 }),
  Object.freeze({ id: ITEM.RAW_FISH, label: 'Reef Fish', count: 2, weight: 0.07 }),
  Object.freeze({ id: null, label: 'Nothing', count: 0, weight: 0.05 }),
]);

const OCEAN_CATCHES = Object.freeze([
  Object.freeze({ id: ITEM.RAW_FISH, label: 'Reef Fish', count: 1, weight: 0.48 }),
  Object.freeze({ id: ITEM.TROPICAL_FISH, label: 'Tropical Fish', count: 1, weight: 0.22 }),
  Object.freeze({ id: ITEM.RAW_CRAB, label: 'Reef Crab', count: 1, weight: 0.10 }),
  Object.freeze({ id: ITEM.RAW_FISH, label: 'Reef Fish', count: 2, weight: 0.10 }),
  Object.freeze({ id: null, label: 'Nothing', count: 0, weight: 0.10 }),
]);

/** Default table remains exported for simple callers and smoke probes. */
export const FISH_CATCH_TABLE = TROPICAL_CATCHES;

function tableForContext(context = {}) {
  return context.biome === 'ocean' ? OCEAN_CATCHES : TROPICAL_CATCHES;
}

export function createFishingState() {
  return { phase: 'ready', timer: 0, casts: 0, outcome: null };
}

export function canCast(state) {
  return state?.phase === 'ready';
}

export function startCast(state, duration = FISHING_CAST_SECONDS) {
  if (!canCast(state)) return state;
  return {
    phase: 'casting',
    timer: FISHING_CAST_TRAVEL_SECONDS,
    castDuration: Math.max(0, Number(duration) || FISHING_CAST_SECONDS),
    casts: (state.casts || 0) + 1,
    outcome: null,
  };
}

/** Advance a cast without mutating the input state. */
export function tickFishing(state, dt) {
  if (!state || state.phase === 'ready') return { state, bite: false, missed: false };
  const timer = Math.max(0, state.timer - Math.max(0, Number(dt) || 0));
  if ((state.phase === 'casting' || state.phase === 'waiting') && timer > 0) {
    return { state: { ...state, timer }, bite: false, missed: false };
  }
  if (state.phase === 'casting') {
    return {
      state: { ...state, phase: 'waiting', timer: state.castDuration || FISHING_CAST_SECONDS },
      bite: false,
      missed: false,
    };
  }
  if (state.phase === 'waiting') {
    return { state: { ...state, phase: 'bite', timer: FISHING_BITE_SECONDS }, bite: true, missed: false };
  }
  if (state.phase === 'bite' && timer > 0) {
    return { state: { ...state, timer }, bite: false, missed: false };
  }
  return { state: createFishingStateFrom(state), bite: false, missed: true };
}

function createFishingStateFrom(state) {
  return { phase: 'ready', timer: 0, casts: state?.casts || 0, outcome: null };
}

/** Roll one weighted outcome using a supplied [0, 1) random value. */
export function rollFishingCatch(randomValue = Math.random, context = {}) {
  const sample = typeof randomValue === 'function' ? randomValue() : randomValue;
  const r = Math.max(0, Math.min(0.999999999, Number(sample) || 0));
  let cursor = r;
  for (const outcome of tableForContext(context)) {
    cursor -= outcome.weight;
    if (cursor < 0) return { ...outcome };
  }
  return { ...tableForContext(context).at(-1) };
}
