/**
 * Web Worker for chunk generation — runs terrain synthesis off the main thread.
 * Self-contained: re-implements only what _generateChunk needs (hash2, fbm, heightAt, biomeAt).
 * Receives { cx, cz, seed } on 'message', posts back Uint8Array chunk data.
 */

// ── Minimal noise helpers (copies of gen.js + biomes.js logic) ──────────────

function hash2(x, z) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function smoothNoise(x, z) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  return (
    hash2(x0, z0) +
    (hash2(x0 + 1, z0) - hash2(x0, z0)) * sx +
    (hash2(x0, z0 + 1) - hash2(x0, z0)) * sz +
    (hash2(x0 + 1, z0 + 1) - hash2(x0 + 1, z0) - hash2(x0, z0 + 1) + hash2(x0, z0)) * sx * sz
  );
}

function fbm(x, z, octaves = 4) {
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

const WORLD_SCALE = 0.5;
const ARCHIPELAGO_COAST_THRESHOLD = 0.60;
const ARCHIPELAGO_ISLAND_THRESHOLD = 0.68;
// Legacy coast < 0.56 / isle > 0.54 was tightened into the constants above.
const EXPOSED_ORE = Object.freeze({ COAL: 13, IRON: 18, COPPER: 56, DIAMOND: 57 });
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
function bviLandformAt(x, z) {
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
function bviCoveAt(x, z) {
  if (bviLandformAt(x, z).influence > 0) return { influence: 0, name: '' };
  let cove = { influence: 0, name: '' };
  for (const candidate of BVI_SHELTERED_COVES) {
    const influence = ellipseInfluence(x, z, candidate);
    if (influence > cove.influence) cove = { influence, name: candidate.name };
  }
  return cove;
}
function bviBeachLandingAt(x, z) {
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
function bviChannelBuoyAt(x, z) {
  return BVI_CHANNEL_BUOYS.find((buoy) => buoy.x === x && buoy.z === z) || null;
}
const BVI_DOCK = Object.freeze({ name: 'north-sound-dock', z: -4, xMin: 50, xMax: 54 });
function bviDockAt(x, z) {
  if (z !== BVI_DOCK.z || x < BVI_DOCK.xMin || x > BVI_DOCK.xMax) return null;
  return { name: BVI_DOCK.name, post: x === BVI_DOCK.xMin || x === BVI_DOCK.xMax };
}
const BVI_WET_SAND_EDGES = Object.freeze([
  { name: 'white-bay-landing', cx: -42, cz: 9, rx: 12 },
  { name: 'north-sound-landing', cx: 52, cz: -5, rx: 8 },
  { name: 'cane-garden-bay-landing', cx: -10, cz: -34, rx: 8 },
]);
function bviWetSandAt(x, z) {
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
function bviReefHeadAt(x, z) {
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
function bviCayOutcropAt(x, z) {
  return BVI_CAY_OUTCROPS.find((outcrop) => outcrop.x === x && outcrop.z === z) || null;
}
const BVI_SALT_POND = Object.freeze({ name: 'anegada-salt-pond', xMin: 90, xMax: 102, zMin: 33, zMax: 35 });
function bviSaltPondAt(x, z) {
  if (x < BVI_SALT_POND.xMin || x > BVI_SALT_POND.xMax || z < BVI_SALT_POND.zMin || z > BVI_SALT_POND.zMax) return null;
  return { name: BVI_SALT_POND.name };
}
function bviSaltPondScrubAt(x, z) {
  if (!bviSaltPondAt(x, z) && ((z === 32 || z === 36) && x >= 90 && x <= 102 && x % 4 === 2)) {
    return { name: 'anegada-salt-scrub' };
  }
  if (!bviSaltPondAt(x, z) && (x === 88 || x === 104) && z === 34) return { name: 'anegada-salt-scrub' };
  return null;
}
const BVI_LANDING_SIGN = Object.freeze({ name: 'north-sound-landing-sign', z: -5, xMin: 55, xMax: 57, postX: 56 });
function bviLandingSignAt(x, z) {
  if (z !== BVI_LANDING_SIGN.z || x < BVI_LANDING_SIGN.xMin || x > BVI_LANDING_SIGN.xMax) return null;
  return { name: BVI_LANDING_SIGN.name, post: x === BVI_LANDING_SIGN.postX, board: true };
}
const BVI_STARTER_RAMP = Object.freeze({ name: 'starter-beach-launch-ramp', xMin: 24, xMax: 28, zMin: 12, zMax: 13 });
function bviStarterRampAt(x, z) {
  if (x < BVI_STARTER_RAMP.xMin || x > BVI_STARTER_RAMP.xMax || z < BVI_STARTER_RAMP.zMin || z > BVI_STARTER_RAMP.zMax) return null;
  return { name: BVI_STARTER_RAMP.name };
}
const BVI_DRIFTWOOD = Object.freeze([[23, 14], [29, 14]]);
function bviDriftwoodAt(x, z) {
  return BVI_DRIFTWOOD.some(([dx, dz]) => dx === x && dz === z) ? { name: 'starter-beach-driftwood' } : null;
}
function bviRouteCorridorAt(x, z) {
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
function bviReefShelfAt(x, z) {
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
function bviDeepWaterAt(x, z) {
  if (bviLandformAt(x, z).influence > 0) return 0;
  if (x < -90 || x > 330 || z < -120 || z > 130) return 0;
  const route = bviRouteCorridorAt(x, z);
  const broad = fbm(x * 0.008 + 17, z * 0.008 - 11, 3);
  const trench = fbm(x * 0.021 - 23, z * 0.021 + 31, 3);
  if (route.influence > 0.78) return 0.25;
  if (broad < 0.40 || trench < 0.52) return 0;
  return Math.min(1, (broad - 0.40) * 1.55 + (trench - 0.52) * 1.20);
}
function starterCoastBlend(x, z) {
  return Math.max(0, Math.min(1, 1 - Math.hypot(x, z) / 180));
}
function starterCoveAt(x, z) {
  return x >= 20 && x <= 31 && z >= 14 && z <= 15;
}
function starterCoveChannelAt(x, z) {
  if (z < -7 || z > 13) return false;
  const depth = Math.abs((z - 3) / 10);
  const halfWidth = 11 - depth * 4.5;
  return Math.abs(x - 26) <= halfWidth;
}
function starterCoveEdgeHeightAt(x, z) {
  if (z < -18 || z >= -7 || Math.abs(x - 26) > 6) return null;
  return 15 + Math.floor((-z - 7) * 2.1);
}
function heightAt(x, z, seed = 0) {
  const sx = x * 0.03 * WORLD_SCALE + seed * 17.1;
  const sz = z * 0.03 * WORLD_SCALE + seed * 9.7;
  const h = fbm(sx, sz, 5);
  const ridge = Math.abs(fbm(sx * 0.5 + 20, sz * 0.5 - 10, 3) - 0.5) * 2;
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
    y = Math.max(y, 16 + 1 + rise * 29 + ridgeCut * 5);
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
    y = Math.max(y, 16 + 1 + macroPeak * macroInfluence + relief * 3 * macroInfluence);
  } else if (bviRegion && !authoredWetland) {
    y = deepWater > 0
      ? Math.min(y, 16 - 4 - Math.floor(deepWater * 6))
      : Math.min(y, 16 - 2);
  }
  if (cove.influence > 0) y = Math.max(y, Math.min(16 - 1, 16 - 2 + Math.floor(cove.influence)));
  if (route.influence > 0) y = Math.min(y, 16 - 1);
  if (beachLanding.influence > 0) y = Math.max(y, 16 + 1);
  if (authoredWetland) y = Math.max(y, 16 + 2);
  if (starterCoveAt(x, z)) y = 16 + 1;
  if (starterCoveChannelAt(x, z)) y = Math.min(y, 16 - 1);
  const starterEdgeHeight = starterCoveEdgeHeightAt(x, z);
  if (starterEdgeHeight != null) y = Math.min(y, starterEdgeHeight);
  if (Math.hypot(x, z) < 18 && route.influence <= 0) y = Math.max(y, 16);
  if (Math.hypot(x - 26, z - 22) < 9) y = Math.max(y, 16);
  if (Math.hypot(x - 42, z - 51) < 8) y = Math.max(y, 16 + 2);
  if (Math.hypot(x, z) > 18 && coast < ARCHIPELAGO_COAST_THRESHOLD && isle > ARCHIPELAGO_ISLAND_THRESHOLD && !bviRegion) {
    const rise = Math.pow((isle - ARCHIPELAGO_ISLAND_THRESHOLD) / (1 - ARCHIPELAGO_ISLAND_THRESHOLD), 0.62);
    y = Math.max(y, 16 + 1 + rise * 32);
  }
  return Math.max(1, Math.min(46, Math.floor(y)));
}
function coastalGradeHeight(x, z, seed = 0) {
  const raw = heightAt(x, z, seed);
  if (raw < 16) return raw;
  let nearestWater = Infinity;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [3, 0], [-3, 0], [0, 3], [0, -3], [4, 0], [-4, 0], [0, 4], [0, -4], [5, 0], [-5, 0], [0, 5], [0, -5], [6, 0], [-6, 0], [0, 6], [0, -6]]) {
    if (heightAt(x + dx, z + dz, seed) < 16) nearestWater = Math.min(nearestWater, Math.abs(dx) + Math.abs(dz));
  }
  if (!Number.isFinite(nearestWater)) return raw;
  return Math.min(raw, 16 + Math.max(1, nearestWater));
}
function sandyCoastHeight(x, z, seed, biome, gradedHeight, rocky = false) {
  if (rocky || (biome !== 'shore' && biome !== 'ocean')) return gradedHeight;
  const adjacentWater = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]
    .some(([dx, dz]) => heightAt(x + dx, z + dz, seed) < 16);
  return adjacentWater ? Math.min(gradedHeight, 15) : gradedHeight;
}
function isSandyBeachSurface(height, biome, rocky = false) {
  return !rocky && (biome === 'shore' || biome === 'ocean') && height <= 15;
}
function mountainFaceAt(x, z, seed = 0) {
  const center = heightAt(x, z, seed);
  if (center < 16 + 10) return false;
  const eastWest = Math.abs(heightAt(x + 2, z, seed) - heightAt(x - 2, z, seed));
  const northSouth = Math.abs(heightAt(x, z + 2, seed) - heightAt(x, z - 2, seed));
  const lowestNeighbor = Math.min(heightAt(x - 2, z, seed), heightAt(x + 2, z, seed), heightAt(x, z - 2, seed), heightAt(x, z + 2, seed));
  return eastWest + northSouth >= 7 && center - lowestNeighbor >= 4;
}
function exposedOreAt(x, y, z, seed = 0) {
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
function biomeAt(x, z, seed = 0) {
  const h = heightAt(x, z, seed);
  const coast = fbm(x * 0.01 * WORLD_SCALE + 3, z * 0.01 * WORLD_SCALE + 7, 3);
  const isle = fbm(x * 0.05 * WORLD_SCALE + seed * 3.1, z * 0.05 * WORLD_SCALE + seed * 5.7, 3);
  if (h < 16 - 1) return 'ocean';
  const starter = starterCoastBlend(x, z);
  const bvi = bviLandformAt(x, z);
  if (starter > 0.12 && h >= 16) {
    if (mangroveAt(x, z, seed)) return 'mangrove';
    if (h <= 16 + 1 || (bvi.cayInfluence > 0 && h <= 16 + 3)) return 'shore';
    return 'tropical';
  }
  if (bvi.influence > 0 && h >= 16) {
    if (mangroveAt(x, z, seed)) return 'mangrove';
    if (h <= 16 + 3) return 'shore';
    if (h <= 16 + 24) return 'tropical';
  }
  if (Math.hypot(x - 30, z + 2) > 170
    && h >= 16 && h <= 16 + 24
    && coast < ARCHIPELAGO_COAST_THRESHOLD && isle > ARCHIPELAGO_ISLAND_THRESHOLD) return 'tropical';
  if (h < 20) return 'shore';
  const dryness = fbm(
    x * 0.015 * WORLD_SCALE + seed * 31.3,
    z * 0.015 * WORLD_SCALE + seed * 22.7,
    4,
  );
  if (h > 30 && dryness < 0.35) return 'tundra';
  if (dryness > 0.65) return 'desert';
  return 'forest';
}

function mangroveAt(x, z, seed = 0) {
  const h = heightAt(x, z, seed);
  if (Math.hypot(x - 42, z - 51) < 8) return false;
  if (h < 16 || h > 16 + 8 || starterCoastBlend(x, z) <= 0.12) return false;
  if (x >= 46 && x <= 68 && z >= 52 && z <= 72 && h <= 16 + 8) return true;
  if (h > 16 + 4) return false;
  const wet = fbm(x * 0.025 * WORLD_SCALE + seed * 7.3, z * 0.025 * WORLD_SCALE - seed * 4.1, 3);
  const tide = fbm(x * 0.045 * WORLD_SCALE - seed * 2.7, z * 0.045 * WORLD_SCALE + seed * 5.9, 2);
  return wet > 0.57 && tide > 0.38;
}

function tropicalCliffAt(x, z, seed = 0) {
  const center = heightAt(x, z, seed);
  if (center < 16 + 8) return false;
  const eastWest = Math.abs(heightAt(x + 2, z, seed) - heightAt(x - 2, z, seed));
  const northSouth = Math.abs(heightAt(x, z + 2, seed) - heightAt(x, z - 2, seed));
  return eastWest + northSouth >= 7;
}

// Rare, compact Tortola population centers. Keep this pure and mirrored with
// gen.js so worker and synchronous fallback produce identical islands.
const TORTOLA_VILLAGE_SITES = [
  { name: 'Road Town · Tortola', x: 22, z: 1, activation: 0.70 },
  { name: 'Cane Garden Bay · Tortola', x: -10, z: -34, activation: 0.70 },
  { name: 'East End · Tortola', x: 82, z: -10, activation: 0.74 },
  { name: 'West End · Tortola', x: -55, z: -10, activation: 0.82 },
];
const VILLAGE_SPOTS = [
  [-18, -3], [-12, -3], [-6, -3], [0, -3],
  [-18, 6], [-12, 6], [-6, 6], [0, 6],
  [-18, 10], [-12, 10], [-6, 10], [0, 10],
];
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
  return min >= 20 && max - min <= 10;
}
function villageSitesForSeed(seed = 0) {
  const sites = [];
  for (const anchor of TORTOLA_VILLAGE_SITES) {
    const roll = hash2(anchor.x * 97 + seed * 11, anchor.z * 89 + seed * 17);
    if (roll < anchor.activation) continue;
    const ground = heightAt(anchor.x, anchor.z, seed);
    if (ground < 20 || ground > 36 || !villageSiteIsFlat(anchor.x, anchor.z, seed, ground)) continue;
    const spots = VILLAGE_SPOTS.filter(([ox, oz]) => villageSpotIsBuildable(anchor.x, anchor.z, ox, oz, seed));
    if (spots.length < 4) continue;
    const countRoll = hash2(anchor.x * 131 + seed * 19, anchor.z * 137 + seed * 23);
    sites.push({ ...anchor, cx: anchor.x, cz: anchor.z, ground, spots, structureCount: 4 + Math.floor(countRoll * Math.min(9, spots.length - 3)), seed });
  }
  return sites;
}
function villageColumnAt(x, z, sites = []) {
  for (const site of sites) {
    for (let index = 0; index < site.structureCount; index++) {
      const [ox, oz] = (site.spots || VILLAGE_SPOTS)[index];
      const typeRoll = hash2(site.cx * 151 + index * 17 + site.seed * 7, site.cz * 157 + index * 23 + site.seed * 11);
      const type = index === 0 && site.structureCount >= 7 && typeRoll > 0.42 ? 'church'
        : index === 1 && site.structureCount >= 6 && typeRoll > 0.32 ? 'store' : 'home';
      const halfW = type === 'church' ? 3 : 2;
      const halfD = type === 'store' ? 3 : 2;
      const dx = x - (site.cx + ox);
      const dz = z - (site.cz + oz);
      if (Math.abs(dx) <= halfW && Math.abs(dz) <= halfD) return { site, type, dx, dz, halfW, halfD, ox, oz };
    }
  }
  return null;
}
function villageBlockAt(x, y, z, sites = []) {
  const column = villageColumnAt(x, z, sites);
  if (!column) return null;
  const { site, type, dx, dz, halfW, halfD, ox, oz } = column;
  const ground = heightAt(site.cx + ox, site.cz + oz, site.seed);
  const wallHeight = type === 'church' ? 4 : 3;
  const roofY = ground + wallHeight + 1;
  const frontDoor = dz === halfD && dx === 0;
  const boundary = Math.abs(dx) === halfW || Math.abs(dz) === halfD;
  if (y < ground) return null;
  if (y === ground) return BLOCK.COBBLE;
  if (y <= ground + wallHeight) {
    if (frontDoor && y <= ground + 2) return y === ground + 1 ? BLOCK.DOOR_CLOSED : BLOCK.AIR;
    return boundary
      ? (Math.abs(dx) === halfW && Math.abs(dz) === halfD ? BLOCK.LOG : BLOCK.PLANKS)
      : (type === 'store' && dx === 0 && dz === 0 && y === ground + 1 ? BLOCK.CHEST : BLOCK.AIR);
  }
  if (y === roofY) {
    if (type === 'church' && Math.abs(dx) <= 1 && dz <= 0) return BLOCK.BRICKS;
    return BLOCK.PLANKS;
  }
  if (type === 'church' && Math.abs(dx) <= 1 && dz <= 0 && y <= roofY + 3) {
    return y === roofY + 3 ? BLOCK.BRICKS : BLOCK.COBBLE;
  }
  return BLOCK.AIR;
}

// ── Block IDs (must match blocks.js) ────────────────────────────────────────

// Must match js/blocks.js exactly — wrong IDs corrupt async gen.
const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
  LOG: 6,
  LEAVES: 7,
  PLANKS: 8,
  COBBLE: 9,
  SANDSTONE: 10,
  SNOW: 11,
  ICE: 12,
  COAL_ORE: 13,
  TORCH: 14,
  CAMPFIRE: 15,
  BEDROCK: 16,
  BED: 17,
  IRON_ORE: 18,
  BUSH: 19,
  FARMLAND: 20,
  CROP: 21,
  CHEST: 22,
  LADDER: 23,
  FENCE: 24,
  SNARE: 25,
  PUMPKIN: 26,
  DOOR_CLOSED: 27,
  DOOR_OPEN: 28,
  GLASS: 29,
  CLAY: 30,
  BRICKS: 31,
  FURNACE: 32,
  WIRE: 33,
  LAMP: 34,
  GENERATOR: 35,
  ICE_BOX: 36,
  WALL: 37,
  LAVA: 38,
  CLAY_DEEP_ORE: 39,
  SULFUR_ORE: 40,
  OIL_SEEP: 41,
  SPRUCE_LOG: 42,
  SPRUCE_LEAVES: 43,
  SEQUOIA_LOG: 44,
  SEQUOIA_LEAVES: 45,
  STAIRS_WOOD: 46,
  SLAB_WOOD: 47,
  CORAL: 48,
  KELP: 49,
  SEAGRASS: 50,
  PALM_LEAVES: 51,
  ROOTS: 52,
  STICK_PILE: 53,
  DAMP_SOIL: 54,
  MUSHROOM: 55,
  COPPER_ORE: 56,
  DIAMOND_ORE: 57,
  MANGROVE_LOG: 58,
  MANGROVE_LEAVES: 59,
  MANGROVE_MUD: 60,
  COCONUT: 61,
  BAMBOO: 62,
  VINES: 63,
  TALL_GRASS: 64,
  WILDFLOWER: 65,
};

const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 48;
const SEA_LEVEL = 16;

const forestPhase = value => ((value % 64) + 64) % 64;
function forestSightlinePocket(x, z, biome) {
  const px = forestPhase(x);
  const pz = forestPhase(z);
  return biome === 'forest' && px >= 26 && px <= 37 && pz >= 26 && pz <= 37;
}
function mangroveMarkerAt(x, z, biome, height) {
  return biome === 'mangrove' && x === 55 && z === 58 && height <= WORLD_HEIGHT - 5;
}
function mangroveSightlinePocket(x, z, biome) {
  return biome === 'mangrove' && x >= 48 && x <= 61 && z >= 53 && z <= 65;
}
function mangroveApproachWaterPocket(x, z, biome) {
  return biome === 'mangrove' && x >= 55 && x <= 61 && z >= 55 && z <= 57;
}
function mangroveApproachBankCut(x, z, biome) {
  return (biome === 'mangrove' || biome === 'tropical')
    && ((x >= 55 && x <= 61 && z >= 59 && z <= 60) || (x >= 58 && x <= 61 && z === 58));
}
function mangroveApproachSightlinePocket(x, z, biome) {
  return (biome === 'mangrove' || biome === 'tropical')
    && x >= 55 && x <= 64 && z >= 53 && z <= 60;
}
function mangroveApproachPlantClearance(x, z, biome) {
  return (biome === 'ocean' || biome === 'mangrove' || biome === 'tropical' || biome === 'shore')
    && x >= 48 && x <= 61 && z >= 54 && z <= 58;
}
function starterCoveSightlinePocket(x, z, biome) {
  return (biome === 'shore' || biome === 'tropical' || biome === 'ocean' || biome === 'mangrove' || !biome)
    && x >= 20 && x <= 28 && z >= 12 && z <= 16;
}

// ── Chunk generation (mirrors World._generateChunk) ─────────────────────────

function generateChunkData(cx, cz, seed) {
  const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);

  function idx(lx, y, lz) {
    return (lz * WORLD_HEIGHT + y) * CHUNK_SIZE + lx;
  }

  const baseX = cx * CHUNK_SIZE;
  const baseZ = cz * CHUNK_SIZE;
  const villageSites = villageSitesForSeed(seed);

  for (let lz = 0; lz < CHUNK_SIZE; lz++) {
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const x = baseX + lx;
      const z = baseZ + lz;
      const biome = biomeAt(x, z, seed);
      const beachApproach = bviBeachLandingAt(x, z).influence > 0 || bviBeachLandingAt(x, z - 1).influence > 0;
      const starterCove = starterCoveAt(x, z);
      const starterCoveSightline = starterCoveSightlinePocket(x, z, biome);
      const deepWater = bviDeepWaterAt(x, z);
      const baseHeight = starterCove ? SEA_LEVEL + 1 : (mangroveApproachWaterPocket(x, z, biome) || mangroveApproachBankCut(x, z, biome))
        ? SEA_LEVEL - 1 : coastalGradeHeight(x, z, seed);
      const cliff = biome === 'tropical' && tropicalCliffAt(x, z, seed);
      const rockyCoast = cliff || !!bviCayOutcropAt(x, z);
      const h = starterCove ? SEA_LEVEL + 1 : sandyCoastHeight(x, z, seed, biome, baseHeight, rockyCoast);
      const sandySurface = !deepWater && (starterCove || isSandyBeachSurface(h, biome, rockyCoast));

      for (let y = 0; y < WORLD_HEIGHT; y++) {
        let id = BLOCK.AIR;
        if (y === 0) id = BLOCK.BEDROCK;
        else if (y > h) {
          if (y <= SEA_LEVEL) id = BLOCK.WATER;
        } else if (y === h) {
          if (deepWater) id = BLOCK.STONE;
          else if (!starterCove && biome === 'mangrove') id = BLOCK.MANGROVE_MUD;
          else if (starterCove || biome === 'desert' || sandySurface) id = BLOCK.SAND;
          else if (biome === 'shore' || biome === 'ocean') id = cliff ? BLOCK.STONE : BLOCK.GRASS;
          else if (biome === 'tundra') id = BLOCK.SNOW;
          else if (cliff) id = BLOCK.STONE;
          else id = BLOCK.GRASS;
        } else if (y > h - 4) {
          if (deepWater) id = BLOCK.STONE;
          else if (!starterCove && biome === 'mangrove') id = BLOCK.MANGROVE_MUD;
          else if (starterCove || biome === 'desert' || sandySurface) id = BLOCK.SAND;
          else if (biome === 'shore' || biome === 'ocean') id = cliff ? BLOCK.STONE : BLOCK.DIRT;
          else if (cliff) id = BLOCK.STONE;
          else id = BLOCK.DIRT;
        } else {
          id = BLOCK.STONE;
          if (y < h - 6 && hash2(x + y * 3, z + seed) > 0.97) id = BLOCK.COAL_ORE;
          if (y < h - 10 && y > 4 && hash2(x * 2 + y, z + seed * 5) > 0.985) id = BLOCK.IRON_ORE;
          if (y >= 2 && y <= 8 && hash2(x + y * 13, z * 7 + seed * 3) > 0.982) id = BLOCK.CLAY_DEEP_ORE;
          if (y >= 3 && y <= h - 5) {
            if (hash2(x + y * 7, z + seed * 3) > 0.991) id = BLOCK.AIR;
          }
        }
        if (!deepWater && y >= h - 1 && y <= h && id === BLOCK.STONE) {
          const exposedOre = exposedOreAt(x, y, z, seed);
          if (exposedOre) id = exposedOre;
        }
        data[idx(lx, y, lz)] = id;
      }
      const saltPond = bviSaltPondAt(x, z);
      const driftwood = bviDriftwoodAt(x, z);
      if (saltPond && h >= SEA_LEVEL + 1) {
        for (let yy = SEA_LEVEL; yy <= h; yy++) data[idx(lx, yy, lz)] = yy === SEA_LEVEL ? BLOCK.WATER : BLOCK.AIR;
      }
      const wetSand = bviWetSandAt(x, z);
      if (wetSand && h >= SEA_LEVEL) data[idx(lx, h, lz)] = BLOCK.DAMP_SOIL;
      const cayOutcrop = bviCayOutcropAt(x, z);
      if (cayOutcrop && h >= SEA_LEVEL + 1) {
        data[idx(lx, h, lz)] = BLOCK.STONE;
        if (h + 1 < WORLD_HEIGHT && data[idx(lx, h + 1, lz)] === BLOCK.AIR) data[idx(lx, h + 1, lz)] = BLOCK.STONE;
      }
      const channelBuoy = bviChannelBuoyAt(x, z);
      const starterLaunchCorridor = x >= 30 && x <= 46 && z >= 4 && z <= 14;
      if (channelBuoy && h < SEA_LEVEL && !starterLaunchCorridor) {
        data[idx(lx, SEA_LEVEL, lz)] = BLOCK.LOG;
        data[idx(lx, SEA_LEVEL + 1, lz)] = channelBuoy.id === 'red' ? BLOCK.CORAL : BLOCK.BUSH;
      }
      const dock = bviDockAt(x, z);
      if (dock && h < SEA_LEVEL) {
        data[idx(lx, SEA_LEVEL, lz)] = BLOCK.PLANKS;
        if (dock.post) data[idx(lx, SEA_LEVEL + 1, lz)] = BLOCK.LOG;
      }

      // Trees
      if (h > SEA_LEVEL + 1) {
        const th = hash2(x * 3 + (seed | 0), z * 5 + 19);
        let treeChance = 0;
        if (biome === 'forest') treeChance = 0.018;
        else if (biome === 'shore') treeChance = 0.028;
        else if (biome === 'tundra') treeChance = 0.012;
        else if (biome === 'tropical') treeChance = 0.014;
        else if (biome === 'mangrove') treeChance = 0.014;
        const forestPocket = forestSightlinePocket(x, z, biome);
        const villageColumn = villageColumnAt(x, z, villageSites);
        const mangroveLandmark = mangroveMarkerAt(x, z, biome, h);
        if (mangroveLandmark) {
          _placeMangroveBridge(data, idx, lx, h + 1, lz, mangroveApproachPlantClearance(x, z, biome));
        } else if (!villageColumn && !forestPocket && !beachApproach && !starterCove && !starterCoveSightline && !saltPond && !driftwood && !mangroveSightlinePocket(x, z, biome)
          && !mangroveApproachSightlinePocket(x, z, biome) && th > 1 - treeChance) {
          if (biome === 'mangrove') _placeMangrove(data, idx, lx, h + 1, lz);
          else if (biome === 'tropical' || biome === 'shore') _placePalm(data, idx, lx, h + 1, lz);
          else _placeTree(data, idx, lx, h + 1, lz);
        }
      }

      const landingSign = bviLandingSignAt(x, z);
      if (landingSign && h >= SEA_LEVEL + 1) {
        if (landingSign.post && data[idx(lx, h + 1, lz)] === BLOCK.AIR) data[idx(lx, h + 1, lz)] = BLOCK.LOG;
        if (data[idx(lx, h + 2, lz)] === BLOCK.AIR) data[idx(lx, h + 2, lz)] = BLOCK.PLANKS;
      }
      const starterRamp = bviStarterRampAt(x, z);
      if (starterRamp && h < SEA_LEVEL) {
        data[idx(lx, SEA_LEVEL, lz)] = BLOCK.PLANKS;
        if (SEA_LEVEL + 1 < WORLD_HEIGHT) data[idx(lx, SEA_LEVEL + 1, lz)] = BLOCK.AIR;
      }
      if (driftwood && !starterCoveSightline && h >= SEA_LEVEL && data[idx(lx, h + 1, lz)] === BLOCK.AIR) {
        data[idx(lx, h + 1, lz)] = BLOCK.LOG;
      }
      const saltScrub = bviSaltPondScrubAt(x, z);
      if (saltScrub && h >= SEA_LEVEL + 1 && data[idx(lx, h + 1, lz)] === BLOCK.AIR) {
        data[idx(lx, h + 1, lz)] = BLOCK.BUSH;
      }
      populateOceanColumn(data, idx, lx, h, lz, x, z, biome, seed);
      populateMangroveColumn(data, idx, lx, h, lz, x, z, biome, seed);
      populateSurfaceFlora(data, idx, lx, h, lz, x, z, biome, seed);

      // Berry bushes
      if (
        (biome === 'forest' || biome === 'shore' || biome === 'tropical') &&
        h > SEA_LEVEL + 1 &&
        data[idx(lx, h, lz)] === BLOCK.GRASS &&
        data[idx(lx, h + 1, lz)] === BLOCK.AIR &&
        hash2(x + 91, z * 3 + (seed | 0)) > 0.94
      ) {
        data[idx(lx, h + 1, lz)] = BLOCK.BUSH;
      }

      const surfaceId = data[idx(lx, h, lz)];
      const aboveId = data[idx(lx, h + 1, lz)];
      if (biome === 'forest' && h > SEA_LEVEL + 1 && aboveId === BLOCK.AIR) {
        const roll = hash2(x * 29 + seed * 7, z * 31 + seed * 11);
        if (surfaceId === BLOCK.GRASS || surfaceId === BLOCK.DIRT || surfaceId === BLOCK.SAND || surfaceId === BLOCK.MANGROVE_MUD) {
          if (roll > 0.997) data[idx(lx, h + 1, lz)] = BLOCK.MUSHROOM;
          else if (roll > 0.93) data[idx(lx, h + 1, lz)] = BLOCK.ROOTS;
          else if (roll > 0.84) data[idx(lx, h + 1, lz)] = BLOCK.STICK_PILE;
          else if (roll > 0.74) data[idx(lx, h, lz)] = BLOCK.DAMP_SOIL;
        }
      }

      // Clay deposits near shore
      if (biome === 'shore' || (h >= SEA_LEVEL && h <= SEA_LEVEL + 3 && biome !== 'tundra')) {
        if (hash2(x + 33, z + seed) > 0.93) {
          const surface = data[idx(lx, h, lz)];
          if (surface === BLOCK.GRASS || surface === BLOCK.DIRT || surface === BLOCK.SAND) {
            data[idx(lx, h, lz)] = BLOCK.CLAY;
          }
        }
      }
      if (villageColumnAt(x, z, villageSites)) {
        for (let yy = 1; yy < WORLD_HEIGHT; yy++) {
          const villageId = villageBlockAt(x, yy, z, villageSites);
          if (villageId !== null) data[idx(lx, yy, lz)] = villageId;
        }
      }
    }
  }

  // Lava tubes
  _carveLavaTubes(data, idx, baseX, baseZ, seed);

  return data;
}

