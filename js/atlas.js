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
} from './atlas-core.js?v=285';

export {
  TILE,
  TILE_PX,
  ATLAS_N,
  ATLAS_PX,
  tileUVs,
  tileForBlock,
  crackTileForProgress,
  atlasTileCount,
} from './atlas-core.js?v=285';

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

function applyMicroTexture(ctx, x0, y0, strength) {
  const img = ctx.getImageData(x0, y0, TILE_PX, TILE_PX);
  const d = img.data;
  for (let j = 0; j < TILE_PX; j++) {
    const row = BAYER4[j % 4];
    for (let i = 0; i < TILE_PX; i++) {
      const delta = (row[i % 4] / 15 - 0.5) * strength;
      const idx = (j * TILE_PX + i) * 4;
      d[idx]     = clamp(d[idx] + delta);
      d[idx + 1] = clamp(d[idx + 1] + delta);
      d[idx + 2] = clamp(d[idx + 2] + delta);
    }
  }
  ctx.putImageData(img, x0, y0);
}

function tileOrigin(index) {
  const tx = index % ATLAS_N;
  const ty = (index / ATLAS_N) | 0;
  return { x: tx * TILE_PX, y: ty * TILE_PX };
}

function drawGrassTop(ctx, x0, y0) {
  // Natural Minecraft-style mid green base with 2x2 pixel cluster structure
  fillNoise(ctx, x0, y0, [85, 138, 52], 0.20, 11, 255, 2);
  const r = rnd(99);
  // Rich natural green shadows (2x2 pixel blocks)
  ctx.fillStyle = 'rgba(48, 98, 30, 0.4)';
  for (let i = 0; i < 20; i++) {
    const bx = (r() * 15) | 0;
    const by = (r() * 15) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 2, 2);
  }
  // Soft natural grass blade highlights (2x2 pixel blocks)
  ctx.fillStyle = 'rgba(122, 175, 70, 0.35)';
  for (let i = 0; i < 16; i++) {
    const bx = (r() * 15) | 0;
    const by = (r() * 15) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 2, 2);
  }
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawDirtBase(ctx, x0, y0) {
  // Warm, rich natural loam dirt brown (clearly distinct from grass and leaves)
  fillNoise(ctx, x0, y0, [131, 93, 61], 0.24, 22, 255, 2);
  const r = rnd(3);
  // Organic dark soil clusters
  ctx.fillStyle = 'rgba(80, 52, 30, 0.35)';
  for (let i = 0; i < 14; i++) {
    const bx = (r() * 14) | 0;
    const by = (r() * 14) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 4, 2);
  }
  // Warm clay / pebble highlights
  ctx.fillStyle = 'rgba(175, 130, 90, 0.3)';
  for (let i = 0; i < 10; i++) {
    const bx = (r() * 15) | 0;
    const by = (r() * 15) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 2, 2);
  }
}

function drawDirt(ctx, x0, y0) {
  drawDirtBase(ctx, x0, y0);
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawGrassSide(ctx, x0, y0) {
  drawDirtBase(ctx, x0, y0);
  // Clean natural top grass cap with overhang pixel drapes
  ctx.fillStyle = '#558a34';
  ctx.fillRect(x0, y0, TILE_PX, 8);
  const r = rnd(7);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = r() > 0.5 ? '#44722a' : '#6aa042';
    const x = x0 + Math.floor(r() * 16) * 2;
    const h = 4 + Math.floor(r() * 3) * 2;
    ctx.fillRect(x, y0 + 6, 2, h);
  }
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawStone(ctx, x0, y0) {
  // Clean natural slate rock gray with 2x2 pixel cluster texture
  fillNoise(ctx, x0, y0, [138, 138, 146], 0.2, 44, 255, 2);
  const r = rnd(8);
  // Structured rock strata accents
  ctx.fillStyle = 'rgba(75, 75, 85, 0.4)';
  for (let i = 0; i < 12; i++) {
    const bx = (r() * 14) | 0;
    const by = (r() * 14) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 4, 2);
  }
  // Subtle quartz mineral highlights
  ctx.fillStyle = 'rgba(180, 185, 195, 0.35)';
  for (let i = 0; i < 10; i++) {
    const bx = (r() * 15) | 0;
    const by = (r() * 15) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 2, 2);
  }
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawSand(ctx, x0, y0) {
  // Warm, vibrant golden beach sand (never gray or washed-out)
  fillNoise(ctx, x0, y0, [222, 200, 151], 0.16, 55, 255, 2);
  const r = rnd(56);
  // Sunny sand grain flecks
  ctx.fillStyle = 'rgba(248, 232, 188, 0.4)';
  for (let i = 0; i < 16; i++) {
    const bx = (r() * 15) | 0;
    const by = (r() * 15) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 2, 2);
  }
  // Warm dune shadows
  ctx.fillStyle = 'rgba(188, 158, 108, 0.35)';
  for (let i = 0; i < 14; i++) {
    const bx = (r() * 15) | 0;
    const by = (r() * 15) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 2, 2);
  }
  // Smooth dune ripple accents in warm golden shadow
  ctx.fillStyle = 'rgba(195, 162, 110, 0.4)';
  ctx.fillRect(x0 + 4, y0 + 8, 14, 2);
  ctx.fillRect(x0 + 16, y0 + 18, 12, 2);
  ctx.fillRect(x0 + 6, y0 + 26, 16, 2);
  applyMicroTexture(ctx, x0, y0, 3);
}

