/**
 * Procedural block texture atlas (canvas) — browser only.
 */
import * as THREE from 'three';
import {
  TILE,
  TILE_PX,
  ATLAS_N,
  ATLAS_PX,
  tileUVs,
  tileForBlock,
  crackTileForProgress,
  atlasTileCount,
} from './atlas-core.js?v=287';
import { WATER_WAVE } from './water-material.js?v=1';

export {
  TILE,
  TILE_PX,
  ATLAS_N,
  ATLAS_PX,
  tileUVs,
  tileForBlock,
  crackTileForProgress,
  atlasTileCount,
} from './atlas-core.js?v=287';

function rnd(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function clamp(v) {
  return Math.max(0, Math.min(255, v | 0));
}

/**
 * Procedural noise generator using 2x2 pixel clusters to create authentic
 * Minecraft-inspired pixel art material textures on a 32x32 tile canvas.
 */
function fillNoise(ctx, x0, y0, base, variance, seed, alpha = 255, clusterSize = 2) {
  const r = rnd(seed);
  const img = ctx.getImageData(x0, y0, TILE_PX, TILE_PX);
  const d = img.data;
  const gridW = Math.ceil(TILE_PX / clusterSize);
  const gridH = Math.ceil(TILE_PX / clusterSize);
  const noiseMap = new Float32Array(gridW * gridH);
  for (let i = 0; i < noiseMap.length; i++) {
    noiseMap[i] = (r() - 0.5) * variance;
  }
  for (let j = 0; j < TILE_PX; j++) {
    const cj = (j / clusterSize) | 0;
    for (let i = 0; i < TILE_PX; i++) {
      const ci = (i / clusterSize) | 0;
      const n = noiseMap[cj * gridW + ci];
      const idx = (j * TILE_PX + i) * 4;
      d[idx]     = clamp(base[0] + n * 40);
      d[idx + 1] = clamp(base[1] + n * 40);
      d[idx + 2] = clamp(base[2] + n * 40);
      d[idx + 3] = alpha;
    }
  }
  ctx.putImageData(img, x0, y0);
}

// 4x4 Bayer ordered-dither matrix — deterministic pixel-level value variation
// (no RNG), used as a restrained "microtexture" pass layered atop existing
// material fills to add grain/depth without altering base readability.
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function applyMicroTexture(ctx, x0, y0, strength, phase = 0) {
  const img = ctx.getImageData(x0, y0, TILE_PX, TILE_PX);
  const d = img.data;
  for (let j = 0; j < TILE_PX; j++) {
    const row = BAYER4[(j + phase) % 4];
    for (let i = 0; i < TILE_PX; i++) {
      const delta = (row[(i + phase) % 4] / 15 - 0.5) * strength;
      const idx = (j * TILE_PX + i) * 4;
      d[idx]     = clamp(d[idx] + delta);
      d[idx + 1] = clamp(d[idx + 1] + delta);
      d[idx + 2] = clamp(d[idx + 2] + delta);
    }
  }
  ctx.putImageData(img, x0, y0);
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function fade(t) {
  return t * t * (3 - 2 * t);
}

/**
 * Tileable 2-D value noise on a `cells` x `cells` lattice. Lattice lookups wrap,
 * so the field is seamless across the tile border and neighbouring copies of the
 * same tile meet without a visible edge.
 */
function tileValueNoise(seed, cells) {
  const r = rnd(seed);
  const lat = new Float32Array(cells * cells);
  for (let i = 0; i < lat.length; i++) lat[i] = r();
  return (u, v) => {
    const x = u * cells;
    const y = v * cells;
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = fade(x - xi);
    const fy = fade(y - yi);
    const xa = ((xi % cells) + cells) % cells;
    const ya = ((yi % cells) + cells) % cells;
    const xb = (xa + 1) % cells;
    const yb = (ya + 1) % cells;
    const top = lat[ya * cells + xa] + (lat[ya * cells + xb] - lat[ya * cells + xa]) * fx;
    const bot = lat[yb * cells + xa] + (lat[yb * cells + xb] - lat[yb * cells + xa]) * fx;
    return top + (bot - top) * fy;
  };
}

/**
 * Octave stack of tileable value noise. Low octaves give the broad patchiness
 * that reads as one material at distance; high octaves give the close-up grain.
 * `sx` / `sy` are integer frequency multipliers (integers keep the field
 * tileable) used to stretch a material along one axis, e.g. water wave bands.
 */
function makeFbm(seed, cells, octaves = 3, sx = 1, sy = 1) {
  const layers = [];
  let amp = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    layers.push({ n: tileValueNoise(seed + o * 131, cells * (1 << o)), amp });
    norm += amp;
    amp *= 0.5;
  }
  return (u, v) => {
    let t = 0;
    for (const l of layers) t += l.n(u * sx, v * sy) * l.amp;
    return t / norm;
  };
}

function mixChannel(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Paint a tile by ramping a tileable fbm field through a three-stop palette
 * (shadow -> base -> light). Ramping between real palette colours instead of
 * pushing one base colour toward black/white keeps hue coherent: shadows stay
 * saturated, highlights stay in-material rather than washing out.
 * Values are quantised to `cluster` pixel blocks so the result still reads as
 * hand-placed pixel art. Returns the field so detail passes can clump onto it.
 */
function fillMaterial(ctx, x0, y0, palette, opts = {}) {
  const {
    seed = 1,
    cells = 4,
    octaves = 3,
    contrast = 1,
    sx = 1,
    sy = 1,
    cluster = 2,
    alpha = 255,
  } = opts;
  const field = makeFbm(seed, cells, octaves, sx, sy);
  const { shadow, base, light } = palette;
  const img = ctx.getImageData(x0, y0, TILE_PX, TILE_PX);
  const d = img.data;
  const grid = Math.ceil(TILE_PX / cluster);
  for (let cj = 0; cj < grid; cj++) {
    const v = (cj + 0.5) / grid;
    for (let ci = 0; ci < grid; ci++) {
      const u = (ci + 0.5) / grid;
      const t = clamp01(0.5 + (field(u, v) - 0.5) * contrast);
      let cr;
      let cg;
      let cb;
      if (t < 0.5) {
        const k = t * 2;
        cr = mixChannel(shadow[0], base[0], k);
        cg = mixChannel(shadow[1], base[1], k);
        cb = mixChannel(shadow[2], base[2], k);
      } else {
        const k = (t - 0.5) * 2;
        cr = mixChannel(base[0], light[0], k);
        cg = mixChannel(base[1], light[1], k);
        cb = mixChannel(base[2], light[2], k);
      }
      for (let j = cj * cluster; j < Math.min((cj + 1) * cluster, TILE_PX); j++) {
        for (let i = ci * cluster; i < Math.min((ci + 1) * cluster, TILE_PX); i++) {
          const idx = (j * TILE_PX + i) * 4;
          d[idx]     = clamp(cr);
          d[idx + 1] = clamp(cg);
          d[idx + 2] = clamp(cb);
          d[idx + 3] = alpha;
        }
      }
    }
  }
  ctx.putImageData(img, x0, y0);
  return field;
}

/**
 * Draw a fleck that wraps at the tile border instead of being clamped inside it.
 * Clamping piled every edge fleck onto the last row/column, which showed up as a
 * faint detail band repeating on every block boundary; wrapping matches the
 * base field, which is already seamless. Never writes outside the tile.
 */
function fillRectWrapped(ctx, x0, y0, px, py, w, h) {
  const wx = ((px % TILE_PX) + TILE_PX) % TILE_PX;
  const wy = ((py % TILE_PX) + TILE_PX) % TILE_PX;
  const w1 = Math.min(w, TILE_PX - wx);
  const h1 = Math.min(h, TILE_PX - wy);
  ctx.fillRect(x0 + wx, y0 + wy, w1, h1);
  if (w1 < w) ctx.fillRect(x0, y0 + wy, w - w1, h1);
  if (h1 < h) ctx.fillRect(x0 + wx, y0, w1, h - h1);
  if (w1 < w && h1 < h) ctx.fillRect(x0, y0, w - w1, h - h1);
}

/**
 * Scatter pixel-art flecks biased toward one lobe of a material field, so detail
 * clumps with the underlying variation (leaf gaps in the dark hollows, sun
 * glints on the raised patches) instead of reading as random confetti.
 * `want` = 1 keeps samples above `threshold`, -1 keeps samples below it.
 */
function scatterFlecks(ctx, x0, y0, opts) {
  const {
    seed, count, color, field, want = 1, threshold = 0.5,
    w = 2, h = 2, cluster = 2,
  } = opts;
  const r = rnd(seed);
  const grid = Math.ceil(TILE_PX / cluster);
  ctx.fillStyle = color;
  let placed = 0;
  for (let tries = 0; tries < count * 14 && placed < count; tries++) {
    const ci = (r() * grid) | 0;
    const cj = (r() * grid) | 0;
    const n = field((ci + 0.5) / grid, (cj + 0.5) / grid);
    if (want > 0 ? n < threshold : n > threshold) continue;
    fillRectWrapped(ctx, x0, y0, ci * cluster, cj * cluster, w, h);
    placed++;
  }
}

// Coherent natural palettes for the high-visibility terrain surfaces. Each is a
// shadow / base / light triple picked to hold its hue under the ACES tonemap:
// shadows stay saturated rather than going grey, highlights stop short of white.
const PAL_GRASS = { shadow: [70, 96, 52], base: [94, 128, 64], light: [116, 150, 78] };
const PAL_DIRT = { shadow: [74, 52, 34], base: [106, 78, 54], light: [138, 104, 76] };
// Cool slate with a restrained warm lift: cliff faces keep their wetland weight
// but retain enough separation from black shadow when the Rootwalk bank is close.
const PAL_STONE = { shadow: [98, 96, 96], base: [132, 130, 132], light: [174, 166, 154] };
const PAL_SAND = { shadow: [186, 160, 110], base: [214, 186, 128], light: [238, 212, 152] };
// Muted tropical teal keeps the water readable beside warm sand and foliage;
// the darker trough also gives the atlas material a natural depth cue.
const PAL_WATER = { shadow: [20, 67, 86], base: [39, 113, 137], light: [88, 163, 169] };
const PAL_LEAVES = { shadow: [42, 70, 38], base: [60, 104, 46], light: [82, 132, 58] };
const PAL_PALM = { shadow: [48, 86, 44], base: [70, 122, 56], light: [96, 146, 70] };
const PAL_SPRUCE = { shadow: [30, 60, 46], base: [46, 88, 66], light: [70, 116, 88] };
const PAL_SEQUOIA = { shadow: [32, 64, 38], base: [46, 92, 52], light: [68, 122, 66] };

function tileOrigin(index) {
  const tx = index % ATLAS_N;
  const ty = (index / ATLAS_N) | 0;
  return { x: tx * TILE_PX, y: ty * TILE_PX };
}

function drawGrassTop(ctx, x0, y0) {
  // Turf read as broad tileable patches ramped shadow -> sunlit green, then
  // blade detail clumped onto those patches so clumps survive at distance.
  const field = fillMaterial(ctx, x0, y0, PAL_GRASS, {
    seed: 11, cells: 4, octaves: 3, contrast: 0.9,
  });
  // Shaded hollows between tufts
  scatterFlecks(ctx, x0, y0, {
    seed: 99, count: 20, color: 'rgba(52, 92, 40, 0.30)',
    field, want: -1, threshold: 0.46, w: 2, h: 2,
  });
  // Sunlit blade tips, biased onto the raised patches (2x4 reads as a blade)
  scatterFlecks(ctx, x0, y0, {
    seed: 100, count: 16, color: 'rgba(115, 155, 75, 0.25)',
    field, want: 1, threshold: 0.55, w: 2, h: 4,
  });
  applyMicroTexture(ctx, x0, y0, 3);
}

function drawDirtBase(ctx, x0, y0) {
  // Warm loam ramped through its own palette so shadows stay brown instead of
  // greying out — keeps dirt clearly separated from stone and leaves.
  const field = fillMaterial(ctx, x0, y0, PAL_DIRT, {
    seed: 22, cells: 4, octaves: 3, contrast: 1.2,
  });
  // Damp soil clods in the hollows
  scatterFlecks(ctx, x0, y0, {
    seed: 3, count: 16, color: 'rgba(74, 48, 28, 0.34)',
    field, want: -1, threshold: 0.44, w: 4, h: 2,
  });
  // Dry grit and small pebbles on the raised ground
  scatterFlecks(ctx, x0, y0, {
    seed: 4, count: 12, color: 'rgba(186, 143, 100, 0.30)',
    field, want: 1, threshold: 0.58, w: 2, h: 2,
  });
  return field;
}

function drawDirt(ctx, x0, y0) {
  drawDirtBase(ctx, x0, y0);
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawGrassSide(ctx, x0, y0) {
  drawDirtBase(ctx, x0, y0);
  // Cap drawn per 2px column from a tileable field: the overhang depth and the
  // colour both vary, so the side shares the top tile's palette instead of
  // reading as one flat green bar, and the drape wraps seamlessly block to block.
  const capField = makeFbm(311, 4, 2);
  const { shadow, base, light } = PAL_GRASS;
  for (let cx = 0; cx < TILE_PX; cx += 2) {
    const n = capField((cx + 1) / TILE_PX, 0.5);
    const depth = 8 + Math.round(n * 3) * 2;
    const k = clamp01(0.35 + n * 0.8);
    const cr = mixChannel(shadow[0], light[0], k);
    const cg = mixChannel(shadow[1], light[1], k);
    const cb = mixChannel(shadow[2], light[2], k);
    ctx.fillStyle = `rgb(${clamp(cr)}, ${clamp(cg)}, ${clamp(cb)})`;
    ctx.fillRect(x0 + cx, y0, 2, depth);
    // Darker tip where each drape meets the soil, so the seam reads as blades
    ctx.fillStyle = `rgba(${clamp(shadow[0] * 0.85)}, ${clamp(shadow[1] * 0.85)}, ${clamp(shadow[2] * 0.85)}, 0.5)`;
    ctx.fillRect(x0 + cx, y0 + depth - 2, 2, 2);
  }
  // Sunlit rim along the very top edge of the block
  ctx.fillStyle = `rgba(${light[0]}, ${light[1]}, ${light[2]}, 0.35)`;
  ctx.fillRect(x0, y0, TILE_PX, 2);
  ctx.fillStyle = `rgba(${base[0]}, ${base[1]}, ${base[2]}, 0.25)`;
  ctx.fillRect(x0, y0 + 2, TILE_PX, 2);
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawStone(ctx, x0, y0) {
  // Slate ramped through a slightly cool shadow / warm highlight pair, with the
  // field stretched horizontally so the grain reads as bedding planes.
  const field = fillMaterial(ctx, x0, y0, PAL_STONE, {
    seed: 44, cells: 4, octaves: 3, contrast: 1.1, sy: 2,
  });
  // Strata fissures sunk into the dark bands
  scatterFlecks(ctx, x0, y0, {
    seed: 8, count: 14, color: 'rgba(70, 71, 82, 0.38)',
    field, want: -1, threshold: 0.44, w: 6, h: 2,
  });
  // Quartz glints on the proud faces
  scatterFlecks(ctx, x0, y0, {
    seed: 9, count: 10, color: 'rgba(224, 211, 188, 0.42)',
    field, want: 1, threshold: 0.6, w: 2, h: 2,
  });
  applyMicroTexture(ctx, x0, y0, 4, 1);
}

function drawSand(ctx, x0, y0) {
  // Warm golden beach sand. Low contrast keeps it from banding, but the ramp
  // holds saturation at both ends so it never flattens to washed-out cream.
  const field = fillMaterial(ctx, x0, y0, PAL_SAND, {
    seed: 55, cells: 4, octaves: 3, contrast: 0.85,
  });
  // Ripple shadows follow a separate horizontally stretched field, replacing the
  // three fixed bars that used to line up into a visible grid across a beach.
  const ripple = makeFbm(57, 3, 2, 1, 3);
  scatterFlecks(ctx, x0, y0, {
    seed: 56, count: 12, color: 'rgba(196, 160, 108, 0.30)',
    field: ripple, want: -1, threshold: 0.42, w: 6, h: 2,
  });
  // Sun-caught grains on the crests of the same ripples
  scatterFlecks(ctx, x0, y0, {
    seed: 58, count: 14, color: 'rgba(245, 226, 172, 0.30)',
    field: ripple, want: 1, threshold: 0.6, w: 2, h: 2,
  });
  // Scattered darker shell grit for close-up interest
  scatterFlecks(ctx, x0, y0, {
    seed: 59, count: 6, color: 'rgba(180, 142, 92, 0.28)',
    field, want: -1, threshold: 0.4, w: 2, h: 2,
  });
  applyMicroTexture(ctx, x0, y0, 2, 2);
}

function drawWaterWavelets(ctx, x0, y0) {
  // Short stepped wavelets give the water a shared direction without turning
  // the tile into a set of evenly spaced stripes. Every segment wraps so the
  // atlas remains seamless when neighbouring water blocks meet.
  const r = rnd(716);
  const bands = [
    { color: 'rgba(10, 55, 74, 0.24)', count: 2, w: 4, h: 1, step: 2 },
    { color: 'rgba(105, 178, 174, 0.18)', count: 2, w: 3, h: 1, step: 2 },
    { color: 'rgba(218, 241, 233, 0.32)', count: 1, w: 2, h: 1, step: 1 },
  ];
  bands.forEach((band, layer) => {
    ctx.fillStyle = band.color;
    for (let i = 0; i < band.count; i++) {
      const startX = (r() * TILE_PX) | 0;
      const startY = (r() * TILE_PX) | 0;
      const segments = 3 + ((r() * 3) | 0);
      const slope = layer === 0 ? 1 : (r() > 0.35 ? 1 : -1);
      for (let segment = 0; segment < segments; segment++) {
        const x = startX + segment * (band.w - 1);
        const y = startY + slope * Math.floor(segment / band.step);
        fillRectWrapped(ctx, x0, y0, x, y, band.w, band.h);
      }
    }
  });
}

function drawWater(ctx, x0, y0) {
  // Tropical teal ramped through deep / mid / lit stops, with a broad field that
  // avoids a tiled grid at the coast. Opaque alpha = 255 (no holes in the pass).
  const field = fillMaterial(ctx, x0, y0, PAL_WATER, {
    seed: 66, cells: 4, octaves: 3, contrast: 0.92, sy: 2,
  });
  // Deep troughs between rolls
  scatterFlecks(ctx, x0, y0, {
    seed: 67, count: 12, color: 'rgba(12, 61, 78, 0.36)',
    field, want: -1, threshold: 0.4, w: 6, h: 2,
  });
  // Lit wave shoulders
  scatterFlecks(ctx, x0, y0, {
    seed: 68, count: 10, color: 'rgba(96, 174, 173, 0.30)',
    field, want: 1, threshold: 0.58, w: 4, h: 2,
  });
  // Broad layer of sea foam on the crests
  scatterFlecks(ctx, x0, y0, {
    seed: 69, count: 6, color: 'rgba(198, 229, 221, 0.34)',
    field, want: 1, threshold: 0.72, w: 6, h: 2,
  });
  // Bright layer of fine foam on the highest peaks
  scatterFlecks(ctx, x0, y0, {
    seed: 70, count: 3, color: 'rgba(230, 247, 238, 0.44)',
    field, want: 1, threshold: 0.80, w: 2, h: 2,
  });
  // A sparse directional pass sits above the broad field: stepped shoulders,
  // troughs and a few foam tips make wave flow legible at the ocean view.
  drawWaterWavelets(ctx, x0, y0);
  applyMicroTexture(ctx, x0, y0, 3, 3);
}

function drawLogSide(ctx, x0, y0) {
  const field = fillMaterial(ctx, x0, y0, {
    shadow: [76, 50, 32], base: [110, 74, 46], light: [138, 96, 62]
  }, {
    seed: 77, cells: 4, octaves: 3, contrast: 1.2, sy: 6,
  });
  scatterFlecks(ctx, x0, y0, {
    seed: 78, count: 18, color: 'rgba(52, 34, 20, 0.4)',
    field, want: -1, threshold: 0.42, w: 2, h: 6,
  });
  scatterFlecks(ctx, x0, y0, {
    seed: 79, count: 12, color: 'rgba(154, 108, 70, 0.35)',
    field, want: 1, threshold: 0.6, w: 2, h: 4,
  });
  applyMicroTexture(ctx, x0, y0, 4, 2);
}

function drawMangroveLogSide(ctx, x0, y0) {
  const field = fillMaterial(ctx, x0, y0, {
    shadow: [52, 28, 22], base: [104, 52, 34], light: [154, 82, 48],
  }, {
    seed: 778, cells: 4, octaves: 3, contrast: 1.25, sy: 7,
  });
  scatterFlecks(ctx, x0, y0, {
    seed: 779, count: 16, color: 'rgba(34, 22, 18, 0.46)',
    field, want: -1, threshold: 0.44, w: 2, h: 8,
  });
  scatterFlecks(ctx, x0, y0, {
    seed: 780, count: 12, color: 'rgba(172, 108, 64, 0.28)',
    field, want: 1, threshold: 0.62, w: 2, h: 4,
  });
  applyMicroTexture(ctx, x0, y0, 4, 1);
}

function drawLogTop(ctx, x0, y0) {
  const field = fillMaterial(ctx, x0, y0, {
    shadow: [142, 108, 70], base: [176, 136, 88], light: [204, 160, 106]
  }, {
    seed: 88, cells: 2, octaves: 2, contrast: 0.8,
  });
  ctx.strokeStyle = '#5a3c23';
  ctx.lineWidth = 2;
  ctx.strokeRect(x0 + 1, y0 + 1, TILE_PX - 2, TILE_PX - 2);
  ctx.strokeStyle = 'rgba(120, 85, 50, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 16, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 16, 5, 0, Math.PI * 2);
  ctx.stroke();
  applyMicroTexture(ctx, x0, y0, 4);
}

/**
 * Shared foliage build: clumped canopy field, shadowed gaps between leaf
 * clusters and lit leaf edges on top of them. Alpha stays 255 throughout, so
 * leaves never punch holes in the opaque pass under `alphaTest 0.35`.
 */
function drawFoliage(ctx, x0, y0, palette, seed, opts = {}) {
  const { gapAlpha = 0.32, litAlpha = 0.28, contrast = 1.1, phase = 0 } = opts;
  const { shadow, light } = palette;
  const field = fillMaterial(ctx, x0, y0, palette, {
    seed, cells: 4, octaves: 3, contrast,
  });
  // Depth between leaf clusters — dark, but never black, so the canopy keeps a
  // readable silhouette instead of turning into a muddy forest mass.
  scatterFlecks(ctx, x0, y0, {
    seed: seed + 1, count: 20,
    color: `rgba(${clamp(shadow[0] - 6)}, ${clamp(shadow[1] - 9)}, ${clamp(shadow[2] - 4)}, ${gapAlpha})`,
    field, want: -1, threshold: 0.44, w: 4, h: 4,
  });
  // Lit leaf edges catching the sun on the clumps that face up
  scatterFlecks(ctx, x0, y0, {
    seed: seed + 2, count: 18,
    color: `rgba(${clamp(light[0] + 6)}, ${clamp(light[1] + 8)}, ${clamp(light[2] + 4)}, ${litAlpha})`,
    field, want: 1, threshold: 0.58, w: 2, h: 2,
  });
  // Fine sub-leaf ticks to break up the 4px clumps at close range
  scatterFlecks(ctx, x0, y0, {
    seed: seed + 3, count: 10,
    color: `rgba(${shadow[0]}, ${shadow[1]}, ${shadow[2]}, 0.26)`,
    field, want: 1, threshold: 0.52, w: 2, h: 2,
  });
  applyMicroTexture(ctx, x0, y0, 4, phase);
  return field;
}

function drawLeaves(ctx, x0, y0) {
  drawFoliage(ctx, x0, y0, PAL_LEAVES, 101, { phase: 1 });
}

function drawMangroveLeaves(ctx, x0, y0) {
  drawFoliage(ctx, x0, y0, {
    shadow: [26, 84, 44], base: [52, 132, 66], light: [92, 178, 88],
  }, 881, { phase: 3, contrast: 1.25, litAlpha: 0.34 });
}

function drawPlanks(ctx, x0, y0) {
  // Sun-warmed boards with a restrained tidal stain: the lower edge reads wet
  // beside the Rootwalk water without turning ordinary wood into black bands.
  fillNoise(ctx, x0, y0, [201, 155, 93], 0.14, 15, 255, 2);
  ctx.fillStyle = 'rgba(110, 75, 35, 0.6)';
  for (let y = 0; y < TILE_PX; y += 8) {
    ctx.fillRect(x0, y0 + y, TILE_PX, 2);
  }
  ctx.fillStyle = 'rgba(48, 70, 58, 0.22)';
  ctx.fillRect(x0, y0 + 26, TILE_PX, 4);
  ctx.fillStyle = 'rgba(232, 194, 125, 0.28)';
  ctx.fillRect(x0, y0 + 2, TILE_PX, 2);
  const r = rnd(151);
  ctx.fillStyle = 'rgba(72, 104, 78, 0.28)';
  for (let i = 0; i < 5; i++) {
    const bx = Math.floor(r() * 14) * 2;
    const by = 24 + Math.floor(r() * 3) * 2;
    ctx.fillRect(x0 + bx, y0 + by, 2, 2);
  }
  applyMicroTexture(ctx, x0, y0, 3);
}

function drawCobble(ctx, x0, y0) {
  // Weathered gray stone: cool midtones and pale worn faces, not coal-black.
  fillNoise(ctx, x0, y0, [148, 150, 158], 0.18, 33, 255, 2);
  const r = rnd(19);
  ctx.fillStyle = 'rgba(82, 84, 92, 0.42)';
  for (let i = 0; i < 8; i++) {
    const bx = Math.floor(r() * 12) * 2;
    const by = Math.floor(r() * 12) * 2;
    const w = 6 + Math.floor(r() * 4) * 2;
    const h = 4 + Math.floor(r() * 3) * 2;
    ctx.fillRect(x0 + bx, y0 + by, w, h);
  }
  ctx.fillStyle = 'rgba(205, 207, 212, 0.34)';
  ctx.fillRect(x0 + 4, y0 + 5, 8, 2);
  ctx.fillRect(x0 + 18, y0 + 21, 7, 2);
  applyMicroTexture(ctx, x0, y0, 3);
}

function drawSandstone(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [214, 188, 131], 0.16, 41, 255, 2);
  ctx.fillStyle = 'rgba(165, 140, 90, 0.45)';
  for (let y = 6; y < TILE_PX; y += 8) {
    ctx.fillRect(x0, y0 + y, TILE_PX, 2);
  }
  applyMicroTexture(ctx, x0, y0, 3);
}

function drawSnow(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [240, 244, 250], 0.1, 50, 255, 2);
  ctx.fillStyle = 'rgba(195, 215, 235, 0.3)';
  const r = rnd(51);
  for (let i = 0; i < 12; i++) {
    const bx = (r() * 15) | 0;
    const by = (r() * 15) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 2, 2);
  }
  applyMicroTexture(ctx, x0, y0, 2);
}

function drawIce(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [150, 205, 238], 0.16, 60, 255, 2);
  ctx.fillStyle = 'rgba(225, 245, 255, 0.5)';
  ctx.fillRect(x0 + 4, y0 + 8, 12, 2);
  ctx.fillRect(x0 + 16, y0 + 20, 10, 2);
  applyMicroTexture(ctx, x0, y0, 3);
}

