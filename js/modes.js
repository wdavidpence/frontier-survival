/**
 * Difficulty modes — pure config + helpers (unit-testable).
 * Harmless → Survival → Challenging → Cruel (+ Creative later).
 */

/** @typedef {'harmless'|'survival'|'challenging'|'cruel'} ModeId */

/**
 * @typedef {{
 *  id: ModeId,
 *  name: string,
 *  blurb: string,
 *  hungerMult: number,
 *  coldDamageMult: number,
 *  predatorDamageMult: number,
 *  predatorSenseMult: number,
 *  deathDrops: boolean,
 *  permadeath: boolean,
 *  starterRations: number
 * }} ModeDef
 */

/** @type {Record<ModeId, ModeDef>} */
export const MODES = {
  harmless: {
    id: 'harmless',
    name: 'Harmless',
    blurb: 'Soft learning mode. Slow hunger, mild cold, timid wolves.',
    hungerMult: 0.2,
    coldDamageMult: 0.25,
    predatorDamageMult: 0.35,
    predatorSenseMult: 0.55,
    deathDrops: false,
    permadeath: false,
    starterRations: 6,
  },
  survival: {
    id: 'survival',
    name: 'Survival',
    blurb: 'Default harsh frontier. Meters matter.',
    hungerMult: 1,
    coldDamageMult: 1,
    predatorDamageMult: 1,
    predatorSenseMult: 1,
    deathDrops: false,
    permadeath: false,
    starterRations: 3,
  },
  challenging: {
    id: 'challenging',
    name: 'Challenging',
    blurb: 'Faster drains, meaner wolves. Death drops your pack.',
    hungerMult: 1.35,
    coldDamageMult: 1.4,
    predatorDamageMult: 1.35,
    predatorSenseMult: 1.25,
    deathDrops: true,
    permadeath: false,
    starterRations: 2,
  },
  cruel: {
    id: 'cruel',
    name: 'Cruel',
    blurb: 'Permadeath. Save wiped on death. No mercy.',
    hungerMult: 1.5,
    coldDamageMult: 1.6,
    predatorDamageMult: 1.5,
    predatorSenseMult: 1.4,
    deathDrops: true,
    permadeath: true,
    starterRations: 1,
  },
};

export const MODE_ORDER = /** @type {ModeId[]} */ (['harmless', 'survival', 'challenging', 'cruel']);

/** @param {string|undefined|null} id */
export function getMode(id) {
  if (id && MODES[id]) return MODES[id];
  return MODES.survival;
}

/** @param {string|undefined|null} id */
export function isValidMode(id) {
  return !!(id && MODES[id]);
}

/**
 * Apply mode-scaled environmental damage from tickSurvival dps components.
 * Pure helper for tests: scale a base dps by cold mult when cause is hypothermia.
 */
export function scaleEnvDps(baseDps, cause, mode) {
  const m = getMode(mode);
  if (!baseDps) return 0;
  if (cause === 'hypothermia' || cause === 'heatstroke') return baseDps * m.coldDamageMult;
  if (cause === 'starvation' || cause === 'exhaustion') return baseDps * Math.max(1, m.hungerMult * 0.85);
  return baseDps;
}

export function scalePredatorDamage(amount, mode) {
  return amount * getMode(mode).predatorDamageMult;
}

export function scalePredatorSense(base, mode, isNight) {
  const m = getMode(mode);
  return base * m.predatorSenseMult * (isNight ? 1 : 1);
}
