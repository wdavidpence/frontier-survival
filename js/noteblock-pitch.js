/**
 * Pure note block pitch helpers (MC-breadth).
 */

export const NOTE_MIN = 0;
export const NOTE_MAX = 24;

export function clampNote(note) {
  const n = Math.floor(Number(note) || 0);
  return Math.max(NOTE_MIN, Math.min(NOTE_MAX, n));
}

/**
 * Frequency multiplier relative to F#3 (~185 Hz) vanilla-ish:
 * freq = base * 2^((note-12)/12)
 * @param {number} note 0..24
 * @param {number} [baseHz=185]
 */
export function noteFrequencyHz(note, baseHz = 185) {
  const n = clampNote(note);
  const base = Math.max(1, Number(baseHz) || 185);
  return base * 2 ** ((n - 12) / 12);
}

/**
 * Cycle note up by delta.
 */
export function cycleNote(note, delta = 1) {
  const n = clampNote(note);
  const d = delta | 0;
  const span = NOTE_MAX - NOTE_MIN + 1;
  return NOTE_MIN + ((((n - NOTE_MIN + d) % span) + span) % span);
}

/**
 * Instrument name stub from block under noteblock.
 * @param {string} underBlockName
 */
export function noteInstrument(underBlockName) {
  const u = String(underBlockName || '').toLowerCase();
  if (u.includes('wood') || u.includes('plank') || u.includes('log')) return 'bass';
  if (u.includes('sand') || u.includes('gravel')) return 'snare';
  if (u.includes('glass')) return 'hat';
  if (u.includes('stone') || u.includes('cobble')) return 'basedrum';
  return 'harp';
}
