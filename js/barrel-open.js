/**
 * Pure barrel open/close state (MC-breadth).
 */

export function createBarrelOpenState(open = false) {
  return { open: !!open };
}

export function setBarrelOpen(state, open) {
  const s = state || createBarrelOpenState();
  s.open = !!open;
  return s;
}

export function toggleBarrelOpen(state) {
  const s = state || createBarrelOpenState();
  s.open = !s.open;
  return s;
}

export function isBarrelOpen(state) {
  return !!(state && state.open);
}
