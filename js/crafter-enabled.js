/**
 * Pure crafter redstone enable latch (MC 1.21).
 */

/**
 * @typedef {{ enabled: boolean, locked: boolean }} CrafterEnable
 */

export function createCrafterEnable(enabled = true) {
  return { enabled: !!enabled, locked: false };
}

/** Latch enable from redstone power level. */
export function crafterSetPowered(state, powered) {
  const s = state || createCrafterEnable();
  if (s.locked) return s;
  s.enabled = !!powered;
  return s;
}

export function crafterLock(state, locked = true) {
  const s = state || createCrafterEnable();
  s.locked = !!locked;
  return s;
}

export function crafterCanCraft(state) {
  const s = state || createCrafterEnable();
  return !!s.enabled && !s.locked;
}
