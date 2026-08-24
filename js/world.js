import * as THREE from 'three';
import { BLOCK, BLOCK_PROPS, isSolid, isTransparent, getColor } from './blocks.js?v=290';
import { heightAt, hash2, fbm, forestFloorDetail, tropicalCliffAt, exposedOreAt, bviReefShelfAt, bviBeachLandingAt, bviChannelBuoyAt, bviDockAt, bviWetSandAt, bviReefHeadAt, bviCayOutcropAt, bviSaltPondAt, bviSaltPondScrubAt, bviLandingSignAt, bviStarterRampAt, bviDriftwoodAt, villageSitesForSeed, villageColumnAt, villageBlockAt } from './gen.js?v=312';
import { biomeAt, BIOME } from './biomes.js?v=270';
import { tileForBlock } from './atlas-core.js?v=287';
import { greedyMeshChunk, quadsToArrays } from './mesh-greedy.js?v=246';
import { buildMushroomGeometry } from './mushroom-geometry.js?v=2';
import { buildTorchGeometry } from './torch-geometry.js?v=1';
import {
  terrainVisibilityPlan,
  chunkDetailTier,
  buildTerrainProxyArrays,
} from './terrain-visibility.js?v=285';
import { raycastVoxel } from './interaction-contract.js?v=4';

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 48;
export const SEA_LEVEL = 16;

const forestPhase = value => ((value % 64) + 64) % 64;
function forestSightlinePocket(x, z, biome) {
  const px = forestPhase(x);
  const pz = forestPhase(z);
  return biome === BIOME.FOREST && px >= 26 && px <= 37 && pz >= 26 && pz <= 37;
}
function mangroveMarkerAt(x, z, biome, height) {
  return biome === BIOME.MANGROVE && x === 55 && z === 58 && height <= WORLD_HEIGHT - 5;
}
function mangroveSightlinePocket(x, z, biome) {
  return biome === BIOME.MANGROVE && x >= 48 && x <= 61 && z >= 53 && z <= 65;
}
function mangroveApproachWaterPocket(x, z, biome) {
  return biome === BIOME.MANGROVE && x >= 55 && x <= 61 && z >= 55 && z <= 57;
}
function mangroveApproachBankCut(x, z, biome) {
  return (biome === BIOME.MANGROVE || biome === BIOME.TROPICAL)
    && ((x >= 55 && x <= 61 && z >= 59 && z <= 60) || (x >= 58 && x <= 61 && z === 58));
}
function mangroveApproachSightlinePocket(x, z, biome) {
  return (biome === BIOME.MANGROVE || biome === BIOME.TROPICAL)
    && x >= 55 && x <= 64 && z >= 53 && z <= 60;
}
function mangroveApproachPlantClearance(x, z, biome) {
  return (biome === BIOME.OCEAN || biome === BIOME.MANGROVE || biome === BIOME.TROPICAL || biome === BIOME.SHORE)
    && x >= 48 && x <= 61 && z >= 54 && z <= 58;
}

// ── Procedural plantlife ────────────────────────────────────────────────────
// Generation already scatters plant blocks over the surface (berry bushes on
// grass and sand, tree roots and stick litter on the forest floor). Meshed as
// voxel cubes they read as coloured boxes sitting on the ground. The mushroom
// pass proved out the alternative — skip the cube in the greedy mesher and
// stamp a small procedural silhouette in its place — so these forms extend that
// standard across the understory: blade tufts, shoreline reeds, root arches and
// fallen twigs.
//
// Rules the forms keep so the upgrade stays safe:
//  • every vertex is clamped inside the host voxel, so a plant never leans into
//    a neighbouring column, pokes through the block above, or sinks into the
//    terrain it stands on — nothing new can occlude the world;
//  • variation comes from hash2 over world coordinates plus the world seed, so a
//    chunk rebuild (or a neighbour edit) produces identical geometry;
//  • block data is never touched, so collision, spawn scans and drops are
//    exactly what they were.

/** Plant block id → silhouette form used by {@link buildPlantGeometry}. */
const PLANT_FORM = new Map([
  [BLOCK.BUSH, 'tuft'],
  [BLOCK.ROOTS, 'arch'],
  [BLOCK.STICK_PILE, 'twig'],
]);

/** Worst-case guard: stop stamping plants once a chunk has this many. */
const PLANT_BUDGET = 768;

/** Visual-only understory guard: sparse, spaced mushroom silhouettes per chunk. */
const FOREST_UNDERSTORY_CAP = 6;
const FOREST_UNDERSTORY_SPACING = 4;
const FOREST_UNDERSTORY_ROLL = 0.70;

/**
 * Collect deterministic mushroom-standard understory without editing voxel data.
 * Tropical/shore columns are included because the starter route reaches them
 * before the inland forest; spacing and the cap keep the silhouette readable.
 */
export function collectForestUnderstory({ baseX = 0, baseZ = 0, size = CHUNK_SIZE, seed = 0, getBlock } = {}) {
  if (typeof getBlock !== 'function') return [];
  const instances = [];
  const accepted = new Set([BIOME.FOREST, BIOME.TROPICAL, BIOME.MANGROVE, BIOME.SHORE]);
  for (let lz = 0; lz < size && instances.length < FOREST_UNDERSTORY_CAP; lz++) {
    for (let lx = 0; lx < size && instances.length < FOREST_UNDERSTORY_CAP; lx++) {
      const x = baseX + lx;
      const z = baseZ + lz;
      const h = heightAt(x, z, seed);
      if (h <= SEA_LEVEL + 1 || !accepted.has(biomeAt(x, z, seed))) continue;
      const surface = getBlock(x, h, z);
      if (surface !== BLOCK.GRASS && surface !== BLOCK.DIRT && surface !== BLOCK.SAND && surface !== BLOCK.MANGROVE_MUD) continue;
      if (getBlock(x, h + 1, z) !== BLOCK.AIR) continue;
      if (hash2(x * 29 + seed * 7, z * 31 + seed * 11) <= FOREST_UNDERSTORY_ROLL) continue;
      if (instances.some((other) => Math.hypot(other.x - x, other.z - z) < FOREST_UNDERSTORY_SPACING)) continue;
      instances.push({ x, y: h + 1, z });
    }
  }
  return instances;
}

// The starter island's south-east shore is the first authored destination
// sightline. Keep the anchor in world space so chunk rebuilds and streaming
// produce one identical silhouette without adding a voxel/edit/save record.
const SHORE_DESTINATION_X_PHASE = 26;
const SHORE_DESTINATION_Z_PHASE = 22;
const SHORE_DESTINATION_STARTER_LIMIT = 48;
const positivePhase = (value, period) => ((value % period) + period) % period;

export function isShoreDestinationAnchor(x, z, seed = 0) {
  const h = heightAt(x, z, seed);
  return x >= 0 && z >= 0
    && x < SHORE_DESTINATION_STARTER_LIMIT && z < SHORE_DESTINATION_STARTER_LIMIT
    && positivePhase(x, 64) === SHORE_DESTINATION_X_PHASE
    && positivePhase(z, 64) === SHORE_DESTINATION_Z_PHASE
    && biomeAt(x, z, seed) === BIOME.SHORE
    && h >= SEA_LEVEL && h <= SEA_LEVEL + 2;
}

/** Find the single starter-coast silhouette cell for a chunk. */
export function collectShoreDestination({ baseX = 0, baseZ = 0, size = CHUNK_SIZE, seed = 0, getBlock } = {}) {
  if (typeof getBlock !== 'function') return [];
  for (let lz = 0; lz < size; lz++) {
    for (let lx = 0; lx < size; lx++) {
      const x = baseX + lx;
      const z = baseZ + lz;
      if (!isShoreDestinationAnchor(x, z, seed)) continue;
      const h = heightAt(x, z, seed);
      const surface = getBlock(x, h, z);
      const above = getBlock(x, h + 1, z);
      if ((surface !== BLOCK.SAND && surface !== BLOCK.GRASS) || isSolid(above)) continue;
      return [{ x, y: h + 1, z }];
    }
  }
  return [];
}

/**
 * Silhouette parameters per form, in voxel fractions. `height`, `reach`, `curve`
 * and `width` are [min, max] ranges resolved per blade. `curve` droops a blade
 * back toward the ground, so `arch`/`twig` read as ribs and sticks lying over
 * the floor while `tuft`/`reed` stand up.
 */
const PLANT_SHAPE = {
  tuft: { blades: 6, segments: 3, height: [0.56, 0.92], reach: [0.10, 0.22], curve: [0.14, 0.32], width: [0.13, 0.19], lift: 0.02 },
  reed: { blades: 4, segments: 3, height: [0.78, 0.96], reach: [0.03, 0.10], curve: [0.04, 0.14], width: [0.08, 0.12], lift: 0.02 },
  fan:  { blades: 5, segments: 3, height: [0.65, 0.98], reach: [0.15, 0.28], curve: [0.20, 0.38], width: [0.15, 0.22], lift: 0.02 },
  arch: { blades: 3, segments: 3, height: [0.70, 1.00], reach: [0.26, 0.40], curve: [0.80, 0.96], width: [0.10, 0.15], lift: 0.03 },
  twig: { blades: 3, segments: 2, height: [0.18, 0.30], reach: [0.28, 0.40], curve: [0.55, 0.80], width: [0.07, 0.11], lift: 0.04 },
};

/**
 * Atlas texels each form may sample. The greedy material discards texels under
 * 0.35 alpha and the atlas is NearestFilter, so a plant that samples a cleared
 * texel disappears: `arch`/`twig` pin to the centre of a painted stroke, while
 * `tuft`/`reed` ramp down the painted leaf blob — which also lets some blades
 * pick up one of the bush tile's berry pixels as a natural accent.
 */
const PLANT_TEXEL = {
  tuft: { uMin: 0.36, uMax: 0.64, vBase: 0.27, vTip: 0.55 },
  reed: { uMin: 0.38, uMax: 0.62, vBase: 0.30, vTip: 0.52 },
  fan:  { uMin: 0.36, uMax: 0.64, vBase: 0.27, vTip: 0.55 },
  arch: { uMin: 0.36, uMax: 0.36, vBase: 0.42, vTip: 0.42 },
  twig: { uMin: 0.48, uMax: 0.48, vBase: 0.45, vTip: 0.45 },
};

const PLANT_TAU = Math.PI * 2;
const plantClamp01 = v => Math.max(0, Math.min(1, v));
const plantLerp = (a, b, t) => a + (b - a) * t;
/** Keep a plant vertex inside its own voxel footprint. */
const plantSpan = (value, centre) => Math.max(centre - 0.47, Math.min(centre + 0.47, value));
/** hash2 truncates its arguments, so fold coordinates into integers first. */
const plantHash = (x, y, z, salt) => hash2(x * 131 + y * 3 + salt * 17, z * 197 + y * 7 + salt * 41);

/**
 * Build blade-fan geometry for a chunk's plant blocks. Pure function of the
 * instance list and seed — no Three.js, no world state.
 * @param {Array<{x:number,y:number,z:number,id:number}>} instances plant cells in world space
 * @param {number} [seed] world seed so two worlds grow differently
 * @returns {{positions:number[],normals:number[],colors:number[],uvs:number[],tiles:number[],indices:number[],quadCount:number}}
 */
