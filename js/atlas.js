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
} from './atlas-core.js?v=183';

export {
  TILE,
  TILE_PX,
  ATLAS_N,
  ATLAS_PX,
  tileUVs,
  tileForBlock,
  crackTileForProgress,
  atlasTileCount,
} from './atlas-core.js?v=183';

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

function drawIronOre(ctx, x0, y0) {
  drawStone(ctx, x0, y0);
  const r = rnd(71);
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = 'rgba(180,160,140,0.9)';
    ctx.beginPath();
    ctx.arc(x0 + 5 + r() * 22, y0 + 5 + r() * 22, 1.5 + r() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBush(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.fillStyle = '#2f6b28';
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 18, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a8a32';
  ctx.beginPath();
  ctx.arc(x0 + 11, y0 + 14, 7, 0, Math.PI * 2);
  ctx.fill();
  const r = rnd(12);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = '#b02030';
    ctx.beginPath();
    ctx.arc(x0 + 8 + r() * 16, y0 + 10 + r() * 14, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFarmland(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [90, 60, 35], 0.35, 15);
  ctx.strokeStyle = 'rgba(40,25,15,0.45)';
  for (let y = 4; y < TILE_PX; y += 6) {
    ctx.beginPath();
    ctx.moveTo(x0, y0 + y);
    ctx.lineTo(x0 + TILE_PX, y0 + y);
    ctx.stroke();
  }
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
  fillNoise(ctx, x0, y0, [140, 90, 40], 0.2, 18);
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
  fillNoise(ctx, x0, y0, [0,0,0], 0, 1, 0);
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
  fillNoise(ctx, x0, y0, [220, 130, 30], 0.25, 33);
  ctx.fillStyle = '#3d6b28';
  ctx.fillRect(x0 + 14, y0 + 4, 4, 6);
  ctx.strokeStyle = 'rgba(120,60,10,0.4)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x0 + 8 + i * 5, y0 + 8);
    ctx.lineTo(x0 + 8 + i * 5, y0 + 28);
    ctx.stroke();
  }
}

function drawDoor(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [160, 110, 70], 0.15, 44);
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
  fillNoise(ctx, x0, y0, [160, 110, 70], 0.15, 44);
}

function drawGlassTile(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [195, 215, 235], 0.15, 55);
  ctx.strokeStyle = 'rgba(160,180,210,0.4)';
  ctx.strokeRect(x0 + 6, y0 + 6, TILE_PX - 12, TILE_PX - 12);
}

function drawClay(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [105, 98, 77], 0.3, 66);
}

function drawBricks(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [170, 77, 55], 0.2, 77);
  ctx.strokeStyle = 'rgba(80,30,15,0.5)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x0 + 8 + i * 12, y0);
    ctx.lineTo(x0 + 8 + i * 12, y0 + TILE_PX);
    ctx.stroke();
  }
}

function drawFurnace(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [65, 60, 55], 0.2, 88);
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
  // thin copper wire line across center
  ctx.strokeStyle = '#b87a20';
  ctx.lineWidth = 3;
  ctx.beginPath();
  // horizontal wire with slight sag
  ctx.moveTo(x0 + 2, y0 + 14);
  ctx.quadraticCurveTo(x0 + 16, y0 + 20, x0 + TILE_PX - 2, y0 + 14);
  ctx.stroke();
}

function drawLamp(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [180, 200, 235], 0.15, 90);
  // glass dome on top
  ctx.fillStyle = 'rgba(255,240,180,0.6)';
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 14, 8, Math.PI, 0);
  ctx.fill();
  // base plate
  ctx.fillStyle = '#8a7a60';
  ctx.fillRect(x0 + 4, y0 + 22, TILE_PX - 8, 6);
  // glow spot
  ctx.fillStyle = 'rgba(255,230,140,0.5)';
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 12, 4, 0, Math.PI * 2);
  ctx.fill();
}


function drawGenerator(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [70, 75, 85], 0.2, 91);
  ctx.fillStyle = '#cc8833';
  ctx.fillRect(x0 + 10, y0 + 10, 12, 12);
}
function drawIceBox(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [160, 200, 230], 0.15, 92);
  ctx.strokeStyle = 'rgba(40,80,120,0.5)';
  ctx.strokeRect(x0 + 4, y0 + 4, TILE_PX - 8, TILE_PX - 8);
}
function drawWall(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [120, 120, 125], 0.2, 93);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  for (let y = 8; y < TILE_PX; y += 10) {
    ctx.beginPath(); ctx.moveTo(x0, y0 + y); ctx.lineTo(x0 + TILE_PX, y0 + y); ctx.stroke();
  }
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

  // Greedy-mesh material: UV in tile units, tile index attribute
  const greedyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      atlas: { value: texture },
      atlasN: { value: ATLAS_N },
      sunIntensity: { value: 1.0 },
      ambientColor: { value: new THREE.Color(0.4, 0.45, 0.55) },
      sunColor: { value: new THREE.Color(1.0, 0.95, 0.85) },
      sunDir: { value: new THREE.Vector3(0.4, 1.0, 0.2).normalize() },
    },
    vertexShader: `
      attribute float tile;
      varying vec2 vUv;
      varying vec4 vColor;
      varying float vTile;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vColor = color;
        vTile = tile;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D atlas;
      uniform float atlasN;
      uniform float sunIntensity;
      uniform vec3 ambientColor;
      uniform vec3 sunColor;
      uniform vec3 sunDir;
      varying vec2 vUv;
      varying vec4 vColor;
      varying float vTile;
      varying vec3 vNormal;
      void main() {
        float tx = mod(vTile, atlasN);
        float ty = floor(vTile / atlasN);
        vec2 tUv = fract(vUv);
        // tiny inset to reduce bleeding
        tUv = clamp(tUv, 0.02, 0.98);
        vec2 auv = vec2((tx + tUv.x) / atlasN, 1.0 - (ty + 1.0 - tUv.y) / atlasN);
        vec4 tex = texture2D(atlas, auv);
        if (tex.a < 0.12) discard;
        float ndl = max(0.0, dot(normalize(vNormal), normalize(sunDir)));
        vec3 light = ambientColor + sunColor * ndl * sunIntensity;
        vec3 rgb = tex.rgb * vColor.rgb * light;
        gl_FragColor = vec4(rgb, tex.a * vColor.a);
      }
    `,
    transparent: true,
    vertexColors: true,
    side: THREE.FrontSide,
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
