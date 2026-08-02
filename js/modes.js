/**
 * Difficulty modes — pure config + helpers (unit-testable).
 * Harmless → Survival → Challenging → Cruel
 *
 * Design (v1.12.12):
 * - Harmless = Minecraft-like peaceful: no predator attacks.
 * - Food lasts many game-days (at hungerMult=1 ≈ 7 idle game-days with survival.js base).
 * - Water/thirst lasts ≈ 3 game-days at thirstMult=1.
 * - Hostiles mostly provoke-only; never free-hunt on Harmless/Survival.
 */
/** @typedef {'harmless'|'survival'|'challenging'|'cruel'} ModeId */
/** @typedef {'off'|'provoke'|'cautious'|'hunt'} HostilePolicy */

/**
 * @typedef {{
 *  id: ModeId,
 *  name: string,
 *  blurb: string,
 *  hungerMult: number,
 *  thirstMult: number,
 *  coldDamageMult: number,
 *  predatorDamageMult: number,
 *  predatorSenseMult: number,
 *  hostilePolicy: HostilePolicy,
 *  bleedMult: number,
 *  poisonMult: number,
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
    blurb: 'Peaceful learning. No predator attacks. Food and cold barely matter.',
    hungerMult: 0.12,
    thirstMult: 0.15,
    coldDamageMult: 0.05,
    predatorDamageMult: 0,
    predatorSenseMult: 0,
    hostilePolicy: 'off',
    bleedMult: 0,
    poisonMult: 0.12,
    deathDrops: false,
    permadeath: false,
    starterRations: 12,
  },
  survival: {
    id: 'survival',
    name: 'Survival',
    blurb: 'Default frontier. Predators only fight back if provoked. Meters matter slowly.',
    hungerMult: 0.55,
    thirstMult: 0.7,
    coldDamageMult: 0.5,
    predatorDamageMult: 0.4,
    predatorSenseMult: 0.35,
    hostilePolicy: 'provoke',
    bleedMult: 0.35,
    poisonMult: 0.3,
    deathDrops: false,
    permadeath: false,
    starterRations: 8,
  },
  challenging: {
    id: 'challenging',
    name: 'Challenging',
    blurb: 'Tighter margins (~7 food days / ~3 water days). Death drops your pack. Predators cautious at night.',
    hungerMult: 0.85,
    thirstMult: 0.95,
    coldDamageMult: 0.85,
    predatorDamageMult: 0.65,
    predatorSenseMult: 0.55,
    hostilePolicy: 'cautious',
    bleedMult: 0.55,
    poisonMult: 0.45,
    deathDrops: true,
    permadeath: false,
    starterRations: 6,
  },
  cruel: {
    id: 'cruel',
    name: 'Cruel',
    blurb: 'Permadeath. Same multi-day food/water pacing as Challenging, but colder and riskier. Save wiped on death.',
    hungerMult: 1,
    thirstMult: 1,
    coldDamageMult: 1.15,
    predatorDamageMult: 0.85,
    predatorSenseMult: 0.7,
    hostilePolicy: 'cautious',
    bleedMult: 0.7,
    poisonMult: 0.55,
    deathDrops: true,
    permadeath: true,
    starterRations: 5,
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

export function scaleEnvDps(baseDps, cause, mode) {
  const m = getMode(mode);
  if (!baseDps) return 0;
  if (cause === 'hypothermia' || cause === 'heatstroke') return baseDps * m.coldDamageMult;
  if (cause === 'starvation' || cause === 'exhaustion' || cause === 'dehydration') {
    return baseDps * Math.max(0.35, m.hungerMult * 0.85);
  }
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
 * @param {ModeId} modeId
 */
export function difficulty_presets_explain(modeId) {
  const m = getMode(modeId);
  const explanations = {
    harmless: {
      title: 'Harmless — Peaceful / learn the game',
      body: 'Minecraft-like peaceful mode. Predators never attack. Hunger and thirst drain very slowly. Cold is almost cosmetic. Ideal for learning build/craft/explore.',
      tips: [
        'No wolves, bears, boars, or gators will hunt you.',
        'Food lasts many days — focus on building and crafting.',
        'Drink from water with F when you want stamina; thirst is very gentle.',
        'Switch to Survival when you want wildlife danger.',
      ],
    },
    survival: {
      title: 'Survival — Default frontier',
      body: 'Meters matter over days, not minutes. Predators only fight if you provoke them (hit them). Raw meat rarely poisons. Good default for real play.',
      tips: [
        'Do not punch a wolf unless you want a fight.',
        'Build shelter before long night trips — cold still matters.',
        'Cook meat when you can; food poisoning is uncommon but real.',
        'Food lasts many game-days; drink water every few days.',
      ],
    },
    challenging: {
      title: 'Challenging — Experienced players',
      body: 'About a week of food and ~3 days of water on a full bar (idle). Night predators may notice you if you linger close. Death drops your pack.',
      tips: [
        'Keep cooked food and a water plan.',
        'Avoid camping on top of hostiles at night.',
        'Death drops inventory — mark your corpse path.',
        'Bleed and poison are still reduced vs old builds, but harsher than Survival.',
      ],
    },
    cruel: {
      title: 'Cruel — Permadeath',
      body: 'Same multi-day food/water pacing targets as Challenging, with colder exposure and higher risk. Die once and the save is wiped.',
      tips: [
        'Learn the game on Harmless/Survival first.',
        'Never take needless fights with predators.',
        'Shelter + fire before storms.',
        'One death ends the run.',
      ],
    },
  };
  const exp = explanations[m.id] || explanations.survival;
  return { ...exp, modeId: m.id, name: m.name };
}
