/**
 * Pure jukebox disc duration table (MC-breadth).
 */
export const DISC_SECONDS = {
  '13': 178, cat: 185, blocks: 345, chirp: 185, far: 174,
  mall: 197, mellohi: 96, stal: 150, strad: 188, ward: 251,
  '11': 71, wait: 238, otherside: 195, '5': 178, pigstep: 148, relic: 178,
};
export function discDurationSec(discId) {
  const k = String(discId || '').toLowerCase().replace(/^music_disc_/, '');
  return DISC_SECONDS[k] ?? 180;
}
export function discIsLong(discId, threshold = 200) {
  return discDurationSec(discId) >= threshold;
}
