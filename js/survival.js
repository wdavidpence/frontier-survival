/**
 * Survival body simulation — the SC differentiator vs soft mining sandboxes.
 * Pure logic; no DOM/Three dependency (unit-testable).
 */

export const DEFAULT_SURVIVAL = {
  health: 100,
  maxHealth: 100,
  hunger: 100,
  maxHunger: 100,
  stamina: 100,
  maxStamina: 100,
  bodyTemp: 37.0, // °C
  sleep: 0, // 0 rested → 100 collapsing
  wetness: 0,
  warmthFromClothes: 0,
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
 * @param {number} [env.coldDamageMult]
 */
export function tickSurvival(state, env) {
  if (state.dead) return state;

  const dt = env.dt;
  const next = { ...state };
  const ambient = ambientTempC(env.dayPhase, env.weather);
  const clothes = next.warmthFromClothes || 0;
  const fire = env.blockHeat || 0;
  const coldMult = env.coldDamageMult ?? 1;

  // Wetness
  if (env.inWater) next.wetness = Math.min(100, next.wetness + 40 * dt);
  else if ((env.wetnessGain || 0) > 0) {
    next.wetness = Math.min(100, next.wetness + env.wetnessGain * dt);
  } else next.wetness = Math.max(0, next.wetness - 8 * dt);

  const wetPenalty = (next.wetness / 100) * 8;
  // Campfires are a primary survival tool — strong local heat must beat night air
  const fireWarmth = Math.min(32, fire * 1.35);
  const feelsLike = ambient + clothes + fireWarmth - wetPenalty;

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

  const tempRate = 0.12 + (fire > 5 ? 0.1 : 0) + (feelsLike < 5 || feelsLike > 36 ? 0.1 : 0);
  next.bodyTemp += (target - next.bodyTemp) * Math.min(1, tempRate * dt);

  // Hunger
  let hungerDrain = 0.35; // per second baseline — harsh enough to matter in a session
  if (env.sprinting) hungerDrain += 0.55;
  if (env.moving) hungerDrain += 0.12;
  if (env.sleeping) hungerDrain *= 0.35;
  hungerDrain *= env.hungerMult ?? 1;
  next.hunger = Math.max(0, next.hunger - hungerDrain * dt);

  // Stamina
  if (env.sprinting && env.moving) {
    next.stamina = Math.max(0, next.stamina - 22 * dt);
  } else if (!env.sprinting) {
    const regen = next.hunger > 10 ? 14 : 5;
    next.stamina = Math.min(next.maxStamina, next.stamina + regen * dt);
  }

  // Sleep debt while awake
  if (env.sleeping) {
    next.sleep = Math.max(0, next.sleep - 28 * dt);
  } else {
    let sleepGain = 0.55;
    // nights accelerate tiredness
    const night = env.dayPhase > 0.55 && env.dayPhase < 0.95;
    if (night) sleepGain *= 1.6;
    if (env.sprinting) sleepGain *= 1.2;
    next.sleep = Math.min(100, next.sleep + sleepGain * dt);
  }

  // Damage conditions
  let dps = 0;
  let cause = null;

  if (next.hunger <= 0) {
    dps += 4;
    cause = 'starvation';
  } else if (next.hunger < 15) {
    dps += 0.6;
    cause = 'starvation';
  }

  if (next.bodyTemp < 32) {
    dps += 6 * coldMult;
    cause = 'hypothermia';
  } else if (next.bodyTemp < 34.5) {
    dps += 2 * coldMult;
    cause = 'hypothermia';
  } else if (next.bodyTemp > 41) {
    dps += 5 * coldMult;
    cause = 'heatstroke';
  }

  if (next.sleep >= 98 && !env.sleeping) {
    dps += 3;
    cause = 'exhaustion';
  }

  if (dps > 0) {
    next.health = Math.max(0, next.health - dps * dt);
  } else if (next.hunger > 40 && next.bodyTemp > 35.5 && next.bodyTemp < 38.5 && next.health < next.maxHealth) {
    // slow regen when comfortable and fed
    next.health = Math.min(next.maxHealth, next.health + 1.2 * dt);
  }

  if (next.health <= 0) {
    next.health = 0;
    next.dead = true;
    next.causeOfDeath = cause || 'unknown';
  }

  next._debug = { ambient, feelsLike, target, dps };
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
    hunger: Math.min(state.maxHunger, state.hunger + amount),
    bodyTemp: state.bodyTemp + warmth * 0.05,
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
