/** Slim seaward-curved palm trunks and drooping radial crowns. Voxel cells stay gameplay truth. */

const PALM_WIND_DX = -1;
const PALM_WIND_DZ = 0;

function hash(x, z, seed = 0) {
  const s = Math.sin(x * 127.1 + z * 311.7 + seed * 17.3) * 43758.5453;
  return s - Math.floor(s);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function normalize(x, y, z) {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function cellKey(cell) {
  return `${cell.x},${cell.y},${cell.z}`;
}

function clusterPalmTrunks(instances) {
  const map = new Map();
  for (const cell of instances) map.set(cellKey(cell), cell);
  const seen = new Set();
  const trees = [];
  const dirs = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1],
  ];
  for (const cell of instances) {
    const start = cellKey(cell);
    if (seen.has(start)) continue;
    const stack = [cell];
    seen.add(start);
    const group = [];
    while (stack.length) {
      const cur = stack.pop();
      group.push(cur);
      for (const [dx, dy, dz] of dirs) {
        const next = map.get(`${cur.x + dx},${cur.y + dy},${cur.z + dz}`);
        if (!next) continue;
        const key = cellKey(next);
        if (seen.has(key)) continue;
        seen.add(key);
        stack.push(next);
      }
    }
    trees.push(group);
  }
  return trees;
}

function treeRoot(cells) {
  return cells.reduce((best, cell) => {
    if (cell.y < best.y) return cell;
    if (cell.y === best.y && (cell.x < best.x || (cell.x === best.x && cell.z < best.z))) return cell;
    return best;
  }, cells[0]);
}

function treeTop(cells) {
  return cells.reduce((best, cell) => (cell.y > best.y ? cell : best), cells[0]);
}

/** Seaward curve with a slight inland return at the crown, like a coconut palm. */
function leanDistance(t, scale) {
  const seaward = Math.pow(clamp01(t), 1.45);
  const tipReturn = t > 0.78 ? ((t - 0.78) / 0.22) * 0.18 : 0;
  return Math.max(0, seaward - tipReturn) * scale;
}

function treeLeanScale(cells) {
  const span = Math.max(...cells.map((cell) => cell.y)) - Math.min(...cells.map((cell) => cell.y));
  return span <= 0 ? 0 : span * 0.42;
}

function sampleAxis(root, cells, t) {
  const scale = treeLeanScale(cells);
  return [
    root.x + 0.5 + PALM_WIND_DX * leanDistance(t, scale),
    root.y + t * (Math.max(...cells.map((cell) => cell.y)) - root.y + 1),
    root.z + 0.5 + PALM_WIND_DZ * leanDistance(t, scale),
  ];
}

function makeBuffers() {
  return { positions: [], normals: [], colors: [], uvs: [], tiles: [], indices: [] };
}

function emitQuad(buffers, a, b, c, d, normal, uv, tint) {
  const start = buffers.positions.length / 3;
  for (const point of [a, b, c, d]) {
    buffers.positions.push(point[0], point[1], point[2]);
    buffers.normals.push(normal[0], normal[1], normal[2]);
    buffers.colors.push(tint[0], tint[1], tint[2], 1);
    buffers.uvs.push(uv[0], uv[1]);
    buffers.tiles.push(uv[2]);
  }
  buffers.indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
}

function ringAt(cx, y, cz, radius, rot, sides, tangent) {
  const [bx, by, bz] = normalize(tangent[0], tangent[1], tangent[2]);
  let px = 0;
  let py = 1;
  let pz = 0;
  if (Math.abs(by) > 0.92) {
    px = 1;
    py = 0;
  }
  const [tx, ty, tz] = normalize(py * bz - pz * by, pz * bx - px * bz, px * by - py * bx);
  const [sx, sy, sz] = normalize(by * tz - bz * ty, bz * tx - bx * tz, bx * ty - by * tx);
  const tau = Math.PI * 2;
  return Array.from({ length: sides }, (_, i) => {
    const angle = (i / sides) * tau + rot;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    return [
      cx + (tx * ca + sx * sa) * radius,
      y + (ty * ca + sy * sa) * radius,
      cz + (tz * ca + sz * sa) * radius,
    ];
  });
}

/**
 * Replace cube palm trunks with one tapered, west-leaning pole per tree.
 * Collision, harvest, and worldgen still use PALM_TRUNK cells.
 */