function populateSurfaceFlora(data, idx, lx, h, lz, x, z, biome, seed) {
  if (h <= SEA_LEVEL + 1 || mangroveApproachPlantClearance(x, z, biome)) return;
  if (biome !== 'forest' && biome !== 'shore' && biome !== 'tropical' && biome !== 'mangrove') return;
  const surface = data[idx(lx, h, lz)];
  if (surface !== BLOCK.GRASS && surface !== BLOCK.DIRT && surface !== BLOCK.SAND && surface !== BLOCK.MANGROVE_MUD) return;
  if (data[idx(lx, h + 1, lz)] !== BLOCK.AIR) return;
  const roll = hash2(x * 29 + seed * 7, z * 31 + seed * 11);
  if ((biome === 'tropical' || biome === 'mangrove') && roll > 0.968) {
    const height = 2 + Math.floor(hash2(x * 37 + 5, z * 41 + seed) * 3);
    for (let i = 0; i < height && h + 1 + i < WORLD_HEIGHT; i++) {
      const cell = idx(lx, h + 1 + i, lz);
      if (data[cell] !== BLOCK.AIR) break;
      data[cell] = BLOCK.BAMBOO;
    }
    return;
  }
  if (roll > 0.90) data[idx(lx, h + 1, lz)] = BLOCK.WILDFLOWER;
  else if ((biome === 'forest' || biome === 'mangrove') && roll > 0.72) data[idx(lx, h + 1, lz)] = BLOCK.FERN;
  else if (roll > 0.48) data[idx(lx, h + 1, lz)] = BLOCK.TALL_GRASS;
}