function drawWater(ctx, x0, y0) {
  // Rich, crystal-clear tropical azure water (opaque alpha = 255 so no alpha holes)
  fillNoise(ctx, x0, y0, [43, 130, 201], 0.16, 66, 255, 2);
  // Deep ocean wave troughs
  ctx.fillStyle = 'rgba(25, 90, 155, 0.35)';
  ctx.fillRect(x0 + 4, y0 + 8, 12, 2);
  ctx.fillRect(x0 + 10, y0 + 18, 16, 2);
  ctx.fillRect(x0 + 18, y0 + 28, 10, 2);
  // Soft turquoise wave crests
  ctx.fillStyle = 'rgba(130, 215, 255, 0.4)';
  ctx.fillRect(x0 + 4, y0 + 6, 14, 2);
  ctx.fillRect(x0 + 18, y0 + 14, 10, 2);
  ctx.fillRect(x0 + 6, y0 + 24, 12, 2);
  // Subtle foam flecks
  ctx.fillStyle = 'rgba(225, 250, 255, 0.5)';
  ctx.fillRect(x0 + 12, y0 + 6, 4, 2);
  ctx.fillRect(x0 + 22, y0 + 14, 4, 2);
  ctx.fillRect(x0 + 8, y0 + 24, 4, 2);
  applyMicroTexture(ctx, x0, y0, 3);
}

function drawLogSide(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [120, 84, 52], 0.2, 77, 255, 2);
  ctx.fillStyle = 'rgba(68, 44, 24, 0.6)';
  for (let x = 4; x < TILE_PX; x += 8) {
    ctx.fillRect(x0 + x, y0, 2, TILE_PX);
  }
  ctx.fillStyle = 'rgba(150, 110, 72, 0.3)';
  for (let x = 6; x < TILE_PX; x += 8) {
    ctx.fillRect(x0 + x, y0, 2, TILE_PX);
  }
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawLogTop(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [186, 141, 93], 0.16, 88, 255, 2);
  ctx.strokeStyle = '#5a3c23';
  ctx.lineWidth = 3;
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

function drawLeaves(ctx, x0, y0) {
  // Natural readable leaf green base with fully opaque canvas alpha
  fillNoise(ctx, x0, y0, [62, 122, 45], 0.22, 101, 255, 2);
  const r = rnd(12);
  // Dark leaf shadow clusters
  ctx.fillStyle = 'rgba(34, 76, 24, 0.5)';
  for (let i = 0; i < 24; i++) {
    const bx = (r() * 14) | 0;
    const by = (r() * 14) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 4, 4);
  }
  // Sunlight leaf edge highlights
  ctx.fillStyle = 'rgba(98, 162, 65, 0.4)';
  for (let i = 0; i < 16; i++) {
    const bx = (r() * 15) | 0;
    const by = (r() * 15) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 2, 2);
  }
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawPlanks(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [201, 155, 93], 0.14, 15, 255, 2);
  ctx.fillStyle = 'rgba(110, 75, 35, 0.6)';
  for (let y = 0; y < TILE_PX; y += 8) {
    ctx.fillRect(x0, y0 + y, TILE_PX, 2);
  }
  applyMicroTexture(ctx, x0, y0, 3);
}

function drawCobble(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [122, 122, 130], 0.22, 33, 255, 2);
  const r = rnd(19);
  ctx.fillStyle = 'rgba(60, 60, 68, 0.55)';
  for (let i = 0; i < 8; i++) {
    const bx = Math.floor(r() * 12) * 2;
    const by = Math.floor(r() * 12) * 2;
    const w = 6 + Math.floor(r() * 4) * 2;
    const h = 4 + Math.floor(r() * 3) * 2;
    ctx.fillRect(x0 + bx, y0 + by, w, h);
  }
  applyMicroTexture(ctx, x0, y0, 4);
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

