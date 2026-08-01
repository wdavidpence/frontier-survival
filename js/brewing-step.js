/**
 * Pure brewing stand step chain stub (MC-breadth).
 */

/** @type {Record<string, string>} ingredient id-name -> potion id-name */
export const BREW_CHAINS = {
  nether_wart_water: 'awkward',
  awkward_sugar: 'swiftness',
  awkward_glistering_melon: 'healing',
  awkward_spider_eye: 'poison',
  awkward_magma_cream: 'fire_resistance',
  awkward_blaze_powder: 'strength',
  awkward_ghast_tear: 'regeneration',
  awkward_pufferfish: 'water_breathing',
  // redstone extends; glowstone strengthens — stubs map to _long / _strong tags
  swiftness_redstone: 'swiftness_long',
  healing_glowstone: 'healing_strong',
};

/**
 * Next potion id after adding ingredient to base.
 * @param {string} baseId
 * @param {string} ingredientId
 * @returns {string|null}
 */
export function brewStep(baseId, ingredientId) {
  const b = String(baseId || '');
  const ing = String(ingredientId || '');
  if (!b || !ing) return null;
  const key = `${b}_${ing}`;
  return BREW_CHAINS[key] ?? null;
}

/**
 * Whether stand can accept ingredient for base.
 */
export function canBrew(baseId, ingredientId) {
  return brewStep(baseId, ingredientId) != null;
}

/**
 * Brew time ticks stub (fixed).
 */
export const BREW_TIME_TICKS = 400;

export function brewProgress(elapsedTicks, total = BREW_TIME_TICKS) {
  const e = Math.max(0, Number(elapsedTicks) || 0);
  const t = Math.max(1, Number(total) || BREW_TIME_TICKS);
  return Math.max(0, Math.min(1, e / t));
}
