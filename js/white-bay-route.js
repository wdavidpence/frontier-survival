export const WHITE_BAY = Object.freeze({
  id: 'white_bay',
  name: 'White Bay',
  x: -42,
  y: 16,
  z: 9,
});

const PHASES = new Set(['locked', 'charted', 'surveyed', 'claimed']);

function normalizePhase(value) {
  const phase = String(value ?? 'locked').toLowerCase();
  return PHASES.has(phase) ? phase : 'locked';
}

export function placeWhiteBay() {
  return { id: WHITE_BAY.id, name: WHITE_BAY.name, x: WHITE_BAY.x, y: WHITE_BAY.y, z: WHITE_BAY.z };
}

function cloneDestination(destination) {
  if (!destination || typeof destination !== 'object') return null;
  if (!Number.isFinite(destination.x) || !Number.isFinite(destination.z)) return null;
  return placeWhiteBay();
}

export function createWhiteBayRouteState(raw = {}) {
  const phase = normalizePhase(raw?.phase);
  const destination = phase === 'locked' ? null : cloneDestination(raw?.destination) || (phase === 'locked' ? null : placeWhiteBay());
  const resolvedPhase = destination ? phase : 'locked';
  return {
    version: 1,
    id: WHITE_BAY.id,
    phase: resolvedPhase,
    destination,
  };
}

export function chartWhiteBayRoute(state, options = {}) {
  const current = createWhiteBayRouteState(state);
  if (current.phase !== 'locked') return current;
  if (options.tidewatchClaimed !== true && options.destinationPhase !== 'claimed') return current;
  return {
    version: 1,
    id: WHITE_BAY.id,
    phase: 'charted',
    destination: placeWhiteBay(),
  };
}

export function surveyWhiteBayRoute(state) {
  const current = createWhiteBayRouteState(state);
  if (current.phase !== 'charted') return current;
  return { ...current, phase: 'surveyed' };
}

export function claimWhiteBayRoute(state) {
  const current = createWhiteBayRouteState(state);
  if (current.phase !== 'surveyed') return current;
  return { ...current, phase: 'claimed' };
}

export function whiteBayRouteHudSummary(state) {
  const current = createWhiteBayRouteState(state);
  if (current.phase === 'locked') return 'Tidewatch return charts White Bay.';
  if (current.phase === 'charted') return 'White Bay · Charted · Survey the overnight camp';
  if (current.phase === 'surveyed') return 'White Bay · Surveyed · Return to the Harbor Signal';
  return 'White Bay · Claimed · Overnight coastal chart recorded';
}
