/** Build a centered low-poly torch with a wood shaft and faceted flame. */

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
 * Build authored prop geometry for placed torches.
 *
 * The block cell remains the source of truth for collision, edits, saves, and
 * streaming. Only the render representation changes: a centered wood shaft and
 * a faceted flame replace the old six-face cube stamp.
 *
 * @param {Array<{x:number,y:number,z:number}>} instances torch cells in world space
 * @param {number} shaftTile atlas tile for the wood shaft
 * @param {number} flameTile atlas tile for the flame
 * @param {[number,number,number]} color torch color from block props
 * @param {number} seed world seed for stable per-cell variation
 * @returns {{positions:number[],normals:number[],colors:number[],uvs:number[],tiles:number[],indices:number[],quadCount:number}}
 */
export function buildTorchGeometry(instances, shaftTile, flameTile, color = [1, 0.75, 0.25], seed = 0) {
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const tiles = [];
  const indices = [];
  const sides = 6;
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
  const triangle = (a, b, c, normal, uv, tint) => {
    const start = positions.length / 3;
    for (const point of [a, b, c]) vertex(point, normal, uv, tint);
    indices.push(start, start + 1, start + 2);
  };
  const ring = (cx, y, cz, radius, rot) => Array.from({ length: sides }, (_, i) => {
    const angle = (i / sides) * tau + rot;
    return [cx + Math.cos(angle) * radius, y, cz + Math.sin(angle) * radius];
  });

  for (const origin of instances) {
    const variation = hash(origin.x + origin.y * 3, origin.z - origin.y * 5, seed);
    const scale = 0.92 + variation * 0.08;
    const rot = hash(origin.x * 3 + 9, origin.z * 0.7 + 2, seed + 1) * tau;
    const cx = origin.x + 0.5;
    const cz = origin.z + 0.5;
    const shaftTint = [
      clamp01(0.42 + color[0] * 0.12),
      clamp01(0.24 + color[1] * 0.08),
      clamp01(0.10 + color[2] * 0.04),
    ];
    const flameTint = [
      clamp01(color[0] * (1.02 + variation * 0.08)),
      clamp01(color[1] * (1.04 + variation * 0.08)),
      clamp01(color[2] * (0.96 + variation * 0.06)),
    ];
    const shaftUv = [0.5, 0.30, shaftTile];
    const flameUv = [0.5, 0.65, flameTile];

    // A narrow hexagonal shaft stays centered in the host cell and reads as
    // timber even when viewed edge-on, without four repeated atlas faces.
    const shaftBottom = ring(cx, origin.y + 0.05 * scale, cz, 0.075 * scale, rot);
    const shaftTop = ring(cx, origin.y + 0.62 * scale, cz, 0.070 * scale, rot);
    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      const angle = ((i + 0.5) / sides) * tau + rot;
      quad(
        shaftBottom[i],
        shaftBottom[next],
        shaftTop[next],
        shaftTop[i],
        normalize(Math.cos(angle), 0.08, Math.sin(angle)),
        shaftUv,
        shaftTint,
      );
    }

    // Two tapered rings and a pointed crown give the flame a compact authored
    // silhouette while staying inside the torch's voxel footprint.
    const flameBase = ring(cx, origin.y + 0.58 * scale, cz, 0.135 * scale, rot);
    const flameShoulder = ring(cx, origin.y + 0.78 * scale, cz, 0.105 * scale, rot);
    const flameUpper = ring(cx, origin.y + 0.90 * scale, cz, 0.055 * scale, rot + 0.18);
    const tip = [cx, origin.y + 0.98 * scale, cz];
    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      const angle = ((i + 0.5) / sides) * tau + rot;
      quad(
        flameBase[i],
        flameBase[next],
        flameShoulder[next],
        flameShoulder[i],
        normalize(Math.cos(angle), 0.45, Math.sin(angle)),
        flameUv,
        flameTint,
      );
      quad(
        flameShoulder[i],
        flameShoulder[next],
        flameUpper[next],
        flameUpper[i],
        normalize(Math.cos(angle), 0.75, Math.sin(angle)),
        flameUv,
        flameTint,
      );
      triangle(flameUpper[i], flameUpper[next], tip, [0, 1, 0], flameUv, flameTint);
    }
  }

  return { positions, normals, colors, uvs, tiles, indices, quadCount: indices.length / 6 };
}
