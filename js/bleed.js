/**
 * Bleeding / wound system — pure helpers.
 * state.bleed 0-100; DPS = bleed * 0.04; natural decay 2/s.
 */
export function applyBleed(state, amount = 8) {
  if (!state || state.dead) return state;
  const bleed = Math.min(100, Math.max(0, (state.bleed || 0) + amount));
  return { ...state, bleed };
}
export function tickBleed(state, dt) {
  if (!state || state.dead) return state;
  let bleed = state.bleed || 0;
  if (bleed <= 0) {
    if (state.bleed) return { ...state, bleed: 0 };
    return state;
  }
  const dps = bleed * 0.04;
  const health = Math.max(0, state.health - dps * dt);
  bleed = Math.max(0, bleed - 2 * dt);
  const next = { ...state, bleed, health };
  if (health <= 0) {
    next.health = 0;
    next.dead = true;
    next.causeOfDeath = "bleeding";
  }
  return next;
}
export function stopBleed(state, strength = 100) {
  if (!state) return state;
  const bleed = Math.max(0, (state.bleed || 0) - strength);
  return { ...state, bleed };
}
export function isBleeding(state) {
  return !!(state && (state.bleed || 0) > 1);
}
