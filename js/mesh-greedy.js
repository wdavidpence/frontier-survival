/**
 * Greedy meshing for voxel chunks (rectangle merge of same-type faces).
 * Pure logic — no Three.js.
 */

function faceVisible(id, nid, waterId, isTransparent, isSolid) {
  if (id === 0 || id == null) return false;
  if (!isTransparent(nid)) return false;
  if (id === nid && isTransparent(id)) return false;
  return true;
}

function packKey(tile, r, g, b, a) {
  return `${tile}|${(r * 1000) | 0}|${(g * 1000) | 0}|${(b * 1000) | 0}|${(a * 100) | 0}`;
}

/**
 * @param {object} opts
 * @returns {Array<object>} quads
 */
export function greedyMeshChunk(opts) {
  const {
    getBlock,
    tileFor,
    colorFor,
    isTransparent,
    isSolid,
    baseX,
    baseY = 0,
    baseZ,
    sizeX,
    sizeY,
    sizeZ,
    waterId = 5,
    glassId = 29,
    iceId = 12,
    amethystId = 56,
    skipBlock = null,
  } = opts;

  const quads = [];
  const sizes = [sizeX, sizeY, sizeZ];

  const dirs = [
    { axis: 0, sign: 1, name: 'east', shade: 0.7, du: 2, dv: 1 },
    { axis: 0, sign: -1, name: 'west', shade: 0.85, du: 2, dv: 1 },
    { axis: 1, sign: 1, name: 'top', shade: 1.0, du: 0, dv: 2 },
    { axis: 1, sign: -1, name: 'bottom', shade: 0.55, du: 0, dv: 2 },
    { axis: 2, sign: 1, name: 'south', shade: 0.8, du: 0, dv: 1 },
    { axis: 2, sign: -1, name: 'north', shade: 0.75, du: 0, dv: 1 },
  ];

  for (const dir of dirs) {
    const { axis, sign, name, shade, du, dv } = dir;
    const uSize = sizes[du];
    const vSize = sizes[dv];
    const dSize = sizes[axis];

    for (let d = 0; d < dSize; d++) {
      const mask = new Array(uSize * vSize).fill(null);

      for (let vv = 0; vv < vSize; vv++) {
        for (let uu = 0; uu < uSize; uu++) {
          const pos = [0, 0, 0];
          pos[du] = uu;
          pos[dv] = vv;
          pos[axis] = d;

          const wx = baseX + pos[0];
          const wy = baseY + pos[1];
          const wz = baseZ + pos[2];

          const id = getBlock(wx, wy, wz);
          if (skipBlock?.(id)) continue;
          const nx = wx + (axis === 0 ? sign : 0);
          const ny = wy + (axis === 1 ? sign : 0);
          const nz = wz + (axis === 2 ? sign : 0);
          const nid = getBlock(nx, ny, nz);

          if (!faceVisible(id, nid, waterId, isTransparent, isSolid)) continue;

          const tile = tileFor(id, name);
          const col = colorFor(id, name);

          const isWater = id === waterId || id === 5;
          const isGlass = id === glassId || id === 29;
          const isIce = id === iceId || id === 12;
          const isAmethyst = id === amethystId || id === 56;

          let shadeFactor = shade;
          let a = 1.0;
          if (isWater) {
            a = 0.65;
          } else if (isGlass) {
            a = 0.48;
          } else if (isIce) {
            a = 0.72;
          } else if (isAmethyst) {
            a = 0.68;
            shadeFactor = Math.max(0.72, shade);
          }

          let r = Math.min(1, col[0] * shadeFactor * 1.15);
          let g = Math.min(1, col[1] * shadeFactor * 1.15);
          let b = Math.min(1, col[2] * shadeFactor * 1.15);

          if (isAmethyst && col[0] < 0.1 && col[1] < 0.1 && col[2] < 0.1) {
            r = Math.min(1, 0.72 * shadeFactor * 1.15);
            g = Math.min(1, 0.42 * shadeFactor * 1.15);
            b = Math.min(1, 0.88 * shadeFactor * 1.15);
          }

          mask[uu + vv * uSize] = { tile, r, g, b, a, id, bx: wx, by: wy, bz: wz };
        }
      }

      for (let vv = 0; vv < vSize; vv++) {
        for (let uu = 0; uu < uSize; ) {
          const cell = mask[uu + vv * uSize];
          if (!cell) {
            uu++;
            continue;
          }
          const key = packKey(cell.tile, cell.r, cell.g, cell.b, cell.a);

          let w = 1;
          while (uu + w < uSize) {
            const c2 = mask[uu + w + vv * uSize];
            if (!c2 || packKey(c2.tile, c2.r, c2.g, c2.b, c2.a) !== key) break;
            w++;
          }

          let h = 1;
          outer: while (vv + h < vSize) {
            for (let k = 0; k < w; k++) {
              const c2 = mask[uu + k + (vv + h) * uSize];
              if (!c2 || packKey(c2.tile, c2.r, c2.g, c2.b, c2.a) !== key) break outer;
            }
            h++;
          }

          for (let j = 0; j < h; j++) {
            for (let i = 0; i < w; i++) {
              mask[uu + i + (vv + j) * uSize] = null;
            }
          }

          quads.push({
            axis,
            sign,
            faceDir: name,
            du,
            dv,
            bx: cell.bx,
            by: cell.by,
            bz: cell.bz,
            // Note: cell is first cell; for merged quads bx,by,bz should be min corner
            // Fix: recompute min from uu,vv,d
            w,
            h,
            tile: cell.tile,
            r: cell.r,
            g: cell.g,
            b: cell.b,
            a: cell.a,
            uu,
            vv,
            d,
          });

          uu += w;
        }
      }
    }
  }

  // Fix origins for merged quads using uu,vv,d
  for (const q of quads) {
    const pos = [0, 0, 0];
    pos[q.du] = q.uu;
    pos[q.dv] = q.vv;
    pos[q.axis] = q.d;
    q.bx = baseX + pos[0];
    q.by = baseY + pos[1];
    q.bz = baseZ + pos[2];
  }

  return quads;
}

