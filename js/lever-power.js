/**
 * Pure lever on/off power helper (MC-breadth / SC electricity).
 */

/**
 * @typedef {{ on: boolean, power: number }} LeverState
 */

export function createLever(on = false) {
  return { on: !!on, power: on ? 15 : 0 };
}

export function setLeverOn(lever, on) {
  const L = lever || createLever();
  L.on = !!on;
  L.power = L.on ? 15 : 0;
  return L;
}

export function toggleLever(lever) {
  const L = lever || createLever();
  return setLeverOn(L, !L.on);
}

/** Momentary pulse: on for duration ticks then off (caller ticks). */
export function pulseLever(lever, remainingTicks) {
  const L = lever || createLever();
  const t = Math.max(0, remainingTicks | 0);
  L.on = t > 0;
  L.power = L.on ? 15 : 0;
  return { lever: L, remaining: Math.max(0, t - 1) };
}

export function leverOutputsPower(lever) {
  return !!(lever && lever.on && (lever.power | 0) > 0);
}