export function buildPalmTrunkGeometry(instances, shaftTile, color = [0.94, 0.82, 0.56], seed = 0) {
  const buffers = makeBuffers();
  const sides = 8;
  const tau = Math.PI * 2;
  const trees = clusterPalmTrunks(instances);

  for (const cells of trees) {
    const root = treeRoot(cells);
    const variation = hash(root.x + root.y * 3, root.z - root.y * 5, seed);
    const rot = hash(root.x * 3 + 9, root.z * 0.7 + 2, seed + 1) * tau;
    const tint = [
      clamp01(color[0] * (0.92 + variation * 0.08)),
      clamp01(color[1] * (0.90 + variation * 0.08)),
      clamp01(color[2] * (0.86 + variation * 0.08)),
    ];
    const shaftUv = [0.5, 0.42, shaftTile];
    const span = Math.max(...cells.map((cell) => cell.y)) - root.y + 1;
    const rings = Math.max(2, Math.round(span * 2) + 1);
    const samples = [];
    for (let i = 0; i < rings; i++) {
      const t = i / (rings - 1);
      const [cx, y, cz] = sampleAxis(root, cells, t);
      const radius = (0.20 + variation * 0.03) * (1 - 0.32 * t);
      const nextT = Math.min(1, t + 1 / (rings - 1));
      const next = sampleAxis(root, cells, nextT);
      const tangent = [next[0] - cx, next[1] - y, next[2] - cz];
      samples.push({ cx, y, cz, radius, tangent });
    }
    for (let i = 0; i < samples.length - 1; i++) {
      const a = samples[i];
      const b = samples[i + 1];
      const bottom = ringAt(a.cx, a.y, a.cz, a.radius, rot, sides, a.tangent);
      const top = ringAt(b.cx, b.y, b.cz, b.radius, rot, sides, b.tangent);
      for (let s = 0; s < sides; s++) {
        const next = (s + 1) % sides;
        const nx = (bottom[s][0] + bottom[next][0] + top[next][0] + top[s][0]) * 0.25 - (a.cx + b.cx) * 0.5;
        const ny = 0.12;
        const nz = (bottom[s][2] + bottom[next][2] + top[next][2] + top[s][2]) * 0.25 - (a.cz + b.cz) * 0.5;
        emitQuad(buffers, bottom[s], bottom[next], top[next], top[s], normalize(nx, ny, nz), shaftUv, tint);
      }
    }
  }

  return { ...buffers, quadCount: buffers.indices.length / 6 };
}

/**
 * 10 wind-swept fronds anchored at each palm crown — one tree, not a cube cap.
 */
export function buildPalmCrownGeometry(instances, leafTile, color = [0.52, 0.84, 0.34], seed = 0) {
  const buffers = makeBuffers();
  const trees = clusterPalmTrunks(instances);
  const tau = Math.PI * 2;
  const west = Math.PI;

  const strip = (origin, angle, reach, height, curve, width, tint, tile) => {
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const segments = 5;
    const start = buffers.positions.length / 3;
    for (let i = 0; i <= segments; i++) {
      const s = i / segments;
      const rise = height * (s - curve * s * s);
      const sweep = reach * (0.35 * s + 0.65 * s * s);
      const y = origin[1] + 0.18 + rise;
      const midX = origin[0] + ca * sweep;
      const midZ = origin[2] + sa * sweep;
      const half = width * 0.5 * (1 - 0.62 * s);
      const nx = -sa;
      const ny = 0.55;
      const nz = ca;
      const k = 0.78 + 0.34 * s;
      for (const side of [-1, 1]) {
        buffers.positions.push(midX - sa * half * side, y, midZ + ca * half * side);
        buffers.normals.push(nx, ny, nz);
        buffers.colors.push(clamp01(tint[0] * k), clamp01(tint[1] * k), clamp01(tint[2] * k * 0.92), 1);
        buffers.uvs.push(0.5, 0.2 + 0.6 * s);
        buffers.tiles.push(tile);
      }
    }
    for (let i = 0; i < segments; i++) {
      const a = start + i * 2;
      buffers.indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
  };

  for (const cells of trees) {
    const root = treeRoot(cells);
    const top = treeTop(cells);
    const t = 1;
    const origin = sampleAxis(root, cells, t);
    origin[1] = top.y + 0.72;
    const variation = hash(root.x * 5 + 2, root.z * 3 + 8, seed + 9);
    const tint = [
      clamp01(color[0] * (1.04 + variation * 0.06)),
      clamp01(color[1] * (1.06 + variation * 0.05)),
      clamp01(color[2] * (1.02 + variation * 0.04)),
    ];
    const rachis = [clamp01(tint[0] + 0.16), clamp01(tint[1] + 0.08), clamp01(tint[2] + 0.04)];
    const fronds = 10;
    for (let i = 0; i < fronds; i++) {
      const base = (i / fronds) * tau + variation * 0.2;
      const pulled = base + Math.sin(west - base) * 0.34;
      const reach = 2.15 + hash(root.x + i * 11, root.z - i * 7, seed + 13) * 0.7;
      const height = 0.62 + hash(root.x - i * 3, root.z + i * 5, seed + 17) * 0.28;
      const curve = 0.92 + hash(root.x + i, root.z + i * 2, seed + 19) * 0.16;
      const width = 0.30 + hash(root.x * 2 + i, root.z, seed + 23) * 0.12;
      strip(origin, pulled, reach, height, curve, width, tint, leafTile);
      strip(origin, pulled, reach * 0.92, height * 0.22, 0.2, 0.07, rachis, leafTile);
    }
  }

  return { ...buffers, quadCount: buffers.indices.length / 6 };
}
