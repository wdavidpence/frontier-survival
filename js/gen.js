/** Deterministic value noise for terrain */
import { sandyBeachHeight, isSandyBeachSurface } from './shore-water.js?v=1';
/** Deterministic 2D hash in [0,1). Integer-safe (float mul collapsed to ~0.5 for large coords). */
export function hash2(x, z) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function smoothNoise(x, z) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const a = hash2(x0, z0);
  const b = hash2(x0 + 1, z0);
  const c = hash2(x0, z0 + 1);
  const d = hash2(x0 + 1, z0 + 1);
  const u = a + (b - a) * sx;
  const v = c + (d - c) * sx;
  return u + (v - u) * sz;
}

export function fbm(x, z, octaves = 4) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += smoothNoise(x * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** Sea level constant shared with world (keep in sync with World.SEA_LEVEL). */
export const GEN_SEA_LEVEL = 16;

/**
 * Terrain height. The travel field is deliberately ocean-dominant: a broad
 * coastal basin becomes water unless a high-isle sample punches through it.
 * The starter shelf and authored shore bay below are kept as explicit safety
 * contracts rather than accidental noise.
 */
/** <1 stretches landforms so islands remain readable while travel stays wet. */
export const WORLD_SCALE = 0.5;
export const ARCHIPELAGO_COAST_THRESHOLD = 0.60;
export const ARCHIPELAGO_ISLAND_THRESHOLD = 0.68;
// Legacy coast < 0.56 / isle > 0.54 was tightened into the constants above.

/** Numeric IDs are kept here so the pure seam can be mirrored by the worker. */
export const EXPOSED_ORE = Object.freeze({ COAL: 13, IRON: 18, COPPER: 56, DIAMOND: 57 });

/** BVI-inspired macro landforms: broad steep islands, a low flat island, and sparse cays. */
const BVI_MAJOR_LANDFORMS = Object.freeze([
  { name: 'tortola', cx: 22, cz: -20, rx: 43, rz: 22, peak: 20 },
  { name: 'virgin-gorda', cx: 82, cz: -4, rx: 28, rz: 16, peak: 16 },
  { name: 'jost-van-dyke', cx: -42, cz: 20, rx: 22, rz: 12, peak: 13 },
  { name: 'anegada', cx: 96, cz: 48, rx: 35, rz: 17, peak: 5 },
]);
const BVI_SPARSE_CAYS = Object.freeze([
  { name: 'peter-island', cx: 28, cz: 18, rx: 8, rz: 5, peak: 6 },
  { name: 'cooper-island', cx: 55, cz: 30, rx: 7, rz: 5, peak: 5 },
  { name: 'great-camanoe', cx: 52, cz: -27, rx: 7, rz: 4, peak: 5 },
]);

// One-tenth-scale regional additions. Horizontal cells represent ~10 m; the
// existing starter landmarks stay fixed for route/save compatibility. These
// missing islands complete the real BVI ordering: Norman/Peter/Salt south,
// Beef/Scrub/Great Camanoe east, and the low Anegada shelf farther northeast.
export const BVI_TENTH_SCALE = Object.freeze({
  metersPerCell: 10,
  horizontal: '1:10 coastline approximation',
  vertical: 'compressed to the 48-block survival world',
});
const BVI_TENTH_ISLANDS = Object.freeze([
  { name: 'beef-island', cx: 116, cz: -4, rx: 24, rz: 8, peak: 10 },
  { name: 'virgin-gorda-east', cx: 170, cz: -4, rx: 42, rz: 12, peak: 20 },
  { name: 'norman-island', cx: -8, cz: 64, rx: 27, rz: 10, peak: 14 },
  { name: 'salt-island', cx: 76, cz: 62, rx: 13, rz: 7, peak: 8 },
  { name: 'scrub-island', cx: 140, cz: -28, rx: 16, rz: 7, peak: 9 },
  { name: 'anegada-east', cx: 260, cz: 44, rx: 55, rz: 18, peak: 5 },
  { name: 'ginger-island', cx: 82, cz: 34, rx: 9, rz: 4, peak: 6 },
  { name: 'marina-cay', cx: 101, cz: -20, rx: 6, rz: 3, peak: 4 },
]);

const BVI_TENTH_LOCATIONS = Object.freeze([
  { name: 'Road Town · Tortola', x: 22, z: 4, radius: 10 },
  { name: 'West End · Tortola', x: -55, z: -10, radius: 9 },
  { name: 'Cane Garden Bay · Tortola', x: -10, z: -34, radius: 8 },
  { name: 'East End · Tortola', x: 82, z: -8, radius: 10 },
  { name: 'Spanish Town · Virgin Gorda', x: 170, z: -4, radius: 12 },
  { name: 'Beef Island · Trellis Bay', x: 116, z: -4, radius: 12 },
  { name: 'Norman Island', x: -8, z: 64, radius: 12 },
  { name: 'Salt Island', x: 76, z: 62, radius: 8 },
  { name: 'Scrub Island', x: 140, z: -28, radius: 9 },
  { name: 'Anegada · Salt Pond', x: 260, z: 44, radius: 16 },
]);

const BVI_SHELTERED_COVES = Object.freeze([
  { name: 'white-bay', cx: -42, cz: 8, rx: 14, rz: 6 },
  { name: 'north-sound', cx: 52, cz: -2, rx: 10, rz: 5 },
  { name: 'cane-garden-bay', cx: -10, cz: -36, rx: 10, rz: 4 },
]);
const BVI_BEACH_LANDINGS = Object.freeze([
  { name: 'white-bay-landing', cx: -42, cz: 9, rx: 12, rz: 1 },
  { name: 'north-sound-landing', cx: 52, cz: -5, rx: 8, rz: 1 },
  { name: 'cane-garden-bay-landing', cx: -10, cz: -34, rx: 8, rz: 1 },
]);
const BVI_ROUTE_CORRIDORS = Object.freeze([
  { name: 'white-bay-channel', x1: 18, z1: 8, x2: -42, z2: 8, width: 3 },
  { name: 'north-sound-channel', x1: 32, z1: 10, x2: 52, z2: 10, width: 3 },
  { name: 'north-sound-approach', x1: 52, z1: 10, x2: 52, z2: -5, width: 3 },
]);

function ellipseInfluence(x, z, landform) {
  const distance = Math.hypot((x - landform.cx) / landform.rx, (z - landform.cz) / landform.rz);
  if (distance >= 1) return 0;
  const edge = 1 - distance;
  return edge * edge * (3 - 2 * edge);
}

/** Return deterministic BVI-style composition data for map tests and biome seams. */
export function bviLandformAt(x, z) {
  let major = { influence: 0, peak: 0, name: '' };
  for (const landform of BVI_MAJOR_LANDFORMS) {
    const influence = ellipseInfluence(x, z, landform);
    if (influence > major.influence) major = { influence, peak: landform.peak, name: landform.name };
  }
  for (const landform of BVI_TENTH_ISLANDS) {
    const influence = ellipseInfluence(x, z, landform);
    if (influence > major.influence) major = { influence, peak: landform.peak, name: landform.name };
  }
  let cay = { influence: 0, peak: 0, name: '' };
  for (const landform of BVI_SPARSE_CAYS) {
    const influence = ellipseInfluence(x, z, landform);
    if (influence > cay.influence) cay = { influence, peak: landform.peak, name: landform.name };
  }
  return {
    majorInfluence: major.influence,
    majorPeak: major.peak,
    majorName: major.name,
    cayInfluence: cay.influence,
    cayPeak: cay.peak,
    cayName: cay.name,
    influence: Math.max(major.influence, cay.influence),
  };
}

/** Player-facing place cue for the authored 1/10-scale BVI region. */
export function bviLocationAt(x, z) {
  let nearest = null;
  let best = Infinity;
  for (const location of BVI_TENTH_LOCATIONS) {
    const distance = Math.hypot(x - location.x, z - location.z);
    if (distance <= location.radius && distance < best) {
      nearest = { name: location.name, distance };
      best = distance;
    }
  }
  return nearest;
}

/** Return named sheltered-water strength only where the cove remains open water. */
export function bviCoveAt(x, z) {
  if (bviLandformAt(x, z).influence > 0) return { influence: 0, name: '' };
  let cove = { influence: 0, name: '' };
  for (const candidate of BVI_SHELTERED_COVES) {
    const influence = ellipseInfluence(x, z, candidate);
    if (influence > cove.influence) cove = { influence, name: candidate.name };
  }
  return cove;
}

/** Return a deterministic sand landing where a named cove meets its island shore. */
/** Return a deterministic sand landing where a named cove meets its island shore. */
export function bviBeachLandingAt(x, z) {
  let landing = { influence: 0, name: '' };
  for (const candidate of BVI_BEACH_LANDINGS) {
    const influence = ellipseInfluence(x, z, candidate);
    if (influence > landing.influence) landing = { influence, name: candidate.name };
  }
  return landing;
}

const BVI_CHANNEL_BUOYS = Object.freeze([
  { x: 12, z: 6, id: 'green' },
  { x: 12, z: 10, id: 'red' },
  { x: -8, z: 6, id: 'red' },
  { x: -8, z: 10, id: 'green' },
  { x: -28, z: 6, id: 'green' },
  { x: -28, z: 10, id: 'red' },
  { x: 36, z: 8, id: 'red' },
  { x: 36, z: 12, id: 'green' },
  { x: 44, z: 8, id: 'green' },
  { x: 44, z: 12, id: 'red' },
  { x: 50, z: 6, id: 'red' },
  { x: 54, z: 6, id: 'green' },
  { x: 50, z: -2, id: 'green' },
  { x: 54, z: -2, id: 'red' },
]);

export function bviChannelBuoyAt(x, z) {
  return BVI_CHANNEL_BUOYS.find((buoy) => buoy.x === x && buoy.z === z) || null;
}

const BVI_DOCK = Object.freeze({ name: 'north-sound-dock', z: -4, xMin: 50, xMax: 54 });
export function bviDockAt(x, z) {
  if (z !== BVI_DOCK.z || x < BVI_DOCK.xMin || x > BVI_DOCK.xMax) return null;
  return { name: BVI_DOCK.name, post: x === BVI_DOCK.xMin || x === BVI_DOCK.xMax };
}

const BVI_WET_SAND_EDGES = Object.freeze([
  { name: 'white-bay-landing', cx: -42, cz: 9, rx: 12 },
  { name: 'north-sound-landing', cx: 52, cz: -5, rx: 8 },
  { name: 'cane-garden-bay-landing', cx: -10, cz: -34, rx: 8 },
]);
export function bviWetSandAt(x, z) {
  for (const edge of BVI_WET_SAND_EDGES) {
    const distance = Math.abs(x - edge.cx);
    if (z === edge.cz && distance >= Math.floor(edge.rx * 0.72) && distance <= edge.rx) {
      return { name: edge.name };
    }
  }
  return null;
}

const BVI_REEF_HEADS = Object.freeze([
  [-46, 5], [-42, 5], [-38, 5], [-44, 7],
  [48, -1], [50, -3], [54, -3], [54, -1],
]);
export function bviReefHeadAt(x, z) {
  return BVI_REEF_HEADS.some(([hx, hz]) => hx === x && hz === z) ? { name: 'named-cove-reef-head' } : null;
}

const BVI_CAY_OUTCROPS = Object.freeze([
  { name: 'peter-island-outcrop', x: 24, z: 16 },
  { name: 'peter-island-outcrop', x: 32, z: 20 },
  { name: 'cooper-island-outcrop', x: 51, z: 28 },
  { name: 'cooper-island-outcrop', x: 59, z: 30 },
  { name: 'great-camanoe-outcrop', x: 50, z: -29 },
  { name: 'great-camanoe-outcrop', x: 54, z: -25 },
]);
export function bviCayOutcropAt(x, z) {
  return BVI_CAY_OUTCROPS.find((outcrop) => outcrop.x === x && outcrop.z === z) || null;
}

const BVI_SALT_POND = Object.freeze({ name: 'anegada-salt-pond', xMin: 90, xMax: 102, zMin: 33, zMax: 35 });
export function bviSaltPondAt(x, z) {
  if (x < BVI_SALT_POND.xMin || x > BVI_SALT_POND.xMax || z < BVI_SALT_POND.zMin || z > BVI_SALT_POND.zMax) return null;
  return { name: BVI_SALT_POND.name };
}
export function bviSaltPondScrubAt(x, z) {
  if (!bviSaltPondAt(x, z) && ((z === 32 || z === 36) && x >= 90 && x <= 102 && x % 4 === 2)) {
    return { name: 'anegada-salt-scrub' };
  }
  if (!bviSaltPondAt(x, z) && (x === 88 || x === 104) && z === 34) return { name: 'anegada-salt-scrub' };
  return null;
}
const BVI_LANDING_SIGN = Object.freeze({ name: 'north-sound-landing-sign', z: -5, xMin: 55, xMax: 57, postX: 56 });
export function bviLandingSignAt(x, z) {
  if (z !== BVI_LANDING_SIGN.z || x < BVI_LANDING_SIGN.xMin || x > BVI_LANDING_SIGN.xMax) return null;
  return { name: BVI_LANDING_SIGN.name, post: x === BVI_LANDING_SIGN.postX, board: true };
}
const BVI_STARTER_RAMP = Object.freeze({ name: 'starter-beach-launch-ramp', xMin: 24, xMax: 28, zMin: 12, zMax: 13 });
export function bviStarterRampAt(x, z) {
  if (x < BVI_STARTER_RAMP.xMin || x > BVI_STARTER_RAMP.xMax || z < BVI_STARTER_RAMP.zMin || z > BVI_STARTER_RAMP.zMax) return null;
  return { name: BVI_STARTER_RAMP.name };
}
const BVI_DRIFTWOOD = Object.freeze([[23, 14], [29, 14]]);
export function bviDriftwoodAt(x, z) {
  return BVI_DRIFTWOOD.some(([dx, dz]) => dx === x && dz === z) ? { name: 'starter-beach-driftwood' } : null;
}

/** Return a safe water corridor between the starter launch and White Bay. */
export function bviRouteCorridorAt(x, z) {
  let route = { influence: 0, name: '' };
  for (const candidate of BVI_ROUTE_CORRIDORS) {
    const ax = candidate.x1;
    const az = candidate.z1;
    const bx = candidate.x2;
    const bz = candidate.z2;
    const dx = bx - ax;
    const dz = bz - az;
    const lengthSq = dx * dx + dz * dz;
    const projection = lengthSq > 0 ? ((x - ax) * dx + (z - az) * dz) / lengthSq : 0;
    const t = Math.max(0, Math.min(1, projection));
    const nearestX = ax + dx * t;
    const nearestZ = az + dz * t;
    const distance = Math.hypot(x - nearestX, z - nearestZ);
    const influence = Math.max(0, 1 - distance / candidate.width);
    if (influence > route.influence) route = { influence, name: candidate.name };
  }
  return route;
}

/** Return reef-belt strength outside a modeled island or cay, never on land. */
export function bviReefShelfAt(x, z) {
  const current = bviLandformAt(x, z).influence;
  if (current > 0) return 0;
  const cove = bviCoveAt(x, z);
  if (cove.influence > 0.2) return Math.min(1, cove.influence * 0.9);
  const route = bviRouteCorridorAt(x, z);
  if (route.influence > 0.2 && route.influence < 0.9) return Math.min(0.7, route.influence * 0.75);
  let nearby = 0;
  for (const [dx, dz] of [[6, 0], [-6, 0], [0, 6], [0, -6], [4, 4], [-4, 4], [4, -4], [-4, -4]]) {
    nearby = Math.max(nearby, bviLandformAt(x + dx, z + dz).influence);
  }
  return nearby > 0.18 ? Math.min(1, nearby * 1.35) : 0;
}

export function bviDeepWaterAt(x, z) {
  if (bviLandformAt(x, z).influence > 0) return 0;
  if (x < -90 || x > 330 || z < -120 || z > 130) return 0;
  const route = bviRouteCorridorAt(x, z);
  const broad = fbm(x * 0.008 + 17, z * 0.008 - 11, 3);
  const trench = fbm(x * 0.021 - 23, z * 0.021 + 31, 3);
  if (route.influence > 0.78) return 0.25;
  if (broad < 0.40 || trench < 0.52) return 0;
  return Math.min(1, (broad - 0.40) * 1.55 + (trench - 0.52) * 1.20);
}

/** Deterministic forest-floor dressing, kept pure so sync and worker terrain agree. */
export function forestFloorDetail(x, z, seed, biome, height, surfaceId, aboveId) {
  if (biome !== 'forest' || height <= GEN_SEA_LEVEL + 1 || aboveId !== 0) return null;
  const roll = hash2(x * 29 + seed * 7, z * 31 + seed * 11);
  if (surfaceId !== 1 && surfaceId !== 2 && surfaceId !== 4) return null;
  if (roll > 0.9875) return 'mushroom';
  if (roll > 0.93) return 'roots';
  if (roll > 0.84) return 'sticks';
  if (roll > 0.74) return 'damp-soil';
  return null;
}

/** Blend the first few chunks toward a low, wet island shelf. */
export function starterCoastBlend(x, z) {
  return Math.max(0, Math.min(1, 1 - Math.hypot(x, z) / 180));
}

export function starterCoveAt(x, z) {
  return x >= 20 && x <= 31 && z >= 14 && z <= 15;
}

export function heightAt(x, z, seed = 0) {
  const sx = x * 0.03 * WORLD_SCALE + seed * 17.1;
  const sz = z * 0.03 * WORLD_SCALE + seed * 9.7;
  const h = fbm(sx, sz, 5);
  const ridge = Math.abs(fbm(sx * 0.5 + 20, sz * 0.5 - 10, 3) - 0.5) * 2;
  // Lower baseline + stronger ridges leaves room for ocean while keeping
  // mountain silhouettes well below the 48-block world ceiling.
  let y = 7 + h * 10 + ridge * 11;

  const coast = fbm(x * 0.01 * WORLD_SCALE + 3, z * 0.01 * WORLD_SCALE + 7, 3);
  const isle = fbm(x * 0.05 * WORLD_SCALE + seed * 3.1, z * 0.05 * WORLD_SCALE + seed * 5.7, 3);
  if (coast < ARCHIPELAGO_COAST_THRESHOLD) {
    const depth = (ARCHIPELAGO_COAST_THRESHOLD - coast) / ARCHIPELAGO_COAST_THRESHOLD;
    y -= depth * depth * 30;
  }
  if (coast < ARCHIPELAGO_COAST_THRESHOLD && isle > ARCHIPELAGO_ISLAND_THRESHOLD) {
    const rise = Math.pow((isle - ARCHIPELAGO_ISLAND_THRESHOLD) / (1 - ARCHIPELAGO_ISLAND_THRESHOLD), 0.58);
    const ridgeCut = fbm(x * 0.022 * WORLD_SCALE + seed * 4.7, z * 0.022 * WORLD_SCALE - seed * 2.3, 3);
    y = Math.max(y, GEN_SEA_LEVEL + 1 + rise * 29 + ridgeCut * 5);
  }

  const starterBlend = starterCoastBlend(x, z);
  if (starterBlend > 0) {
    const shelf = 4 + fbm(x * 0.018 * WORLD_SCALE + 41, z * 0.018 * WORLD_SCALE - 17, 3) * 10;
    y = y * (1 - starterBlend) + shelf * starterBlend;
  }
  const bvi = bviLandformAt(x, z);
  const cove = bviCoveAt(x, z);
  const beachLanding = bviBeachLandingAt(x, z);
  const route = bviRouteCorridorAt(x, z);
  const deepWater = bviDeepWaterAt(x, z);
  const bviRegion = x >= -90 && x <= 330 && z >= -120 && z <= 130;
  const authoredWetland = x >= 46 && x <= 68 && z >= 52 && z <= 72;
  if (bvi.influence > 0) {
    const relief = fbm(x * 0.04 * WORLD_SCALE + seed * 2.1, z * 0.04 * WORLD_SCALE - seed * 1.7, 3);
    const macroInfluence = bvi.majorInfluence > 0 ? bvi.majorInfluence : bvi.cayInfluence;
    const macroPeak = bvi.majorInfluence > 0 ? bvi.majorPeak : bvi.cayPeak;
    y = Math.max(y, GEN_SEA_LEVEL + 1 + macroPeak * macroInfluence + relief * 3 * macroInfluence);
  } else if (bviRegion && !authoredWetland) {
    // Keep the Drake Channel open, but carve rare 4–10 block bluewater basins.
    y = deepWater > 0
      ? Math.min(y, GEN_SEA_LEVEL - 4 - Math.floor(deepWater * 6))
      : Math.min(y, GEN_SEA_LEVEL - 2);
  }
  if (cove.influence > 0) y = Math.max(y, Math.min(GEN_SEA_LEVEL - 1, GEN_SEA_LEVEL - 2 + Math.floor(cove.influence)));
  if (route.influence > 0) y = Math.min(y, GEN_SEA_LEVEL - 1);
  if (beachLanding.influence > 0) y = Math.max(y, GEN_SEA_LEVEL + 1);
  if (authoredWetland) y = Math.max(y, GEN_SEA_LEVEL + 2);
  if (starterCoveAt(x, z)) y = GEN_SEA_LEVEL + 1;
  // Safe, buildable starter island and the existing authored shore destination.
  if (Math.hypot(x, z) < 18 && route.influence <= 0) y = Math.max(y, GEN_SEA_LEVEL);
  if (Math.hypot(x - 26, z - 22) < 9) y = Math.max(y, GEN_SEA_LEVEL);
  if (Math.hypot(x - 42, z - 51) < 8) y = Math.max(y, GEN_SEA_LEVEL + 2);
  // Keep the first walk on the starter island in the same island mask while
  // making the nearby horizon reveal steep tropical relief.
  if (
    Math.hypot(x, z) > 18 &&
    coast < ARCHIPELAGO_COAST_THRESHOLD &&
    isle > ARCHIPELAGO_ISLAND_THRESHOLD &&
    !bviRegion
  ) {
    const rise = Math.pow((isle - ARCHIPELAGO_ISLAND_THRESHOLD) / (1 - ARCHIPELAGO_ISLAND_THRESHOLD), 0.62);
    y = Math.max(y, GEN_SEA_LEVEL + 1 + rise * 32);
  }
  return Math.max(1, Math.min(46, Math.floor(y)));
}

/** Grade the first few land blocks above sea level into a readable tropical beach. */
export function coastalGradeHeight(x, z, seed = 0) {
  const raw = heightAt(x, z, seed);
  if (raw < GEN_SEA_LEVEL) return raw;
  let nearestWater = Infinity;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [3, 0], [-3, 0], [0, 3], [0, -3], [4, 0], [-4, 0], [0, 4], [0, -4]]) {
    if (heightAt(x + dx, z + dz, seed) < GEN_SEA_LEVEL) nearestWater = Math.min(nearestWater, Math.abs(dx) + Math.abs(dz));
  }
  if (!Number.isFinite(nearestWater)) return raw;
  const allowedRise = 1 + nearestWater * 1.25;
  return Math.min(raw, GEN_SEA_LEVEL + Math.floor(allowedRise));
}