export function buildPlantGeometry(instances, seed = 0) {
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const tiles = [];
  const indices = [];

  /** One tapered, drooping strip anchored in a single voxel cell. */
  const strip = (b) => {
    const ca = Math.cos(b.angle);
    const sa = Math.sin(b.angle);
    const start = positions.length / 3;
    for (let i = 0; i <= b.segments; i++) {
      const s = i / b.segments;
      const rise = Math.max(0, b.height * (s - b.curve * s * s));
      const sweep = b.offset + b.reach * (0.45 * s + 0.55 * s * s);
      const y = Math.min(b.cellY + 0.98, b.cellY + b.lift + rise);
      // Geometric normal of the strip: upright blades face outward, flattened
      // twigs face up. The atlas shader lights with abs(dot(n, sun)) and the
      // material is DoubleSide, so the sign never darkens a back face.
      // sqrt over hypot: this runs per ring for every blade in a chunk.
      const dy = b.height * (1 - 2 * b.curve * s);
      const dr = b.reach * (0.45 + 1.1 * s);
      const tangent = Math.sqrt(dy * dy + dr * dr) || 1;
      let nx = (dy / tangent) * ca;
      let ny = Math.abs(dr / tangent) + 0.45;
      let nz = (dy / tangent) * sa;
      const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= nLen;
      ny /= nLen;
      nz /= nLen;
      // Darker at the root, brighter at the tip: the ramp is what makes a thin
      // blade legible against the ground texture it stands on.
      const k = plantLerp(b.kBase, b.kTip, s);
      const r = plantClamp01(b.color[0] * k + b.warm);
      const g = plantClamp01(b.color[1] * k);
      const bl = plantClamp01(b.color[2] * k - b.warm * 0.6);
      const v = plantLerp(b.vBase, b.vTip, s);
      const half = b.width * 0.5 * (1 - 0.72 * s);
      const midX = b.cellX + ca * sweep;
      const midZ = b.cellZ + sa * sweep;
      const offX = sa * half;
      const offZ = ca * half;
      for (let side = -1; side <= 1; side += 2) {
        positions.push(
          plantSpan(midX - offX * side, b.cellX),
          y,
          plantSpan(midZ + offZ * side, b.cellZ),
        );
        normals.push(nx, ny, nz);
        colors.push(r, g, bl, 1);
        uvs.push(b.u, v);
        tiles.push(b.tile);
      }
    }
    for (let i = 0; i < b.segments; i++) {
      const a = start + i * 2;
      indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
  };

  for (const instance of instances) {
    const base = PLANT_FORM.get(instance.id);
    if (!base) continue;
    const biome = biomeAt(instance.x, instance.z, seed);
    // Shoreline gets reeds; tropical forest gets broad fan understory.
    let form = base;
    if (base === 'tuft') {
      if (biome === BIOME.SHORE || instance.y <= SEA_LEVEL + 2) form = 'reed';
      else if (biome === BIOME.TROPICAL) form = 'fan';
    }
    const isTropicalOrShore = biome === BIOME.TROPICAL || biome === BIOME.MANGROVE || biome === BIOME.SHORE;
    const kTipBoost = isTropicalOrShore ? 0.12 : 0;
    const shape = PLANT_SHAPE[form];
    const texel = PLANT_TEXEL[form];
    const tile = tileForBlock(instance.id);
    const color = getColor(instance.id);
    const cellX = instance.x + 0.5;
    const cellZ = instance.z + 0.5;
    const spin = plantHash(instance.x, instance.y, instance.z, seed + 3) * PLANT_TAU;
    // One whole-plant vigour term keeps a clump reading as a single plant even
    // though each blade resolves its own height and width.
    const grow = plantLerp(0.86, 1, plantHash(instance.x, instance.y, instance.z, seed + 5));
    for (let i = 0; i < shape.blades; i++) {
      const r1 = plantHash(instance.x + i * 7, instance.y, instance.z - i * 5, seed + 11 + i);
      const r2 = plantHash(instance.x - i * 3, instance.y, instance.z + i * 9, seed + 23 + i);
      const r3 = plantHash(instance.x + i * 13, instance.y, instance.z + i * 3, seed + 37 + i);
      // Tufts and fans keep one straight centre blade so the clump has a readable spine.
      const spine = (form === 'tuft' || form === 'fan') && i === 0;
      strip({
        cellX,
        cellY: instance.y,
        cellZ,
        tile,
        color,
        angle: (i / shape.blades) * PLANT_TAU + spin + (r1 - 0.5) * 0.8,
        offset: spine ? 0 : plantLerp(0.02, 0.12, r2),
        height: plantLerp(shape.height[0], shape.height[1], r1) * grow,
        reach: spine ? shape.reach[0] * 0.3 : plantLerp(shape.reach[0], shape.reach[1], r2),
        curve: spine ? shape.curve[0] * 0.5 : plantLerp(shape.curve[0], shape.curve[1], r3),
        width: plantLerp(shape.width[0], shape.width[1], r3) * grow,
        lift: shape.lift,
        segments: shape.segments,
        u: plantLerp(texel.uMin, texel.uMax, r2),
        vBase: texel.vBase,
        vTip: texel.vTip,
        kBase: 0.74,
        kTip: plantLerp(1.06 + kTipBoost, 1.3 + kTipBoost, r3),
        warm: (r1 - 0.5) * 0.07 + (isTropicalOrShore ? 0.03 : 0),
      });
    }
  }

  return { positions, normals, colors, uvs, tiles, indices, quadCount: indices.length / 6 };
}

/** Build a warm stone-and-brick arch that reads as a shore destination marker. */
export function buildShoreDestinationGeometry(instances) {
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const tiles = [];
  const indices = [];
  const uv = [[0.18, 0.18], [0.82, 0.18], [0.82, 0.82], [0.18, 0.82]];

  const box = (minX, minY, minZ, maxX, maxY, maxZ, id) => {
    const color = getColor(id);
    const tile = tileForBlock(id);
    const faces = [
      { normal: [1, 0, 0], points: [[maxX, minY, minZ], [maxX, maxY, minZ], [maxX, maxY, maxZ], [maxX, minY, maxZ]] },
      { normal: [-1, 0, 0], points: [[minX, minY, maxZ], [minX, maxY, maxZ], [minX, maxY, minZ], [minX, minY, minZ]] },
      { normal: [0, 1, 0], points: [[minX, maxY, minZ], [minX, maxY, maxZ], [maxX, maxY, maxZ], [maxX, maxY, minZ]] },
      { normal: [0, -1, 0], points: [[minX, minY, maxZ], [minX, minY, minZ], [maxX, minY, minZ], [maxX, minY, maxZ]] },
      { normal: [0, 0, 1], points: [[maxX, minY, maxZ], [maxX, maxY, maxZ], [minX, maxY, maxZ], [minX, minY, maxZ]] },
      { normal: [0, 0, -1], points: [[minX, minY, minZ], [minX, maxY, minZ], [maxX, maxY, minZ], [maxX, minY, minZ]] },
    ];
    for (const face of faces) {
      const start = positions.length / 3;
      for (let i = 0; i < 4; i++) {
        const p = face.points[i];
        positions.push(p[0], p[1], p[2]);
        normals.push(face.normal[0], face.normal[1], face.normal[2]);
        colors.push(color[0], color[1], color[2], 1);
        uvs.push(uv[i][0], uv[i][1]);
        tiles.push(tile);
      }
      indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    }
  };

  for (const instance of instances) {
    const x = instance.x + 0.5;
    const y = instance.y;
    const z = instance.z + 0.5;
    box(x - 0.78, y, z - 0.32, x - 0.36, y + 3.0, z + 0.32, BLOCK.SANDSTONE);
    box(x + 0.36, y, z - 0.32, x + 0.78, y + 3.0, z + 0.32, BLOCK.SANDSTONE);
    box(x - 0.88, y, z - 0.38, x + 0.88, y + 0.18, z + 0.38, BLOCK.COBBLE);
    box(x - 0.88, y + 2.78, z - 0.38, x + 0.88, y + 3.2, z + 0.38, BLOCK.BRICKS);
    box(x - 0.2, y + 2.34, z - 0.34, x + 0.2, y + 2.8, z + 0.34, BLOCK.SANDSTONE);
  }
  return { positions, normals, colors, uvs, tiles, indices, quadCount: indices.length / 6 };
}

/**
 * Append a procedural geometry part onto greedy-mesh arrays in place.
 * @param {{positions:number[],normals:number[],colors:number[],uvs:number[],tiles:number[],indices:number[]}} arrays
 * @param {{positions:number[],normals:number[],colors:number[],uvs:number[],tiles:number[],indices:number[]}} part
 */
function appendGeometryPart(arrays, part) {
  if (!part || !part.indices.length) return;
  const vertexOffset = arrays.positions.length / 3;
  // Copied element-wise: spreading a whole chunk's plant vertices through
  // Function.prototype.apply can overflow the engine's argument limit.
  for (const value of part.positions) arrays.positions.push(value);
  for (const value of part.normals) arrays.normals.push(value);
  for (const value of part.colors) arrays.colors.push(value);
  for (const value of part.uvs) arrays.uvs.push(value);
  for (const value of part.tiles) arrays.tiles.push(value);
  for (const index of part.indices) arrays.indices.push(index + vertexOffset);
}

/**
 * Pick a readable first-person direction from a spawn candidate. Prefer the
 * lowest nearby terrain profile so a fresh world opens onto a shore, valley,
 * or island silhouette instead of a close hillside wall.
 */
function spawnViewYaw(x, z, seed) {
  const directions = [
    [0, -1], [1, -1], [1, 0], [1, 1],
    [0, 1], [-1, 1], [-1, 0], [-1, -1],
  ];
  let best = { score: Infinity, yaw: Math.PI };
  for (const [dx, dz] of directions) {
    const near = heightAt(x + dx * 6, z + dz * 6, seed);
    const far = heightAt(x + dx * 14, z + dz * 14, seed);
    // Lower distant terrain reads as open water/shore or a navigable valley.
    // Penalize a sudden near rise so the first frame does not face a wall.
    const score = Math.max(0, near - SEA_LEVEL) * 0.8
      + Math.max(0, far - SEA_LEVEL) * 1.5
      + Math.max(0, near - far) * 1.4;
    if (score < best.score) best = { score, yaw: Math.atan2(-dx, -dz) };
  }
  return best.yaw;
}

export class World {
  /**
   * @param {object} opts
   * @param {number} opts.seed
   * @param {number} opts.radiusChunks half-extent in chunks
   * @param {THREE.Material} [opts.material]
   */
  constructor({ seed = 1, radiusChunks = 4, material = null } = {}) {
    this.seed = seed;
    this.radiusChunks = radiusChunks;
    this.streamRadius = Math.max(2, Math.min(32, radiusChunks | 0));
    this.streamMargin = 1;
    this._streamCenter = { cx: 0, cz: 0 };
    this._streamQueue = [];
    this._streamQueued = new Set();
    // Chunk generation/meshing is synchronous in the fallback path. Keep a
    // generous per-frame budget so the visible ring catches up before the
    // player can reach its edge, while still avoiding one huge blocking pass.
    this.streamBudget = 16;
    this.chunks = new Map();
    this.meshes = new Map();
    /** @type {Map<string,'full'|'lod'|'proxy'>} */
    this.meshTiers = new Map();
    this._visPlan = terrainVisibilityPlan(this.streamRadius, { chunkSize: CHUNK_SIZE });
    this.group = new THREE.Group();
    this.dirty = new Set();
    this.edits = new Map();
    // Prefer atlas greedyMaterial (passed in). Fallback is fully opaque DoubleSide solids.
    this.material =
      material ||
      new THREE.MeshLambertMaterial({
        vertexColors: true,
        transparent: false,
        depthWrite: true,
        side: THREE.DoubleSide,
      });
    if (this.material) {
      this.material.transparent = false;
      this.material.depthWrite = true;
      this.material.side = THREE.DoubleSide;
    }
    this._stats = { quads: 0, naiveFaces: 0 };

    // ── Chunk worker pool (stub) ───────────────────────────────────────
    this._workerPool = [];
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    this._maxWorkers = Math.max(1, cores - 1);
    this._workerReady = false;

    // Bootstrap a solid starter ring. The old radius-2 bootstrap exposed a
    // white void after only a short walk even though streaming was enabled.
    this._genInitial(Math.min(this.streamRadius, 6));
  }

  /** Lazily initialise the worker pool (first call creates Blob URL workers). */
  _ensureWorkers() {
    if (this._workerReady || typeof Worker === 'undefined') return;
    this._workerReady = true;

    // Build a Blob URL from the inline chunk-worker source.
    // We read it via a fetch so we don't need to duplicate the code here.
    const workerUrl = './js/chunk-worker.js?v=334';

    for (let i = 0; i < this._maxWorkers; i++) {
      try {
        const w = new Worker(workerUrl);
        this._workerPool.push(w);
      } catch {
        // Worker not supported — fall back to sync generation (already done)
        this._workerReady = false;
        break;
      }
    }
  }

  /**
   * Generate a single chunk via the worker pool.
   * @param {number} cx
   * @param {number} cz
   * @returns {Promise<Uint8Array>}
   */
  generateChunkAsync(cx, cz) {
    this._ensureWorkers();

    // Fallback: if no workers available, generate synchronously
    if (!this._workerReady || this._workerPool.length === 0) {
      return Promise.resolve(this._generateChunkSync(cx, cz));
    }

    // Find an idle worker (simple round-robin with message queue)
    const workerIndex = ((cx * 31 + cz) % this._workerPool.length + this._workerPool.length) % this._workerPool.length;
    const worker = this._workerPool[workerIndex];

    const requestId = `${cx}:${cz}:${Date.now()}:${Math.random()}`;
    return new Promise((resolve, reject) => {
      const handler = (e) => {
        if (e.data.requestId !== requestId) return;
        if (e.data.error) {
          worker.removeEventListener('message', handler);
          reject(new Error(`Chunk ${cx},${cz}: ${e.data.error}`));
          return;
        }
        worker.removeEventListener('message', handler);
        resolve(e.data.data); // Uint8Array (transferred)
      };
      worker.addEventListener('message', handler);
      worker.postMessage({ cx, cz, seed: this.seed, requestId });
    });
  }

  /** Synchronous chunk generation (used as fallback). */
  _generateChunkSync(cx, cz) {
    const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    const baseX = cx * CHUNK_SIZE;
    const baseZ = cz * CHUNK_SIZE;
    const villageSites = villageSitesForSeed(this.seed);

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const x = baseX + lx;
        const z = baseZ + lz;
        const biome = biomeAt(x, z, this.seed);
        const beachApproach = bviBeachLandingAt(x, z).influence > 0 || bviBeachLandingAt(x, z - 1).influence > 0;
        const h = (mangroveApproachWaterPocket(x, z, biome) || mangroveApproachBankCut(x, z, biome))
          ? SEA_LEVEL - 1 : heightAt(x, z, this.seed);
        const cliff = biome === BIOME.TROPICAL && tropicalCliffAt(x, z, this.seed);

        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let id = BLOCK.AIR;
          if (y === 0) id = BLOCK.BEDROCK;
          else if (y > h) {
            if (y <= SEA_LEVEL) id = BLOCK.WATER;
            else id = BLOCK.AIR;
          } else if (y === h) {
            if (biome === BIOME.MANGROVE) id = BLOCK.MANGROVE_MUD;
            else if (biome === BIOME.SHORE || biome === BIOME.DESERT || biome === BIOME.OCEAN) id = BLOCK.SAND;
            else if (biome === BIOME.TUNDRA) id = BLOCK.SNOW;
            else if (cliff) id = BLOCK.STONE;
            else id = BLOCK.GRASS;
          } else if (y > h - 4) {
            if (biome === BIOME.MANGROVE) id = BLOCK.MANGROVE_MUD;
            else if (biome === BIOME.DESERT || biome === BIOME.SHORE || biome === BIOME.OCEAN) id = BLOCK.SAND;
            else if (cliff) id = BLOCK.STONE;
            else id = BLOCK.DIRT;
          } else {
            id = BLOCK.STONE;
            if (y < h - 6 && hash2(x + y * 3, z + this.seed) > 0.97) id = BLOCK.COAL_ORE;
            if (y < h - 10 && y > 4 && hash2(x * 2 + y, z + this.seed * 5) > 0.985) id = BLOCK.IRON_ORE;
            if (y >= 2 && y <= 8 && hash2(x + y * 13, z * 7 + this.seed * 3) > 0.982) id = BLOCK.CLAY_DEEP_ORE;
            if (y >= 3 && y <= h - 5) {
              if (hash2(x + y * 7, z + this.seed * 3) > 0.991) id = BLOCK.AIR;
            }
          }
          if (y >= h - 1 && y <= h && id === BLOCK.STONE) {
            const exposedOre = exposedOreAt(x, y, z, this.seed);
            if (exposedOre) id = exposedOre;
          }
          data[this._idx(lx, y, lz)] = id;
        }
        const saltPond = bviSaltPondAt(x, z);
        const driftwood = bviDriftwoodAt(x, z);
        if (saltPond && h >= SEA_LEVEL + 1) {
          for (let yy = SEA_LEVEL; yy <= h; yy++) data[this._idx(lx, yy, lz)] = yy === SEA_LEVEL ? BLOCK.WATER : BLOCK.AIR;
        }
        const wetSand = bviWetSandAt(x, z);
        if (wetSand && h >= SEA_LEVEL) data[this._idx(lx, h, lz)] = BLOCK.DAMP_SOIL;
        const cayOutcrop = bviCayOutcropAt(x, z);
        if (cayOutcrop && h >= SEA_LEVEL + 1) {
          data[this._idx(lx, h, lz)] = BLOCK.STONE;
          if (h + 1 < WORLD_HEIGHT && data[this._idx(lx, h + 1, lz)] === BLOCK.AIR) data[this._idx(lx, h + 1, lz)] = BLOCK.STONE;
        }
        const channelBuoy = bviChannelBuoyAt(x, z);
        if (channelBuoy && h < SEA_LEVEL) {
          data[this._idx(lx, SEA_LEVEL, lz)] = BLOCK.LOG;
          data[this._idx(lx, SEA_LEVEL + 1, lz)] = channelBuoy.id === 'red' ? BLOCK.CORAL : BLOCK.BUSH;
        }
        const dock = bviDockAt(x, z);
        if (dock && h < SEA_LEVEL) {
          data[this._idx(lx, SEA_LEVEL, lz)] = BLOCK.PLANKS;
          if (dock.post) data[this._idx(lx, SEA_LEVEL + 1, lz)] = BLOCK.LOG;
        }
        if (h > SEA_LEVEL + 1) {
          const th = hash2(x * 3 + (this.seed | 0), z * 5 + 19);
          let treeChance = 0;
          if (biome === BIOME.FOREST) treeChance = 0.018; // half prior density for navigability
          else if (biome === BIOME.SHORE) treeChance = 0.020; // coastal palms/scrub
          else if (biome === BIOME.TUNDRA) treeChance = 0.012;
          else if (biome === BIOME.TROPICAL) treeChance = 0.014; // trimmed further so the starter island sightline reads clearly
          else if (biome === BIOME.MANGROVE) treeChance = 0.014; // sparse tidal grove sightlines
          else if (biome === BIOME.OCEAN) treeChance = 0;
          const forestPocket = forestSightlinePocket(x, z, biome);
          const villageColumn = villageColumnAt(x, z, villageSites);
          const mangroveLandmark = mangroveMarkerAt(x, z, biome, h);
          if (mangroveLandmark) {
            this._placeMangroveBridge(data, lx, h + 1, lz, mangroveApproachPlantClearance(x, z, biome));
          } else if (!villageColumn && !forestPocket && !beachApproach && !saltPond && !driftwood && !mangroveSightlinePocket(x, z, biome)
            && !mangroveApproachSightlinePocket(x, z, biome) && th > 1 - treeChance) {
            // Tree species selection by biome
            const sequoiaRoll = hash2(x + 73, z * 2 + (this.seed | 0));
            const spruceRoll = hash2(x * 5 + 17, z * 3 + (this.seed | 0));
            if (biome === BIOME.TUNDRA && spruceRoll > 0.15) {
              // Tundra: ~85% spruce, fallback to oak for the rest
              this._placeSpruce(data, lx, h + 1, lz);
            } else if (biome === BIOME.FOREST && sequoiaRoll > 0.97) {
              this._placeSequoia(data, lx, h + 1, lz);
            } else if (biome === BIOME.FOREST && spruceRoll > 0.85) {
              // Forest: ~15% of non-sequoia trees are spruce
              this._placeSpruce(data, lx, h + 1, lz);
            } else if (biome === BIOME.MANGROVE) {
              this._placeMangrove(data, lx, h + 1, lz);
            } else if (biome === BIOME.TROPICAL || biome === BIOME.SHORE) {
              this._placePalm(data, lx, h + 1, lz);
            } else {
              this._placeTree(data, lx, h + 1, lz);
            }
          }
        }
        const landingSign = bviLandingSignAt(x, z);
        if (landingSign && h >= SEA_LEVEL + 1) {
          if (landingSign.post && data[this._idx(lx, h + 1, lz)] === BLOCK.AIR) data[this._idx(lx, h + 1, lz)] = BLOCK.LOG;
          if (data[this._idx(lx, h + 2, lz)] === BLOCK.AIR) data[this._idx(lx, h + 2, lz)] = BLOCK.PLANKS;
        }
        const starterRamp = bviStarterRampAt(x, z);
        if (starterRamp && h < SEA_LEVEL) {
          data[this._idx(lx, SEA_LEVEL, lz)] = BLOCK.PLANKS;
          if (SEA_LEVEL + 1 < WORLD_HEIGHT) data[this._idx(lx, SEA_LEVEL + 1, lz)] = BLOCK.AIR;
        }
        if (driftwood && h >= SEA_LEVEL && data[this._idx(lx, h + 1, lz)] === BLOCK.AIR) {
          data[this._idx(lx, h + 1, lz)] = BLOCK.LOG;
        }
        const saltScrub = bviSaltPondScrubAt(x, z);
        if (saltScrub && h >= SEA_LEVEL + 1 && data[this._idx(lx, h + 1, lz)] === BLOCK.AIR) {
          data[this._idx(lx, h + 1, lz)] = BLOCK.BUSH;
        }
        this._populateOceanColumn(data, lx, h, lz, x, z, biome);
        this._populateMangroveColumn(data, lx, h, lz, x, z, biome);
        if (
          (biome === BIOME.FOREST || biome === BIOME.MANGROVE || biome === BIOME.SHORE || biome === BIOME.TROPICAL) &&
          h > SEA_LEVEL + 1 &&
          (data[this._idx(lx, h, lz)] === BLOCK.GRASS || data[this._idx(lx, h, lz)] === BLOCK.SAND || data[this._idx(lx, h, lz)] === BLOCK.MANGROVE_MUD) &&
          data[this._idx(lx, h + 1, lz)] === BLOCK.AIR &&
          hash2(x + 91, z * 3 + (this.seed | 0)) > 0.94
        ) {
          data[this._idx(lx, h + 1, lz)] = BLOCK.BUSH;
        }

        const floorDetail = forestFloorDetail(
          x,
          z,
          this.seed,
          biome,
          h,
          data[this._idx(lx, h, lz)],
          data[this._idx(lx, h + 1, lz)],
        );
        if (floorDetail === 'damp-soil') data[this._idx(lx, h, lz)] = BLOCK.DAMP_SOIL;
        else if (floorDetail === 'roots') data[this._idx(lx, h + 1, lz)] = BLOCK.ROOTS;
        else if (floorDetail === 'sticks') data[this._idx(lx, h + 1, lz)] = BLOCK.STICK_PILE;
        else if (floorDetail === 'mushroom') data[this._idx(lx, h + 1, lz)] = BLOCK.MUSHROOM;

        if (biome === BIOME.SHORE || (h >= SEA_LEVEL && h <= SEA_LEVEL + 3 && biome !== BIOME.TUNDRA)) {
          if (hash2(x + 33, z + this.seed) > 0.93) {
            const surface = data[this._idx(lx, h, lz)];
            if (surface === BLOCK.GRASS || surface === BLOCK.DIRT || surface === BLOCK.SAND) {
              data[this._idx(lx, h, lz)] = BLOCK.CLAY;
            }
          }
        }
        if (villageColumnAt(x, z, villageSites)) {
          for (let yy = 1; yy < WORLD_HEIGHT; yy++) {
            const villageId = villageBlockAt(x, yy, z, villageSites);
            if (villageId !== null) data[this._idx(lx, yy, lz)] = villageId;
          }
        }
      }
    }

    this._carveLavaTubesSync(data, baseX, baseZ);
    return data;
  }

  /** Synchronous lava tube carving (fallback). */
  _carveLavaTubesSync(data, baseX, baseZ) {
    const tubeY = 4;
    const tubeRadius = 2;

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = baseX + lx;
        const wz = baseZ + lz;

        const tubeCenterX = fbm(wx * 0.04 + this.seed * 17, wz * 0.04 + this.seed * 31, 2);
        const tubeCenterZ = fbm(wx * 0.04 + this.seed * 43, wz * 0.04 + this.seed * 59, 2);

        const tubeLx = (tubeCenterX * CHUNK_SIZE) % CHUNK_SIZE;
        const tubeLz = (tubeCenterZ * CHUNK_SIZE) % CHUNK_SIZE;

        const dx = lx - tubeLx;
        const dz = lz - tubeLz;
        const dist2d = Math.sqrt(dx * dx + dz * dz);

        const tubePresence = hash2(wx + this.seed * 7, wz + this.seed * 13);
        if (tubePresence < 0.85) continue;

        if (dist2d < tubeRadius) {
          const yTop = tubeY + Math.floor(hash2(wx, wz + this.seed * 5) * 3);
          const lavaLevel = tubeY;

          for (let y = lavaLevel; y <= yTop && y < WORLD_HEIGHT - 1; y++) {
            const i = this._idx(lx, y, lz);
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

  /** Async version of _genAll — generates all chunks in parallel via workers. */
  async _genAllAsync() {
    const tasks = [];
    for (let cz = -this.radiusChunks; cz <= this.radiusChunks; cz++) {
      for (let cx = -this.radiusChunks; cx <= this.radiusChunks; cx++) {
        tasks.push(this.generateChunkAsync(cx, cz).then((data) => ({ cx, cz, data })));
      }
    }

    const results = await Promise.all(tasks);
    for (const { cx, cz, data } of results) {
      this.chunks.set(this.key(cx, cz), data);
    }

    // Now rebuild meshes for all chunks
    for (let cz = -this.radiusChunks; cz <= this.radiusChunks; cz++) {
      for (let cx = -this.radiusChunks; cx <= this.radiusChunks; cx++) {
        this.rebuildChunk(cx, cz);
      }
    }
  }

  /** Dispose worker pool. */
  disposeWorkers() {
    for (const w of this._workerPool) {
      try { w.terminate(); } catch {}
    }
    this._workerPool = [];
  }

  key(cx, cz) {
    return `${cx},${cz}`;
  }

  _genAll() {
    for (let cz = -this.radiusChunks; cz <= this.radiusChunks; cz++) {
      for (let cx = -this.radiusChunks; cx <= this.radiusChunks; cx++) {
        this._generateChunk(cx, cz);
      }
    }
    for (let cz = -this.radiusChunks; cz <= this.radiusChunks; cz++) {
      for (let cx = -this.radiusChunks; cx <= this.radiusChunks; cx++) {
        this.rebuildChunk(cx, cz);
      }
    }
  }

  _genInitial(radius = 2) {
    for (let cz = -radius; cz <= radius; cz++) {
      for (let cx = -radius; cx <= radius; cx++) this.ensureChunk(cx, cz, { rebuild: false });
    }
    for (let cz = -radius; cz <= radius; cz++) {
      for (let cx = -radius; cx <= radius; cx++) this.rebuildChunk(cx, cz);
    }
  }

  ensureChunk(cx, cz, { rebuild = true } = {}) {
    const k = this.key(cx, cz);
    if (!this.chunks.has(k)) {
      this._generateChunk(cx, cz);
      this._restoreChunkEdits(cx, cz);
    }
    if (rebuild && !this.meshes.has(k)) this.rebuildChunk(cx, cz);
    return this.chunks.get(k);
  }

  _restoreChunkEdits(cx, cz) {
    const data = this.chunks.get(this.key(cx, cz));
    if (!data) return;
    const minX = cx * CHUNK_SIZE;
    const minZ = cz * CHUNK_SIZE;
    for (const [key, id] of this.edits) {
      const [x, y, z] = key.split(',').map(Number);
      if (x < minX || x >= minX + CHUNK_SIZE || z < minZ || z >= minZ + CHUNK_SIZE) continue;
      if (y >= 0 && y < WORLD_HEIGHT) data[this._idx(x - minX, y, z - minZ)] = id;
    }
  }

  /**
   * Stream full / LOD / proxy rings around player(s).
   * @param {object|object[]} players
   * @param {object} [opts]
   * @param {number} [opts.radius] outer stream radius (proxy ring)
   * @param {number} [opts.fullRadius]
   * @param {number} [opts.lodRadius]
   * @param {number} [opts.proxyRadius]
   * @param {number} [opts.lodStep]
   * @param {number} [opts.proxyStep]
   */
  updateStreaming(players, {
    radius = this.streamRadius,
    fullRadius,
    lodRadius,
    proxyRadius,
    lodStep,
    proxyStep,
  } = {}) {
    const list = Array.isArray(players) ? players : [players];
    // Callers may pass Player instances (the game loop) or plain x/z points
    // (tests/tools). Normalize both shapes before deriving stream centers.
    const valid = list
      .map((p) => p?.position ?? p)
      .filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.z));
    if (!valid.length) return { loaded: this.chunks.size, meshes: this.meshes.size };
    const centers = valid.map((p) => this.worldToChunk(p.x, p.z));

    const basePlan = terrainVisibilityPlan(radius, { chunkSize: CHUNK_SIZE });
    const plan = {
      ...basePlan,
      fullChunks: Math.max(2, Math.min(32, (fullRadius ?? basePlan.fullChunks) | 0)),
      lodChunks: Math.max(2, Math.min(32, (lodRadius ?? basePlan.lodChunks) | 0)),
      proxyChunks: Math.max(2, Math.min(32, (proxyRadius ?? basePlan.proxyChunks ?? radius) | 0)),
      lodStep: Math.max(1, (lodStep ?? basePlan.lodStep) | 0),
      proxyStep: Math.max(1, (proxyStep ?? basePlan.proxyStep) | 0),
    };
    if (plan.lodChunks < plan.fullChunks) plan.lodChunks = plan.fullChunks;
    if (plan.proxyChunks < plan.lodChunks) plan.proxyChunks = plan.lodChunks;
    this._visPlan = plan;

    const r = plan.proxyChunks;
    this.streamRadius = r;
    const signature = `${plan.fullChunks}:${plan.lodChunks}:${plan.proxyChunks}:${centers.map((c) => `${c.cx},${c.cz}`).join('|')}`;
    const centerChanged = signature !== this._streamSignature;
    this._streamSignature = signature;

    /** @type {Map<string,{cx:number,cz:number,distance:number,tier:'full'|'lod'|'proxy'}>} */
    const desired = new Map();
    for (const { cx, cz } of centers) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          const distance = Math.max(Math.abs(dx), Math.abs(dz));
          if (distance > r) continue;
          const tier = chunkDetailTier(distance, plan);
          if (tier === 'none') continue;
          const k = this.key(cx + dx, cz + dz);
          const prev = desired.get(k);
          // Prefer the highest-detail tier if multiple players overlap.
          if (!prev || this._tierRank(tier) > this._tierRank(prev.tier)) {
            desired.set(k, { cx: cx + dx, cz: cz + dz, distance, tier });
          }
        }
      }
    }

    for (const [k, want] of desired) {
      const have = this.meshTiers.get(k);
      const needsVoxel = want.tier === 'full' || want.tier === 'lod';
      const needsWork =
        !this.meshes.has(k) ||
        !have ||
        have !== want.tier ||
        (needsVoxel && !this.chunks.has(k));
      if (!needsWork || this._streamQueued.has(k)) continue;
      this._streamQueued.add(k);
      this._streamQueue.push({ ...want, key: k });
    }

    // Near + higher detail first. Continue draining even when the player
    // remains in the same chunk (signature early-return used to starve the queue).
    const rank = (t) => this._tierRank(t);
    this._streamQueue.sort((a, b) => a.distance - b.distance || rank(b.tier) - rank(a.tier));
    let generated = 0;
    const budget = Math.max(1, this.streamBudget | 0);
    while (this._streamQueue.length && generated < budget) {
      const next = this._streamQueue.shift();
      const k = next.key || this.key(next.cx, next.cz);
      this._streamQueued.delete(k);
      const want = desired.get(k);
      if (!want) continue;
      this._materializeChunk(want.cx, want.cz, want.tier, plan);
      generated++;
    }

    const unloadR = r + this.streamMargin;
    for (const [k, mesh] of this.meshes) {
      const [cx, cz] = k.split(',').map(Number);
      if (centers.some((c) => Math.max(Math.abs(cx - c.cx), Math.abs(cz - c.cz)) <= unloadR)) {
        // Drop expensive voxel data outside the LOD ring; keep proxy mesh.
        const want = desired.get(k);
        if (want?.tier === 'proxy' && this.chunks.has(k)) {
          this.chunks.delete(k);
          this.dirty.delete(k);
        }
        continue;
      }
      mesh.geometry?.dispose();
      this.group.remove(mesh);
      this.meshes.delete(k);
      this.meshTiers.delete(k);
      this.chunks.delete(k);
      this.dirty.delete(k);
    }
    this._streamCenter = centers[0];
    return {
      loaded: this.chunks.size,
      meshes: this.meshes.size,
      queued: this._streamQueue.length,
      generated,
      centerChanged,
      fullChunks: plan.fullChunks,
      lodChunks: plan.lodChunks,
      proxyChunks: plan.proxyChunks,
    };
  }

  /** @param {'full'|'lod'|'proxy'} tier */
  _tierRank(tier) {
    if (tier === 'full') return 3;
    if (tier === 'lod') return 2;
    if (tier === 'proxy') return 1;
    return 0;
  }

  /**
   * Ensure the right representation exists for a chunk at the requested tier.
   * @param {number} cx
   * @param {number} cz
   * @param {'full'|'lod'|'proxy'} tier
   * @param {ReturnType<typeof terrainVisibilityPlan>} plan
   */
  _materializeChunk(cx, cz, tier, plan) {
    const k = this.key(cx, cz);
    if (tier === 'proxy') {
      // Proxies never allocate full voxel storage.
      if (this.chunks.has(k) && this.meshTiers.get(k) === 'full') {
        // Keep voxel data if we somehow still have it; just draw proxy if requested.
      }
      this.rebuildProxyChunk(cx, cz, plan.proxyStep || 4);
      return;
    }
    this.ensureChunk(cx, cz, { rebuild: false });
    if (tier === 'lod') this.rebuildLodChunk(cx, cz, plan.lodStep || 2);
    else this.rebuildChunk(cx, cz);
  }

  /** Surface sample used by LOD/proxy heightfields. */
  _proxySurfaceSample(x, z, h) {
    const biome = biomeAt(x, z, this.seed);
    let id = BLOCK.GRASS;
    if (h < SEA_LEVEL) id = BLOCK.WATER;
    else if (biome === BIOME.SHORE || biome === BIOME.DESERT || biome === BIOME.OCEAN) id = BLOCK.SAND;
    else if (biome === BIOME.TUNDRA) id = BLOCK.SNOW;
    else if (biome === BIOME.TROPICAL) id = BLOCK.GRASS;
    const c = getColor(id);
    // getColor returns [r,g,b] in 0..1 (sometimes face-tinted).
    let r = 0.35;
    let g = 0.55;
    let b = 0.28;
    if (Array.isArray(c) && c.length >= 3) {
      r = Number(c[0]) || r;
      g = Number(c[1]) || g;
      b = Number(c[2]) || b;
    } else if (typeof c === 'number') {
      r = ((c >> 16) & 255) / 255;
      g = ((c >> 8) & 255) / 255;
      b = (c & 255) / 255;
    } else if (c && typeof c === 'object') {
      r = Number(c.r ?? r);
      g = Number(c.g ?? g);
      b = Number(c.b ?? b);
    }
    // Slight distance desaturation so proxies read as horizon mass.
    if (h < SEA_LEVEL) {
      r = 0.15;
      g = 0.42;
      b = 0.62;
    }
    return {
      r,
      g,
      b,
      a: h < SEA_LEVEL ? 0.85 : 1,
      tile: tileForBlock(id) || 0,
    };
  }

  _applyMeshArrays(cx, cz, arrays, tier) {
    const k = this.key(cx, cz);
    if (!arrays || !arrays.positions?.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arrays.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(arrays.normals, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(arrays.colors, 4));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(arrays.uvs, 2));
    geo.setAttribute('tile', new THREE.Float32BufferAttribute(arrays.tiles, 1));
    geo.setIndex(Array.from(arrays.indices));
    geo.computeBoundingSphere();

    let mesh = this.meshes.get(k);
    if (mesh) {
      mesh.geometry.dispose();
      mesh.geometry = geo;
      mesh.material = this.material;
    } else {
      mesh = new THREE.Mesh(geo, this.material);
      mesh.name = `chunk_${k}`;
      this.meshes.set(k, mesh);
      this.group.add(mesh);
    }
    mesh.userData.tier = tier;
    mesh.castShadow = tier === 'full';
    mesh.receiveShadow = tier !== 'proxy';
    this.meshTiers.set(k, tier);
  }

  rebuildLodChunk(cx, cz, step = 2) {
    const arrays = buildTerrainProxyArrays({
      baseX: cx * CHUNK_SIZE,
      baseZ: cz * CHUNK_SIZE,
      size: CHUNK_SIZE,
      step,
      seed: this.seed,
      heightFn: heightAt,
      sampleFn: (x, z, h) => this._proxySurfaceSample(x, z, h),
    });
    this._applyMeshArrays(cx, cz, arrays, 'lod');
  }

  rebuildProxyChunk(cx, cz, step = 4) {
    const arrays = buildTerrainProxyArrays({
      baseX: cx * CHUNK_SIZE,
      baseZ: cz * CHUNK_SIZE,
      size: CHUNK_SIZE,
      step,
      seed: this.seed,
      heightFn: heightAt,
      sampleFn: (x, z, h) => this._proxySurfaceSample(x, z, h),
    });
    this._applyMeshArrays(cx, cz, arrays, 'proxy');
  }

  _generateChunk(cx, cz) {
    const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    const baseX = cx * CHUNK_SIZE;
    const baseZ = cz * CHUNK_SIZE;
    const villageSites = villageSitesForSeed(this.seed);

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const x = baseX + lx;
        const z = baseZ + lz;
        const biome = biomeAt(x, z, this.seed);
        const beachApproach = bviBeachLandingAt(x, z).influence > 0 || bviBeachLandingAt(x, z - 1).influence > 0;
        const h = (mangroveApproachWaterPocket(x, z, biome) || mangroveApproachBankCut(x, z, biome))
          ? SEA_LEVEL - 1 : heightAt(x, z, this.seed);
        const cliff = biome === BIOME.TROPICAL && tropicalCliffAt(x, z, this.seed);

        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let id = BLOCK.AIR;
          if (y === 0) id = BLOCK.BEDROCK;
          else if (y > h) {
            if (y <= SEA_LEVEL) id = BLOCK.WATER;
            else id = BLOCK.AIR;
          } else if (y === h) {
            // Biome-driven surface block
            if (biome === BIOME.MANGROVE) id = BLOCK.MANGROVE_MUD;
            else if (biome === BIOME.SHORE || biome === BIOME.DESERT || biome === BIOME.OCEAN) id = BLOCK.SAND;
            else if (biome === BIOME.TUNDRA) id = BLOCK.SNOW;
            else if (cliff) id = BLOCK.STONE;
            else id = BLOCK.GRASS; // FOREST default
          } else if (y > h - 4) {
            // Sub-surface follows biome: desert/shore → sand, tundra → dirt, else dirt
            if (biome === BIOME.MANGROVE) id = BLOCK.MANGROVE_MUD;
            else if (biome === BIOME.DESERT || biome === BIOME.SHORE || biome === BIOME.OCEAN) id = BLOCK.SAND;
            else if (cliff) id = BLOCK.STONE;
            else id = BLOCK.DIRT;
          } else {
            id = BLOCK.STONE;
            // coal veins
            if (y < h - 6 && hash2(x + y * 3, z + this.seed) > 0.97) id = BLOCK.COAL_ORE;
            // iron deeper
            if (y < h - 10 && y > 4 && hash2(x * 2 + y, z + this.seed * 5) > 0.985) id = BLOCK.IRON_ORE;
            // deep clay ore veins (y <= 8, hash2-safe density)
            if (y >= 2 && y <= 8 && hash2(x + y * 13, z * 7 + this.seed * 3) > 0.982) id = BLOCK.CLAY_DEEP_ORE;
            // caves
            if (y >= 3 && y <= h - 5) {
              if (hash2(x + y * 7, z + this.seed * 3) > 0.991) id = BLOCK.AIR;
            }
          }
          if (y >= h - 1 && y <= h && id === BLOCK.STONE) {
            const exposedOre = exposedOreAt(x, y, z, this.seed);
            if (exposedOre) id = exposedOre;
          }
          data[this._idx(lx, y, lz)] = id;
        }
        const saltPond = bviSaltPondAt(x, z);
        const driftwood = bviDriftwoodAt(x, z);
        if (saltPond && h >= SEA_LEVEL + 1) {
          for (let yy = SEA_LEVEL; yy <= h; yy++) data[this._idx(lx, yy, lz)] = yy === SEA_LEVEL ? BLOCK.WATER : BLOCK.AIR;
        }
        const wetSand = bviWetSandAt(x, z);
        if (wetSand && h >= SEA_LEVEL) data[this._idx(lx, h, lz)] = BLOCK.DAMP_SOIL;
        const cayOutcrop = bviCayOutcropAt(x, z);
        if (cayOutcrop && h >= SEA_LEVEL + 1) {
          data[this._idx(lx, h, lz)] = BLOCK.STONE;
          if (h + 1 < WORLD_HEIGHT && data[this._idx(lx, h + 1, lz)] === BLOCK.AIR) data[this._idx(lx, h + 1, lz)] = BLOCK.STONE;
        }
        const channelBuoy = bviChannelBuoyAt(x, z);
        if (channelBuoy && h < SEA_LEVEL) {
          data[this._idx(lx, SEA_LEVEL, lz)] = BLOCK.LOG;
          data[this._idx(lx, SEA_LEVEL + 1, lz)] = channelBuoy.id === 'red' ? BLOCK.CORAL : BLOCK.BUSH;
        }
        const dock = bviDockAt(x, z);
        if (dock && h < SEA_LEVEL) {
          data[this._idx(lx, SEA_LEVEL, lz)] = BLOCK.PLANKS;
          if (dock.post) data[this._idx(lx, SEA_LEVEL + 1, lz)] = BLOCK.LOG;
        }

        if (h > SEA_LEVEL + 1) {
          const th = hash2(x * 3 + (this.seed | 0), z * 5 + 19);
          let treeChance = 0;
          if (biome === BIOME.FOREST) treeChance = 0.018; // ~4% surface — half prior density
          else if (biome === BIOME.SHORE) treeChance = 0.020; // coastal palms/scrub
          else if (biome === BIOME.TUNDRA) treeChance = 0.012;
          else if (biome === BIOME.TROPICAL) treeChance = 0.014; // trimmed further so the starter island sightline reads clearly
          else if (biome === BIOME.MANGROVE) treeChance = 0.014; // sparse tidal grove sightlines
          else if (biome === BIOME.OCEAN) treeChance = 0;
          const forestPocket = forestSightlinePocket(x, z, biome);
          const villageColumn = villageColumnAt(x, z, villageSites);
          const mangroveLandmark = mangroveMarkerAt(x, z, biome, h);
          if (mangroveLandmark) {
            this._placeMangroveBridge(data, lx, h + 1, lz, mangroveApproachPlantClearance(x, z, biome));
          } else if (!villageColumn && !forestPocket && !beachApproach && !saltPond && !driftwood && !mangroveSightlinePocket(x, z, biome)
            && !mangroveApproachSightlinePocket(x, z, biome) && th > 1 - treeChance) {
            // Tree species selection by biome
            const sequoiaRoll = hash2(x + 73, z * 2 + (this.seed | 0));
            const spruceRoll = hash2(x * 5 + 17, z * 3 + (this.seed | 0));
            if (biome === BIOME.TUNDRA && spruceRoll > 0.15) {
              // Tundra: ~85% spruce, fallback to oak for the rest
              this._placeSpruce(data, lx, h + 1, lz);
            } else if (biome === BIOME.FOREST && sequoiaRoll > 0.97) {
              this._placeSequoia(data, lx, h + 1, lz);
            } else if (biome === BIOME.FOREST && spruceRoll > 0.85) {
              // Forest: ~15% of non-sequoia trees are spruce
              this._placeSpruce(data, lx, h + 1, lz);
            } else if (biome === BIOME.MANGROVE) {
              this._placeMangrove(data, lx, h + 1, lz);
            } else if (biome === BIOME.TROPICAL || biome === BIOME.SHORE) {
              this._placePalm(data, lx, h + 1, lz);
            } else {
              this._placeTree(data, lx, h + 1, lz);
            }
          }
        }
        // berry bushes on grass surface — forest mainly
        const landingSign = bviLandingSignAt(x, z);
        if (landingSign && h >= SEA_LEVEL + 1) {
          if (landingSign.post && data[this._idx(lx, h + 1, lz)] === BLOCK.AIR) data[this._idx(lx, h + 1, lz)] = BLOCK.LOG;
          if (data[this._idx(lx, h + 2, lz)] === BLOCK.AIR) data[this._idx(lx, h + 2, lz)] = BLOCK.PLANKS;
        }
        const starterRamp = bviStarterRampAt(x, z);
        if (starterRamp && h < SEA_LEVEL) {
          data[this._idx(lx, SEA_LEVEL, lz)] = BLOCK.PLANKS;
          if (SEA_LEVEL + 1 < WORLD_HEIGHT) data[this._idx(lx, SEA_LEVEL + 1, lz)] = BLOCK.AIR;
        }
        if (driftwood && h >= SEA_LEVEL && data[this._idx(lx, h + 1, lz)] === BLOCK.AIR) {
          data[this._idx(lx, h + 1, lz)] = BLOCK.LOG;
        }
        const saltScrub = bviSaltPondScrubAt(x, z);
        if (saltScrub && h >= SEA_LEVEL + 1 && data[this._idx(lx, h + 1, lz)] === BLOCK.AIR) {
          data[this._idx(lx, h + 1, lz)] = BLOCK.BUSH;
        }
        this._populateOceanColumn(data, lx, h, lz, x, z, biome);
        this._populateMangroveColumn(data, lx, h, lz, x, z, biome);
        if (
          (biome === BIOME.FOREST || biome === BIOME.MANGROVE || biome === BIOME.SHORE || biome === BIOME.TROPICAL) &&
          h > SEA_LEVEL + 1 &&
          (data[this._idx(lx, h, lz)] === BLOCK.GRASS || data[this._idx(lx, h, lz)] === BLOCK.SAND || data[this._idx(lx, h, lz)] === BLOCK.MANGROVE_MUD) &&
          data[this._idx(lx, h + 1, lz)] === BLOCK.AIR &&
          hash2(x + 91, z * 3 + (this.seed | 0)) > 0.94
        ) {
          data[this._idx(lx, h + 1, lz)] = BLOCK.BUSH;
        }

        const floorDetail = forestFloorDetail(
          x,
          z,
          this.seed,
          biome,
          h,
          data[this._idx(lx, h, lz)],
          data[this._idx(lx, h + 1, lz)],
        );
        if (floorDetail === 'damp-soil') data[this._idx(lx, h, lz)] = BLOCK.DAMP_SOIL;
        else if (floorDetail === 'roots') data[this._idx(lx, h + 1, lz)] = BLOCK.ROOTS;
        else if (floorDetail === 'sticks') data[this._idx(lx, h + 1, lz)] = BLOCK.STICK_PILE;
        else if (floorDetail === 'mushroom') data[this._idx(lx, h + 1, lz)] = BLOCK.MUSHROOM;

        // clay deposits near shore biome
        if (biome === BIOME.SHORE || (h >= SEA_LEVEL && h <= SEA_LEVEL + 3 && biome !== BIOME.TUNDRA)) {
          if (hash2(x + 33, z + this.seed) > 0.93) {
            const surface = data[this._idx(lx, h, lz)];
            if (surface === BLOCK.GRASS || surface === BLOCK.DIRT || surface === BLOCK.SAND) {
              data[this._idx(lx, h, lz)] = BLOCK.CLAY;
            }
          }
        }
        if (villageColumnAt(x, z, villageSites)) {
          for (let yy = 1; yy < WORLD_HEIGHT; yy++) {
            const villageId = villageBlockAt(x, yy, z, villageSites);
            if (villageId !== null) data[this._idx(lx, yy, lz)] = villageId;
          }
        }
      }
    }

    // Lava tube generation — carve tubular passages deep underground, fill with lava
    this._carveLavaTubes(data, baseX, baseZ);

    this.chunks.set(this.key(cx, cz), data);
  }

  /**
   * Lava tube generation — carved tubular passages deep underground filled with lava.
   * Uses 3D noise-based tunnel routing: center path determined by fbm drift, with
   * variable radius. Lava pools at the bottom of each tube segment.
   */
  _carveLavaTubes(data, baseX, baseZ) {
    const tubeY = 4; // Deep underground level (above bedrock at y=0)
    const tubeRadius = 2; // Half-width of the tunnel

    // For each column, compute a tube path through this chunk
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = baseX + lx;
        const wz = baseZ + lz;

        // Deterministic check: does a lava tube pass near this position?
        // Use fbm to create the tube centerline offset at depth tubeY
        const tubeCenterX = fbm(wx * 0.04 + this.seed * 17, wz * 0.04 + this.seed * 31, 2);
        const tubeCenterZ = fbm(wx * 0.04 + this.seed * 43, wz * 0.04 + this.seed * 59, 2);

        // Map [0,1) to chunk-relative position
        const tubeLx = (tubeCenterX * CHUNK_SIZE) % CHUNK_SIZE;
        const tubeLz = (tubeCenterZ * CHUNK_SIZE) % CHUNK_SIZE;

        // Distance from this block to the tube center
        const dx = lx - tubeLx;
        const dz = lz - tubeLz;
        const dist2d = Math.sqrt(dx * dx + dz * dz);

        // Tube presence check — sparse enough to be interesting
        const tubePresence = hash2(wx + this.seed * 7, wz + this.seed * 13);
        if (tubePresence < 0.85) continue; // Only ~15% of columns host a tube

        if (dist2d < tubeRadius) {
          // Carve through stone, fill with lava at bottom level
          const yTop = tubeY + Math.floor(hash2(wx, wz + this.seed * 5) * 3);
          const lavaLevel = tubeY;

          for (let y = lavaLevel; y <= yTop && y < WORLD_HEIGHT - 1; y++) {
            const i = this._idx(lx, y, lz);
            const block = data[i];
            // Carve stone/dirt; don't overwrite bedrock
            if (block === BLOCK.STONE || block === BLOCK.DIRT) {
              if (y === lavaLevel) {
                data[i] = BLOCK.LAVA; // Lava floor
              } else if (y < yTop) {
                data[i] = BLOCK.AIR; // Carved ceiling/air space
              }
            }
          }

          // Edge glow reserved for future light bleed; lava BLOCK_PROPS.light handles emission.
        }
      }
    }
  }

  /** Flood low mangrove pockets with sparse tidal channels and aquatic accents. */
  _populateMangroveColumn(data, lx, h, lz, x, z, biome) {
    if (biome !== BIOME.MANGROVE || h > SEA_LEVEL + 2) return;
    if (mangroveApproachPlantClearance(x, z, biome)) return;
    const channel = hash2(x * 19 + this.seed * 3, z * 23 + this.seed * 5);
    if (channel < 0.72) return;
    data[this._idx(lx, h, lz)] = BLOCK.WATER;
    if (channel > 0.86) data[this._idx(lx, h, lz)] = BLOCK.KELP;
  }

  /** Populate shallow ocean shelves with deterministic reefs and underwater plants. */
  _populateOceanColumn(data, lx, h, lz, x, z, biome) {
    if (h >= SEA_LEVEL || (biome !== BIOME.OCEAN && biome !== BIOME.SHORE && biome !== BIOME.TROPICAL)) return;
    if (mangroveApproachPlantClearance(x, z, biome)) return;
    const floor = data[this._idx(lx, h, lz)];
    if (floor !== BLOCK.SAND && floor !== BLOCK.DIRT) return;
    const waterY = h + 1;
    if (waterY >= SEA_LEVEL || data[this._idx(lx, waterY, lz)] !== BLOCK.WATER) return;

    const plantRoll = hash2(x * 11 + this.seed * 7, z * 13 + 31);
    const shallow = h >= SEA_LEVEL - 5;
    if (shallow && plantRoll > 0.72) {
      data[this._idx(lx, waterY, lz)] = BLOCK.SEAGRASS;
    } else if (!shallow && plantRoll > 0.78) {
      const kelpHeight = 2 + Math.floor(hash2(x * 17 + 5, z * 19 + this.seed) * 4);
      for (let y = waterY; y < Math.min(SEA_LEVEL, waterY + kelpHeight); y++) {
        if (data[this._idx(lx, y, lz)] !== BLOCK.WATER) break;
        data[this._idx(lx, y, lz)] = BLOCK.KELP;
      }
    }
    if (shallow && hash2(x * 17 + 5, z * 19 + this.seed) > 0.93) {
      data[this._idx(lx, waterY, lz)] = BLOCK.KELP;
      if (waterY + 1 < SEA_LEVEL && data[this._idx(lx, waterY + 1, lz)] === BLOCK.WATER) data[this._idx(lx, waterY + 1, lz)] = BLOCK.KELP;
    }

    const reefShelf = bviReefShelfAt(x, z);
    const reefRoll = hash2(x * 23 + 17, z * 29 + this.seed * 3);
    const coralThreshold = reefShelf > 0 ? 0.88 : 0.96;
    if (shallow && reefRoll > coralThreshold) {
      data[this._idx(lx, waterY, lz)] = BLOCK.CORAL;
      const reefY = waterY + 1;
      if (reefY < SEA_LEVEL && data[this._idx(lx, reefY, lz)] === BLOCK.WATER && hash2(x + 41, z * 3 + 7) > 0.45) {
        data[this._idx(lx, reefY, lz)] = BLOCK.CORAL;
      }
      for (const dx of [-1, 1]) {
        const tx = lx + dx;
        if (tx < 0 || tx >= CHUNK_SIZE) continue;
        if (data[this._idx(tx, h, lz)] === BLOCK.SAND && data[this._idx(tx, waterY, lz)] === BLOCK.WATER) {
          data[this._idx(tx, waterY, lz)] = BLOCK.CORAL;
        }
      }
    }
    if (bviReefHeadAt(x, z)) {
      data[this._idx(lx, waterY, lz)] = BLOCK.CORAL;
      if (waterY + 1 < SEA_LEVEL && data[this._idx(lx, waterY + 1, lz)] === BLOCK.WATER) {
        data[this._idx(lx, waterY + 1, lz)] = BLOCK.CORAL;
      }
    }
  }

  _placeTree(data, lx, y, lz) {
    // Variable height canopy (Minecraft-ish oak)
    const trunkH = 4 + Math.floor(hash2(lx + 11, lz + 7) * 4); // 4-7
    for (let i = 0; i < trunkH; i++) {
      const ty = y + i;
      if (ty >= WORLD_HEIGHT) break;
      if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
        data[this._idx(lx, ty, lz)] = BLOCK.LOG;
      }
    }
    const top = y + trunkH - 1;
    const radius = 2 + (hash2(lx + 3, lz + 9) > 0.55 ? 1 : 0);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
          if (dist > radius + 1) continue;
          if (dx === 0 && dz === 0 && dy < 0) continue; // keep trunk
          // thinner top layer
          if (dy === 2 && (Math.abs(dx) > 1 || Math.abs(dz) > 1)) continue;
          const tx = lx + dx;
          const ty = top + dy;
          const tz = lz + dz;
          if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE || ty < 0 || ty >= WORLD_HEIGHT) continue;
          const i = this._idx(tx, ty, tz);
          if (data[i] === BLOCK.AIR) data[i] = BLOCK.LEAVES;
        }
      }
    }
    // canopy peak
    const peak = top + 3;
    if (peak < WORLD_HEIGHT && lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
      const i = this._idx(lx, peak, lz);
      if (data[i] === BLOCK.AIR) data[i] = BLOCK.LEAVES;
    }
  }


  /** Tropical palm: tapered trunk, small root flare, and drooping frond crown. */
  _placePalm(data, lx, y, lz) {
    const trunkH = 6 + Math.floor(hash2(lx + 21, lz + 13) * 4);
    const lean = hash2(lx + 27, lz + 31) > 0.5 ? 1 : -1;
    for (let i = 0; i < trunkH; i++) {
      const ty = y + i;
      if (ty >= WORLD_HEIGHT) break;
      const ox = i >= trunkH - 2 ? (i - trunkH + 2) * lean : 0;
      this._setAir(data, lx + ox, ty, lz, BLOCK.LOG);
    }
    for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) this._setAir(data, lx + dx, y, lz + dz, BLOCK.LOG);
    const top = y + trunkH - 1;
    const fronds = [
      [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
      [2, 0], [-2, 0], [0, 2], [0, -2],
      [2, 1], [2, -1], [-2, 1], [-2, -1],
      [1, 2], [-1, 2], [1, -2], [-1, -2],
    ];
    for (const [dx, dz] of fronds) {
      const tx = lx + dx;
      const tz = lz + dz;
      const distance = Math.abs(dx) + Math.abs(dz);
      const ty = top + (distance >= 2 ? -1 : 1);
      this._setAir(data, tx, ty, tz, BLOCK.PALM_LEAVES);
    }
  }

  /** Place the authored Lantern Rootwalk destination in the wetland. */
  _placeMangroveBridge(data, lx, y, lz, clearApproachPlants = false) {
    const set = (x, yy, z, id) => {
      if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || yy < 0 || yy >= WORLD_HEIGHT) return;
      const i = this._idx(x, yy, z);
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
    // Sparse mangrove-log ribs give the crossing a believable wetland bearing
    // structure without narrowing the one-block walking line.
    for (const dx of [-3, 0]) {
      const rampRise = Math.max(0, Math.min(y - rampBase, dx + 6));
      const stepY = dx < 2 ? rampBase + rampRise : y;
      for (let yy = SEA_LEVEL - 1; yy < stepY; yy++) {
        const i = this._idx(lx + dx, yy, lz + 1);
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
      const i = this._idx(x, yy, z);
      if (data[i] === BLOCK.WATER) data[i] = id;
    };
    for (const [dx, dz, h] of [[-5, -2, 2], [-6, 1, 3], [-5, 2, 2], [-3, -3, 1]]) {
      if (clearApproachPlants && ((dx === -5 && dz === -2) || (dx === -3 && dz === -3))) continue;
      for (let i = 0; i < h; i++) plant(lx + dx, SEA_LEVEL - 1 - i, lz + dz, i === h - 1 ? BLOCK.SEAGRASS : BLOCK.KELP);
      const tip = this._idx(lx + dx, SEA_LEVEL + 1, lz + dz);
      if (data[tip] === BLOCK.AIR) data[tip] = BLOCK.SEAGRASS;
    }
    for (const [dx, dz] of [[2, -1], [2, 1], [3, 0]]) {
      const mud = this._idx(lx + dx, y - 1, lz + dz);
      if (data[mud] === BLOCK.MANGROVE_MUD || data[mud] === BLOCK.DIRT || data[mud] === BLOCK.SAND) data[mud] = BLOCK.DAMP_SOIL;
    }
  }

  /** Place a tidal mangrove: low forked trunk, flared roots, and a bright umbrella canopy. */
  _placeMangrove(data, lx, y, lz) {
    const trunkH = 3 + Math.floor(hash2(lx + 121, lz + 137) * 2);
    const lean = hash2(lx + 127, lz + 131) > 0.5 ? 1 : -1;
    for (let i = 0; i < trunkH; i++) {
      const ty = y + i;
      const ox = i >= trunkH - 2 ? (i - trunkH + 2) * lean : 0;
      this._setAir(data, lx + ox, ty, lz, BLOCK.MANGROVE_LOG);
    }
    // Buttress roots make the wetland silhouette unmistakable at player scale.
    for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      this._setAir(data, lx + dx, y, lz + dz, BLOCK.ROOTS);
    }
    const top = y + trunkH - 1;
    for (let dy = -1; dy <= 2; dy++) {
      const radius = dy === 2 ? 1 : 2;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const dist = Math.abs(dx) + Math.abs(dz);
          if (dist > radius + 1 || (dy === -1 && dist > 2)) continue;
          if (dx === 0 && dz === 0 && dy < 0) continue;
          this._setAir(data, lx + dx, top + dy, lz + dz, BLOCK.MANGROVE_LEAVES);
        }
      }
    }
    this._setAir(data, lx, top + 3, lz, BLOCK.MANGROVE_LEAVES);
  }

  /** Place a massive sequoia — thick trunk, tall, reddish canopy. */
  _placeSequoia(data, lx, y, lz) {
    const trunkH = 8 + Math.floor(hash2(lx + 41, lz + 37) * 5); // 8-12
    const thick = hash2(lx + 53, lz + 61) > 0.4; // ~60% chance of 2x2 base
    for (let i = 0; i < trunkH; i++) {
      const ty = y + i;
      if (ty >= WORLD_HEIGHT) break;
      // Main trunk column
      this._setAir(data, lx, ty, lz, BLOCK.SEQUOIA_LOG);
      // Thick base: 2x2 bottom + occasional flare near top
      if (thick) {
        this._setAir(data, lx + 1, ty, lz, BLOCK.SEQUOIA_LOG);
        this._setAir(data, lx, ty, lz + 1, BLOCK.SEQUOIA_LOG);
        this._setAir(data, lx + 1, ty, lz + 1, BLOCK.SEQUOIA_LOG);
      } else if (i < 2) {
        // Narrow flare at very bottom for thin variants
        this._setAir(data, lx + 1, ty, lz, BLOCK.SEQUOIA_LOG);
      }
    }
    // Massive canopy: wide ellipsoid near the top, reddish-green foliage
    const canopyBase = y + trunkH - 2;
    const rXZ = thick ? 3 : 2;
    for (let dy = -1; dy <= 3; dy++) {
      for (let dx = -rXZ; dx <= rXZ; dx++) {
        for (let dz = -rXZ; dz <= rXZ; dz++) {
          const dist = Math.abs(dx) + Math.abs(dz);
          if (dist > rXZ + 1) continue;
          // Shrink top/bottom layers for rounded shape
          if (dy === 3 && dist > rXZ) continue;
          if (dy === -1 && dist > rXZ - 1) continue;
          const tx = lx + dx;
          const ty = canopyBase + dy;
          const tz = lz + dz;
          if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE || ty < 0 || ty >= WORLD_HEIGHT) continue;
          const i = this._idx(tx, ty, tz);
          if (data[i] === BLOCK.AIR) data[i] = BLOCK.SEQUOIA_LEAVES;
        }
      }
    }
  }

  /** Place a spruce tree — tall narrow cone, dark pine tones. */
  _placeSpruce(data, lx, y, lz) {
    const trunkH = 5 + Math.floor(hash2(lx + 71, lz + 59) * 3); // 5-7
    for (let i = 0; i < trunkH; i++) {
      const ty = y + i;
      if (ty >= WORLD_HEIGHT) break;
      this._setAir(data, lx, ty, lz, BLOCK.SPRUCE_LOG);
    }
    // Conical canopy: wide at bottom, narrow point at top — stacked diamond layers
    const canopyStart = y + Math.max(1, trunkH - 3);
    const layers = 3 + Math.floor(hash2(lx + 13, lz + 29) * 2); // 3-4 layers
    for (let layer = 0; layer < layers; layer++) {
      const cy = canopyStart + layer;
      if (cy >= WORLD_HEIGHT) break;
      // Radius shrinks as we go up: start at 3, end at 1
      const r = Math.max(1, 3 - layer);
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          const dist = Math.abs(dx) + Math.abs(dz);
          if (dist > r) continue;
          const tx = lx + dx;
          const tz = lz + dz;
          if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE) continue;
          const i = this._idx(tx, cy, tz);
          if (data[i] === BLOCK.AIR) data[i] = BLOCK.SPRUCE_LEAVES;
        }
      }
    }
    // Top cap
    const topY = canopyStart + layers;
    this._setAir(data, lx, topY, lz, BLOCK.SPRUCE_LEAVES);
  }

  /** Helper: set block only if in-bounds. */
  _setAir(data, lx, ty, lz, block) {
    if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE && ty >= 0 && ty < WORLD_HEIGHT) {
      data[this._idx(lx, ty, lz)] = block;
    }
  }

  _idx(lx, y, lz) {
    return (ly => (lz * WORLD_HEIGHT + ly) * CHUNK_SIZE + lx)(y);
  }

  worldToChunk(x, z) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const lx = ((Math.floor(x) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((Math.floor(z) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return { cx, cz, lx, lz };
  }

  getBlock(x, y, z) {
    y = Math.floor(y);
    if (y < 0 || y >= WORLD_HEIGHT) return y < 0 ? BLOCK.BEDROCK : BLOCK.AIR;
    const { cx, cz, lx, lz } = this.worldToChunk(x, z);
    const data = this.chunks.get(this.key(cx, cz));
    if (!data) return BLOCK.AIR;
    return data[this._idx(lx, y, lz)];
  }

  setBlock(x, y, z, id, { recordEdit = true } = {}) {
    y = Math.floor(y);
    x = Math.floor(x);
    z = Math.floor(z);
    if (y < 0 || y >= WORLD_HEIGHT) return false;
    const { cx, cz, lx, lz } = this.worldToChunk(x, z);
    const data = this.chunks.get(this.key(cx, cz)) || this.ensureChunk(cx, cz);
    if (!data) return false;
    const i = this._idx(lx, y, lz);
    if (data[i] === BLOCK.BEDROCK) return false;
    data[i] = id;
    if (recordEdit) {
      this.edits.set(`${x},${y},${z}`, id);
    }
    this.markDirty(cx, cz);
    // neighbor chunk seams
    if (lx === 0) this.markDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.markDirty(cx + 1, cz);
    if (lz === 0) this.markDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.markDirty(cx, cz + 1);
    return true;
  }

  /** @returns {Array<[number,number,number,number]>} */
  exportEdits() {
    const out = [];
    for (const [k, id] of this.edits) {
      const [x, y, z] = k.split(',').map(Number);
      out.push([x, y, z, id]);
    }
    return out;
  }

  /**
   * Apply sparse edits after generation. Does not clear existing edits map first unless replace.
   * @param {Array<[number,number,number,number]>} edits
   * @param {{ replace?: boolean }} opts
   */
  applyEdits(edits, { replace = true } = {}) {
    if (replace) this.edits.clear();
    if (!edits || !edits.length) {
      if (replace) {
        // rebuild all if we cleared? no need — gen is pristine
      }
      return;
    }
    for (const e of edits) {
      const [x, y, z, id] = e;
      this.setBlock(x, y, z, id, { recordEdit: true });
    }
    this.flushDirty();
  }

  markDirty(cx, cz) {
    if (!this.chunks.has(this.key(cx, cz))) return;
    this.dirty.add(this.key(cx, cz));
  }

  flushDirty() {
    for (const k of this.dirty) {
      const [cx, cz] = k.split(',').map(Number);
      this.rebuildChunk(cx, cz);
    }
    this.dirty.clear();
  }

  rebuildChunk(cx, cz) {
    const k = this.key(cx, cz);
    const data = this.chunks.get(k);
    if (!data) return;

    const baseX = cx * CHUNK_SIZE;
    const baseZ = cz * CHUNK_SIZE;

    const getBlock = (x, y, z) => this.getBlock(x, y, z);
    const quads = greedyMeshChunk({
      getBlock,
      tileFor: tileForBlock,
      colorFor: getColor,
      isTransparent,
      isSolid,
      baseX,
      baseY: 0,
      baseZ,
      sizeX: CHUNK_SIZE,
      sizeY: WORLD_HEIGHT,
      sizeZ: CHUNK_SIZE,
      waterId: BLOCK.WATER,
      // Authored props are appended below so small objects do not inherit the
      // six-face cube treatment used by full blocks.
      skipBlock: id => id === BLOCK.MUSHROOM || id === BLOCK.TORCH || PLANT_FORM.has(id),
    });
    const arrays = quadsToArrays(quads);
    const mushrooms = [];
    const torches = [];
    const plants = [];
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let ly = 0; ly < WORLD_HEIGHT; ly++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const id = data[this._idx(lx, ly, lz)];
          if (id === BLOCK.MUSHROOM) {
            if (mushrooms.length < PLANT_BUDGET) mushrooms.push({ x: baseX + lx, y: ly, z: baseZ + lz });
          } else if (id === BLOCK.TORCH) {
            if (torches.length < PLANT_BUDGET) torches.push({ x: baseX + lx, y: ly, z: baseZ + lz });
          } else if (PLANT_FORM.has(id) && plants.length < PLANT_BUDGET) {
            plants.push({ x: baseX + lx, y: ly, z: baseZ + lz, id });
          }
        }
      }
    }
    const understory = collectForestUnderstory({ baseX, baseZ, seed: this.seed, getBlock });
    const shoreDestination = collectShoreDestination({ baseX, baseZ, seed: this.seed, getBlock });
    if (mushrooms.length) {
      appendGeometryPart(
        arrays,
        buildMushroomGeometry(mushrooms, tileForBlock(BLOCK.MUSHROOM), getColor(BLOCK.MUSHROOM)),
      );
    }
    if (torches.length) {
      appendGeometryPart(
        arrays,
        buildTorchGeometry(
          torches,
          tileForBlock(BLOCK.LOG, 'side'),
          tileForBlock(BLOCK.TORCH),
          getColor(BLOCK.TORCH),
          this.seed,
        ),
      );
    }
    if (understory.length) {
      appendGeometryPart(
        arrays,
        buildMushroomGeometry(understory, tileForBlock(BLOCK.MUSHROOM), getColor(BLOCK.MUSHROOM)),
      );
    }
    if (plants.length) appendGeometryPart(arrays, buildPlantGeometry(plants, this.seed));
    if (shoreDestination.length) appendGeometryPart(arrays, buildShoreDestinationGeometry(shoreDestination));
    this._stats.quads = (this._stats.quads || 0) + arrays.quadCount;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arrays.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(arrays.normals, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(arrays.colors, 4));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(arrays.uvs, 2));
    geo.setAttribute('tile', new THREE.Float32BufferAttribute(arrays.tiles, 1));
    geo.setIndex(arrays.indices);
    geo.computeBoundingSphere();

    let mesh = this.meshes.get(k);
    if (mesh) {
      mesh.geometry.dispose();
      mesh.geometry = geo;
      mesh.material = this.material;
    } else {
      mesh = new THREE.Mesh(geo, this.material);
      mesh.name = `chunk_${k}`;
      this.meshes.set(k, mesh);
      this.group.add(mesh);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.tier = 'full';
    this.meshTiers.set(k, 'full');
  }

  meshStats() {
    let verts = 0;
    let tris = 0;
    for (const m of this.meshes.values()) {
      const pos = m.geometry?.getAttribute('position');
      const idx = m.geometry?.index;
      if (pos) verts += pos.count;
      if (idx) tris += idx.count / 3;
    }
    return { chunks: this.meshes.size, verts, tris };
  }

  /**
   * DDA voxel raycast
   * @returns {{x:number,y:number,z:number, nx:number,ny:number,nz:number, dist:number}|null}
   */
  raycast(origin, direction, maxDist = 8) {
    return raycastVoxel(
      origin,
      direction,
      maxDist,
      (x, y, z) => this.getBlock(x, y, z),
      (id) => id !== BLOCK.AIR && id !== BLOCK.WATER && !!BLOCK_PROPS[id],
    );
  }

  /** Heat contribution near a world position (campfires/torches). */
  sampleHeat(x, y, z, radius = 6) {
    let heat = 0;
    const r = Math.ceil(radius);
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    for (let dz = -r; dz <= r; dz++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const id = this.getBlock(xi + dx, yi + dy, zi + dz);
          const h = BLOCK_PROPS[id]?.heat || 0;
          if (!h) continue;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist > radius) continue;
          heat += h * (1 - dist / radius);
        }
      }
    }
    return heat;
  }

  findSpawn() {
    // Prefer warm sand above sea level, near the tropical starter coast.
    let best = null;
    // BVI candidates get first refusal so a fresh player can actually reach
    // the authored launch ramp, driftwood, and channel without a lucky random
    // spawn on a distant cay. The normal clearance checks below still apply.
    const launchCandidates = [
      [-10, -34, 'Cane Garden Bay · Tortola', Math.PI],
      [26, 15], [25, 15], [27, 15], [24, 15], [28, 15],
      [26, 14], [25, 14], [27, 14],
    ];
    // Tropical/coastal seeds can have sparse clearings; sample deeply enough
    // to avoid falling back to the origin beach and opening the game on a
    // water-dominant frame.
    for (let i = 0; i < 1600; i++) {
      const preferred = launchCandidates[i];
      const x = preferred
        ? preferred[0]
        : Math.floor((hash2(i, this.seed) - 0.5) * this.radiusChunks * CHUNK_SIZE * 1.6);
      const z = preferred
        ? preferred[1]
        : Math.floor((hash2(this.seed, i + 9) - 0.5) * this.radiusChunks * CHUNK_SIZE * 1.6);
      const h = heightAt(x, z, this.seed);
      if (h < SEA_LEVEL + (preferred ? 1 : 2) || h >= WORLD_HEIGHT - 6) continue;
      const spawnChunk = this.worldToChunk(x, z);
      this.ensureChunk(spawnChunk.cx, spawnChunk.cz);
      // surface must be solid non-water
      const surface = this.getBlock(x, h, z);
      if (surface === BLOCK.WATER || surface === BLOCK.AIR) continue;
      if (!isSolid(surface)) continue;
      const above1 = this.getBlock(x, h + 1, z);
      const above2 = this.getBlock(x, h + 2, z);
      if (above1 !== BLOCK.AIR || above2 !== BLOCK.AIR) continue;
      let clear = true;
      const foliage = new Set([
        BLOCK.LOG, BLOCK.LEAVES, BLOCK.SPRUCE_LOG, BLOCK.SPRUCE_LEAVES,
        BLOCK.SEQUOIA_LOG, BLOCK.SEQUOIA_LEAVES, BLOCK.PALM_LEAVES, BLOCK.BUSH,
      ]);
      const clearRadius = preferred ? 1 : 4;
      for (let dx = -clearRadius; dx <= clearRadius && clear; dx++) {
        for (let dz = -clearRadius; dz <= clearRadius && clear; dz++) {
          for (let dy = 1; dy <= 6; dy++) {
            if (foliage.has(this.getBlock(x + dx, h + dy, z + dz))) { clear = false; break; }
          }
        }
      }
      if (!clear) continue;
      if (preferred) {
        return {
          x: x + 0.5,
          y: h + 1.01,
          z: z + 0.5,
          yaw: Number.isFinite(preferred[3]) ? preferred[3] : spawnViewYaw(x, z, this.seed),
          landmark: preferred[2] || '',
        };
      }
      const candidate = { x: x + 0.5, y: h + 1.01, z: z + 0.5, h };
      const biome = biomeAt(x, z, this.seed);
      const warmSurface = surface === BLOCK.SAND && (biome === BIOME.TROPICAL || biome === BIOME.SHORE);
      // Preserve the authored starter-route location score, with a strong
      // preference for a valid BVI launch candidate when one is available.
      const score = (preferred ? 10000 : 0)
        + (warmSurface ? 220 : 0) + h * 2 - Math.hypot(x, z) * 0.15;
      candidate.yaw = spawnViewYaw(x, z, this.seed);
      if (!best || score > best.score) best = { ...candidate, score };
    }
    if (best) return { x: best.x, y: best.y, z: best.z, yaw: best.yaw };
    return { x: 0.5, y: SEA_LEVEL + 12, z: 0.5 };
  }
}
