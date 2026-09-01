export const SEAGLASS_CAY = Object.freeze({
  id: 'seaglass_cay',
  name: 'Seaglass Cay',
  minimumCampDistance: 36,
});

const PHASES = new Set(['locked', 'charted', 'surveyed', 'claimed']);

function hashSeed(seed) {
  const text = String(seed ?? 'seaglass');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function finiteNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function placeSeaglassCay(seed = 'default', campPosition = { x: 0, y: 0, z: 0 }) {
  const campX = finiteNumber(campPosition.x);
  const campY = finiteNumber(campPosition.y);
  const campZ = finiteNumber(campPosition.z);
  const first = hashSeed(`${seed}:seaglass`);
  const second = hashSeed(`${seed}:seaglass-radius`);
  const angle = (first / 0x100000000) * Math.PI * 2;
  const radius = SEAGLASS_CAY.minimumCampDistance + (second % 14);
  return {
    id: SEAGLASS_CAY.id,
    name: SEAGLASS_CAY.name,
    x: Math.round(campX + Math.cos(angle) * radius),
    y: Math.round(campY),
    z: Math.round(campZ + Math.sin(angle) * radius),
  };
}

function normalizePhase(value) {
  const phase = String(value ?? 'locked').toLowerCase();
  return PHASES.has(phase) ? phase : 'locked';
}

function cloneDestination(destination) {
  if (!destination || typeof destination !== 'object') return null;
  if (!Number.isFinite(destination.x) || !Number.isFinite(destination.z)) return null;
  return {
    id: SEAGLASS_CAY.id,
    name: SEAGLASS_CAY.name,
    x: Math.round(destination.x),
    y: Math.round(finiteNumber(destination.y)),
    z: Math.round(destination.z),
  };
}

export function createLookoutRouteState(raw = {}) {
  const phase = normalizePhase(raw?.phase);
  const destination = phase === 'locked' ? null : cloneDestination(raw?.destination) || null;
  const resolvedPhase = destination ? phase : 'locked';
  return {
    version: 1,
    id: SEAGLASS_CAY.id,
    phase: resolvedPhase,
    destination,
  };
}

export function chartLookoutRoute(state, options = {}) {
  const current = createLookoutRouteState(state);
  if (current.phase !== 'locked') return current;
  if (options.harborChoice !== 'lookout') return current;
  const campPosition = options.campPosition ?? options.spawnPosition ?? { x: 0, y: 0, z: 0 };
  return {
    version: 1,
    id: SEAGLASS_CAY.id,
    phase: 'charted',
    destination: placeSeaglassCay(options.seed ?? 'default', campPosition),
  };
}

export function surveyLookoutRoute(state) {
  const current = createLookoutRouteState(state);
  if (current.phase !== 'charted') return current;
  return { ...current, phase: 'surveyed' };
}

export function claimLookoutRoute(state) {
  const current = createLookoutRouteState(state);
  if (current.phase !== 'surveyed') return current;
  return { ...current, phase: 'claimed' };
}

export function lookoutRouteHudSummary(state) {
  const current = createLookoutRouteState(state);
  if (current.phase === 'locked') return 'Lookout plan charts Seaglass Cay.';
  if (current.phase === 'charted') return 'Seaglass Cay · Charted · Survey the cay beacon';
  if (current.phase === 'surveyed') return 'Seaglass Cay · Surveyed · Return to the Harbor Signal';
  return 'Seaglass Cay · Claimed · Offshore chart recorded';
}