/**
 * Lower ordinary sandy shoreline cells to the flush waterline. Rocky faces and
 * higher inland relief remain untouched; sync and worker generation mirror this
 * seam so streamed chunks cannot resurrect one-block-high sand.
 */
export function sandyCoastHeight(x, z, seed = 0, biome = '', gradedHeight = coastalGradeHeight(x, z, seed), rocky = false) {
  if (rocky || (biome !== 'shore' && biome !== 'ocean')) return gradedHeight;
  const adjacentWater = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [2, 0], [-2, 0], [0, 2], [0, -2],
  ].some(([dx, dz]) => heightAt(x + dx, z + dz, seed) < GEN_SEA_LEVEL);
  return sandyBeachHeight({ height: gradedHeight, biome, seaLevel: GEN_SEA_LEVEL, adjacentWater, rocky });
}

export { isSandyBeachSurface };

/** True only for warm, high, sheared mountain cells with a visible drop. */
export function mountainFaceAt(x, z, seed = 0) {
  const center = heightAt(x, z, seed);
  if (center < GEN_SEA_LEVEL + 10) return false;
  const eastWest = Math.abs(heightAt(x + 2, z, seed) - heightAt(x - 2, z, seed));
  const northSouth = Math.abs(heightAt(x, z + 2, seed) - heightAt(x, z - 2, seed));
  const lowestNeighbor = Math.min(
    heightAt(x - 2, z, seed), heightAt(x + 2, z, seed),
    heightAt(x, z - 2, seed), heightAt(x, z + 2, seed),
  );
  return eastWest + northSouth >= 7 && center - lowestNeighbor >= 4;
}

