/**
 * Pure compost item chance table (MC-breadth).
 */
export const COMPOST_CHANCE = {
  leaves: 0.3, sapling: 0.3, seeds: 0.3, kelp: 0.3,
  apple: 0.65, melon: 0.65, pumpkin: 0.65,
  bread: 0.85, pie: 1.0, cake: 1.0,
};
export function compostChance(itemName) {
  const n = String(itemName || '').toLowerCase();
  for (const [k, v] of Object.entries(COMPOST_CHANCE)) {
    if (n.includes(k)) return v;
  }
  return 0;
}
export function compostSucceeds(itemName, rng = Math.random) {
  const c = compostChance(itemName);
  const r = typeof rng === 'function' ? rng() : Math.random();
  return r < c;
}