function placeVines(data, idx, lx, y, lz, trunkH) {
  const top = y + trunkH - 2;
  const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = 0; i < sides.length; i++) {
    const [dx, dz] = sides[i];
    if (hash2(lx * 17 + i * 13 + trunkH, lz * 23 + i * 19) < 0.48) continue;
    const length = 1 + Math.floor(hash2(lx * 31 + i * 7, lz * 29 + i * 11) * 3);
    const vx = lx + dx; const vz = lz + dz;
    for (let step = 0; step < length; step++) {
      const vy = top - step;
      if (vx < 0 || vx >= CHUNK_SIZE || vz < 0 || vz >= CHUNK_SIZE || vy < 1 || vy >= WORLD_HEIGHT) break;
      const cell = idx(vx, vy, vz);
      if (data[cell] !== BLOCK.AIR) break;
      data[cell] = BLOCK.VINES;
    }
  }
}

function _placePalm(data, idx, lx, y, lz) {
  const trunkH = 6 + Math.floor(hash2(lx + 21, lz + 13) * 4);
  const lean = hash2(lx + 27, lz + 31) > 0.5 ? 1 : -1;
  const set = (x, yy, z, id) => {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || yy < 0 || yy >= WORLD_HEIGHT) return;
    if (data[idx(x, yy, z)] === BLOCK.AIR) data[idx(x, yy, z)] = id;
  };
  for (let i = 0; i < trunkH; i++) set(lx + (i >= trunkH - 2 ? (i - trunkH + 2) * lean : 0), y + i, lz, BLOCK.LOG);
  for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) set(lx + dx, y, lz + dz, BLOCK.LOG);
  const top = y + trunkH - 1;
  const fronds = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [-1, 2], [1, -2], [-1, -2]];
  for (const [dx, dz] of fronds) {
    const distance = Math.abs(dx) + Math.abs(dz);
    set(lx + dx, top + (distance >= 2 ? -1 : 1), lz + dz, BLOCK.PALM_LEAVES);
  }
  const fruitRoll = hash2(lx * 13 + 77, lz * 17 + 91);
  if (fruitRoll > 0.42) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1]]) set(lx + dx, top - 1, lz + dz, BLOCK.COCONUT);
    set(lx + (fruitRoll > 0.72 ? 2 : -2), y, lz + (fruitRoll > 0.72 ? 1 : -1), BLOCK.COCONUT);
  }
  placeVines(data, idx, lx, y, lz, trunkH);
}

