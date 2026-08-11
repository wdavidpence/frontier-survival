/** Build a small, opaque low-poly mushroom instead of a full voxel cube. */

// Deterministic pseudo-random in [0,1) from integer-ish world coordinates —
// keeps per-instance variation stable across rebuilds without a shared RNG.
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
const clamp01 = v => Math.max(0, Math.min(1, v));

export function buildMushroomGeometry(instances, tile, color = [1, 1, 1]) {
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const tiles = [];
  const indices = [];

  const sides = 8;
  const tau = Math.PI * 2;

  const vertex = (x, y, z, nx, ny, nz, u, v, col) => {
    positions.push(x, y, z);
    normals.push(nx, ny, nz);
    colors.push(col[0], col[1], col[2], 1);
    uvs.push(u, v);
    tiles.push(tile);
  };
  const quad = (a, b, c, d, normal, col, uv = [[0, 0], [1, 0], [1, 1], [0, 1]]) => {
    const start = positions.length / 3;
    for (const [p, tex] of [[a, uv[0]], [b, uv[1]], [c, uv[2]], [d, uv[3]]]) {
      vertex(p[0], p[1], p[2], normal[0], normal[1], normal[2], tex[0], tex[1], col);
    }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  };
  // Sample a single clean pixel from each painted atlas region. Mapping the
  // whole mushroom tile onto every face repeats the cap highlights across
  // the stem and reads as noisy overdraw at game scale.
  const stemUv = [[0.5, 0.24], [0.5, 0.24], [0.5, 0.24], [0.5, 0.24]];
  const capUv = [[0.5, 0.75], [0.5, 0.75], [0.5, 0.75], [0.5, 0.75]];
  const triangle = (a, b, c, normal, col, uv = [[0, 0], [1, 0], [0.5, 1]]) => {
    const start = positions.length / 3;
    vertex(a[0], a[1], a[2], normal[0], normal[1], normal[2], uv[0][0], uv[0][1], col);
    vertex(b[0], b[1], b[2], normal[0], normal[1], normal[2], uv[1][0], uv[1][1], col);
    vertex(c[0], c[1], c[2], normal[0], normal[1], normal[2], uv[2][0], uv[2][1], col);
    indices.push(start, start + 1, start + 2);
  };

  const buildCap = (cx, cz, baseY, scale, rot, col) => {
    const ring = (y, radius) => Array.from({ length: sides }, (_, i) => {
      const angle = (i / sides) * tau + rot;
      return [cx + Math.cos(angle) * radius * scale, baseY + y * scale, cz + Math.sin(angle) * radius * scale];
    });
    const stemBottom = ring(0.02, 0.14);
    const stemTop = ring(0.58, 0.17);
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      const a = stemBottom[i]; const b = stemBottom[j]; const c = stemTop[j]; const d = stemTop[i];
      const angle = ((i + 0.5) / sides) * tau + rot;
      quad(a, b, c, d, [Math.cos(angle), 0.08, Math.sin(angle)], col, stemUv);
    }

    const underside = ring(0.55, 0.40);
    const rim = ring(0.70, 0.52);
    const crown = ring(0.91, 0.30);
    const center = [cx, baseY + 0.91 * scale, cz];
    const capCenter = [cx, baseY + 0.55 * scale, cz];
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      const angle = ((i + 0.5) / sides) * tau + rot;
      triangle(underside[j], underside[i], capCenter, [0, -1, 0], col, capUv);
      quad(underside[i], underside[j], rim[j], rim[i], [Math.cos(angle), 0.45, Math.sin(angle)], col, capUv);
      quad(rim[i], rim[j], crown[j], crown[i], [Math.cos(angle), 0.72, Math.sin(angle)], col, capUv);
      triangle(crown[i], crown[j], center, [0, 1, 0], col, capUv);
    }
  };

  for (const origin of instances) {
    const ox = origin.x;
    const oy = origin.y;
    const oz = origin.z;

    // Restrained per-instance variation so a cluster of mushrooms reads as
    // organic growth rather than stamped copies — kept subtle to preserve
    // silhouette clarity at gameplay scale.
    const rScale = hash(ox * 0.7 + 1, oz * 1.3 + 5);
    const rRot = hash(ox * 3.1 + 9, oz * 0.9 + 2);
    const rTint = hash(ox * 5.7 + 3, oz * 2.1 + 8);
    const rCompanion = hash(ox * 9.3 + 2, oz * 4.7 + 6);
    const rCompanionPos = hash(ox * 2.3 + 6, oz * 8.1 + 4);

    const scale = 0.88 + rScale * 0.28;
    const rot = Math.PI / 8 + rRot * tau;
    const brightness = 0.9 + rTint * 0.2;
    const warmth = (rScale - 0.5) * 0.1;
    const tint = [
      clamp01(color[0] * brightness + warmth),
      clamp01(color[1] * brightness),
      clamp01(color[2] * brightness - warmth),
    ];

    buildCap(ox + 0.5, oz + 0.5, oy, scale, rot, tint);

    // ~35% of mushrooms grow a small companion cap beside the main one for
    // a layered, less uniform silhouette. Kept small and close to center so
    // it stays inside the voxel footprint and never blocks traversal.
    if (rCompanion > 0.65) {
      const companionAngle = rCompanionPos * tau;
      const companionDist = 0.16 + rCompanionPos * 0.08;
      const cx = ox + 0.5 + Math.cos(companionAngle) * companionDist;
      const cz = oz + 0.5 + Math.sin(companionAngle) * companionDist;
      const companionScale = scale * (0.45 + rCompanionPos * 0.15);
      const companionBrightness = 0.85 + rCompanion * 0.25;
      const companionTint = [
        clamp01(color[0] * companionBrightness - warmth),
        clamp01(color[1] * companionBrightness),
        clamp01(color[2] * companionBrightness + warmth),
      ];
      buildCap(cx, cz, oy, companionScale, rot + Math.PI, companionTint);
    }
  }
  return { positions, normals, colors, uvs, tiles, indices, quadCount: indices.length / 6 };
}