/**
 * Rare surface-adjacent ore in a mountain face. Returning zero means no ore;
 * every non-zero result is a top/upper-face block of a valid stone cliff.
 */
export function exposedOreAt(x, y, z, seed = 0) {
  const h = heightAt(x, z, seed);
  if (y < h - 1 || y > h || !mountainFaceAt(x, z, seed)) return 0;
  const seam = hash2(x * 41 + z * 17 + seed * 3, z * 43 + y * 19 + seed * 5);
  if (seam <= 0.985) return 0;
  const kind = hash2(x * 13 + seed * 7, z * 17 + y * 3 + seed * 11);
  if (kind > 0.998) return EXPOSED_ORE.DIAMOND;
  if (kind > 0.93) return EXPOSED_ORE.COPPER;
  if (kind > 0.64) return EXPOSED_ORE.IRON;
  return EXPOSED_ORE.COAL;
}

export function tropicalCliffAt(x, z, seed = 0) {
  return mountainFaceAt(x, z, seed);
}

/**
 * Small, rare settlements for the Tortola-inspired island chain.
 *
 * These are intentionally anchored to the existing population cues rather than
 * scattered as noise: Road Town, Cane Garden Bay, East End, and West End are
 * the largest settlement references in the authored BVI region. The generator
 * may leave any site empty for a seed, so most islands remain natural.
 */
