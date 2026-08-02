/**
 * Survival body simulation — the SC differentiator vs soft mining sandboxes.
 * Pure logic; no DOM/Three dependency (unit-testable).
 */

/** Real seconds per full in-game day (matches GameTime default in game.js). */
export const GAME_DAY_SEC = 420;

/**
 * At hungerMult=1, a full hunger bar lasts this many idle game-days.
 * Challenging/Cruel target ≈ 7 days; softer modes use lower hungerMult.
 */
export const HUNGER_DAYS_AT_MULT_1 = 7;

/**
 * At thirstMult=1, a full thirst bar lasts this many idle game-days (~3).
 */
export const THIRST_DAYS_AT_MULT_1 = 3;

export const DEFAULT_SURVIVAL = {
  health: 100,
  maxHealth: 100,
  hunger: 100,
  maxHunger: 100,
  thirst: 100,
  maxThirst: 100,
  stamina: 100,
  maxStamina: 100,
  bodyTemp: 37.0, // °C
  sleep: 0, // 0 rested → 100 collapsing
  wetness: 0,
  warmthFromClothes: 0,
  bleed: 0,
  dead: false,
  causeOfDeath: null,
};

/**
 * Ambient air temperature °C from day phase [0,1) where 0=dawn, 0.25=noon, 0.5=dusk, 0.75=midnight
 */
export function ambientTempC(dayPhase, weather = 'clear') {
  // cos peaking at noon (phase 0.25), coldest at midnight (0.75)
  const t = Math.cos((dayPhase - 0.25) * Math.PI * 2);
  let ambient = 12 + t * 14; // ~ -2 night to 26 day baseline temperate
  if (weather === 'rain') ambient -= 4;
  if (weather === 'snow') ambient -= 12;
  return ambient;
}

/**
 * @param {typeof DEFAULT_SURVIVAL} state
 * @param {object} env
 * @param {number} env.dt seconds
 * @param {number} env.dayPhase
 * @param {string} env.weather
 * @param {number} env.blockHeat heat from campfires
 * @param {boolean} env.sprinting
 * @param {boolean} env.moving
 * @param {boolean} env.inWater
 * @param {boolean} env.sleeping
 * @param {number} [env.hungerMult]
 * @param {number} [env.thirstMult]
 * @param {number} [env.coldDamageMult]
 * @param {number} [env.ambientTempOffset] biome temperature bias °C
 * @param {number} [env.earlyGameGrace] 0..1 — 1 = full new-game protection (no lethal need DPS)
 */
