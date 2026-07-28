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
} from './atlas-core.js';

export {
  TILE,
  TILE_PX,
  ATLAS_N,
  ATLAS_PX,
  tileUVs,
  tileForBlock,
  crackTileForProgress,
  atlasTileCount,
} from './atlas-core.js';

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

function fillNoise(ctx, x0, y0, base, variance, seed, alpha = 255) {
  const r = rnd(seed);
  const img = ctx.getImageData(x0, y0, TILE_PX, TILE_PX);
  const d = img.data;
  for (let i = 0; i < TILE_PX * TILE_PX; i++) {
    const n = (r() - 0.5) * variance;
    d[i * 4] = clamp(base[0] + n * 40);
    d[i * 4 + 1] = clamp(base[1] + n * 40);
    d[i * 4 + 2] = clamp(base[2] + n * 40);
    d[i * 4 + 3] = alpha;
  }
  ctx.putImageData(img, x0, y0);
}

function tileOrigin(index) {
  const tx = index % ATLAS_N;
  const ty = (index / ATLAS_N) | 0;
  return { x: tx * TILE_PX, y: ty * TILE_PX };
}

function drawGrassTop(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [70, 140, 55], 0.55, 11);
  const r = rnd(99);
  ctx.fillStyle = 'rgba(40,100,30,0.35)';
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(x0 + r() * TILE_PX, y0 + r() * TILE_PX, 1 + r() * 2, 1 + r() * 2);
  }
}

function drawDirt(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [120, 85, 50], 0.5, 22);
  const r = rnd(3);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = `rgba(60,40,25,${0.15 + r() * 0.2})`;
    ctx.fillRect(x0 + r() * 28, y0 + r() * 28, 2 + r() * 3, 2);
  }
}

function drawGrassSide(ctx, x0, y0) {
  drawDirt(ctx, x0, y0);
  ctx.fillStyle = '#4a8a38';
  ctx.fillRect(x0, y0, TILE_PX, 8);
  const r = rnd(7);
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = r() > 0.5 ? '#3d7a2e' : '#5a9a40';
    const x = x0 + r() * TILE_PX;
    ctx.fillRect(x, y0 + 6 + r() * 4, 1, 3 + r() * 4);
  }
}

function drawStone(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [140, 140, 148], 0.35, 44);
  const r = rnd(8);
  ctx.strokeStyle = 'rgba(80,80,90,0.35)';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(x0 + r() * TILE_PX, y0 + r() * TILE_PX);
    ctx.lineTo(x0 + r() * TILE_PX, y0 + r() * TILE_PX);
    ctx.stroke();
  }
}

function drawSand(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [220, 200, 140], 0.25, 55);
}

function drawWater(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [40, 90, 190], 0.3, 66, 160);
  ctx.fillStyle = 'rgba(180,220,255,0.2)';
  ctx.fillRect(x0 + 4, y0 + 8, 20, 3);
}

function drawLogSide(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [105, 70, 35], 0.25, 77);
  ctx.strokeStyle = 'rgba(60,35,15,0.5)';
  for (let x = 4; x < TILE_PX; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x0 + x, y0);
    ctx.lineTo(x0 + x + 1, y0 + TILE_PX);
    ctx.stroke();
  }
}

function drawLogTop(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [145, 110, 65], 0.2, 88);
  ctx.strokeStyle = 'rgba(90,60,30,0.6)';
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 16, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 16, 5, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLeaves(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [55, 120, 45], 0.45, 101, 230);
  const r = rnd(12);
  for (let i = 0; i < 25; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(30,90,25,0.5)' : 'rgba(80,150,50,0.4)';
    ctx.beginPath();
    ctx.arc(x0 + r() * TILE_PX, y0 + r() * TILE_PX, 1 + r() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlanks(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [185, 150, 90], 0.15, 15);
  ctx.strokeStyle = 'rgba(100,70,30,0.55)';
  for (let y = 0; y < TILE_PX; y += 8) {
    ctx.beginPath();
    ctx.moveTo(x0, y0 + y);
    ctx.lineTo(x0 + TILE_PX, y0 + y);
    ctx.stroke();
  }
}

function drawCobble(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [120, 120, 128], 0.3, 33);
  const r = rnd(19);
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = 'rgba(50,50,55,0.45)';
    ctx.strokeRect(x0 + r() * 22, y0 + r() * 22, 6 + r() * 8, 5 + r() * 7);
  }
}

function drawSandstone(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [200, 180, 120], 0.2, 41);
  ctx.strokeStyle = 'rgba(160,140,90,0.4)';
  for (let y = 6; y < TILE_PX; y += 7) {
    ctx.beginPath();
    ctx.moveTo(x0, y0 + y);
    ctx.lineTo(x0 + TILE_PX, y0 + y);
    ctx.stroke();
  }
}

function drawSnow(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [235, 240, 248], 0.12, 50);
}

function drawIce(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [160, 210, 240], 0.2, 60, 200);
}

function drawCoal(ctx, x0, y0) {
  drawStone(ctx, x0, y0);
  const r = rnd(70);
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = 'rgba(15,15,18,0.85)';
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
  fillNoise(ctx, x0, y0, [50, 40, 30], 0.2, 9);
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
  fillNoise(ctx, x0, y0, [40, 40, 48], 0.4, 2);
}

function drawBed(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [90, 55, 35], 0.15, 14);
  ctx.fillStyle = '#a04050';
  ctx.fillRect(x0 + 2, y0 + 8, TILE_PX - 4, 16);
  ctx.fillStyle = '#d0c8b0';
  ctx.fillRect(x0 + 4, y0 + 6, 10, 8);
  ctx.fillStyle = '#703040';
  ctx.fillRect(x0 + 2, y0 + 22, TILE_PX - 4, 4);
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
  paint(TILE.CRACK0, (c, x, y) => drawCrack(c, x, y, 0));
  paint(TILE.CRACK1, (c, x, y) => drawCrack(c, x, y, 1));
  paint(TILE.CRACK2, (c, x, y) => drawCrack(c, x, y, 2));
  paint(TILE.CRACK3, (c, x, y) => drawCrack(c, x, y, 3));
  paint(TILE.CRACK4, (c, x, y) => drawCrack(c, x, y, 4));
  paint(TILE.CRACK5, (c, x, y) => drawCrack(c, x, y, 5));

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const material = new THREE.MeshLambertMaterial({
    map: texture,
    vertexColors: true,
    transparent: true,
    alphaTest: 0.15,
    side: THREE.FrontSide,
  });

  const crackMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    alphaTest: 0.05,
  });

  return { canvas, texture, material, crackMaterial, uvsForTile: tileUVs };
}
