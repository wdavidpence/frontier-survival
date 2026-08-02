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
export function stopBleed(state, amount = 100) {
  if (!state) return state;
  const bleed = Math.max(0, (state.bleed || 0) - amount);
  return { ...state, bleed };
}

/** Bandage: heal + stop bleeding */
export function applyBandage(state) {
  if (!state) return state;
  const healed = 8;
  let health = Math.min(20, (state.health || 0) + healed);
  // Heal up to max health first, then drain bleed for the rest of heal budget
  let remainingHeal = healed - (health - (state.health || 0));
  if (remainingHeal < 0) remainingHeal = 0;
  const newBleed = Math.max(0, (state.bleed || 0) - remainingHeal);
  return { ...state, health, bleed: newBleed };
}
export function isBleeding(state) {
  return !!(state && (state.bleed || 0) > 1);
}
