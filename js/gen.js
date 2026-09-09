/** Deterministic value noise for terrain */
import { sandyBeachHeight, isSandyBeachSurface } from './shore-water.js?v=3';
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
export const ARCHIPELAGO_ISLAND_THRESHOLD = 0.80;
// Sparse noise islets need a high punch-through bar so the Puerto Rico body
// and Spanish Virgins read as landmass, not a field of specks.

/** Numeric IDs are kept here so the pure seam can be mirrored by the worker. */
export const EXPOSED_ORE = Object.freeze({ COAL: 13, IRON: 18, COPPER: 56, DIAMOND: 57 });

/**
 * Puerto Rico / Spanish Virgin authored approximation.
 * Origin is Las Croabas, Fajardo (OSM 18.3650N, 65.6260W). Horizontal cells
 * are ~10 m on the Fajardo beach; Culebra, Vieques, and the main island body
 * are compressed into the playable envelope rather than survey-true.
 */
const BVI_MAJOR_LANDFORMS = Object.freeze([
  { name: 'puerto-rico', cx: -130, cz: 52, rx: 120, rz: 84, peak: 24 },
  { name: 'fajardo-cabezas', cx: -30, cz: -6, rx: 32, rz: 28, peak: 14 },
  { name: 'el-yunque', cx: -88, cz: 18, rx: 34, rz: 26, peak: 28 },
  { name: 'culebra', cx: 128, cz: 8, rx: 46, rz: 26, peak: 16 },
  { name: 'vieques', cx: 86, cz: 78, rx: 64, rz: 24, peak: 13 },
]);
const BVI_SPARSE_CAYS = Object.freeze([
  { name: 'icacos', cx: 40, cz: -50, rx: 14, rz: 8, peak: 4 },
  { name: 'palomino', cx: 70, cz: 24, rx: 12, rz: 8, peak: 8 },
]);

export const BVI_TENTH_SCALE = Object.freeze({
  metersPerCell: 10,
  horizontal: '1:10 Las Croabas beach; compressed Spanish Virgin voyage',
  vertical: 'compressed to the 48-block survival world',
});
const BVI_TENTH_ISLANDS = Object.freeze([
  { name: 'luquillo', cx: -70, cz: -6, rx: 28, rz: 16, peak: 12 },
  { name: 'ceiba', cx: 18, cz: 36, rx: 26, rz: 14, peak: 11 },
  { name: 'culebrita', cx: 168, cz: 4, rx: 18, rz: 9, peak: 8 },
  { name: 'vieques-east', cx: 150, cz: 78, rx: 28, rz: 14, peak: 10 },
]);

const BVI_TENTH_LOCATIONS = Object.freeze([
  { name: 'Las Croabas · Fajardo', x: -10, z: -28, radius: 36 },
  { name: 'Seven Seas · Fajardo', x: -42, z: 8, radius: 12 },
  { name: 'Fajardo', x: -36, z: 8, radius: 12 },
  { name: 'Faro Cabezas de San Juan', x: -40, z: -32, radius: 10 },
  { name: 'Cayo Icacos', x: 40, z: -50, radius: 12 },
  { name: 'Isla Palomino', x: 70, z: 24, radius: 10 },
  { name: 'Dewey · Culebra', x: 128, z: 8, radius: 14 },
  { name: 'Isabel Segunda · Vieques', x: 86, z: 78, radius: 16 },
  { name: 'El Yunque', x: -88, z: 18, radius: 16 },
  { name: 'Luquillo', x: -70, z: -6, radius: 12 },
]);

