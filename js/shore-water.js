/** Deterministic shoreline grading and bounded voxel-water reactions. */

const HORIZONTAL = Object.freeze([
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]);

const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function isCoastalSandBiome(biome) {
  return biome === 'shore' || biome === 'ocean';
}

/** Keep ordinary sandy beaches flush with the top of the sea column. */
export function sandyBeachHeight({ height, biome, seaLevel = 16, adjacentWater = false, rocky = false } = {}) {
  const safeHeight = Math.floor(finite(height, seaLevel - 1));
  const safeSea = Math.floor(finite(seaLevel, 16));
  if (!adjacentWater || rocky || !isCoastalSandBiome(biome)) return safeHeight;
  return Math.min(safeHeight, safeSea - 1);
}

/** Surface material contract: sand never occupies the raised shoreline band. */
export function isSandyBeachSurface({ height, biome, seaLevel = 16, rocky = false } = {}) {
  const safeHeight = Math.floor(finite(height, seaLevel - 1));
  const safeSea = Math.floor(finite(seaLevel, 16));
  return !rocky && isCoastalSandBiome(biome) && safeHeight <= safeSea - 1;
}

function key(x, y, z) {
  return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
}

function sideCells(x, y, z) {
  return HORIZONTAL.map(([dx, dz]) => ({ x: x + dx, y, z: z + dz }));
}

function isSolid(block, { airId, waterId, isSolidId } = {}) {
  if (typeof isSolidId === 'function') return !!isSolidId(block);
  return block !== airId && block !== waterId;
}

function effectiveGetter(getBlock, overlays) {
  return (x, y, z) => {
    const k = key(x, y, z);
    return overlays.has(k) ? overlays.get(k) : getBlock(x, y, z);
  };
}

function shouldKeepWater(x, y, z, getBlock, options) {
  const { airId, waterId } = options;
  const sides = sideCells(x, y, z);
  if (sides.some(({ x: sx, y: sy, z: sz }) => getBlock(sx, sy, sz) === waterId)) return true;
  // A solitary water pocket is valid only when all four horizontal walls remain.
  return sides.every(({ x: sx, y: sy, z: sz }) => isSolid(getBlock(sx, sy, sz), options))
    && getBlock(x, y, z) !== airId;
}

/**
 * Return sparse [x,y,z,id] reactions after a block is excavated.
 * The caller applies these through the authoritative World.setBlock path.
 */
export function waterEditsAfterExcavation({
  x,
  y,
  z,
  getBlock,
  waterId = 5,
  airId = 0,
  seaLevel = 16,
  isSolidId,
} = {}) {
  if (typeof getBlock !== 'function') return [];
  const ix = Math.floor(finite(x, 0));
  const iy = Math.floor(finite(y, 0));
  const iz = Math.floor(finite(z, 0));
  const overlays = new Map();
  const edits = [];
  const options = { airId, waterId, isSolidId };
  const read = effectiveGetter(getBlock, overlays);
  const targetId = read(ix, iy, iz);
  // Model the just-excavated cell as air before deciding whether a water source
  // is connected. This prevents a solitary pocket from flowing into the hole
  // that simultaneously removes its last supporting wall.
  if (targetId !== waterId) overlays.set(key(ix, iy, iz), airId);

  // Only connected water or a fully enclosed source can refill an excavation.
  if (targetId !== waterId && iy <= Math.floor(finite(seaLevel, 16))) {
    const incoming = sideCells(ix, iy, iz).some(({ x: sx, y: sy, z: sz }) => {
      const sameLevel = read(sx, sy, sz) === waterId;
      const shorelineLevel = iy === Math.floor(finite(seaLevel, 16)) - 1 && read(sx, sy + 1, sz) === waterId;
      if (!sameLevel && !shorelineLevel) return false;
      const sourceY = sameLevel ? sy : sy + 1;
      return shouldKeepWater(sx, sourceY, sz, read, options);
    });
    if (incoming) {
      overlays.set(key(ix, iy, iz), waterId);
      edits.push([ix, iy, iz, waterId]);
    }
  }

  // If a land wall was removed beside a solitary water cell, collapse that cell.
  // Connected ocean water remains because it has a same-level water neighbor.
  const candidates = [
    ...sideCells(ix, iy, iz),
    { x: ix, y: iy, z: iz },
  ];
  const seen = new Set();
  for (const cell of candidates) {
    const k = key(cell.x, cell.y, cell.z);
    if (seen.has(k)) continue;
    seen.add(k);
    if (read(cell.x, cell.y, cell.z) !== waterId) continue;
    if (shouldKeepWater(cell.x, cell.y, cell.z, read, options)) continue;
    overlays.set(k, airId);
    edits.push([cell.x, cell.y, cell.z, airId]);
  }
  return edits;
}

/** True when a water edit has a legal same-level or shoreline source. */
export function canReceiveWater({ x, y, z, getBlock, waterId = 5, seaLevel = 16 } = {}) {
  if (typeof getBlock !== 'function' || Math.floor(y) > Math.floor(seaLevel)) return false;
  return sideCells(Math.floor(x), Math.floor(y), Math.floor(z)).some(({ x: sx, y: sy, z: sz }) => (
    getBlock(sx, sy, sz) === waterId
      || (Math.floor(y) === Math.floor(seaLevel) - 1 && getBlock(sx, sy + 1, sz) === waterId)
  ));
}
