/**
 * Pure daylight sensor power from sun factor (MC-breadth).
 */

/**
 * @param {number} sun01 day factor 0 night .. 1 noon
 * @param {boolean} [inverted=false]
 * @returns {number} redstone-like power 0..15
 */
export function daylightSensorPower(sun01, inverted = false) {
  let s = Number(sun01);
  if (!Number.isFinite(s)) s = 0;
  s = Math.max(0, Math.min(1, s));
  if (inverted) s = 1 - s;
  return Math.round(s * 15);
}

/**
 * Whether sensor should emit (power > 0).
 */
export function daylightSensorActive(sun01, inverted = false, minPower = 1) {
  return daylightSensorPower(sun01, inverted) >= Math.max(1, minPower | 0);
}

/**
 * Rough sun01 from day fraction 0..1 (0 midnight, 0.5 noon).
 * @param {number} dayFrac
 */
export function sun01FromDayFrac(dayFrac) {
  let t = Number(dayFrac);
  if (!Number.isFinite(t)) return 0;
  t = ((t % 1) + 1) % 1;
  // triangle peak at 0.5
  return 1 - Math.abs(t - 0.5) * 2;
}