function drawCoal(ctx, x0, y0) {
  drawStone(ctx, x0, y0);
  const r = rnd(70);
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = 'rgba(28, 28, 34, 0.9)';
    ctx.beginPath();
    ctx.arc(x0 + 4 + r() * 24, y0 + 4 + r() * 24, 1.5 + r() * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTorch(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(x0 + 13, y0 + 14, 6, 16);
  ctx.fillStyle = '#ffcc44';
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 12, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawCampfire(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [50, 40, 30], 0.2, 9, 255, 2);
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0 + 6, y0 + 24);
  ctx.lineTo(x0 + 26, y0 + 10);
  ctx.moveTo(x0 + 26, y0 + 24);
  ctx.lineTo(x0 + 6, y0 + 10);
  ctx.stroke();
  ctx.fillStyle = '#ff6622';
  ctx.beginPath();
  ctx.moveTo(x0 + 16, y0 + 6);
  ctx.lineTo(x0 + 10, y0 + 20);
  ctx.lineTo(x0 + 22, y0 + 20);
  ctx.fill();
}

function drawBedrock(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [45, 45, 52], 0.35, 2, 255, 2);
  applyMicroTexture(ctx, x0, y0, 5);
}

function drawBed(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [90, 55, 35], 0.15, 14, 255, 2);
  ctx.fillStyle = '#a04050';
  ctx.fillRect(x0 + 2, y0 + 8, TILE_PX - 4, 16);
  ctx.fillStyle = '#d0c8b0';
  ctx.fillRect(x0 + 4, y0 + 6, 10, 8);
  ctx.fillStyle = '#703040';
  ctx.fillRect(x0 + 2, y0 + 22, TILE_PX - 4, 4);
}