function _placeMangroveBridge(data, idx, lx, y, lz, clearApproachPlants = false) {
  const set = (x, yy, z, id) => {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || yy < 0 || yy >= WORLD_HEIGHT) return;
    const i = idx(x, yy, z);
    if (data[i] === BLOCK.AIR) data[i] = id;
  };
  const rampBase = SEA_LEVEL + 1;
  for (let dx = -6; dx <= 2; dx++) {
    const rampRise = Math.max(0, Math.min(y - rampBase, dx + 6));
    const stepY = dx < 2 ? rampBase + rampRise : y;
    set(lx + dx, stepY, lz, BLOCK.PLANKS);
    if (dx === -6) {
      set(lx + dx, stepY - 1, lz, BLOCK.ROOTS);
      set(lx + dx, stepY + 1, lz, BLOCK.TORCH);
    }
  }
  for (const dx of [-3, 0]) {
    const rampRise = Math.max(0, Math.min(y - rampBase, dx + 6));
    const stepY = dx < 2 ? rampBase + rampRise : y;
    for (let yy = SEA_LEVEL - 1; yy < stepY; yy++) {
      const i = idx(lx + dx, yy, lz + 1);
      if (data[i] === BLOCK.AIR || data[i] === BLOCK.WATER) data[i] = BLOCK.MANGROVE_LOG;
    }
  }
  for (const dx of [-6, 2]) {
    const postY = dx === -6 ? rampBase - 1 : y;
    set(lx + dx, postY + 1, lz, BLOCK.MANGROVE_LOG);
    set(lx + dx, postY + 2, lz, BLOCK.MANGROVE_LOG);
    set(lx + dx, postY + 3, lz, BLOCK.MANGROVE_LEAVES);
  }
  set(lx, y + 1, lz, BLOCK.TORCH);
  set(lx, y + 4, lz, BLOCK.MANGROVE_LOG);
  set(lx, y + 5, lz, BLOCK.TORCH);
  for (const dx of [-1, 1]) set(lx + dx, y, lz + 1, BLOCK.ROOTS);
  for (const dx of [-1, 0, 1]) set(lx + dx, y + 3, lz, BLOCK.MANGROVE_LEAVES);
  for (const dx of [-1, 0, 1]) set(lx + dx, y + 5, lz, BLOCK.MANGROVE_LEAVES);
  const plant = (x, yy, z, id) => {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || yy < 0 || yy >= WORLD_HEIGHT) return;
    const i = idx(x, yy, z);
    if (data[i] === BLOCK.WATER) data[i] = id;
  };
  for (const [dx, dz, h] of [[-5, -2, 2], [-6, 1, 3], [-5, 2, 2], [-3, -3, 1]]) {
    if (clearApproachPlants && ((dx === -5 && dz === -2) || (dx === -3 && dz === -3))) continue;
    for (let i = 0; i < h; i++) plant(lx + dx, SEA_LEVEL - 1 - i, lz + dz, i === h - 1 ? BLOCK.SEAGRASS : BLOCK.KELP);
    const tip = idx(lx + dx, SEA_LEVEL + 1, lz + dz);
    if (data[tip] === BLOCK.AIR) data[tip] = BLOCK.SEAGRASS;
  }
  for (const [dx, dz] of [[2, -1], [2, 1], [3, 0]]) {
    const mud = idx(lx + dx, y - 1, lz + dz);
    if (data[mud] === BLOCK.MANGROVE_MUD || data[mud] === BLOCK.DIRT || data[mud] === BLOCK.SAND) data[mud] = BLOCK.DAMP_SOIL;
  }
}