export function tickSurvival(state, env) {
  if (state.dead) return state;

  const dt = env.dt;
  const next = { ...state };
  if (next.thirst == null || !Number.isFinite(next.thirst)) next.thirst = 100;
  if (next.maxThirst == null || !Number.isFinite(next.maxThirst)) next.maxThirst = 100;
  const grace = Math.max(0, Math.min(1, env.earlyGameGrace ?? 0));
  let ambient = ambientTempC(env.dayPhase, env.weather);
  // Apply biome temperature bias (desert +8, tundra -10, etc.)
  if (env.ambientTempOffset) ambient += env.ambientTempOffset;
  const clothes = next.warmthFromClothes || 0;
  const fire = env.blockHeat || 0;
  const coldMult = env.coldDamageMult ?? 1;

  // Wetness — slower soak during early grace
  const wetMul = 1 - grace * 0.85;
  if (env.inWater) next.wetness = Math.min(100, next.wetness + 40 * dt * wetMul);
  else if ((env.wetnessGain || 0) > 0) {
    next.wetness = Math.min(100, next.wetness + env.wetnessGain * dt * wetMul);
  } else next.wetness = Math.max(0, next.wetness - 8 * dt);

  const wetPenalty = (next.wetness / 100) * 8;
  // Campfires are a primary survival tool — strong local heat must beat night air
  const fireWarmth = Math.min(32, fire * 1.35);
  // Early game: bias feels-like toward comfort so new players can explore/build
  let feelsLike = ambient + clothes + fireWarmth - wetPenalty + grace * 10;
  if (env.desertHeat) feelsLike += 10 * (1 - grace * 0.7);

  // Homeostasis: comfortable air keeps core ~37°C; extremes and wetness pull away
  let target = 37;
  if (feelsLike < 8) {
    // freezing exposure
    target = 37 - (8 - feelsLike) * 0.45;
  } else if (feelsLike < 14) {
    target = 37 - (14 - feelsLike) * 0.25;
  } else if (feelsLike > 34) {
    target = 37 + (feelsLike - 34) * 0.35;
  }
  // wet + cold is brutal
  if (next.wetness > 40 && feelsLike < 18) {
    target -= (next.wetness / 100) * 4;
  }
  // strong fire stabilizes toward warm comfort
  if (fire > 10) {
    target = Math.max(target, Math.min(38.2, 36.5 + fireWarmth * 0.04));
  }
  // Grace: pull core temp toward healthy 37°C
  if (grace > 0) {
    target = target * (1 - grace * 0.85) + 37 * (grace * 0.85);
  }

  const tempRate = 0.12 + (fire > 5 ? 0.1 : 0) + (feelsLike < 5 || feelsLike > 36 ? 0.1 : 0);
  next.bodyTemp += (target - next.bodyTemp) * Math.min(1, tempRate * dt);
  if (grace > 0.5) {
    // hard floor during strong grace — never drop into damage band
    next.bodyTemp = Math.max(next.bodyTemp, 35.8);
  }

  // Hunger — multi-day pacing (not minutes). At mult=1 ≈ HUNGER_DAYS_AT_MULT_1 idle game-days.
  const hungerBase = 100 / (GAME_DAY_SEC * HUNGER_DAYS_AT_MULT_1);
  let hungerDrain = hungerBase;
  if (env.sprinting) hungerDrain += hungerBase * 0.85;
  if (env.moving) hungerDrain += hungerBase * 0.22;
  if (env.sleeping) hungerDrain *= 0.35;
  hungerDrain *= env.hungerMult ?? 1;
  hungerDrain *= 1 - grace * 0.92; // ~8% drain at full grace
  next.hunger = Math.max(0, next.hunger - hungerDrain * dt);
  if (grace > 0.3) {
    // keep a comfortable floor while learning the game
    next.hunger = Math.max(next.hunger, 25 + grace * 40);
  }

  // Thirst — ~3 idle game-days at thirstMult=1
  const thirstBase = 100 / (GAME_DAY_SEC * THIRST_DAYS_AT_MULT_1);
  let thirstDrain = thirstBase;
  if (env.sprinting) thirstDrain += thirstBase * 0.7;
  if (env.moving) thirstDrain += thirstBase * 0.18;
  if (env.desertHeat) thirstDrain += thirstBase * 0.55;
  if (env.sleeping) thirstDrain *= 0.4;
  thirstDrain *= env.thirstMult ?? 1;
  thirstDrain *= 1 - grace * 0.9;
  next.thirst = Math.max(0, next.thirst - thirstDrain * dt);
  if (grace > 0.3) {
    next.thirst = Math.max(next.thirst, 30 + grace * 35);
  }

  // Stamina
  if (env.sprinting && env.moving) {
    next.stamina = Math.max(0, next.stamina - 18 * dt * (1 - grace * 0.4));
  } else if (!env.sprinting) {
    const regen = next.hunger > 10 && next.thirst > 10 ? 14 : 5;
    next.stamina = Math.min(next.maxStamina, next.stamina + regen * dt * (1 + grace * 0.5));
  }

  // Sleep debt while awake — slow during grace so exhaustion isn't a day-1 killer
  if (env.sleeping) {
    next.sleep = Math.max(0, next.sleep - 28 * dt);
  } else {
    let sleepGain = 0.4;
    // nights accelerate tiredness
    const night = env.dayPhase > 0.55 && env.dayPhase < 0.95;
    if (night) sleepGain *= 1.45;
    if (env.sprinting) sleepGain *= 1.15;
    sleepGain *= 1 - grace * 0.9;
    next.sleep = Math.min(100, next.sleep + sleepGain * dt);
    if (grace > 0.3) next.sleep = Math.min(next.sleep, 55);
  }

  // Damage conditions — fully suppressed during grace, ramp only after grace < 0.5
  let dps = 0;
  let cause = null;

  if (grace < 0.5) {
    const dmgScale = (1 - grace * 2); // 0 at full grace → 1 when grace=0

    if (next.hunger <= 0) {
      dps += 2.2 * dmgScale;
      cause = 'starvation';
    } else if (next.hunger < 12) {
      dps += 0.35 * dmgScale;
      cause = 'starvation';
    }

    if (next.thirst <= 0) {
      dps += 2.4 * dmgScale;
      cause = 'dehydration';
    } else if (next.thirst < 12) {
      dps += 0.4 * dmgScale;
      if (!cause) cause = 'dehydration';
    }

    if (next.bodyTemp < 32) {
      dps += 3.5 * coldMult * dmgScale;
      cause = 'hypothermia';
    } else if (next.bodyTemp < 34.5) {
      dps += 1.1 * coldMult * dmgScale;
      cause = 'hypothermia';
    } else if (next.bodyTemp > 41) {
      dps += 3 * coldMult * dmgScale;
      cause = 'heatstroke';
    }

    if (next.sleep >= 98 && !env.sleeping) {
      dps += 1.6 * dmgScale;
      cause = 'exhaustion';
    }
  }

  if (dps > 0) {
    next.health = Math.max(0, next.health - dps * dt);
  } else if (
    next.hunger > 40 &&
    next.thirst > 35 &&
    next.bodyTemp > 35.5 &&
    next.bodyTemp < 38.5 &&
    next.health < next.maxHealth
  ) {
    // slow regen when comfortable and fed/hydrated
    next.health = Math.min(next.maxHealth, next.health + 1.2 * dt * (1 + grace));
  }

  if (next.health <= 0) {
    next.health = 0;
    next.dead = true;
    next.causeOfDeath = cause || 'unknown';
  }

  next._debug = { ambient, feelsLike, target, dps, grace, hungerDrain, thirstDrain };
  return next;
}