function drawIronOre(ctx, x0, y0) {
  drawStone(ctx, x0, y0);
  const r = rnd(71);
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = 'rgba(189, 154, 122, 0.9)';
    ctx.beginPath();
    ctx.arc(x0 + 5 + r() * 22, y0 + 5 + r() * 22, 1.5 + r() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCopperOre(ctx, x0, y0) {
  drawStone(ctx, x0, y0);
  const r = rnd(72);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = 'rgba(190, 105, 66, 0.92)';
    ctx.fillRect(x0 + 4 + (r() * 23 | 0), y0 + 4 + (r() * 23 | 0), 3, 3);
  }
}

function drawDiamondOre(ctx, x0, y0) {
  drawStone(ctx, x0, y0);
  const r = rnd(73);
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = 'rgba(104, 230, 226, 0.95)';
    ctx.fillRect(x0 + 4 + (r() * 23 | 0), y0 + 4 + (r() * 23 | 0), 3, 3);
  }
}

function drawBush(ctx, x0, y0) {
  // Built from 2px blocks rather than antialiased arcs: every painted pixel is
  // fully opaque, so nothing sits under the 0.35 alphaTest and drops out as a
  // ragged hole in the silhouette.
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  const field = makeFbm(120, 4, 2);
  const cx = 16;
  const cy = 19;
  const { shadow, base, light } = PAL_LEAVES;
  for (let py = 0; py < TILE_PX; py += 2) {
    for (let px = 0; px < TILE_PX; px += 2) {
      const dx = (px + 1 - cx) / 13;
      const dy = (py + 1 - cy) / 12;
      const d = dx * dx + dy * dy;
      const n = field((px + 1) / TILE_PX, (py + 1) / TILE_PX);
      // Noisy radial mask gives a leafy edge instead of a clean circle
      if (d > 0.75 + (n - 0.5) * 0.55) continue;
      const lit = clamp01(0.55 + (n - 0.5) * 1.4 - dy * 0.5);
      const from = lit < 0.5 ? shadow : base;
      const to = lit < 0.5 ? base : light;
      const k = lit < 0.5 ? lit * 2 : (lit - 0.5) * 2;
      ctx.fillStyle = `rgb(${clamp(mixChannel(from[0], to[0], k))}, ${clamp(mixChannel(from[1], to[1], k))}, ${clamp(mixChannel(from[2], to[2], k))})`;
      ctx.fillRect(x0 + px, y0 + py, 2, 2);
    }
  }
  // Ripe berries, kept few and clustered so they read as accents, not confetti
  const r = rnd(12);
  for (let i = 0; i < 6; i++) {
    const bx = 8 + Math.floor(r() * 8) * 2;
    const by = 12 + Math.floor(r() * 6) * 2;
    ctx.fillStyle = '#c22f2f';
    ctx.fillRect(x0 + bx, y0 + by, 2, 2);
    ctx.fillStyle = 'rgba(240, 120, 110, 0.7)';
    ctx.fillRect(x0 + bx, y0 + by, 1, 1);
  }
}

