export const LANDING_BERTH = Object.freeze({
  id: 'landing_berth',
  name: 'Landing Berth',
  moorRadius: 6,
});

const PHASES = new Set(['locked', 'open', 'moored']);

function finiteNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function placeLandingSlip(harborPosition = { x: 0, y: 0, z: 0 }) {
  return {
    x: Math.round(finiteNumber(harborPosition.x) * 10) / 10,
    y: finiteNumber(harborPosition.y),
    z: Math.round((finiteNumber(harborPosition.z) + 3.2) * 10) / 10,
  };
}

function cloneSlip(slip) {
  if (!slip || typeof slip !== 'object') return null;
  if (!Number.isFinite(slip.x) || !Number.isFinite(slip.z)) return null;
  return { x: finiteNumber(slip.x), y: finiteNumber(slip.y), z: finiteNumber(slip.z) };
}

function normalizePhase(value) {
  const phase = String(value ?? 'locked').toLowerCase();
  return PHASES.has(phase) ? phase : 'locked';
}

export function createLandingBerthState(raw = {}) {
  const phase = normalizePhase(raw?.phase);
  const slip = phase === 'locked' ? null : cloneSlip(raw?.slip);
  return {
    version: 1,
    id: LANDING_BERTH.id,
    phase: slip ? phase : 'locked',
    slip,
  };
}

export function openLandingBerth(state, options = {}) {
  const current = createLandingBerthState(state);
  if (current.phase !== 'locked') return current;
  if (options.harborChoice !== 'landing') return current;
  const harborPosition = options.harborPosition ?? options.campPosition ?? { x: 0, y: 0, z: 0 };
  return {
    version: 1,
    id: LANDING_BERTH.id,
    phase: 'open',
    slip: placeLandingSlip(harborPosition),
  };
}

export function boatNearBerth(state, boat) {
  const current = createLandingBerthState(state);
  if (!current.slip || !boat) return false;
  return Math.hypot(finiteNumber(boat.x) - current.slip.x, finiteNumber(boat.z) - current.slip.z) <= LANDING_BERTH.moorRadius;
}

export function moorBoatAtBerth(state, boat) {
  const current = createLandingBerthState(state);
  if (current.phase === 'locked' || !current.slip || !boatNearBerth(current, boat)) {
    return { ok: false, state: current, boat };
  }
  return {
    ok: true,
    state: { ...current, phase: 'moored' },
    boat: {
      x: current.slip.x,
      y: current.slip.y,
      z: current.slip.z,
      vx: 0,
      vz: 0,
      beached: true,
    },
  };
}

export function launchBoatFromBerth(state, boat, seaLevel = 16) {
  const current = createLandingBerthState(state);
  if (current.phase !== 'moored' || !current.slip || !boat) {
    return { ok: false, state: current, boat };
  }
  return {
    ok: true,
    state: { ...current, phase: 'open' },
    boat: {
      x: current.slip.x,
      y: finiteNumber(seaLevel) + 0.12,
      z: current.slip.z + 2.4,
      vx: 0,
      vz: 0,
      beached: false,
    },
  };
}

export function landingBerthHudSummary(state) {
  const current = createLandingBerthState(state);
  if (current.phase === 'locked') return 'Landing plan opens a skiff return berth.';
  if (current.phase === 'moored') return 'Landing Berth · Skiff moored · F to launch';
  return 'Landing Berth · Open · Moor the skiff with F';
}