function _placeMangrove(data, idx, lx, y, lz) {
  const trunkH = 3 + Math.floor(hash2(lx + 121, lz + 137) * 2);
  const lean = hash2(lx + 127, lz + 131) > 0.5 ? 1 : -1;
  const set = (x, yy, z, id) => {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || yy < 0 || yy >= WORLD_HEIGHT) return;
    if (data[idx(x, yy, z)] === BLOCK.AIR) data[idx(x, yy, z)] = id;
  };
  for (let i = 0; i < trunkH; i++) {
    const ox = i >= trunkH - 2 ? (i - trunkH + 2) * lean : 0;
    set(lx + ox, y + i, lz, BLOCK.MANGROVE_LOG);
  }
  for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    set(lx + dx, y, lz + dz, BLOCK.ROOTS);
  }
  const top = y + trunkH - 1;
  for (let dy = -1; dy <= 2; dy++) {
    const radius = dy === 2 ? 1 : 2;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const dist = Math.abs(dx) + Math.abs(dz);
        if (dist > radius + 1 || (dy === -1 && dist > 2)) continue;
        if (dx === 0 && dz === 0 && dy < 0) continue;
        set(lx + dx, top + dy, lz + dz, BLOCK.MANGROVE_LEAVES);
      }
    }
  }
  set(lx, top + 3, lz, BLOCK.MANGROVE_LEAVES);
  placeVines(data, idx, lx, y, lz, trunkH);
}