export const TORTOLA_VILLAGE_SITES = Object.freeze([
  { name: 'Road Town · Tortola', x: 22, z: 1, activation: 0.70 },
  { name: 'Cane Garden Bay · Tortola', x: -10, z: -34, activation: 0.70 },
  { name: 'East End · Tortola', x: 82, z: -10, activation: 0.74 },
  { name: 'West End · Tortola', x: -55, z: -10, activation: 0.82 },
]);

const VILLAGE_SPOTS = Object.freeze([
  [-18, -3], [-12, -3], [-6, -3], [0, -3],
  [-18, 6], [-12, 6], [-6, 6], [0, 6],
  [-18, 10], [-12, 10], [-6, 10], [0, 10],
]);

const VILLAGE_BLOCK = Object.freeze({
  AIR: 0,
  LOG: 6,
  PLANKS: 8,
  COBBLE: 9,
  CHEST: 22,
  DOOR: 27,
  BRICKS: 31,
});

function villageSiteIsFlat(cx, cz, seed, ground) {
  for (const [dx, dz] of [[-8, 0], [8, 0], [0, -8], [0, 8], [-6, -6], [6, 6]]) {
    if (Math.abs(heightAt(cx + dx, cz + dz, seed) - ground) > 10) return false;
  }
  return true;
}

