/**
 * Pure sniffer seed drop table.
 */
export const SNIFFER_SEEDS = ['torchflower_seeds', 'pitcher_pod'];
export function snifferSeedDrop(rng = Math.random) {
  const r = typeof rng === 'function' ? rng() : Math.random();
  return r < 0.5 ? SNIFFER_SEEDS[0] : SNIFFER_SEEDS[1];
}
export function isSnifferSeed(id) {
  return SNIFFER_SEEDS.includes(String(id || '').toLowerCase());
}
