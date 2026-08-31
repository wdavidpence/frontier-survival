/** Slim authored palm-trunk poles. Voxel cells stay the gameplay source of truth. */

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

/**
 * Replace the full-cube palm trunk with a tapered octagonal pole.
 * Collision, harvest, and worldgen still use the PALM_TRUNK cell.
 *
 * @param {Array<{x:number,y:number,z:number}>} instances trunk cells in world space
 * @param {number} shaftTile atlas tile for bark
 * @param {[number,number,number]} color palm bark tint
 * @param {number} seed world seed for stable per-cell variation
 */
export function buildPalmTrunkGeometry(instances, shaftTile, color = [0.94, 0.82, 0.56], seed = 0) {
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const tiles = [];
  const indices = [];
  const sides = 8;
  const tau = Math.PI * 2;

  const vertex = (point, normal, uv, tint) => {
    positions.push(point[0], point[1], point[2]);
    normals.push(normal[0], normal[1], normal[2]);
    colors.push(tint[0], tint[1], tint[2], 1);
    uvs.push(uv[0], uv[1]);
    tiles.push(uv[2]);
  };
  const quad = (a, b, c, d, normal, uv, tint) => {
    const start = positions.length / 3;
    for (const point of [a, b, c, d]) vertex(point, normal, uv, tint);
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  };
  const ring = (cx, y, cz, radius, rot) => Array.from({ length: sides }, (_, i) => {
    const angle = (i / sides) * tau + rot;
    return [cx + Math.cos(angle) * radius, y, cz + Math.sin(angle) * radius];
  });

  for (const origin of instances) {
    const variation = hash(origin.x + origin.y * 3, origin.z - origin.y * 5, seed);
    const rot = hash(origin.x * 3 + 9, origin.z * 0.7 + 2, seed + 1) * tau;
    const cx = origin.x + 0.5;
    const cz = origin.z + 0.5;
    const bottomR = 0.20 + variation * 0.03;
    const topR = 0.14 + variation * 0.02;
    const tint = [
      clamp01(color[0] * (0.92 + variation * 0.08)),
      clamp01(color[1] * (0.90 + variation * 0.08)),
      clamp01(color[2] * (0.86 + variation * 0.08)),
    ];
    const shaftUv = [0.5, 0.42, shaftTile];
    const bottom = ring(cx, origin.y, cz, bottomR, rot);
    const top = ring(cx, origin.y + 1, cz, topR, rot);
    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      const angle = ((i + 0.5) / sides) * tau + rot;
      quad(
        bottom[i],
        bottom[next],
        top[next],
        top[i],
        normalize(Math.cos(angle), 0.12, Math.sin(angle)),
        shaftUv,
        tint,
      );
    }
  }

  return { positions, normals, colors, uvs, tiles, indices, quadCount: indices.length / 6 };
}