function _placeTree(data, idx, lx, y, lz) {
  const trunkH = 4 + Math.floor(hash2(lx + 11, lz + 7) * 4);
  for (let i = 0; i < trunkH; i++) {
    const ty = y + i;
    if (ty >= WORLD_HEIGHT) break;
    data[idx(lx, ty, lz)] = BLOCK.LOG;
  }
  const top = y + trunkH - 1;
  const radius = 2 + (hash2(lx + 3, lz + 9) > 0.55 ? 1 : 0);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
        if (dist > radius + 1) continue;
        if (dx === 0 && dz === 0 && dy < 0) continue;
        if (dy === 2 && (Math.abs(dx) > 1 || Math.abs(dz) > 1)) continue;
        const tx = lx + dx;
        const ty2 = top + dy;
        const tz = lz + dz;
        if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE || ty2 < 0 || ty2 >= WORLD_HEIGHT) continue;
        if (data[idx(tx, ty2, tz)] === BLOCK.AIR) data[idx(tx, ty2, tz)] = BLOCK.LEAVES;
      }
    }
  }
  const peak = top + 3;
  if (peak < WORLD_HEIGHT && lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
    const i = idx(lx, peak, lz);
    if (data[i] === BLOCK.AIR) data[i] = BLOCK.LEAVES;
  }
  placeVines(data, idx, lx, y, lz, trunkH);
}

