/**
 * Farther terrain visibility policy: streaming rings, LOD, fog, and proxy meshes.
 * Pure helpers — no DOM / Three.js.
 */

/** @param {number} n @param {number} lo @param {number} hi */
export function clampInt(n, lo, hi) {
  const v = Number(n);
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

/**
 * Map effective render-distance slider (post-coop bias) to streaming + fog plan.
 * Full voxel meshes stay near the player; LOD then proxies extend the horizon.
 *
 * @param {number} renderDistance effective RD (2–16)
 * @param {{chunkSize?: number}} [opts]
 */
export function terrainVisibilityPlan(renderDistance, { chunkSize = 16 } = {}) {
  const rd = clampInt(renderDistance, 2, 16);
  const cs = Number.isFinite(chunkSize) && chunkSize > 0 ? chunkSize : 16;

  // Full detail tracks the slider but caps so meshing stays affordable.
  const fullChunks = Math.max(2, Math.min(12, rd));
  // LOD ring ~1.5× slider (cheaper stepped surface).
  const lodChunks = Math.max(fullChunks, Math.min(20, Math.round(rd * 1.5 + 1)));
  // Proxy ring ~2.25× — horizon shells without full voxel storage.
  const proxyChunks = Math.max(lodChunks, Math.min(28, Math.round(rd * 2.25 + 2)));

  const fullBlocks = fullChunks * cs;
  const proxyBlocks = proxyChunks * cs;

  // Soft haze: near beach stays crisp, far islands recede. Never collapse to soup.
  const fogNear = Math.max(28, Math.round(fullBlocks * 0.50));
  const fogFar = Math.max(fogNear + 52, Math.round(proxyBlocks * 0.84));
  const cameraFar = Math.max(fogFar + 48, proxyBlocks + 64);

  return {
    renderDistance: rd,
    chunkSize: cs,
    fullChunks,
    lodChunks,
    proxyChunks,
    streamRadius: proxyChunks,
    lodStep: 2,
    proxyStep: 4,
    fogNear,
    fogFar,
    cameraFar,
  };
}

/**
 * Chebyshev chunk distance → detail tier.
 * @param {number} chebyshevDist
 * @param {{fullChunks:number,lodChunks:number,proxyChunks:number}} plan
 * @returns {'full'|'lod'|'proxy'|'none'}
 */
export function chunkDetailTier(chebyshevDist, plan) {
  const d = Number(chebyshevDist);
  if (!Number.isFinite(d) || d < 0) return 'none';
  if (d <= plan.fullChunks) return 'full';
  if (d <= plan.lodChunks) return 'lod';
  if (d <= plan.proxyChunks) return 'proxy';
  return 'none';
}

/**
 * Day/night fog modulation on top of the visibility plan.
 * @param {{fogNear:number,fogFar:number}} plan
 * @param {number} sunIntensity 0..1
 */
export function fogForSun(plan, sunIntensity = 1) {
  const sunI = Number.isFinite(Number(sunIntensity))
    ? Math.max(0, Math.min(1, Number(sunIntensity)))
    : 1;
  const near = plan.fogNear;
  const far = plan.fogFar;
  // Slightly closer haze at night; clear midday still keeps far horizon.
  return {
    near: Math.max(20, near * (0.74 + sunI * 0.24)),
    far: Math.max(near + 36, far * (0.78 + sunI * 0.18)),
  };
}

/**
 * Build a stepped heightfield mesh for LOD/proxy terrain rings.
 * @param {object} opts
 * @param {number} opts.baseX world origin of chunk
 * @param {number} opts.baseZ
 * @param {number} [opts.size=16]
 * @param {number} [opts.step=2] sample stride in blocks
 * @param {number} [opts.seed=0]
 * @param {(x:number,z:number,seed:number)=>number} opts.heightFn
 * @param {(x:number,z:number,h:number)=>{r:number,g:number,b:number,a?:number,tile?:number}} opts.sampleFn
 */
export function buildTerrainProxyArrays({
  baseX,
  baseZ,
  size = 16,
  step = 2,
  seed = 0,
  heightFn,
  sampleFn,
} = {}) {
  const s = Math.max(1, size | 0);
  const st = Math.max(1, step | 0);
  const cols = Math.floor(s / st);
  if (!heightFn || !sampleFn || cols < 1) {
    return {
      positions: new Float32Array(0),
      normals: new Float32Array(0),
      colors: new Float32Array(0),
      uvs: new Float32Array(0),
      tiles: new Float32Array(0),
      indices: new Uint32Array(0),
      quadCount: 0,
      step: st,
    };
  }

  const grid = cols + 1;
  const heights = new Float32Array(grid * grid);
  const samples = new Array(grid * grid);

  for (let iz = 0; iz < grid; iz++) {
    for (let ix = 0; ix < grid; ix++) {
      const wx = baseX + Math.min(s, ix * st);
      const wz = baseZ + Math.min(s, iz * st);
      const h = heightFn(wx, wz, seed);
      const y = Number.isFinite(h) ? h : 0;
      const idx = iz * grid + ix;
      heights[idx] = y + 1; // surface top
      const sm = sampleFn(wx, wz, y) || {};
      samples[idx] = {
        r: Number.isFinite(sm.r) ? sm.r : 0.35,
        g: Number.isFinite(sm.g) ? sm.g : 0.55,
        b: Number.isFinite(sm.b) ? sm.b : 0.28,
        a: Number.isFinite(sm.a) ? sm.a : 1,
        tile: Number.isFinite(sm.tile) ? sm.tile : 0,
      };
    }
  }

  const cellQuads = cols * cols;
  const vertCount = cellQuads * 4;
  const positions = new Float32Array(vertCount * 3);
  const normals = new Float32Array(vertCount * 3);
  const colors = new Float32Array(vertCount * 4);
  const uvs = new Float32Array(vertCount * 2);
  const tiles = new Float32Array(vertCount);
  const indices = new Uint32Array(cellQuads * 6);

  let vi = 0;
  let ii = 0;
  for (let iz = 0; iz < cols; iz++) {
    for (let ix = 0; ix < cols; ix++) {
      const i00 = iz * grid + ix;
      const i10 = i00 + 1;
      const i01 = i00 + grid;
      const i11 = i01 + 1;

      const x0 = baseX + ix * st;
      const z0 = baseZ + iz * st;
      const x1 = baseX + Math.min(s, (ix + 1) * st);
      const z1 = baseZ + Math.min(s, (iz + 1) * st);

      const y00 = heights[i00];
      const y10 = heights[i10];
      const y01 = heights[i01];
      const y11 = heights[i11];

      // Flat normal from diagonal cross product (outward up-ish).
      const e1x = x1 - x0;
      const e1y = y10 - y00;
      const e1z = 0;
      const e2x = 0;
      const e2y = y01 - y00;
      const e2z = z1 - z0;
      let nx = e1y * e2z - e1z * e2y;
      let ny = e1z * e2x - e1x * e2z;
      let nz = e1x * e2y - e1y * e2x;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      const sm = samples[i00];
      const baseVert = vi;
      const corners = [
        [x0, y00, z0, 0, 0],
        [x1, y10, z0, 1, 0],
        [x1, y11, z1, 1, 1],
        [x0, y01, z1, 0, 1],
      ];
      for (const [px, py, pz, u, v] of corners) {
        const p = vi * 3;
        const c = vi * 4;
        const t = vi * 2;
        positions[p] = px;
        positions[p + 1] = py;
        positions[p + 2] = pz;
        normals[p] = nx;
        normals[p + 1] = ny;
        normals[p + 2] = nz;
        colors[c] = sm.r;
        colors[c + 1] = sm.g;
        colors[c + 2] = sm.b;
        colors[c + 3] = sm.a;
        uvs[t] = u;
        uvs[t + 1] = v;
        tiles[vi] = sm.tile;
        vi++;
      }
      indices[ii++] = baseVert;
      indices[ii++] = baseVert + 1;
      indices[ii++] = baseVert + 2;
      indices[ii++] = baseVert;
      indices[ii++] = baseVert + 2;
      indices[ii++] = baseVert + 3;
    }
  }

  return {
    positions,
    normals,
    colors,
    uvs,
    tiles,
    indices,
    quadCount: cellQuads,
    step: st,
  };
}
