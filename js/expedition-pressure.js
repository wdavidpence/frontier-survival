const PHASES = new Set(['dormant', 'threatened', 'secured']);

export const PRESSURE_ID = 'night_stalkers';
export const THREAT_LABEL = 'Night Stalkers';
export const DESTINATION_ID = 'iron_ravine';

const TORCH = 'torch';
const RATION = 'ration';

export const REQUIRED_SUPPLIES = Object.freeze([
  Object.freeze({ id: TORCH, quantity: 1 }),
  Object.freeze({ id: RATION, quantity: 1 }),
]);

export const NIGHT_STALKERS = Object.freeze({
  id: PRESSURE_ID,
  label: THREAT_LABEL,
  destinationId: DESTINATION_ID,
  requirements: REQUIRED_SUPPLIES,
  preparationDriven: true,
  encounterNote: 'Preparation-driven threat; Night Stalkers can be encountered at night or in bad weather.',
});

function cloneRequirements(requirements = REQUIRED_SUPPLIES) {
  return (Array.isArray(requirements) ? requirements : REQUIRED_SUPPLIES).map((requirement) => ({
    id: String(requirement?.id ?? ''),
    quantity: Number.isFinite(requirement?.quantity) ? Math.max(0, Math.trunc(requirement.quantity)) : 0,
  }));
}

function cloneEnvironment(environment) {
  if (!environment || typeof environment !== 'object') return null;
  return {
    dayNight: environment.dayNight,
    weather: environment.weather,
  };
}

function normalizeDayNight(environment = {}) {
  if (environment.isNight === true) return 'night';
  if (environment.isNight === false) return 'day';
  const value = environment.dayNight ?? environment.timeOfDay ?? environment.period ?? environment.time ?? 'day';
  return String(value).toLowerCase().includes('night') ? 'night' : 'day';
}

function normalizeWeather(environment = {}) {
  const value = environment.weather ?? environment.condition ?? 'clear';
  return String(value ?? 'clear').toLowerCase();
}

function snapshotEnvironment(environment) {
  const source = environment && typeof environment === 'object' ? environment : {};
  return {
    dayNight: normalizeDayNight(source),
    weather: normalizeWeather(source),
  };
}

function normalizePhase(value) {
  const phase = String(value ?? 'dormant').toLowerCase();
  if (phase === 'triggered' || phase === 'active' || phase === 'encountered') return 'threatened';
  if (phase === 'prepared' || phase === 'ready' || phase === 'secured') return 'secured';
  return PHASES.has(phase) ? phase : 'dormant';
}

function normalizeConsumed(value) {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(REQUIRED_SUPPLIES.map((requirement) => requirement.id));
  const consumed = [];
  for (const item of value) {
    const id = typeof item === 'string' ? item : item?.id ?? item?.itemId;
    if (allowed.has(id) && !consumed.includes(id)) consumed.push(id);
  }
  return consumed;
}

function stateRecord(phase = 'dormant', environment = null, consumed = []) {
  return {
    version: 1,
    id: PRESSURE_ID,
    label: THREAT_LABEL,
    destinationId: DESTINATION_ID,
    phase: normalizePhase(phase),
    requirements: cloneRequirements(),
    preparationDriven: true,
    environment: cloneEnvironment(environment),
    consumed: normalizeConsumed(consumed),
  };
}

export function createPressureState(options = {}) {
  if (options && typeof options === 'object' && ('phase' in options || 'status' in options || 'triggered' in options || 'secured' in options)) {
    return deserializePressureState(options);
  }
  return stateRecord('dormant');
}

export function deserializePressureState(raw = null) {
  if (!raw || typeof raw !== 'object') return createPressureState();

  let phase = normalizePhase(raw.phase ?? raw.status);
  if (raw.secured === true || raw.secure === true) phase = 'secured';
  else if (raw.triggered === true && phase === 'dormant') phase = 'threatened';

  const legacyEnvironment = raw.environment ?? raw.environmentSnapshot ?? raw.encounterEnvironment ?? {
    dayNight: raw.dayNight,
    timeOfDay: raw.timeOfDay,
    weather: raw.weather,
  };
  const environment = raw.environment || raw.environmentSnapshot || raw.encounterEnvironment || raw.dayNight || raw.timeOfDay || raw.weather
    ? snapshotEnvironment(legacyEnvironment)
    : null;

  return stateRecord(phase, environment, raw.consumed ?? raw.consumedSupplies);
}

function cloneState(state) {
  if (!state || typeof state !== 'object') return createPressureState();
  return stateRecord(state.phase, state.environment, state.consumed);
}

export function triggerPressure(state, environment = {}) {
  const current = cloneState(state);
  if (current.phase !== 'dormant') return current;
  const next = cloneState(current);
  next.phase = 'threatened';
  next.environment = snapshotEnvironment(environment);
  return next;
}

function countSupply(supplies, wantedId, seen = new Set()) {
  if (supplies == null) return 0;
  if (typeof supplies === 'string') return supplies === wantedId ? 1 : 0;
  if (typeof supplies !== 'object') return 0;
  if (seen.has(supplies)) return 0;
  seen.add(supplies);

  if (Array.isArray(supplies)) {
    return supplies.reduce((total, item) => total + countSupply(item, wantedId, seen), 0);
  }

  let total = 0;
  const directId = supplies.id ?? supplies.itemId ?? supplies.item;
  if (directId === wantedId) {
    const quantity = supplies.quantity ?? supplies.count ?? supplies.amount;
    total += quantity === undefined ? 1 : (Number.isFinite(quantity) ? Math.max(0, quantity) : 0);
  }

  if (Object.prototype.hasOwnProperty.call(supplies, wantedId)) {
    const quantity = supplies[wantedId];
    total += quantity === true ? 1 : (Number.isFinite(quantity) ? Math.max(0, quantity) : 0);
  }

  for (const key of ['items', 'inventory', 'slots', 'supplies']) {
    if (supplies[key] !== undefined) total += countSupply(supplies[key], wantedId, seen);
  }
  return total;
}

export function securePressure(state, supplies) {
  const current = cloneState(state);
  if (current.phase === 'secured') return { state: current, consumed: [] };
  if (current.phase !== 'threatened') {
    throw new Error(`invalid pressure phase transition: ${current.phase} -> secured`);
  }

  const missing = REQUIRED_SUPPLIES
    .filter((requirement) => countSupply(supplies, requirement.id) < requirement.quantity)
    .map((requirement) => requirement.id);
  if (missing.length > 0) {
    throw new Error(`pressure preparation requires ${missing.join(' and ')}`);
  }

  const secured = cloneState(current);
  secured.phase = 'secured';
  secured.consumed = REQUIRED_SUPPLIES.map((requirement) => requirement.id);
  return { state: secured, consumed: [...secured.consumed] };
}

const PHASE_LABELS = Object.freeze({
  dormant: 'Dormant',
  threatened: 'Threatened',
  secured: 'Secured',
});

export function getPressureHudSummary(state) {
  const current = cloneState(state);
  const phase = PHASE_LABELS[current.phase] ?? PHASE_LABELS.dormant;
  const environment = current.environment
    ? ` · ${current.environment.dayNight} · ${current.environment.weather}`
    : '';
  return `${THREAT_LABEL} · ${phase} · Iron Ravine · Requires torch + ration${environment} · Preparation-driven; night/bad-weather pressure`;
}