function drawFarmland(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [95, 65, 38], 0.28, 15, 255, 2);
  ctx.fillStyle = 'rgba(40, 25, 15, 0.45)';
  for (let y = 4; y < TILE_PX; y += 6) {
    ctx.fillRect(x0, y0 + y, TILE_PX, 2);
  }
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawCrop(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.fillStyle = '#6aaa3a';
  for (let i = 0; i < 5; i++) {
    const x = x0 + 6 + i * 5;
    ctx.fillRect(x, y0 + 10, 2, 18);
  }
  ctx.fillStyle = '#d4b84a';
  for (let i = 0; i < 5; i++) {
    const x = x0 + 5 + i * 5;
    ctx.fillRect(x, y0 + 6, 4, 5);
  }
}

function drawChest(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [140, 90, 40], 0.2, 18, 255, 2);
  ctx.strokeStyle = '#5a3a15';
  ctx.strokeRect(x0 + 3, y0 + 6, TILE_PX - 6, TILE_PX - 10);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(x0 + 14, y0 + 14, 4, 6);
}

function drawLadder(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(x0 + 6, y0 + 2, 3, 28);
  ctx.fillRect(x0 + 23, y0 + 2, 3, 28);
  for (let y = 6; y < 28; y += 6) ctx.fillRect(x0 + 6, y0 + y, 20, 2);
}

