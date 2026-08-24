const PHASES = new Set(['idle', 'underway', 'landed']);

const clamp01 = value => Math.max(0, Math.min(1, Number.isFinite(Number(value)) ? Number(value) : 0));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function point(raw = {}) {
  return { x: finite(raw.x), y: finite(raw.y), z: finite(raw.z) };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function createCrossingState({ start = {}, destination = {} } = {}) {
  const origin = point(start);
  const target = point(destination);
  const totalDistance = Math.max(1, distance(origin, target));
  return {
    version: 1,
    phase: 'idle',
    origin,
    destination: target,
    totalDistance,
    progress: 0,
    maxProgress: 0,
    distance: totalDistance,
    bearing: 0,
    bothAboard: false,
  };
}

export function deserializeCrossingState(raw, context = {}) {
  if (!raw || typeof raw !== 'object') return createCrossingState(context);
  const fallback = createCrossingState(context);
  const origin = point(raw.origin ?? fallback.origin);
  const destination = point(raw.destination ?? fallback.destination);
  const totalDistance = Math.max(1, finite(raw.totalDistance, distance(origin, destination)));
  const phase = PHASES.has(raw.phase) ? raw.phase : 'idle';
  const maxProgress = clamp01(raw.maxProgress ?? raw.progress);
  return {
    ...fallback,
    ...raw,
    version: 1,
    phase,
    origin,
    destination,
    totalDistance,
    progress: clamp01(raw.progress),
    maxProgress,
    distance: Math.max(0, finite(raw.distance, totalDistance)),
    bearing: finite(raw.bearing),
    bothAboard: raw.bothAboard === true,
  };
}

/** Advance the persisted first-crossing telemetry from authoritative boat state. */
export function tickCrossing(state, { boat = null, destination = null, bothAboard = false } = {}) {
  const current = deserializeCrossingState(state, { destination: destination ?? state?.destination ?? {} });
  const target = point(destination ?? current.destination);
  const origin = point(current.origin);
  const totalDistance = Math.max(1, finite(current.totalDistance, distance(origin, target)));
  const hasBoat = !!boat && Number.isFinite(Number(boat.x)) && Number.isFinite(Number(boat.z));
  const boatPoint = hasBoat ? point(boat) : origin;
  const remaining = distance(boatPoint, target);
  const progress = clamp01(1 - remaining / totalDistance);
  const bearing = Math.atan2(target.x - boatPoint.x, target.z - boatPoint.z);
  const landed = hasBoat && remaining <= 5 && boat.beached === true;
  const underway = hasBoat && boat.mounted === true && !landed;
  return {
    ...current,
    destination: target,
    totalDistance,
    phase: landed ? 'landed' : (underway ? 'underway' : current.phase === 'landed' ? 'landed' : 'idle'),
    progress: Math.max(current.progress, progress),
    maxProgress: Math.max(current.maxProgress, progress),
    distance: remaining,
    bearing,
    bothAboard: !!bothAboard,
  };
}

function bearingLabel(radians) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round((((finite(radians) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4))) % directions.length;
  return directions[index];
}

export function crossingHudSummary(state, destinationName = 'the next island') {
  const safe = deserializeCrossingState(state);
  if (safe.phase === 'landed') return `First crossing complete · ${destinationName} reached`;
  if (safe.phase === 'underway') {
    const crew = safe.bothAboard ? ' · crew aboard' : ' · waiting for partner';
    return `Crossing to ${destinationName} · ${Math.round(safe.progress * 100)}% · ${Math.round(safe.distance)}m · ${bearingLabel(safe.bearing)}${crew}`;
  }
  return `First crossing · board the dinghy · ${Math.round(safe.totalDistance)}m ${bearingLabel(safe.bearing)} to ${destinationName}`;
}
