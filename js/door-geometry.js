/**
 * Authored swinging door leaf.
 * Gameplay cells stay DOOR_CLOSED / DOOR_OPEN; this is presentation only.
 * Closed: a thin board in the doorway. Open: the same board hinged ~80°.
 */

export function pairDoorLeaves(cells, closedId, openId) {
  const isDoor = (id) => id === closedId || id === openId;
  const map = new Map();
  for (const cell of cells || []) {
    if (!isDoor(cell.id)) continue;
    map.set(`${cell.x | 0},${cell.y | 0},${cell.z | 0}`, cell);
  }
  const leaves = [];
  for (const cell of map.values()) {
    const below = map.get(`${cell.x | 0},${(cell.y | 0) - 1},${cell.z | 0}`);
    if (below) continue;
    const above = map.get(`${cell.x | 0},${(cell.y | 0) + 1},${cell.z | 0}`);
    leaves.push({
      x: cell.x | 0,
      y: cell.y | 0,
      z: cell.z | 0,
      open: cell.id === openId || !!(above && above.id === openId),
      height: above ? 2 : 1,
    });
  }
  return leaves;
}

function rotY(lx, lz, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return [lx * c - lz * s, lx * s + lz * c];
}

export function buildDoorGeometry(leaves, tile, color = [0.72, 0.52, 0.28]) {
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const tiles = [];
  const indices = [];
  const uv = [[0.18, 0.12], [0.82, 0.12], [0.82, 0.88], [0.18, 0.88]];

  const vertex = (p, n, col, tex) => {
    positions.push(p[0], p[1], p[2]);
    normals.push(n[0], n[1], n[2]);
    colors.push(col[0], col[1], col[2], 1);
    uvs.push(tex[0], tex[1]);
    tiles.push(tile);
  };
  const quad = (a, b, c, d, n, col, tex = uv) => {
    const start = positions.length / 3;
    vertex(a, n, col, tex[0]);
    vertex(b, n, col, tex[1]);
    vertex(c, n, col, tex[2]);
    vertex(d, n, col, tex[3]);
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  };

  const wood = [
    Math.min(1, color[0] * 1.14),
    Math.min(1, color[1] * 1.08),
    Math.min(1, color[2] * 0.92),
  ];
  const dark = [wood[0] * 0.70, wood[1] * 0.66, wood[2] * 0.58];
  const glass = [0.62, 0.78, 0.92];

  for (const leaf of leaves || []) {
    const height = leaf.height === 2 ? 2 : 1;
    const width = 0.86;
    const thick = 0.09;
    const hingeX = leaf.x + 0.07;
    const hingeZ = leaf.z + 1 - 0.05;
    const y0 = leaf.y + 0.02;
    const y1 = leaf.y + height - 0.04;
    const ang = leaf.open ? 1.3963 : 0;

    const corner = (lx, y, lz) => {
      const [rx, rz] = rotY(lx, lz, ang);
      return [hingeX + rx, y, hingeZ + rz];
    };
    const nrot = (nx, nz) => {
      const [rx, rz] = rotY(nx, nz, ang);
      const len = Math.hypot(rx, rz) || 1;
      return [rx / len, 0, rz / len];
    };

    const a = corner(0, y0, 0);
    const b = corner(width, y0, 0);
    const c = corner(width, y1, 0);
    const d = corner(0, y1, 0);
    const e = corner(0, y0, -thick);
    const f = corner(width, y0, -thick);
    const g = corner(width, y1, -thick);
    const h = corner(0, y1, -thick);

    quad(a, b, c, d, nrot(0, 1), wood);
    quad(f, e, h, g, nrot(0, -1), dark);
    quad(e, a, d, h, nrot(-1, 0), dark);
    quad(b, f, g, c, nrot(1, 0), wood);
    quad(d, c, g, h, [0, 1, 0], wood);
    quad(e, f, b, a, [0, -1, 0], dark);

    if (height === 2) {
      const ry0 = leaf.y + 0.94;
      const ry1 = leaf.y + 1.08;
      quad(
        corner(0.02, ry0, 0.012),
        corner(width - 0.02, ry0, 0.012),
        corner(width - 0.02, ry1, 0.012),
        corner(0.02, ry1, 0.012),
        nrot(0, 1),
        dark,
      );
      quad(
        corner(0.22, leaf.y + 1.22, 0.016),
        corner(0.64, leaf.y + 1.22, 0.016),
        corner(0.64, leaf.y + 1.78, 0.016),
        corner(0.22, leaf.y + 1.78, 0.016),
        nrot(0, 1),
        glass,
      );
    }

    const ky = leaf.y + (height === 2 ? 1.02 : 0.52);
    quad(
      corner(width - 0.12, ky - 0.05, 0.03),
      corner(width - 0.02, ky - 0.05, 0.03),
      corner(width - 0.02, ky + 0.05, 0.03),
      corner(width - 0.12, ky + 0.05, 0.03),
      nrot(0, 1),
      dark,
    );
  }

  return {
    positions,
    normals,
    colors,
    uvs,
    tiles,
    indices,
    quadCount: indices.length / 6,
  };
}
