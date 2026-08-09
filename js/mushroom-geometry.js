/** Build a small, opaque low-poly mushroom instead of a full voxel cube. */
export function buildMushroomGeometry(instances, tile, color = [1, 1, 1]) {
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const tiles = [];
  const indices = [];

  const sides = 8;
  const tau = Math.PI * 2;

  const vertex = (x, y, z, nx, ny, nz, u, v) => {
    positions.push(x, y, z);
    normals.push(nx, ny, nz);
    colors.push(color[0], color[1], color[2], 1);
    uvs.push(u, v);
    tiles.push(tile);
  };
  const quad = (a, b, c, d, normal, uv = [[0, 0], [1, 0], [1, 1], [0, 1]]) => {
    const start = positions.length / 3;
    for (const [p, tex] of [[a, uv[0]], [b, uv[1]], [c, uv[2]], [d, uv[3]]]) {
      vertex(p[0], p[1], p[2], normal[0], normal[1], normal[2], tex[0], tex[1]);
    }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  };
  // Sample a single clean pixel from each painted atlas region. Mapping the
  // whole mushroom tile onto every face repeats the cap highlights across
  // the stem and reads as noisy overdraw at game scale.
  const stemUv = [[0.5, 0.24], [0.5, 0.24], [0.5, 0.24], [0.5, 0.24]];
  const capUv = [[0.5, 0.75], [0.5, 0.75], [0.5, 0.75], [0.5, 0.75]];
  const triangle = (a, b, c, normal, uv = [[0, 0], [1, 0], [0.5, 1]]) => {
    const start = positions.length / 3;
    vertex(a[0], a[1], a[2], normal[0], normal[1], normal[2], uv[0][0], uv[0][1]);
    vertex(b[0], b[1], b[2], normal[0], normal[1], normal[2], uv[1][0], uv[1][1]);
    vertex(c[0], c[1], c[2], normal[0], normal[1], normal[2], uv[2][0], uv[2][1]);
    indices.push(start, start + 1, start + 2);
  };

  for (const origin of instances) {
    const ox = origin.x;
    const oy = origin.y;
    const oz = origin.z;
    const ring = (y, radius) => Array.from({ length: sides }, (_, i) => {
      const angle = (i / sides) * tau + Math.PI / 8;
      return [ox + 0.5 + Math.cos(angle) * radius, oy + y, oz + 0.5 + Math.sin(angle) * radius];
    });
    const stemBottom = ring(0.02, 0.14);
    const stemTop = ring(0.58, 0.17);
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      const a = stemBottom[i]; const b = stemBottom[j]; const c = stemTop[j]; const d = stemTop[i];
      const angle = ((i + 0.5) / sides) * tau + Math.PI / 8;
      quad(a, b, c, d, [Math.cos(angle), 0.08, Math.sin(angle)], stemUv);
    }

    const underside = ring(0.55, 0.40);
    const rim = ring(0.70, 0.52);
    const crown = ring(0.91, 0.30);
    const center = [ox + 0.5, oy + 0.91, oz + 0.5];
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      const angle = ((i + 0.5) / sides) * tau + Math.PI / 8;
      triangle(underside[j], underside[i], [ox + 0.5, oy + 0.55, oz + 0.5], [0, -1, 0], capUv);
      quad(underside[i], underside[j], rim[j], rim[i], [Math.cos(angle), 0.45, Math.sin(angle)], capUv);
      quad(rim[i], rim[j], crown[j], crown[i], [Math.cos(angle), 0.72, Math.sin(angle)], capUv);
      triangle(crown[i], crown[j], center, [0, 1, 0], capUv);
    }
  }
  return { positions, normals, colors, uvs, tiles, indices, quadCount: indices.length / 6 };
}