function drawFence(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.fillStyle = '#8a6230';
  ctx.fillRect(x0 + 6, y0 + 4, 4, 24);
  ctx.fillRect(x0 + 22, y0 + 4, 4, 24);
  ctx.fillRect(x0 + 6, y0 + 10, 20, 3);
  ctx.fillRect(x0 + 6, y0 + 18, 20, 3);
}

function drawSnare(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.strokeStyle = '#c8b090';
  ctx.lineWidth = 2;
  ctx.strokeRect(x0 + 6, y0 + 10, 20, 14);
  ctx.beginPath();
  ctx.moveTo(x0 + 10, y0 + 10);
  ctx.lineTo(x0 + 16, y0 + 22);
  ctx.lineTo(x0 + 22, y0 + 10);
  ctx.stroke();
}

function drawPumpkin(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [220, 130, 30], 0.22, 33, 255, 2);
  ctx.fillStyle = '#3d6b28';
  ctx.fillRect(x0 + 14, y0 + 4, 4, 6);
  ctx.fillStyle = 'rgba(120,60,10,0.4)';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x0 + 8 + i * 5, y0 + 8, 2, 20);
  }
}

function drawDoor(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [160, 110, 70], 0.15, 44, 255, 2);
  ctx.fillStyle = '#8a6235';
  ctx.fillRect(x0 + 6, y0, TILE_PX - 12, TILE_PX);
  ctx.strokeStyle = '#4a3018';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x0 + 6, y0 + 6 + i * 7);
    ctx.lineTo(x0 + TILE_PX - 8, y0 + 12 + i * 7);
    ctx.stroke();
  }
}

