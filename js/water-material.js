/** Safe water-material contract harvested from the dirty worker tree. */

export const WATER_WAVE = Object.freeze({
  speed: 1.8,
  xFrequency: 0.5,
  zFrequency: 0.37,
  tint: Object.freeze([0.08, 0.14, 0.20]),
});

export function waterWaveStrength(time, x, z) {
  return 0.5 + 0.5 * Math.sin(
    Number(time || 0) * WATER_WAVE.speed
      + Number(x || 0) * WATER_WAVE.xFrequency
      + Number(z || 0) * WATER_WAVE.zFrequency,
  );
}
