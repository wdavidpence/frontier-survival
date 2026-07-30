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
    starterRations: 8,
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
    starterRations: 6,
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
    starterRations: 5,
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
    starterRations: 4,
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

/**
 * Detailed explanation for a difficulty preset — what the player can expect
 * during their first hour. Returns an object with readable sections.
 * @param {ModeId} modeId
 */
export function difficulty_presets_explain(modeId) {
  const m = getMode(modeId);
  /** @type {{title:string, body:string, tips:string[]}} */
  const explanations = {
    harmless: {
      title: 'Harmless — Learn the game',
      body: 'This mode is forgiving so you can learn mechanics without pressure. Hunger barely drains, cold damage is minimal, and wolves are timid — they will not chase you aggressively. You start with 8 rations (enough for a long first day). If you die, nothing is lost.',
      tips: [
        'Use this to learn crafting, building, and the day/night cycle.',
        'Hunger drains at ~20% normal speed — you have hours before starvation matters.',
        'Cold only becomes dangerous after extended exposure in snow or rain at night.',
        'Wolves keep their distance; bears are still a threat but deal reduced damage.',
      ],
    },
    survival: {
      title: 'Survival — The default frontier',
      body: 'All survival meters matter from the start. Hunger drains at a steady pace, cold can kill you in freezing weather without shelter, and wolves will hunt you at night. You start with 6 rations — enough for a few meals but not forever. Death costs nothing but time.',
      tips: [
        'Build shelter and light a fire before the first night.',
        'Hunt hares for meat; cook it to avoid food poisoning.',
        'Wolves are dangerous at night — stay near fire or in a sealed shelter.',
        'Wetness + cold is the fastest way to die early — dry off near a fire.',
      ],
    },
    challenging: {
      title: 'Challenging — For experienced players',
      body: 'Hunger drains 35% faster, cold damage is steeper, and wolves are meaner and more perceptive. If you die, your entire inventory is dropped in the world — you must retrieve it or lose it forever. You start with only 5 rations.',
      tips: [
        'Scout for food and wood before dusk — you have less margin for error.',
        'Always carry a weapon; wolves will actively hunt you at night.',
        'Death is costly — save frequently and avoid risky behavior early on.',
        'Cooked food is essential; raw meat risks poisoning which compounds the difficulty.',
      ],
    },
    cruel: {
      title: 'Cruel — Permadeath, no second chances',
      body: 'Everything is harder than Challenging mode. Hunger drains 50% faster, cold damage is brutal, and wolves are extremely aggressive. If you die, your save file is wiped entirely — no respawn, no recovery. You start with only 4 rations.',
      tips: [
        'This mode is for players who know the game well. Learn on Harmless or Survival first.',
        'Every decision matters — do not waste resources on unnecessary risks.',
        'Always have a plan for shelter, fire, and food before nightfall.',
        'Consider this mode only after you can reliably survive 3+ days on Survival.',
      ],
    },
  };

  const exp = explanations[m.id] || explanations.survival;
  return { ...exp, modeId: m.id, name: m.name };
}