function drawDoorOpen(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  fillNoise(ctx, x0, y0, [160, 110, 70], 0.15, 44, 255, 2);
}

function drawGlassTile(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [195, 215, 235], 0.15, 55, 255, 2);
  ctx.strokeStyle = 'rgba(160,180,210,0.4)';
  ctx.strokeRect(x0 + 6, y0 + 6, TILE_PX - 12, TILE_PX - 12);
}

function drawClay(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [105, 98, 77], 0.25, 66, 255, 2);
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawBricks(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [170, 77, 55], 0.18, 77, 255, 2);
  ctx.fillStyle = 'rgba(80,30,15,0.5)';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x0 + 8 + i * 12, y0, 2, TILE_PX);
  }
  applyMicroTexture(ctx, x0, y0, 3);
}

function drawFurnace(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [65, 60, 55], 0.2, 88, 255, 2);
  ctx.strokeStyle = '#4a3a2a';
  ctx.lineWidth = 3;
  ctx.strokeRect(x0 + 6, y0 + 6, TILE_PX - 12, TILE_PX - 12);
  ctx.fillStyle = '#cc5522';
  ctx.beginPath();
  ctx.moveTo(x0 + 22, y0 + 18);
  ctx.lineTo(x0 + 26, y0 + 30);
  ctx.lineTo(x0 + 8, y0 + 34);
  ctx.closePath();
  ctx.fill();
}

function drawWire(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.strokeStyle = '#c88225';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0 + 2, y0 + 14);
  ctx.quadraticCurveTo(x0 + 16, y0 + 20, x0 + TILE_PX - 2, y0 + 14);
  ctx.stroke();
}

function drawLamp(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [180, 200, 235], 0.15, 90, 255, 2);
  ctx.fillStyle = 'rgba(255,240,180,0.6)';
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 14, 8, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#8a7a60';
  ctx.fillRect(x0 + 4, y0 + 22, TILE_PX - 8, 6);
  ctx.fillStyle = 'rgba(255,230,140,0.5)';
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 12, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGenerator(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [70, 75, 85], 0.2, 91, 255, 2);
  ctx.fillStyle = '#cc8833';
  ctx.fillRect(x0 + 10, y0 + 10, 12, 12);
}

function drawIceBox(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [160, 200, 230], 0.15, 92, 255, 2);
  ctx.strokeStyle = 'rgba(40,80,120,0.5)';
  ctx.strokeRect(x0 + 4, y0 + 4, TILE_PX - 8, TILE_PX - 8);
}

function drawWall(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [120, 120, 125], 0.2, 93, 255, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let y = 8; y < TILE_PX; y += 10) {
    ctx.fillRect(x0, y0 + y, TILE_PX, 2);
  }
}

function drawLava(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [210, 80, 15], 0.3, 94, 255, 2);
  ctx.fillStyle = 'rgba(255,180,30,0.4)';
  ctx.fillRect(x0 + 6, y0 + 8, 12, 4);
  ctx.fillRect(x0 + 18, y0 + 16, 10, 3);
}