function villageSpotIsBuildable(cx, cz, ox, oz, seed) {
  let min = Infinity;
  let max = -Infinity;
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      const height = heightAt(cx + ox + dx, cz + oz + dz, seed);
      min = Math.min(min, height);
      max = Math.max(max, height);
    }
  }
  return min >= GEN_SEA_LEVEL + 4 && max - min <= 10;
}

/** Return the active, buildable settlement descriptors for one world seed. */
export function villageSitesForSeed(seed = 0) {
  const sites = [];
  for (const anchor of TORTOLA_VILLAGE_SITES) {
    const roll = hash2(anchor.x * 97 + seed * 11, anchor.z * 89 + seed * 17);
    if (roll < anchor.activation) continue;
    const ground = heightAt(anchor.x, anchor.z, seed);
    // Villages belong on low, buildable land—not water, beach lips, or cliffs.
    if (ground < GEN_SEA_LEVEL + 4 || ground > GEN_SEA_LEVEL + 20) continue;
    if (!villageSiteIsFlat(anchor.x, anchor.z, seed, ground)) continue;
    const spots = VILLAGE_SPOTS.filter(([ox, oz]) => villageSpotIsBuildable(anchor.x, anchor.z, ox, oz, seed));
    if (spots.length < 4) continue;
    const countRoll = hash2(anchor.x * 131 + seed * 19, anchor.z * 137 + seed * 23);
    sites.push({
      ...anchor,
      cx: anchor.x,
      cz: anchor.z,
      ground,
      spots,
      structureCount: 4 + Math.floor(countRoll * Math.min(9, spots.length - 3)),
      seed,
    });
  }
  return sites;
}