/**
 * Expand quads to typed arrays. UV = (u,v) in tile units (0..w, 0..h).
 */
export function quadsToArrays(quads) {
  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const tiles = [];
  const indices = [];
  let base = 0;

  const opaque = [];
  const translucent = [];
  for (const q of quads) {
    if (q.a < 0.99) {
      translucent.push(q);
    } else {
      opaque.push(q);
    }
  }
  const orderedQuads = opaque.concat(translucent);

  for (const q of orderedQuads) {
    const n = [0, 0, 0];
    n[q.axis] = q.sign;

    const stepU = [0, 0, 0];
    const stepV = [0, 0, 0];
    stepU[q.du] = 1;
    stepV[q.dv] = 1;

    const origin = [q.bx, q.by, q.bz];
    if (q.sign > 0) origin[q.axis] += 1;

    // Winding so front faces outward (CCW when looking against normal is wrong for WebGL default front=CCW from camera)
    // Use: for +normal, wind so cross product matches normal
    const wind =
      q.sign > 0
        ? [
            [0, 0],
            [0, q.h],
            [q.w, q.h],
            [q.w, 0],
          ]
        : [
            [0, 0],
            [q.w, 0],
            [q.w, q.h],
            [0, q.h],
          ];

    for (const [uu, vv] of wind) {
      positions.push(
        origin[0] + stepU[0] * uu + stepV[0] * vv,
        origin[1] + stepU[1] * uu + stepV[1] * vv,
        origin[2] + stepU[2] * uu + stepV[2] * vv,
      );
      normals.push(n[0], n[1], n[2]);
      colors.push(q.r, q.g, q.b, q.a);
      uvs.push(uu, vv);
      tiles.push(q.tile);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    base += 4;
  }

  return { positions, normals, colors, uvs, tiles, indices, quadCount: quads.length };
}

export function countNaiveFaces(opts) {
  const {
    getBlock,
    isTransparent,
    isSolid,
    baseX,
    baseY = 0,
    baseZ,
    sizeX,
    sizeY,
    sizeZ,
    waterId = 5,
  } = opts;
  let count = 0;
  const dirs = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  for (let z = 0; z < sizeZ; z++) {
    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        const id = getBlock(baseX + x, baseY + y, baseZ + z);
        if (!id) continue;
        for (const [dx, dy, dz] of dirs) {
          const nid = getBlock(baseX + x + dx, baseY + y + dy, baseZ + z + dz);
          if (faceVisible(id, nid, waterId, isTransparent, isSolid)) count++;
        }
      }
    }
  }
  return count;
}