function drawBush(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.fillStyle = '#448832';
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 18, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5c9e46';
  ctx.beginPath();
  ctx.arc(x0 + 12, y0 + 14, 7, 0, Math.PI * 2);
  ctx.fill();
  const r = rnd(12);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = '#e03535';
    ctx.fillRect(x0 + Math.floor(4 + r() * 22), y0 + Math.floor(8 + r() * 16), 2, 2);
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
  fillNoise(ctx, x0, y0, [36, 110, 47], 0.28, 202, 255, 2);
  const r = rnd(203);
  ctx.fillStyle = 'rgba(20, 75, 25, 0.5)';
  for (let i = 0; i < 20; i++) {
    const bx = (r() * 14) | 0;
    const by = (r() * 14) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 4, 4);
  }
  ctx.fillStyle = 'rgba(70, 150, 60, 0.4)';
  for (let i = 0; i < 14; i++) {
    const bx = (r() * 15) | 0;
    const by = (r() * 15) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 2, 2);
  }
  applyMicroTexture(ctx, x0, y0, 4);
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
  fillNoise(ctx, x0, y0, [41, 94, 67], 0.28, 302, 255, 2);
  const r = rnd(303);
  ctx.fillStyle = 'rgba(22, 65, 42, 0.5)';
  for (let i = 0; i < 20; i++) {
    const bx = (r() * 14) | 0;
    const by = (r() * 14) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 4, 4);
  }
  ctx.fillStyle = 'rgba(75, 140, 105, 0.4)';
  for (let i = 0; i < 14; i++) {
    const bx = (r() * 15) | 0;
    const by = (r() * 15) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 2, 2);
  }
  applyMicroTexture(ctx, x0, y0, 4);
}

function drawPalmLeaves(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [68, 145, 52], 0.22, 501, 255, 2);
  const r = rnd(502);
  ctx.fillStyle = 'rgba(36, 95, 28, 0.45)';
  for (let i = 0; i < 22; i++) {
    const bx = (r() * 14) | 0;
    const by = (r() * 14) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 4, 4);
  }
  ctx.fillStyle = 'rgba(110, 182, 72, 0.4)';
  for (let i = 0; i < 16; i++) {
    const bx = (r() * 15) | 0;
    const by = (r() * 15) | 0;
    ctx.fillRect(x0 + bx * 2, y0 + by * 2, 2, 2);
  }
  applyMicroTexture(ctx, x0, y0, 4);
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

function drawKelp(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  const r = rnd(412);
  ctx.strokeStyle = '#1c7a45';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    const x = x0 + 6 + i * 10;
    ctx.beginPath();
    ctx.moveTo(x, y0 + 30);
    ctx.quadraticCurveTo(x - 3 + r() * 6, y0 + 17, x + r() * 4 - 2, y0 + 3);
    ctx.stroke();
  }
}

function drawSeagrass(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  const r = rnd(413);
  ctx.strokeStyle = '#3cb85c';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const x = x0 + 3 + i * 4;
    ctx.beginPath();
    ctx.moveTo(x, y0 + 30);
    ctx.quadraticCurveTo(x - 3 + r() * 6, y0 + 13, x + r() * 5 - 2, y0 + 4 + r() * 5);
    ctx.stroke();
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
  fillNoise(ctx, x0, y0, [88, 58, 36], 0.24, 414, 255, 2);
  const r = rnd(415);
  ctx.fillStyle = 'rgba(35, 22, 14, 0.4)';
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
    },
    vertexShader: `
      attribute float tile;
      varying vec2 vUv;
      varying vec4 vColor;
      varying vec2 vAuvBase;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vColor = color;
        float tx = mod(tile, ${ATLAS_N}.0);
        float ty = floor(tile / ${ATLAS_N}.0);
        vAuvBase = vec2(tx / ${ATLAS_N}.0, 1.0 - (ty + 1.0) / ${ATLAS_N}.0);
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D atlas;
      uniform float sunIntensity;
      uniform vec3 ambientColor;
      uniform vec3 sunColor;
      uniform vec3 sunDir;
      varying vec2 vUv;
      varying vec4 vColor;
      varying vec2 vAuvBase;
      varying vec3 vNormal;
      void main() {
        vec2 tUv = fract(vUv);
        tUv = clamp(tUv, 0.02, 0.98);
        vec2 auv = vAuvBase + vec2(tUv.x / ${ATLAS_N}.0, tUv.y / ${ATLAS_N}.0);
        vec4 tex = texture2D(atlas, auv);
        if (tex.a < 0.35) discard;
        float ndl = max(0.0, abs(dot(normalize(vNormal), normalize(sunDir))));
        vec3 light = ambientColor + sunColor * ndl * sunIntensity;
        vec3 rgb = tex.rgb * max(vColor.rgb, vec3(0.25)) * light;
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
