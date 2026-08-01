/**
 * Pure copper oxidation stages 0..3 (MC-breadth).
 * 0=copper, 1=exposed, 2=weathered, 3=oxidized
 */

export const COPPER_STAGE_MAX = 3;
export const COPPER_OXIDIZE_CHANCE = 0.05;

export function clampCopperStage(stage) {
  const n = Math.floor(Number(stage) || 0);
  return Math.max(0, Math.min(COPPER_STAGE_MAX, n));
}

/**
 * Try advance oxidation one stage.
 * @param {number} stage
 * @param {boolean} [waxed=false]
 * @param {number} [chance=COPPER_OXIDIZE_CHANCE]
 * @param {() => number} [rng]
 */
export function copperTryOxidize(stage, waxed = false, chance = COPPER_OXIDIZE_CHANCE, rng = Math.random) {
  if (waxed) return clampCopperStage(stage);
  const s = clampCopperStage(stage);
  if (s >= COPPER_STAGE_MAX) return s;
  const c = Math.max(0, Math.min(1, Number(chance) || 0));
  const roll = typeof rng === 'function' ? rng() : Math.random();
  if (roll > c) return s;
  return s + 1;
}

/** Scraping with axe reduces one stage. */
export function copperScrape(stage) {
  return Math.max(0, clampCopperStage(stage) - 1);
}

export function copperStageName(stage) {
  return ['copper', 'exposed', 'weathered', 'oxidized'][clampCopperStage(stage)] || 'copper';
}

export function copperIsFullyOxidized(stage) {
  return clampCopperStage(stage) >= COPPER_STAGE_MAX;
}
