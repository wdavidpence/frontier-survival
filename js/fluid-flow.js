/**
 * Source/flow water. Ocean columns stay put; player-placed sources spread.
 */

export const FLOW_MAX = 7;

export function isFlowableInto(id, airId = 0, waterId = 5) {
  return id === airId || id === waterId;
}

/**
 * Next cells a source at (x,y,z) should fill this tick.
 * Spreads down first, then horizontally up to `range` (Chebyshev).
 */
export function nextFlowCells(x, y, z, getBlock, {
  airId = 0,
  waterId = 5,
  range = FLOW_MAX,
  source = true,
} = {}) {
  const gx = x | 0;
  const gy = y | 0;
  const gz = z | 0;
  const get = typeof getBlock === 'function' ? getBlock : () => airId;
  const out = [];
  const below = get(gx, gy - 1, gz);
  if (gy > 1 && below === airId) {
    out.push({ x: gx, y: gy - 1, z: gz, level: FLOW_MAX });
    return out;
  }
  if (!source && range <= 0) return out;
  const r = Math.max(0, Math.min(FLOW_MAX, range | 0));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = gx + dx;
    const nz = gz + dz;
    const here = get(nx, gy, nz);
    if (here === airId) out.push({ x: nx, y: gy, z: nz, level: r - 1 });
  }
  return out;
}

export function waterBucketPlace(hitY, seaLevel = 16) {
  const y = hitY | 0;
  return y >= 1 && y < (seaLevel | 0) + 24;
}

/** Finite spread budget so ocean does not BFS the map. */
export function floodFromSources(sources, getBlock, setWater, maxCells = 48) {
  const queue = Array.isArray(sources) ? sources.map((s) => ({ ...s, level: FLOW_MAX })) : [];
  let n = 0;
  const seen = new Set();
  while (queue.length && n < maxCells) {
    const cur = queue.shift();
    const key = `${cur.x|0},${cur.y|0},${cur.z|0}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const next = nextFlowCells(cur.x, cur.y, cur.z, getBlock, { range: cur.level, source: cur.level >= FLOW_MAX });
    for (const cell of next) {
      setWater(cell.x, cell.y, cell.z);
      n += 1;
      if (cell.level > 0) queue.push(cell);
      if (n >= maxCells) break;
    }
  }
  return n;
}