function populateMangroveColumn(data, idx, lx, h, lz, x, z, biome, seed) {
  if (biome !== 'mangrove' || h > SEA_LEVEL + 2) return;
  if (mangroveApproachPlantClearance(x, z, biome)) return;
  const channel = hash2(x * 19 + seed * 3, z * 23 + seed * 5);
  if (channel < 0.72) return;
  data[idx(lx, h, lz)] = BLOCK.WATER;
  if (channel > 0.86) data[idx(lx, h, lz)] = BLOCK.KELP;
}

function populateOceanColumn(data, idx, lx, h, lz, x, z, biome, seed) {
  if (h >= SEA_LEVEL || (biome !== 'ocean' && biome !== 'shore' && biome !== 'tropical')) return;
  if (mangroveApproachPlantClearance(x, z, biome)) return;
  const floor = data[idx(lx, h, lz)];
  if (floor !== BLOCK.SAND && floor !== BLOCK.DIRT) return;
  const waterY = h + 1;
  if (waterY >= SEA_LEVEL || data[idx(lx, waterY, lz)] !== BLOCK.WATER) return;
  const lilyRoll = hash2(x * 43 + seed * 5, z * 47 + seed * 9);
  if (h >= SEA_LEVEL - 5 && lilyRoll > 0.965 && data[idx(lx, SEA_LEVEL, lz)] === BLOCK.WATER) {
    data[idx(lx, SEA_LEVEL, lz)] = BLOCK.LILY_PAD;
  }

  const plantRoll = hash2(x * 11 + seed * 7, z * 13 + 31);
  const shallow = h >= SEA_LEVEL - 5;
  if (shallow && plantRoll > 0.72) {
    data[idx(lx, waterY, lz)] = BLOCK.SEAGRASS;
  } else if (!shallow && plantRoll > 0.78) {
    const kelpHeight = 2 + Math.floor(hash2(x * 17 + 5, z * 19 + seed) * 4);
    for (let y = waterY; y < Math.min(SEA_LEVEL, waterY + kelpHeight); y++) {
      if (data[idx(lx, y, lz)] !== BLOCK.WATER) break;
      data[idx(lx, y, lz)] = BLOCK.KELP;
    }
  }
  if (shallow && hash2(x * 17 + 5, z * 19 + seed) > 0.93) {
    data[idx(lx, waterY, lz)] = BLOCK.KELP;
    if (waterY + 1 < SEA_LEVEL && data[idx(lx, waterY + 1, lz)] === BLOCK.WATER) data[idx(lx, waterY + 1, lz)] = BLOCK.KELP;
  }

  const reefShelf = bviReefShelfAt(x, z);
  const reefRoll = hash2(x * 23 + 17, z * 29 + seed * 3);
  const coralThreshold = reefShelf > 0 ? 0.88 : 0.96;
  if (shallow && reefRoll > coralThreshold) {
    data[idx(lx, waterY, lz)] = BLOCK.CORAL;
    const reefY = waterY + 1;
    if (reefY < SEA_LEVEL && data[idx(lx, reefY, lz)] === BLOCK.WATER && hash2(x + 41, z * 3 + 7) > 0.45) {
      data[idx(lx, reefY, lz)] = BLOCK.CORAL;
    }
    for (const dx of [-1, 1]) {
      const tx = lx + dx;
      if (tx < 0 || tx >= CHUNK_SIZE) continue;
      if (data[idx(tx, h, lz)] === BLOCK.SAND && data[idx(tx, waterY, lz)] === BLOCK.WATER) {
        data[idx(tx, waterY, lz)] = BLOCK.CORAL;
      }
    }
  }
  if (bviReefHeadAt(x, z)) {
    data[idx(lx, waterY, lz)] = BLOCK.CORAL;
    if (waterY + 1 < SEA_LEVEL && data[idx(lx, waterY + 1, lz)] === BLOCK.WATER) {
      data[idx(lx, waterY + 1, lz)] = BLOCK.CORAL;
    }
  }
}