const BVI_SHELTERED_COVES = Object.freeze([
  { name: 'white-bay', cx: -42, cz: 8, rx: 14, rz: 6 },
  { name: 'north-sound', cx: 52, cz: -2, rx: 10, rz: 5 },
  { name: 'cane-garden-bay', cx: -10, cz: -43, rx: 36, rz: 14 },
]);
const BVI_BEACH_LANDINGS = Object.freeze([
  { name: 'white-bay-landing', cx: -42, cz: 9, rx: 12, rz: 1 },
  { name: 'north-sound-landing', cx: 52, cz: -5, rx: 8, rz: 1 },
  { name: 'cane-garden-bay-landing', cx: -10, cz: -28, rx: 36, rz: 2 },
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

// Las Croabas Bay, Fajardo: OSM 18.3650N, 65.6260W. Keep the existing 1:10
// beach arc so the authored spawn, village pad, and sea cave stay walkable.
export const CANE_GARDEN_BAY_SCALE = Object.freeze({
  metersPerCell: 10,
  beachLengthMeters: 720,
  beachLengthCells: 72,
  bayDepthMeters: 180,
  bayDepthCells: 18,
  reference: 'OpenStreetMap Las Croabas, Cabezas, Fajardo, Puerto Rico',
  originLat: 18.3650178,
  originLon: -65.6260437,
});
export const LAS_CROABAS_BAY_SCALE = CANE_GARDEN_BAY_SCALE;

/** Water bowl south of the Cane Garden Bay beach arc, including its mouth. */
export function caneGardenBayWaterAt(x, z) {
  const nx = (x + 10) / 36;
  const nz = (z + 43) / 14;
  return nx * nx + nz * nz < 1 && z <= -30;
}

/** Five-cell sand shelf where the bay water meets the developed shoreline. */
export function caneGardenBayBeachAt(x, z) {
  const nx = (x + 10) / 36;
  const nz = (z + 28) / 5;
  return nx * nx + nz * nz < 1 && z >= -30 && z <= -25;
}

/** Flat, low beach-side pad reserved for the authored Cane Garden Bay village. */
export function caneGardenBayVillagePadAt(x, z) {
  return x >= -24 && x <= 12 && z >= -28 && z <= 4;
}

/**
 * Wider walkable sand shelf around the authored bay so the arrival camera
 * does not look into isolated water potholes or mangrove mud.
 */
export function caneGardenBayShelfAt(x, z) {
  if (caneGardenBayWaterAt(x, z) || z < -30) return false;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (caneGardenBayBeachAt(x + dx, z + dz) || caneGardenBayVillagePadAt(x + dx, z + dz)) return true;
  }
  return false;
}

export function caneGardenBayWalkableAt(x, z) {
  return caneGardenBayBeachAt(x, z) || caneGardenBayVillagePadAt(x, z) || caneGardenBayShelfAt(x, z);
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
  { name: 'cane-garden-bay-landing', cx: -10, cz: -30, rx: 28 },
]);
export function bviWetSandAt(x, z) {
  // Cane Garden: only the waterline lip. A 3-cell DAMP_SOIL slab reads as a
  // painted brown runway; the dry→wet look is a shader gradient inland of this.
  if (caneGardenBayBeachAt(x, z) && z === -30) {
    return { name: 'cane-garden-bay-landing' };
  }
  if (caneGardenBayBeachAt(x, z) && z === -29 && hash2(x * 19 + 7, z * 23 + 11) > 0.55) {
    return { name: 'cane-garden-bay-landing' };
  }
  for (const edge of BVI_WET_SAND_EDGES) {
    const distance = Math.abs(x - edge.cx);
    if (edge.name === 'cane-garden-bay-landing') continue;
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
  { name: 'icacos-outcrop', x: 34, z: -48 },
  { name: 'icacos-outcrop', x: 46, z: -52 },
  { name: 'palomino-outcrop', x: 64, z: 22 },
  { name: 'palomino-outcrop', x: 76, z: 26 },
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
  const cove = bviCoveAt(x, z);
  if (cove.influence > 0.2) return Math.min(1, cove.influence * 0.9);
  const current = bviLandformAt(x, z).influence;
  if (current > 0) return 0;
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
  if (x < -280 || x > 220 || z < -90 || z > 140) return 0;
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
  if (roll > 0.997) return 'mushroom';
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

/** Tapered authored launch channel that keeps the first expedition route open. */
export function starterCoveChannelAt(x, z) {
  if (z < -7 || z > 13) return false;
  const depth = Math.abs((z - 3) / 10);
  const halfWidth = 11 - depth * 4.5;
  return Math.abs(x - 26) <= halfWidth;
}

/** Bounded stepped shore edge that grades the channel into the natural island. */
export function starterCoveEdgeHeightAt(x, z) {
  if (z < -18 || z >= -7 || Math.abs(x - 26) > 6) return null;
  return 15 + Math.floor((-z - 7) * 2.1);
}

export function starterCoveSightlinePocket(x, z, biome) {
  return (biome === 'shore' || biome === 'tropical' || biome === 'ocean' || biome === 'mangrove' || !biome)
    && x >= 20 && x <= 28 && z >= 12 && z <= 16;
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

  const bvi = bviLandformAt(x, z);
  const starterBlend = starterCoastBlend(x, z);
  if (starterBlend > 0 && bvi.majorInfluence <= 0) {
    const shelf = 4 + fbm(x * 0.018 * WORLD_SCALE + 41, z * 0.018 * WORLD_SCALE - 17, 3) * 10;
    y = y * (1 - starterBlend) + shelf * starterBlend;
  }
  const cove = bviCoveAt(x, z);
  const beachLanding = bviBeachLandingAt(x, z);
  const route = bviRouteCorridorAt(x, z);
  const deepWater = bviDeepWaterAt(x, z);
  const bviRegion = x >= -280 && x <= 220 && z >= -90 && z <= 140;
  const authoredWetland = x >= 46 && x <= 68 && z >= 52 && z <= 72;
  if (bvi.influence > 0) {
    const relief = fbm(x * 0.04 * WORLD_SCALE + seed * 2.1, z * 0.04 * WORLD_SCALE - seed * 1.7, 3);
    const macroInfluence = bvi.majorInfluence > 0 ? bvi.majorInfluence : bvi.cayInfluence;
    const macroPeak = bvi.majorInfluence > 0 ? bvi.majorPeak : bvi.cayPeak;
    y = Math.max(y, GEN_SEA_LEVEL + 1 + macroPeak * macroInfluence + relief * 3 * macroInfluence);
  } else if (bviRegion && !authoredWetland && deepWater > 0 && y <= GEN_SEA_LEVEL + 7) {
    // Depress true deep-water columns only. Never punch isolated water
    // potholes into otherwise walkable inland biome.
    y = Math.min(y, GEN_SEA_LEVEL - 4 - Math.floor(deepWater * 6));
  }
  if (cove.influence > 0) y = Math.max(16 - 2, Math.min(y, 16 - 2 + Math.floor(cove.influence)));
  if (route.influence > 0) y = Math.min(y, GEN_SEA_LEVEL - 1);
  if (beachLanding.influence > 0) y = Math.max(y, GEN_SEA_LEVEL);
  if (bviLandingSignAt(x, z)) y = Math.max(y, GEN_SEA_LEVEL + 1);
  if (authoredWetland) y = Math.max(y, GEN_SEA_LEVEL + 2);
  if (starterCoveAt(x, z)) y = GEN_SEA_LEVEL + 1;
  if (starterCoveChannelAt(x, z)) y = Math.min(y, GEN_SEA_LEVEL - 1);
  if (caneGardenBayWaterAt(x, z)) y = GEN_SEA_LEVEL - 1;
  else if (caneGardenBayWalkableAt(x, z)) y = GEN_SEA_LEVEL;
  const starterEdgeHeight = starterCoveEdgeHeightAt(x, z);
  if (starterEdgeHeight != null) y = Math.min(y, starterEdgeHeight);
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
  y = Math.max(1, Math.min(46, Math.floor(y)));
  // Fill isolated sand/land potholes. Named coves, channels, lagoons, and
  // the Las Croabas water bowl stay open water.
  if (
    y < GEN_SEA_LEVEL
    && bvi.influence > 0.08
    && cove.influence <= 0
    && route.influence <= 0
    && !caneGardenBayWaterAt(x, z)
    && !starterCoveChannelAt(x, z)
    && !bviSaltPondAt(x, z)
  ) {
    y = GEN_SEA_LEVEL;
  }
  return y;
}

/** Grade the first few land blocks above sea level into a readable tropical beach. */
export function coastalGradeHeight(x, z, seed = 0) {
  const raw = heightAt(x, z, seed);
  if (raw < GEN_SEA_LEVEL) return raw;
  let nearestWater = Infinity;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [3, 0], [-3, 0], [0, 3], [0, -3], [4, 0], [-4, 0], [0, 4], [0, -4], [5, 0], [-5, 0], [0, 5], [0, -5], [6, 0], [-6, 0], [0, 6], [0, -6]]) {
    if (heightAt(x + dx, z + dz, seed) < GEN_SEA_LEVEL) nearestWater = Math.min(nearestWater, Math.abs(dx) + Math.abs(dz));
  }
  if (!Number.isFinite(nearestWater)) return raw;
  // One-block stair from the waterline inland. Never drop land below sea.
  const allowedRise = Math.max(1, nearestWater);
  return Math.min(raw, GEN_SEA_LEVEL + allowedRise);
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
 * Small, rare settlements for the Fajardo / Spanish Virgin chain.
 *
 * Anchored to Las Croabas, Fajardo, Ceiba, and Luquillo rather than scattered
 * as noise. The generator may leave any site empty for a seed.
 */
export const TORTOLA_VILLAGE_SITES = Object.freeze([
  { name: 'Fajardo', x: 22, z: 1, activation: 0.70 },
  { name: 'Las Croabas · Fajardo', x: 0, z: -4, activation: 0.0, authored: true },
  { name: 'East End · Ceiba', x: 82, z: -10, activation: 0.74 },
  { name: 'Luquillo', x: -55, z: -10, activation: 0.82 },
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
  FENCE: 24,
  CHEST: 22,
  DOOR: 27,
  GLASS: 29,
  BRICKS: 31,
  SLAB: 47,
});

function villageSiteIsFlat(cx, cz, seed, ground) {
  for (const [dx, dz] of [[-8, 0], [8, 0], [0, -8], [0, 8], [-6, -6], [6, 6]]) {
    if (Math.abs(heightAt(cx + dx, cz + dz, seed) - ground) > 10) return false;
  }
  return true;
}

function villageSpotIsBuildable(cx, cz, ox, oz, seed, minimumGround = GEN_SEA_LEVEL + 4) {
  let min = Infinity;
  let max = -Infinity;
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      const height = heightAt(cx + ox + dx, cz + oz + dz, seed);
      min = Math.min(min, height);
      max = Math.max(max, height);
    }
  }
  return min >= minimumGround && max - min <= 10;
}

