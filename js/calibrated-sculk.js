/**
 * Pure calibrated sculk sensor filter strength (MC-breadth).
 */

/**
 * Vibration frequency bands 1..15 (simplified).
 * @param {string} eventName
 */
export function sculkEventFrequency(eventName) {
  const e = String(eventName || '').toLowerCase();
  if (e.includes('step')) return 1;
  if (e.includes('hit') || e.includes('attack')) return 5;
  if (e.includes('eat')) return 7;
  if (e.includes('explode')) return 15;
  if (e.includes('place') || e.includes('break')) return 12;
  return 8;
}

/**
 * Whether calibrated sensor with amethyst frequency f accepts event.
 * @param {number} filterFreq 1..15
 * @param {string} eventName
 */
export function calibratedSculkAccepts(filterFreq, eventName) {
  const f = Math.max(1, Math.min(15, Math.floor(Number(filterFreq) || 1)));
  return sculkEventFrequency(eventName) === f;
}

/**
 * Output strength 0..15 when accepted.
 */
export function calibratedSculkPower(accepted, base = 15) {
  if (!accepted) return 0;
  return Math.max(1, Math.min(15, Math.floor(Number(base) || 15)));
}