export function canSprint(state) {
  return !state.dead && state.stamina > 1 && state.hunger > 0;
}

export function moveSpeedMultiplier(state, sprinting) {
  if (state.dead) return 0;
  let m = 1;
  if (sprinting && canSprint(state)) m = 1.55;
  if (state.stamina < 5) m *= 0.55;
  if (state.hunger < 10) m *= 0.75;
  if (state.sleep > 80) m *= 0.7;
  if (state.bodyTemp < 33) m *= 0.65;
  if (state.wetness > 60) m *= 0.9;
  return m;
}

export function eatFood(state, amount = 25, warmth = 0) {
  if (state.dead) return state;
  return {
    ...state,
    hunger: Math.min(state.maxHunger ?? 100, state.hunger + amount),
    bodyTemp: state.bodyTemp + warmth * 0.05,
  };
}

/** Restore thirst (and a little stamina) from drinking water. */
export function drinkWater(state, amount = 40, staminaBoost = 18) {
  if (state.dead) return state;
  const maxT = state.maxThirst ?? 100;
  const curT = state.thirst == null ? 100 : state.thirst;
  return {
    ...state,
    thirst: Math.min(maxT, curT + amount),
    stamina: Math.min(state.maxStamina ?? 100, (state.stamina ?? 0) + staminaBoost),
  };
}

export function applyDamage(state, amount, cause = 'injury') {
  if (state.dead) return state;
  const health = Math.max(0, state.health - amount);
  return {
    ...state,
    health,
    dead: health <= 0,
    causeOfDeath: health <= 0 ? cause : state.causeOfDeath,
  };
}

/** Pure fall damage from impact speed (downward positive). */
export function fallDamageFromSpeed(downSpeed) {
  if (!(downSpeed > 11)) return 0;
  return Math.min(80, (downSpeed - 11) * 4.2);
}
