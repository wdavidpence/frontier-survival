/**
 * Pure goat horn instrument variants.
 */
export const GOAT_HORN_INSTRUMENTS = [
  'ponder', 'sing', 'seek', 'feel', 'admire', 'call', 'yearn', 'dream',
];
export function goatHornInstrument(index) {
  const i = ((index | 0) % GOAT_HORN_INSTRUMENTS.length + GOAT_HORN_INSTRUMENTS.length) % GOAT_HORN_INSTRUMENTS.length;
  return GOAT_HORN_INSTRUMENTS[i];
}
export function isGoatHornInstrument(name) {
  return GOAT_HORN_INSTRUMENTS.includes(String(name || '').toLowerCase());
}
