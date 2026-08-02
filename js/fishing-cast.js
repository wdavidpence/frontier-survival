/** Pure fishing cast state + deterministic catch table helpers. */

export const FISHING_CAST_SECONDS = 2.2;

/** Weighted outcomes. A miss is intentional: fishing should cost time and rod durability. */
export const FISH_CATCH_TABLE = Object.freeze([
  Object.freeze({ id: 'raw_fish', count: 1, weight: 0.55 }),
  Object.freeze({ id: 'raw_fish', count: 2, weight: 0.25 }),
  Object.freeze({ id: null, count: 0, weight: 0.2 }),
]);

export function createFishingState() {
  return { phase: 'ready', timer: 0, casts: 0 };
}

export function canCast(state) {
  return state?.phase === 'ready';
}

export function startCast(state, duration = FISHING_CAST_SECONDS) {
  if (!canCast(state)) return state;
  return {
    phase: 'waiting',
    timer: Math.max(0, Number(duration) || FISHING_CAST_SECONDS),
    casts: (state.casts || 0) + 1,
  };
}

/** Advance a cast without mutating the input state. */
export function tickFishing(state, dt) {
  if (!state || state.phase !== 'waiting') return { state, caught: false };
  const timer = Math.max(0, state.timer - Math.max(0, Number(dt) || 0));
  if (timer > 0) return { state: { ...state, timer }, caught: false };
  return { state: { ...state, phase: 'ready', timer: 0 }, caught: true };
}

/** Roll one weighted outcome using a supplied [0, 1) random value. */
export function rollFishingCatch(randomValue = Math.random) {
  const sample = typeof randomValue === 'function' ? randomValue() : randomValue;
  const r = Math.max(0, Math.min(0.999999999, Number(sample) || 0));
  let cursor = r;
  for (const outcome of FISH_CATCH_TABLE) {
    cursor -= outcome.weight;
    if (cursor < 0) return { ...outcome };
  }
  return { ...FISH_CATCH_TABLE[FISH_CATCH_TABLE.length - 1] };
}