function _carveLavaTubes(data, idx, baseX, baseZ, seed) {
  const tubeY = 4;
  const tubeRadius = 2;

  for (let lz = 0; lz < CHUNK_SIZE; lz++) {
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const wx = baseX + lx;
      const wz = baseZ + lz;

      const tubeCenterX = fbm(wx * 0.04 + seed * 17, wz * 0.04 + seed * 31, 2);
      const tubeCenterZ = fbm(wx * 0.04 + seed * 43, wz * 0.04 + seed * 59, 2);

      const tubeLx = (tubeCenterX * CHUNK_SIZE) % CHUNK_SIZE;
      const tubeLz = (tubeCenterZ * CHUNK_SIZE) % CHUNK_SIZE;

      const dx = lx - tubeLx;
      const dz = lz - tubeLz;
      const dist2d = Math.sqrt(dx * dx + dz * dz);

      const tubePresence = hash2(wx + seed * 7, wz + seed * 13);
      if (tubePresence < 0.85) continue;

      if (dist2d < tubeRadius) {
        const yTop = tubeY + Math.floor(hash2(wx, wz + seed * 5) * 3);
        const lavaLevel = tubeY;

        for (let y = lavaLevel; y <= yTop && y < WORLD_HEIGHT - 1; y++) {
          const i = idx(lx, y, lz);
          const block = data[i];
          if (block === BLOCK.STONE || block === BLOCK.DIRT) {
            if (y === lavaLevel) data[i] = BLOCK.LAVA;
            else if (y < yTop) data[i] = BLOCK.AIR;
          }
        }
      }
    }
  }
}

// ── Worker message handler ──────────────────────────────────────────────────

self.onmessage = function (e) {
  const msg = e.data;
  const { cx, cz, seed } = msg;
  try {
    const data = generateChunkData(cx, cz, seed);
    self.postMessage({ cx, cz, requestId: msg.requestId, data });
  } catch (err) {
    self.postMessage({ cx, cz, requestId: msg.requestId, error: err.message });
  }
};