/** Return the building occupying a world column, or null for natural terrain. */
export function villageColumnAt(x, z, sites = []) {
  for (const site of sites) {
    for (let index = 0; index < site.structureCount; index++) {
      const [ox, oz] = (site.spots || VILLAGE_SPOTS)[index];
      const typeRoll = hash2(site.cx * 151 + index * 17 + site.seed * 7, site.cz * 157 + index * 23 + site.seed * 11);
      const type = index === 0 && site.structureCount >= 7 && typeRoll > 0.42
        ? 'church'
        : index === 1 && site.structureCount >= 6 && typeRoll > 0.32
          ? 'store'
          : 'home';
      const halfW = type === 'church' ? 3 : 2;
      const halfD = type === 'store' ? 3 : 2;
      const dx = x - (site.cx + ox);
      const dz = z - (site.cz + oz);
      if (Math.abs(dx) <= halfW && Math.abs(dz) <= halfD) return { site, index, type, dx, dz, halfW, halfD, ox, oz };
    }
  }
  return null;
}

/**
 * Resolve one deterministic voxel of a village building. Null means the
 * natural terrain remains untouched; AIR deliberately clears trees/brush under
 * a roof so buildings do not inherit random forest clutter.
 */
export function villageBlockAt(x, y, z, sites = []) {
  const column = villageColumnAt(x, z, sites);
  if (!column) return null;
  const { site, type, dx, dz, halfW, halfD, ox, oz } = column;
  const ground = heightAt(site.cx + ox, site.cz + oz, site.seed);
  const wallHeight = type === 'church' ? 4 : 3;
  const roofY = ground + wallHeight + 1;
  const frontDoor = dz === halfD && dx === 0;
  const boundary = Math.abs(dx) === halfW || Math.abs(dz) === halfD;
  if (y < ground) return null;
  if (y === ground) return VILLAGE_BLOCK.COBBLE;
  if (y <= ground + wallHeight) {
    if (frontDoor && y <= ground + 2) return y === ground + 1 ? VILLAGE_BLOCK.DOOR : VILLAGE_BLOCK.AIR;
    return boundary
      ? (Math.abs(dx) === halfW && Math.abs(dz) === halfD ? VILLAGE_BLOCK.LOG : VILLAGE_BLOCK.PLANKS)
      : (type === 'store' && dx === 0 && dz === 0 && y === ground + 1 ? VILLAGE_BLOCK.CHEST : VILLAGE_BLOCK.AIR);
  }
  if (y === roofY) {
    if (type === 'church' && Math.abs(dx) <= 1 && dz <= 0) return VILLAGE_BLOCK.BRICKS;
    if (type === 'store' && Math.abs(dz) === halfD + 1 && Math.abs(dx) <= halfW) return VILLAGE_BLOCK.PLANKS;
    return VILLAGE_BLOCK.PLANKS;
  }
  // A compact church tower gives the settlement a readable landmark without
  // turning the village into a town-scale monument.
  if (type === 'church' && Math.abs(dx) <= 1 && dz <= 0 && y <= roofY + 3) {
    return y === roofY + 3 ? VILLAGE_BLOCK.BRICKS : VILLAGE_BLOCK.COBBLE;
  }
  return VILLAGE_BLOCK.AIR;
}
