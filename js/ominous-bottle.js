/**
 * Pure ominous bottle amplifier 0..4 (MC 1.21).
 */

export const OMINOUS_AMP_MAX = 4;

export function clampOminousAmplifier(level) {
  const n = Math.floor(Number(level) || 0);
  return Math.max(0, Math.min(OMINOUS_AMP_MAX, n));
}

/**
 * Drink bottle: returns bad omen amplifier to apply.
 * @param {number} bottleAmp 0..4
 */
export function ominousBottleEffect(bottleAmp) {
  return {
    effect: 'bad_omen',
    amplifier: clampOminousAmplifier(bottleAmp),
    durationSec: 100 * 60, // long
  };
}

/** Ominous trial chance scales with amp. */
export function ominousTrialChance(amplifier) {
  const a = clampOminousAmplifier(amplifier);
  return Math.min(1, 0.2 + a * 0.15);
}