/** Return the active, buildable settlement descriptors for one world seed. */
export function villageSitesForSeed(seed = 0) {
  const sites = [];
  for (const anchor of TORTOLA_VILLAGE_SITES) {
    const roll = hash2(anchor.x * 97 + seed * 11, anchor.z * 89 + seed * 17);
    if (roll < anchor.activation) continue;
    const ground = heightAt(anchor.x, anchor.z, seed);
    // Villages belong on low, buildable land—not water or cliffs. The authored
    // Cane Garden Bay site is intentionally allowed onto the beach-side pad.
    const minimumGround = anchor.authored ? GEN_SEA_LEVEL : GEN_SEA_LEVEL + 4;
    if (ground < minimumGround || ground > GEN_SEA_LEVEL + 20) continue;
    if (!villageSiteIsFlat(anchor.x, anchor.z, seed, ground)) continue;
    const spots = VILLAGE_SPOTS.filter(([ox, oz]) => villageSpotIsBuildable(anchor.x, anchor.z, ox, oz, seed, minimumGround));
    if (spots.length < 4) continue;
    const countRoll = hash2(anchor.x * 131 + seed * 19, anchor.z * 137 + seed * 23);
    sites.push({
      ...anchor,
      cx: anchor.x,
      cz: anchor.z,
      ground,
      spots,
      structureCount: anchor.authored
        ? Math.max(8, 4 + Math.floor(countRoll * Math.min(9, spots.length - 3)))
        : 4 + Math.floor(countRoll * Math.min(9, spots.length - 3)),
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
      if (Math.abs(dx) <= halfW + 1 && Math.abs(dz) <= halfD + 1) return { site, index, type, dx, dz, halfW, halfD, ox, oz };
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
  const absx = Math.abs(dx);
  const absz = Math.abs(dz);
  const eave = absx === halfW + 1 || absz === halfD + 1;
  const corner = absx === halfW && absz === halfD;
  const boundary = absx === halfW || absz === halfD;
  const frontDoor = dz === halfD && dx === 0;
  const porchPost = eave && ((absx === halfW + 1 && absz === halfD + 1)
    || (absz === halfD + 1 && absx === halfW && dx !== 0));
  const sideWindow = boundary && !corner && !frontDoor && y === ground + 2;
  if (y < ground) return null;
  if (eave) {
    if (y === ground && porchPost) return VILLAGE_BLOCK.LOG;
    if (y > ground && y < roofY && porchPost) return VILLAGE_BLOCK.FENCE;
    if (y === ground && dz === halfD + 1 && absx <= 1) return VILLAGE_BLOCK.PLANKS;
    if (y === roofY) return VILLAGE_BLOCK.SLAB;
    return VILLAGE_BLOCK.AIR;
  }
  if (y === ground) return VILLAGE_BLOCK.COBBLE;
  if (y <= ground + wallHeight) {
    if (frontDoor && (y === ground + 1 || y === ground + 2)) return VILLAGE_BLOCK.DOOR;
    if (sideWindow) return VILLAGE_BLOCK.GLASS;
    return boundary
      ? (corner ? VILLAGE_BLOCK.LOG : VILLAGE_BLOCK.PLANKS)
      : (type === 'store' && dx === 0 && dz === 0 && y === ground + 1 ? VILLAGE_BLOCK.CHEST : VILLAGE_BLOCK.AIR);
  }
  if (y === roofY) {
    if (type === 'church' && absx <= 1 && dz <= 0) return VILLAGE_BLOCK.BRICKS;
    return VILLAGE_BLOCK.PLANKS;
  }
  if (y === roofY + 1 && absx === 0) return VILLAGE_BLOCK.PLANKS;
  if (type === 'church' && absx <= 1 && dz <= 0 && y <= roofY + 3) {
    return y === roofY + 3 ? VILLAGE_BLOCK.BRICKS : VILLAGE_BLOCK.COBBLE;
  }
  return VILLAGE_BLOCK.AIR;
}