function drawCrack(ctx, x0, y0, stage) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.strokeStyle = `rgba(20,15,10,${0.35 + stage * 0.1})`;
  ctx.lineWidth = 1.5;
  const r = rnd(100 + stage);
  const lines = 3 + stage * 2;
  for (let i = 0; i < lines; i++) {
    ctx.beginPath();
    let x = x0 + 4 + r() * 24;
    let y = y0 + 4 + r() * 24;
    ctx.moveTo(x, y);
    for (let j = 0; j < 2 + stage; j++) {
      x += (r() - 0.5) * 12;
      y += (r() - 0.5) * 12;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawSequoiaLogSide(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [138, 55, 30], 0.22, 200, 255, 2);
  ctx.fillStyle = 'rgba(65, 22, 10, 0.6)';
  for (let x = 4; x < TILE_PX; x += 6) {
    ctx.fillRect(x0 + x, y0, 2, TILE_PX);
  }
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawSequoiaLogTop(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [165, 95, 52], 0.18, 201, 255, 2);
  ctx.strokeStyle = 'rgba(75, 32, 12, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 16, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 16, 6, 0, Math.PI * 2);
  ctx.stroke();
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawSequoiaLeaves(ctx, x0, y0) {
  drawFoliage(ctx, x0, y0, PAL_SEQUOIA, 202, { contrast: 1.15, phase: 2 });
}

function drawSpruceLogSide(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [92, 64, 38], 0.22, 300, 255, 2);
  ctx.fillStyle = 'rgba(48, 30, 16, 0.6)';
  for (let x = 4; x < TILE_PX; x += 6) {
    ctx.fillRect(x0 + x, y0, 2, TILE_PX);
  }
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawSpruceLogTop(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [130, 95, 55], 0.18, 301, 255, 2);
  ctx.strokeStyle = 'rgba(55, 34, 15, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 16, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 16, 5, 0, Math.PI * 2);
  ctx.stroke();
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawSpruceLeaves(ctx, x0, y0) {
  // Needled conifer: tighter, darker clumping than broadleaf, but the same
  // shadow floor so a mixed forest keeps one coherent green family.
  drawFoliage(ctx, x0, y0, PAL_SPRUCE, 302, { contrast: 1.2, gapAlpha: 0.3, phase: 3 });
}

function drawPalmLeaves(ctx, x0, y0) {
  // Tropical fronds: brighter, wider clumps with the field stretched along the
  // frond direction so palm canopy reads distinct from inland leaves.
  const field = fillMaterial(ctx, x0, y0, PAL_PALM, {
    seed: 501, cells: 4, octaves: 3, contrast: 1.25, sx: 2,
  });
  scatterFlecks(ctx, x0, y0, {
    seed: 502, count: 18, color: 'rgba(30, 90, 30, 0.32)',
    field, want: -1, threshold: 0.44, w: 6, h: 2,
  });
  scatterFlecks(ctx, x0, y0, {
    seed: 503, count: 16, color: 'rgba(126, 196, 84, 0.32)',
    field, want: 1, threshold: 0.58, w: 4, h: 2,
  });
  applyMicroTexture(ctx, x0, y0, 4, 2);
}

function drawCoral(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [228, 93, 117], 0.24, 410, 255, 2);
  const r = rnd(411);
  ctx.fillStyle = '#ffa3b3';
  for (let i = 0; i < 7; i++) {
    const x = x0 + Math.floor(r() * 12) * 2;
    const y = y0 + Math.floor(r() * 10) * 2;
    ctx.fillRect(x, y, 4, 4);
  }
  applyMicroTexture(ctx, x0, y0, 3);
}

/**
 * Draw a swaying blade as stacked 2px blocks. Strokes were antialiased, which
 * left the outer pixels of a thin blade below `alphaTest 0.35` — the blade then
 * rendered thinner and gappier than drawn. Block stepping keeps every pixel at
 * full alpha and full colour.
 */
function drawBlade(ctx, x0, y0, opts) {
  const { baseX, top, bottom, sway, width, dark, mid, lit } = opts;
  for (let py = bottom; py >= top; py -= 2) {
    const t = (bottom - py) / Math.max(2, bottom - top);
    const bx = baseX + Math.round((sway * t * t) / 2) * 2;
    const shade = t > 0.66 ? lit : t > 0.3 ? mid : dark;
    ctx.fillStyle = shade;
    ctx.fillRect(x0 + Math.max(0, Math.min(TILE_PX - width, bx)), y0 + py, width, 2);
  }
}

function drawKelp(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  const r = rnd(412);
  for (let i = 0; i < 3; i++) {
    const baseX = 4 + i * 10;
    drawBlade(ctx, x0, y0, {
      baseX, top: 2 + Math.floor(r() * 3) * 2, bottom: 30,
      sway: (r() * 8) - 4, width: 4,
      dark: '#14603a', mid: '#1f8049', lit: '#2f9c5c',
    });
    // Frond flaps hanging off the stipe
    ctx.fillStyle = '#1a6b3d';
    for (let k = 0; k < 3; k++) {
      const fy = 8 + k * 7;
      const fx = Math.max(0, Math.min(TILE_PX - 4, baseX + (k % 2 ? 4 : -4)));
      ctx.fillRect(x0 + fx, y0 + fy, 4, 2);
    }
  }
}

function drawSeagrass(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  const r = rnd(413);
  for (let i = 0; i < 7; i++) {
    drawBlade(ctx, x0, y0, {
      baseX: 2 + i * 4, top: 4 + Math.floor(r() * 4) * 2, bottom: 30,
      sway: (r() * 10) - 5, width: 2,
      dark: '#2b8a48', mid: '#37a355', lit: '#4cbc6a',
    });
  }
}

function drawRoots(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.strokeStyle = '#6e4222';
  ctx.lineWidth = 3;
  for (const [sx, sy, ex, ey] of [[3, 28, 15, 8], [15, 30, 22, 12], [29, 26, 18, 16]]) {
    ctx.beginPath(); ctx.moveTo(x0 + sx, y0 + sy); ctx.quadraticCurveTo(x0 + 14, y0 + 18, x0 + ex, y0 + ey); ctx.stroke();
  }
}

function drawStickPile(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.strokeStyle = '#a86c38';
  ctx.lineWidth = 3;
  for (const [sx, sy, ex, ey] of [[4, 25, 26, 10], [7, 12, 28, 23], [12, 28, 21, 7]]) {
    ctx.beginPath(); ctx.moveTo(x0 + sx, y0 + sy); ctx.lineTo(x0 + ex, y0 + ey); ctx.stroke();
  }
}

function drawDampSoil(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [118, 92, 54], 0.24, 414, 255, 2);
  const r = rnd(415);
  ctx.fillStyle = 'rgba(70, 58, 30, 0.4)';
  for (let i = 0; i < 12; i++) {
    const bx = (r() * 15) | 0;
    const by = (r() * 15) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 2, 2);
  }
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawMushroom(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.fillStyle = '#e8cca4'; ctx.fillRect(x0 + 14, y0 + 17, 5, 12);
  ctx.fillStyle = '#cc382b'; ctx.beginPath(); ctx.arc(x0 + 16, y0 + 15, 9, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#f5ead8'; ctx.fillRect(x0 + 11, y0 + 12, 2, 2); ctx.fillRect(x0 + 19, y0 + 10, 2, 2);
}

export function createBlockAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_PX;
  canvas.height = ATLAS_PX;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ATLAS_PX, ATLAS_PX);

  const paint = (index, fn) => {
    const { x, y } = tileOrigin(index);
    fn(ctx, x, y);
  };

  // Fill entire atlas opaque first so unused tiles never sample as holes
  for (let i = 0; i < ATLAS_N * ATLAS_N; i++) {
    const { x, y } = tileOrigin(i);
    fillNoise(ctx, x, y, [90, 90, 95], 0.1, 900 + i, 255, 2);
  }

  paint(TILE.GRASS_SIDE, drawGrassSide);
  paint(TILE.GRASS_TOP, drawGrassTop);
  paint(TILE.DIRT, drawDirt);
  paint(TILE.STONE, drawStone);
  paint(TILE.SAND, drawSand);
  paint(TILE.WATER, drawWater);
  paint(TILE.LOG_SIDE, drawLogSide);
  paint(TILE.LOG_TOP, drawLogTop);
  paint(TILE.LEAVES, drawLeaves);
  paint(TILE.PLANKS, drawPlanks);
  paint(TILE.COBBLE, drawCobble);
  paint(TILE.SANDSTONE, drawSandstone);
  paint(TILE.SNOW, drawSnow);
  paint(TILE.ICE, drawIce);
  paint(TILE.COAL_ORE, drawCoal);
  paint(TILE.TORCH, drawTorch);
  paint(TILE.CAMPFIRE, drawCampfire);
  paint(TILE.BEDROCK, drawBedrock);
  paint(TILE.BED, drawBed);
  paint(TILE.IRON_ORE, drawIronOre);
  paint(TILE.BUSH, drawBush);
  paint(TILE.FARMLAND, drawFarmland);
  paint(TILE.CROP, drawCrop);
  paint(TILE.CHEST, drawChest);
  paint(TILE.LADDER, drawLadder);
  paint(TILE.FENCE, drawFence);
  paint(TILE.SNARE, drawSnare);
  paint(TILE.PUMPKIN, drawPumpkin);
  paint(TILE.DOOR_CLOSED, drawDoor);
  paint(TILE.DOOR_OPEN, drawDoorOpen);
  paint(TILE.GLASS, drawGlassTile);
  paint(TILE.CLAY, drawClay);
  paint(TILE.BRICKS, drawBricks);
  paint(TILE.FURNACE, drawFurnace);
  paint(TILE.WIRE, drawWire);
  paint(TILE.LAMP, drawLamp);
  paint(TILE.GENERATOR, drawGenerator);
  paint(TILE.ICE_BOX, drawIceBox);
  paint(TILE.WALL, drawWall);
  paint(TILE.LAVA, drawLava);
  paint(TILE.CRACK0, (c, x, y) => drawCrack(c, x, y, 0));
  paint(TILE.CRACK1, (c, x, y) => drawCrack(c, x, y, 1));
  paint(TILE.CRACK2, (c, x, y) => drawCrack(c, x, y, 2));
  paint(TILE.CRACK3, (c, x, y) => drawCrack(c, x, y, 3));
  paint(TILE.CRACK4, (c, x, y) => drawCrack(c, x, y, 4));
  paint(TILE.CRACK5, (c, x, y) => drawCrack(c, x, y, 5));
  paint(TILE.SEQUOIA_LOG_SIDE, drawSequoiaLogSide);
  paint(TILE.SEQUOIA_LOG_TOP, drawSequoiaLogTop);
  paint(TILE.SEQUOIA_LEAVES, drawSequoiaLeaves);
  paint(TILE.SPRUCE_LOG_SIDE, drawSpruceLogSide);
  paint(TILE.SPRUCE_LOG_TOP, drawSpruceLogTop);
  paint(TILE.SPRUCE_LEAVES, drawSpruceLeaves);
  paint(TILE.CORAL, drawCoral);
  paint(TILE.KELP, drawKelp);
  paint(TILE.SEAGRASS, drawSeagrass);
  paint(TILE.PALM_LEAVES, drawPalmLeaves);
  paint(TILE.ROOTS, drawRoots);
  paint(TILE.STICK_PILE, drawStickPile);
  paint(TILE.DAMP_SOIL, drawDampSoil);
  paint(TILE.MUSHROOM, drawMushroom);
  paint(TILE.COPPER_ORE, drawCopperOre);
  paint(TILE.DIAMOND_ORE, drawDiamondOre);
  paint(TILE.MANGROVE_LOG_SIDE, drawMangroveLogSide);
  paint(TILE.MANGROVE_LEAVES, drawMangroveLeaves);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const material = new THREE.MeshLambertMaterial({
    map: texture,
    vertexColors: true,
    transparent: false,
    alphaTest: 0.35,
    depthWrite: true,
    side: THREE.DoubleSide,
  });

  const greedyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      atlas: { value: texture },
      sunIntensity: { value: 1.0 },
      ambientColor: { value: new THREE.Color(0.58, 0.58, 0.65) },
      sunColor: { value: new THREE.Color(1.0, 0.96, 0.88) },
      sunDir: { value: new THREE.Vector3(0.4, 1.0, 0.2).normalize() },
      lanternPos: { value: new THREE.Vector3(50, 17.96, 60) },
      lanternColor: { value: new THREE.Color(1.0, 0.48, 0.18) },
      lanternStrength: { value: 0.0 },
      lanternRadius: { value: 7.5 },
      waterTime: { value: 0 },
    },
    vertexShader: `
      attribute float tile;
      varying vec2 vUv;
      varying vec4 vColor;
      varying vec2 vAuvBase;
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying float vTile;
      void main() {
        vUv = uv;
        vColor = color;
        vTile = tile;
        float tx = mod(tile, ${ATLAS_N}.0);
        float ty = floor(tile / ${ATLAS_N}.0);
        vAuvBase = vec2(tx / ${ATLAS_N}.0, 1.0 - (ty + 1.0) / ${ATLAS_N}.0);
        vNormal = normalize(normalMatrix * normal);
        vWorldPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D atlas;
      uniform float sunIntensity;
      uniform vec3 ambientColor;
      uniform vec3 sunColor;
      uniform vec3 sunDir;
      uniform vec3 lanternPos;
      uniform vec3 lanternColor;
      uniform float lanternStrength;
      uniform float lanternRadius;
      uniform float waterTime;
      varying vec2 vUv;
      varying vec4 vColor;
      varying vec2 vAuvBase;
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying float vTile;
      void main() {
        vec2 tUv = fract(vUv);
        tUv = clamp(tUv, 0.02, 0.98);
        vec2 auv = vAuvBase + vec2(tUv.x / ${ATLAS_N}.0, tUv.y / ${ATLAS_N}.0);
        vec4 tex = texture2D(atlas, auv);
        if (tex.a < 0.35) discard;
        float ndl = max(0.0, abs(dot(normalize(vNormal), normalize(sunDir))));
        vec3 light = ambientColor + sunColor * ndl * sunIntensity;
        float lanternFalloff = max(0.0, 1.0 - distance(vWorldPos, lanternPos) / lanternRadius);
        lanternFalloff *= lanternFalloff * lanternStrength;
        light += lanternColor * lanternFalloff;
        vec3 rgb = tex.rgb * max(vColor.rgb, vec3(0.25)) * light;
        // Named BVI coves get a restrained shallow-water response: a greener
        // shelf tint and a broken foam glint on upward-facing water tops. Deep
        // ocean and all non-water materials keep the existing atlas treatment.
        float waterFace = 1.0 - smoothstep(0.5, 1.5, abs(vTile - 5.0));
        float whiteBay = exp(-pow((vWorldPos.x + 42.0) / 14.0, 2.0) - pow((vWorldPos.z - 8.0) / 6.0, 2.0));
        float northSound = exp(-pow((vWorldPos.x - 52.0) / 10.0, 2.0) - pow((vWorldPos.z + 2.0) / 5.0, 2.0));
        float cove = max(whiteBay, northSound) * waterFace;
        rgb = mix(rgb, rgb * vec3(0.78, 1.16, 1.10), clamp(cove * 0.42, 0.0, 0.42));
        float topFace = smoothstep(0.78, 0.98, vNormal.y);
        float foamBand = smoothstep(0.48, 0.78, cove) * (1.0 - smoothstep(0.78, 0.96, cove));
        float foamBreak = 0.55 + 0.45 * sin(vWorldPos.x * 1.7 + vWorldPos.z * 1.1);
        rgb += vec3(0.16, 0.26, 0.22) * foamBand * topFace * foamBreak * 0.22;
        float waterSurface = waterFace * topFace;
        float wave = 0.5 + 0.5 * sin(waterTime * ${WATER_WAVE.speed} + vWorldPos.x * ${WATER_WAVE.xFrequency} + vWorldPos.z * ${WATER_WAVE.zFrequency});
        float ripple = 0.5 + 0.5 * sin(waterTime * 1.05 + vWorldPos.x * 0.27 - vWorldPos.z * 0.38);
        rgb += vec3(${WATER_WAVE.tint.join(', ')}) * waterSurface * (0.16 + wave * 0.16);
        rgb += vec3(0.18, 0.28, 0.26) * waterSurface * ripple * 0.08;
        gl_FragColor = vec4(rgb, 1.0);
      }
    `,
    transparent: false,
    depthWrite: true,
    vertexColors: true,
    side: THREE.DoubleSide,
  });

  const crackMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    alphaTest: 0.05,
  });

  return { canvas, texture, material, greedyMaterial, crackMaterial, uvsForTile: tileUVs };
}
