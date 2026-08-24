/** Deterministic Castaway Arrival rules; Three-free so the opening is testable. */

export const CASTAWAY_ARRIVAL_VERSION = 1;

export const CASTAWAY_CONFIG = Object.freeze({
  searchSamples: 2200,
  maxSpawnRadius: 112,
  boatOffset: 4.2,
  salvageRadius: 6.0,
  cardSeconds: 9,
});

/**
 * Score a worldgen candidate for the opening composition.
 * Higher is better: warm sand, shallow coast, open sightline, and a little
 * inland clearance all matter more than raw height.
 */
export function scoreCastawayCandidate(candidate = {}) {
  const sand = candidate.surface === 'sand' || candidate.biome === 'shore' || candidate.biome === 'tropical';
  const shallow = Number(candidate.waterDistance);
  const clear = Number(candidate.clearance);
  const horizon = Number(candidate.horizon);
  const inland = Number(candidate.inland);
  if (!Number.isFinite(shallow) || !Number.isFinite(clear) || !Number.isFinite(horizon)) return -Infinity;
  if (shallow < 1 || shallow > 9 || clear < 2 || horizon < 0) return -Infinity;
  return (sand ? 240 : 0)
    + Math.max(0, 34 - shallow * 5)
    + Math.min(24, clear * 3)
    + Math.min(28, horizon * 2)
    + Math.min(20, inland)
    - Math.abs(Number(candidate.height || 0) - 19) * 0.65;
}

/** Deterministically choose the best candidate; ties preserve seed order. */
export function chooseCastawayCandidate(candidates = []) {
  let best = null;
  let bestScore = -Infinity;
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const score = scoreCastawayCandidate(candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best ? { ...best, score: bestScore } : null;
}

export function createCastawayArrival({ x, y, z, yaw = 0, water = false } = {}) {
  return {
    version: CASTAWAY_ARRIVAL_VERSION,
    x: Number(x) || 0,
    y: Number(y) || 0,
    z: Number(z) || 0,
    yaw: Number(yaw) || 0,
    water: !!water,
    salvaged: false,
  };
}

/** Optional save field stays legacy-safe and rejects malformed coordinates. */
export function restoreCastawayArrival(raw) {
  if (!raw || !Number.isFinite(Number(raw.x)) || !Number.isFinite(Number(raw.y)) || !Number.isFinite(Number(raw.z))) {
    return null;
  }
  return {
    ...createCastawayArrival(raw),
    boatX: Number.isFinite(Number(raw.boatX)) ? Number(raw.boatX) : Number(raw.x),
    boatY: Number.isFinite(Number(raw.boatY)) ? Number(raw.boatY) : Number(raw.y) - 0.9,
    boatZ: Number.isFinite(Number(raw.boatZ)) ? Number(raw.boatZ) : Number(raw.z) + 2.5,
    waterDirX: Number(raw.waterDirX) || 0,
    waterDirZ: Number(raw.waterDirZ) || 1,
    salvaged: !!raw.salvaged,
  };
}

export function castawayObjective(salvaged = false) {
  return salvaged
    ? 'Find fresh water · choose a camp before nightfall'
    : 'Salvage the wreckage · find fresh water before nightfall';
}
