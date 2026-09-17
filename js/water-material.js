/** Safe water-material contract harvested from the dirty worker tree. */

export const WATER_WAVE = Object.freeze({
  // A low-frequency swell reads as moving water without turning the
  // horizon into evenly spaced ridges at first-person grazing angles.
  speed: 1.15,
  xFrequency: 0.16,
  zFrequency: 0.12,
  amplitude: 0.025,
  tint: Object.freeze([0.05, 0.20, 0.24]),
});

export function waterWaveStrength(time, x, z) {
  return 0.5 + 0.5 * Math.sin(
    Number(time || 0) * WATER_WAVE.speed
      + Number(x || 0) * WATER_WAVE.xFrequency
      + Number(z || 0) * WATER_WAVE.zFrequency,
  );
}
