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

function createSeededRand(initialSeed = 42) {
  let seed = initialSeed;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function drawGrassTop(ctx, x0, y0) {
  const rand = createSeededRand(101);
  const baseR = 76, baseG = 145, baseB = 52;
  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      const noise = (rand() - 0.5) * 0.14;
      let r = clamp(baseR * (1 + noise));
      let g = clamp(baseG * (1 + noise));
      let b = clamp(baseB * (1 + noise));

      // Scatter small dark-green dots (blades of grass)
      if (rand() < 0.08) {
        r = clamp(baseR * 0.55);
        g = clamp(baseG * 0.70);
        b = clamp(baseB * 0.50);
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }
}

function drawDirt(ctx, x0, y0) {
  const rand = createSeededRand(202);
  const baseR = 120, baseG = 85, baseB = 50;
  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      const noise = (rand() - 0.5) * 0.16;
      let r = clamp(baseR * (1 + noise));
      let g = clamp(baseG * (1 + noise));
      let b = clamp(baseB * (1 + noise));

      // Small darker spots (pebbles / organic matter)
      if (rand() < 0.04) {
        r = clamp(r * 0.60);
        g = clamp(g * 0.55);
        b = clamp(b * 0.55);
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }
}

function drawGrassSide(ctx, x0, y0) {
  const rand = createSeededRand(303);
  const dirtR = 120, dirtG = 85, dirtB = 50;
  const grassR = 76, grassG = 145, grassB = 52;
  const grassDepth = Math.floor(TILE_PX * (1 / 3));

  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      // Overhang grass variation on top 1/3
      const isGrass = (y < grassDepth - 1) || (y < grassDepth + 2 && rand() > 0.45);
      const baseR = isGrass ? grassR : dirtR;
      const baseG = isGrass ? grassG : dirtG;
      const baseB = isGrass ? grassB : dirtB;

      const noise = (rand() - 0.5) * 0.15;
      let r = clamp(baseR * (1 + noise));
      let g = clamp(baseG * (1 + noise));
      let b = clamp(baseB * (1 + noise));

      if (!isGrass && rand() < 0.04) {
        r = clamp(r * 0.60);
        g = clamp(g * 0.55);
        b = clamp(b * 0.55);
      } else if (isGrass && rand() < 0.08) {
        r = clamp(grassR * 0.55);
        g = clamp(grassG * 0.70);
        b = clamp(grassB * 0.50);
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }
}

function drawStone(ctx, x0, y0) {
  const rand = createSeededRand(404);
  const baseR = 140, baseG = 140, baseB = 148;
  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      const noise = (rand() - 0.5) * 0.10;
      let r = clamp(baseR * (1 + noise));
      let g = clamp(baseG * (1 + noise));
      let b = clamp(baseB * (1 + noise));

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }

  // Thin dark stone crack lines
  ctx.strokeStyle = 'rgba(40,40,46,0.65)';
  ctx.lineWidth = 1;
  const crackRand = rnd(404);
  for (let i = 0; i < 3; i++) {
    let cx = x0 + 4 + crackRand() * 24;
    let cy = y0 + 4 + crackRand() * 24;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 3; s++) {
      cx += (crackRand() - 0.5) * 8;
      cy += (crackRand() - 0.5) * 8;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }
}

function drawSand(ctx, x0, y0) {
  const rand = createSeededRand(505);
  const baseR = 220, baseG = 200, baseB = 140;
  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      // Dune wave pattern variation
      const duneWave = Math.sin((y + x * 0.3) * 0.4) * 0.06;
      const noise = (rand() - 0.5) * 0.08 + duneWave;
      let r = clamp(baseR * (1 + noise));
      let g = clamp(baseG * (1 + noise));
      let b = clamp(baseB * (1 + noise));

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }
  // Subtle horizontal dune ripple lines
  ctx.fillStyle = 'rgba(175, 155, 95, 0.35)';
  for (let y = 6; y < TILE_PX; y += 10) {
    ctx.fillRect(x0, y0 + y, TILE_PX, 1);
  }
}

function drawWater(ctx, x0, y0) {
  const rand = createSeededRand(606);
  const baseR = 40, baseG = 90, baseB = 190;
  const alpha = 220;
  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      const noise = (rand() - 0.5) * 0.10;
      let r = clamp(baseR * (1 + noise));
      let g = clamp(baseG * (1 + noise));
      let b = clamp(baseB * (1 + noise));

      ctx.fillStyle = `rgba(${r},${g},${b},${alpha / 255})`;
      ctx.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }

  // Lighter blue streaks for water highlights
  ctx.fillStyle = 'rgba(180,220,255,0.4)';
  ctx.fillRect(x0 + 4, y0 + 8, 20, 2);
  ctx.fillRect(x0 + 10, y0 + 20, 16, 2);
}

function drawLogSide(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [105, 70, 35], 0.25, 77);
  const rand = createSeededRand(77);
  // Vertical dark bark grooves
  ctx.strokeStyle = 'rgba(45, 25, 10, 0.75)';
  for (let x = 4; x < TILE_PX; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x0 + x, y0);
    ctx.lineTo(x0 + x + (rand() - 0.5) * 2, y0 + TILE_PX);
    ctx.stroke();
  }
  // Light bark highlights
  ctx.strokeStyle = 'rgba(155, 110, 60, 0.4)';
  for (let x = 5; x < TILE_PX; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x0 + x, y0);
    ctx.lineTo(x0 + x, y0 + TILE_PX);
    ctx.stroke();
  }
}

function drawLogTop(ctx, x0, y0) {
  drawLogEndTexture(ctx, x0, y0, 'oak');
}

export function drawLogEndTexture(ctx, x0, y0, woodType = 'oak') {
  const configs = {
    oak: { heart: [160, 125, 75], sap: [200, 160, 105], ring: 'rgba(90, 60, 25, 0.7)', bark: 'rgba(65, 40, 18, 0.95)' },
    birch: { heart: [215, 200, 170], sap: [235, 225, 205], ring: 'rgba(175, 155, 120, 0.65)', bark: 'rgba(230, 230, 225, 0.95)' },
    spruce: { heart: [115, 80, 50], sap: [150, 110, 70], ring: 'rgba(75, 45, 25, 0.75)', bark: 'rgba(55, 35, 20, 0.95)' },
    jungle: { heart: [155, 105, 65], sap: [185, 135, 90], ring: 'rgba(105, 60, 30, 0.7)', bark: 'rgba(85, 50, 25, 0.95)' },
    dark_oak: { heart: [75, 50, 25], sap: [110, 75, 45], ring: 'rgba(45, 25, 10, 0.8)', bark: 'rgba(30, 18, 8, 0.95)' },
    acacia: { heart: [175, 90, 45], sap: [205, 125, 70], ring: 'rgba(120, 50, 20, 0.75)', bark: 'rgba(85, 70, 60, 0.95)' },
  };
  const cfg = configs[woodType] || configs.oak;
  fillNoise(ctx, x0, y0, cfg.heart, 0.18, 88);
  const rand = createSeededRand(88);

  // Sapwood outer ring tint
  ctx.fillStyle = `rgba(${cfg.sap[0]},${cfg.sap[1]},${cfg.sap[2]}, 0.4)`;
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 16, 14, 0, Math.PI * 2);
  ctx.fill();

  // Fine organic growth rings with wobble
  ctx.strokeStyle = cfg.ring;
  for (const r of [2, 4.5, 7, 9.5, 12, 14]) {
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.2) {
      const wobble = (rand() - 0.5) * 0.4;
      const rx = (r + wobble) * Math.cos(a);
      const ry = (r + wobble) * Math.sin(a);
      if (a === 0) ctx.moveTo(x0 + 16 + rx, y0 + 16 + ry);
      else ctx.lineTo(x0 + 16 + rx, y0 + 16 + ry);
    }
    ctx.stroke();
  }

  // Radial crack rays
  ctx.strokeStyle = 'rgba(40, 20, 10, 0.4)';
  for (let i = 0; i < 4; i++) {
    const angle = rand() * Math.PI * 2;
    const len = 4 + rand() * 8;
    ctx.beginPath();
    ctx.moveTo(x0 + 16 + Math.cos(angle) * 2, y0 + 16 + Math.sin(angle) * 2);
    ctx.lineTo(x0 + 16 + Math.cos(angle) * len, y0 + 16 + Math.sin(angle) * len);
    ctx.stroke();
  }

  // Bark rim border
  ctx.strokeStyle = cfg.bark;
  ctx.lineWidth = 2;
  ctx.strokeRect(x0, y0, TILE_PX, TILE_PX);
  ctx.lineWidth = 1;
}

export const WOOL_COLORS = {
  white: [233, 236, 236],
  orange: [240, 118, 19],
  magenta: [189, 68, 179],
  light_blue: [58, 175, 217],
  yellow: [248, 197, 39],
  lime: [112, 185, 25],
  pink: [237, 141, 172],
  gray: [62, 68, 71],
  light_gray: [142, 142, 134],
  cyan: [21, 137, 145],
  purple: [121, 42, 172],
  blue: [53, 57, 157],
  brown: [114, 71, 40],
  green: [89, 119, 22],
  red: [160, 39, 34],
  black: [20, 21, 25],
};

export function drawWoolTexture(ctx, x0, y0, colorKey = 'white') {
  const rgb = WOOL_COLORS[colorKey] || WOOL_COLORS.white;
  fillNoise(ctx, x0, y0, rgb, 0.15, 303);
  const rand = createSeededRand(303);

  // Woven fuzzy cross-hatch fabric weave
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  for (let p = 0; p < TILE_PX; p += 2) {
    ctx.beginPath();
    ctx.moveTo(x0 + p, y0); ctx.lineTo(x0 + p, y0 + TILE_PX);
    ctx.moveTo(x0, y0 + p); ctx.lineTo(x0 + TILE_PX, y0 + p);
    ctx.stroke();
  }

  // Micro fuzzy pilled tufts (raised fleece bumps)
  for (let i = 0; i < 35; i++) {
    const fx = x0 + Math.floor(rand() * (TILE_PX - 2));
    const fy = y0 + Math.floor(rand() * (TILE_PX - 2));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(fx, fy, 2, 1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(fx, fy + 1, 2, 1);
  }
}

export function drawCarpetTexture(ctx, x0, y0, colorKey = 'white') {
  drawWoolTexture(ctx, x0, y0, colorKey);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(x0, y0, TILE_PX, 1);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(x0, y0 + TILE_PX - 2, TILE_PX, 2);
}

export function drawBannerTexture(ctx, x0, y0, baseColor = 'white', pattern = 'stripes') {
  const rgb = WOOL_COLORS[baseColor] || WOOL_COLORS.white;
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(x0, y0, TILE_PX, 4);
  ctx.fillStyle = '#d8a050';
  ctx.fillRect(x0, y0, 2, 4);
  ctx.fillRect(x0 + TILE_PX - 2, y0, 2, 4);

  ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  ctx.fillRect(x0 + 4, y0 + 4, 24, 28);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let x = 6; x < 28; x += 4) {
    ctx.fillRect(x0 + x, y0 + 4, 2, 28);
  }

  ctx.save();
  ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
  ctx.strokeStyle = 'rgba(20, 20, 20, 0.85)';
  ctx.lineWidth = 2;

  if (pattern === 'stripes') {
    ctx.fillRect(x0 + 8, y0 + 4, 4, 28);
    ctx.fillRect(x0 + 16, y0 + 4, 4, 28);
  } else if (pattern === 'cross') {
    ctx.fillRect(x0 + 4, y0 + 16, 24, 4);
    ctx.fillRect(x0 + 14, y0 + 4, 4, 28);
  } else if (pattern === 'border') {
    ctx.strokeRect(x0 + 5, y0 + 5, 22, 26);
  } else if (pattern === 'creeper') {
    ctx.fillRect(x0 + 10, y0 + 10, 4, 4);
    ctx.fillRect(x0 + 18, y0 + 10, 4, 4);
    ctx.fillRect(x0 + 13, y0 + 14, 6, 8);
    ctx.fillRect(x0 + 11, y0 + 18, 3, 6);
    ctx.fillRect(x0 + 18, y0 + 18, 3, 6);
  } else {
    const grad = ctx.createLinearGradient(x0, y0 + 4, x0, y0 + 32);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(x0 + 4, y0 + 4, 24, 28);
  }
  ctx.restore();
}

export function drawShieldTexture(ctx, x0, y0, variant = 'iron', emblem = null) {
  fillNoise(ctx, x0, y0, [155, 115, 70], 0.18, 606);
  ctx.strokeStyle = 'rgba(80, 50, 20, 0.6)';
  for (let x = 6; x < TILE_PX; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x0 + x, y0); ctx.lineTo(x0 + x, y0 + TILE_PX);
    ctx.stroke();
  }

  const isIron = variant === 'iron';
  const rimColor = isIron ? 'rgba(215, 215, 220, 0.95)' : 'rgba(110, 60, 30, 0.95)';
  const rivetColor = isIron ? '#444444' : '#d0a060';

  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(x0 + 1, y0 + 1, TILE_PX - 2, TILE_PX - 2);

  ctx.fillStyle = rivetColor;
  const rivets = [[3, 3], [28, 3], [3, 28], [28, 28], [16, 3], [16, 28], [3, 16], [28, 16]];
  for (const [rx, ry] of rivets) {
    ctx.fillRect(x0 + rx - 1, y0 + ry - 1, 2, 2);
  }

  ctx.fillStyle = isIron ? '#cccccc' : '#8b5a2b';
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 16, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isIron ? '#555555' : '#4a2e18';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.moveTo(x0 + 8, y0 + 10); ctx.lineTo(x0 + 13, y0 + 22);
  ctx.moveTo(x0 + 18, y0 + 7); ctx.lineTo(x0 + 24, y0 + 15);
  ctx.stroke();
}

export function drawElytraTexture(ctx, x0, y0, side = 'left') {
  fillNoise(ctx, x0, y0, [195, 195, 190], 0.12, 707);

  ctx.fillStyle = 'rgba(150, 155, 150, 0.85)';
  ctx.beginPath();
  if (side === 'left') {
    ctx.moveTo(x0 + 28, y0 + 2);
    ctx.quadraticCurveTo(x0 + 12, y0 + 8, x0 + 4, y0 + 28);
    ctx.lineTo(x0 + 18, y0 + 30);
    ctx.closePath();
  } else {
    ctx.moveTo(x0 + 4, y0 + 2);
    ctx.quadraticCurveTo(x0 + 20, y0 + 8, x0 + 28, y0 + 28);
    ctx.lineTo(x0 + 14, y0 + 30);
    ctx.closePath();
  }
  ctx.fill();

  ctx.strokeStyle = 'rgba(90, 95, 90, 0.65)';
  ctx.lineWidth = 1.5;
  const spineX0 = side === 'left' ? x0 + 28 : x0 + 4;
  const spineY0 = y0 + 2;
  const tipX = side === 'left' ? x0 + 4 : x0 + 28;

  ctx.beginPath();
  ctx.moveTo(spineX0, spineY0);
  ctx.lineTo(tipX, y0 + 28);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(70, 75, 70, 0.45)';
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    const vx = spineX0 + (tipX - spineX0) * t;
    const vy = spineY0 + (y0 + 28 - spineY0) * t;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx + (side === 'left' ? 6 : -6), vy + 6);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(40, 45, 40, 0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x0, y0, TILE_PX, TILE_PX);
  ctx.lineWidth = 1;
}

function drawLeaves(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [55, 125, 45], 0.45, 101, 230);
  const r = rnd(12);
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(25,75,20,0.55)' : 'rgba(95,175,60,0.45)';
    ctx.beginPath();
    ctx.arc(x0 + r() * TILE_PX, y0 + r() * TILE_PX, 1 + r() * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Subtle darker leaf vein network
  ctx.strokeStyle = 'rgba(20, 65, 15, 0.45)';
  for (let i = 0; i < 5; i++) {
    const vx = x0 + 4 + r() * 22;
    const vy = y0 + 4 + r() * 22;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx + (r() - 0.5) * 8, vy + 4);
    ctx.stroke();
  }
}

function drawPlanks(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [185, 150, 90], 0.15, 15);
  const rand = createSeededRand(15);
  ctx.strokeStyle = 'rgba(90,60,25,0.7)';
  for (let y = 0; y < TILE_PX; y += 8) {
    // Horizontal seam line
    ctx.beginPath();
    ctx.moveTo(x0, y0 + y);
    ctx.lineTo(x0 + TILE_PX, y0 + y);
    ctx.stroke();
    // Bevel highlight
    ctx.strokeStyle = 'rgba(235, 205, 150, 0.4)';
    ctx.beginPath();
    ctx.moveTo(x0, y0 + y + 1);
    ctx.lineTo(x0 + TILE_PX, y0 + y + 1);
    ctx.stroke();
    // Horizontal wood grain streaks
    for (let k = 0; k < 3; k++) {
      const gy = y0 + y + 2 + Math.floor(rand() * 4);
      ctx.strokeStyle = rand() > 0.5 ? 'rgba(130, 90, 40, 0.35)' : 'rgba(215, 175, 110, 0.3)';
      ctx.beginPath();
      const startX = x0 + Math.floor(rand() * 8);
      const endX = startX + 8 + Math.floor(rand() * 16);
      ctx.moveTo(startX, gy);
      ctx.lineTo(Math.min(x0 + TILE_PX, endX), gy);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(90,60,25,0.7)';
  }
  // Detailed oak knot holes (concentric dark oval with lighter outline ring)
  const knotPositions = [{ x: 10, y: 5 }, { x: 22, y: 21 }];
  for (const k of knotPositions) {
    const kx = x0 + k.x;
    const ky = y0 + k.y;
    ctx.fillStyle = 'rgba(70, 40, 15, 0.85)';
    ctx.beginPath();
    ctx.ellipse(kx, ky, 2.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(210, 170, 110, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(kx, ky, 3.8, 2.6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawBirchPlanks(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [225, 215, 190], 0.12, 115);
  const rand = createSeededRand(115);
  ctx.strokeStyle = 'rgba(110, 95, 75, 0.65)';
  for (let y = 0; y < TILE_PX; y += 8) {
    ctx.beginPath(); ctx.moveTo(x0, y0 + y); ctx.lineTo(x0 + TILE_PX, y0 + y); ctx.stroke();
    for (let k = 0; k < 2; k++) {
      const bx = x0 + Math.floor(rand() * 24);
      const by = y0 + y + 2 + Math.floor(rand() * 3);
      ctx.fillStyle = 'rgba(45, 40, 35, 0.75)';
      ctx.fillRect(bx, by, 3 + Math.floor(rand() * 4), 1);
    }
  }
}

export function drawSprucePlanksWithResin(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [105, 68, 38], 0.18, 215);
  const rand = createSeededRand(215);
  ctx.strokeStyle = 'rgba(45, 25, 12, 0.75)';
  for (let y = 0; y < TILE_PX; y += 8) {
    ctx.beginPath(); ctx.moveTo(x0, y0 + y); ctx.lineTo(x0 + TILE_PX, y0 + y); ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const rx = x0 + 4 + rand() * 24;
    const ry = y0 + 4 + rand() * 24;
    ctx.fillStyle = 'rgba(235, 175, 40, 0.85)';
    ctx.beginPath(); ctx.arc(rx, ry, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 240, 180, 0.9)'; ctx.fillRect(rx - 0.5, ry - 0.5, 1, 1);
  }
}

export function drawGranite(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [185, 130, 115], 0.25, 415);
  const rand = createSeededRand(415);
  for (let i = 0; i < 22; i++) {
    const gx = x0 + rand() * 30;
    const gy = y0 + rand() * 30;
    ctx.fillStyle = rand() > 0.4 ? 'rgba(245, 230, 220, 0.75)' : 'rgba(60, 45, 45, 0.8)';
    ctx.fillRect(gx, gy, 1 + rand() * 2, 1 + rand() * 2);
  }
}

export function drawDiorite(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [220, 225, 225], 0.2, 515);
  const rand = createSeededRand(515);
  for (let i = 0; i < 24; i++) {
    const dx = x0 + rand() * 30;
    const dy = y0 + rand() * 30;
    ctx.fillStyle = rand() > 0.3 ? 'rgba(50, 55, 60, 0.82)' : 'rgba(160, 165, 170, 0.6)';
    ctx.fillRect(dx, dy, 1 + rand() * 2, 1 + rand() * 2);
  }
}

export function drawAndesite(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [115, 120, 122], 0.22, 615);
  const rand = createSeededRand(615);
  for (let i = 0; i < 20; i++) {
    const ax = x0 + rand() * 30;
    const ay = y0 + rand() * 30;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(70, 75, 78, 0.75)' : 'rgba(160, 168, 172, 0.5)';
    ctx.fillRect(ax, ay, 1 + rand() * 2.5, 1 + rand() * 2.5);
  }
}

export function drawPolishedGranite(ctx, x0, y0) {
  drawGranite(ctx, x0, y0);
  ctx.strokeStyle = 'rgba(255, 240, 230, 0.35)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(x0 + 1, y0 + 1, TILE_PX - 2, TILE_PX - 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; ctx.fillRect(x0 + 3, y0 + 3, 10, 4);
}

export function drawPolishedDiorite(ctx, x0, y0) {
  drawDiorite(ctx, x0, y0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(x0 + 1, y0 + 1, TILE_PX - 2, TILE_PX - 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.fillRect(x0 + 3, y0 + 3, 10, 4);
}

export function drawPolishedAndesite(ctx, x0, y0) {
  drawAndesite(ctx, x0, y0);
  ctx.strokeStyle = 'rgba(200, 210, 215, 0.35)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(x0 + 1, y0 + 1, TILE_PX - 2, TILE_PX - 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; ctx.fillRect(x0 + 3, y0 + 3, 10, 4);
}

const CONCRETE_COLORS = {
  white: '#e9ecef', orange: '#f07f1d', magenta: '#bd36b9', light_blue: '#3ab3da',
  yellow: '#fed83d', lime: '#70b919', pink: '#ed8dac', gray: '#3e4447',
  light_gray: '#8e8e86', cyan: '#158991', purple: '#792aac', blue: '#35399d',
  brown: '#6b4429', green: '#495b24', red: '#a12722', black: '#141519'
};

export function drawConcreteTexture(ctx, x0, y0, colorKey = 'white') {
  const hex = CONCRETE_COLORS[colorKey] || CONCRETE_COLORS.white;
  ctx.fillStyle = hex;
  ctx.fillRect(x0, y0, TILE_PX, TILE_PX);
  fillNoise(ctx, x0, y0, [128, 128, 128], 0.04, 715, 40);
}

export function drawTerracottaTexture(ctx, x0, y0, colorKey = 'natural') {
  const baseRgb = colorKey === 'natural' ? [150, 92, 66] : [140, 100, 80];
  fillNoise(ctx, x0, y0, baseRgb, 0.12, 815);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let y = 4; y < TILE_PX; y += 8) {
    ctx.fillRect(x0, y0 + y, TILE_PX, 2);
  }
}

export function drawPrismarine(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [40, 110, 105], 0.25, 915);
  const rand = createSeededRand(915);
  for (let i = 0; i < 12; i++) {
    const px = x0 + 3 + rand() * 24;
    const py = y0 + 3 + rand() * 24;
    ctx.fillStyle = 'rgba(90, 220, 200, 0.85)';
    ctx.beginPath(); ctx.arc(px, py, 1.8, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawNetherBricks(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [48, 22, 28], 0.2, 1015);
  ctx.strokeStyle = 'rgba(24, 10, 14, 0.9)'; ctx.lineWidth = 1.5;
  for (let y = 0; y <= TILE_PX; y += 8) {
    ctx.beginPath(); ctx.moveTo(x0, y0 + y); ctx.lineTo(x0 + TILE_PX, y0 + y); ctx.stroke();
  }
  for (let r = 0; r < 4; r++) {
    const y1 = y0 + r * 8;
    const xOffs = r % 2 === 0 ? [8, 24] : [0, 16, 32];
    for (const xo of xOffs) {
      ctx.beginPath(); ctx.moveTo(x0 + xo, y1); ctx.lineTo(x0 + xo, y1 + 8); ctx.stroke();
    }
  }
}

export function drawAcaciaLeaves(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [170, 125, 45], 0.4, 1115, 230);
  const r = rnd(1116);
  for (let i = 0; i < 22; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(190, 95, 30, 0.5)' : 'rgba(140, 150, 40, 0.45)';
    ctx.beginPath(); ctx.arc(x0 + r() * TILE_PX, y0 + r() * TILE_PX, 1.5 + r() * 2.5, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawDarkOakLeaves(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [28, 48, 28], 0.5, 1215, 240);
  const r = rnd(1216);
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = r() > 0.4 ? 'rgba(15, 25, 18, 0.7)' : 'rgba(22, 22, 38, 0.55)';
    ctx.beginPath(); ctx.arc(x0 + r() * TILE_PX, y0 + r() * TILE_PX, 1.5 + r() * 2.5, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawAzaleaLeaves(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [75, 165, 52], 0.35, 1315, 230);
  const r = rnd(1316);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = '#ff88bb';
    ctx.beginPath(); ctx.arc(x0 + 4 + r() * 24, y0 + 4 + r() * 24, 1.5, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawFloweringAzaleaLeaves(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [65, 155, 48], 0.35, 1415, 230);
  const r = rnd(1416);
  for (let i = 0; i < 12; i++) {
    const fx = x0 + 4 + r() * 24;
    const fy = y0 + 4 + r() * 24;
    ctx.fillStyle = r() > 0.3 ? '#ff66aa' : '#ffffff';
    ctx.beginPath(); ctx.arc(fx, fy, 2.2, 0, Math.PI * 2); ctx.fill();
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
  fillNoise(ctx, x0, y0, [242, 246, 252], 0.1, 50);
  const r = rnd(50);
  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      if (x < 3 || y < 3 || x > 28 || y > 28) {
        if (r() < 0.25) {
          ctx.fillStyle = 'rgba(180, 210, 245, 0.4)';
          ctx.fillRect(x0 + x, y0 + y, 1, 1);
        }
      } else if (r() < 0.04) {
        // Sparkling snow crystal dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(x0 + x, y0 + y, 1, 1);
      }
    }
  }
}

function drawIce(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [160, 210, 240], 0.2, 60, 200);
}

function drawCoal(ctx, x0, y0) {
  drawStone(ctx, x0, y0);
  const r = rnd(70);
  for (let i = 0; i < 11; i++) {
    const cx = x0 + 4 + r() * 23;
    const cy = y0 + 4 + r() * 23;
    const rad = 1.8 + r() * 2.2;
    ctx.fillStyle = 'rgba(20, 20, 24, 0.95)';
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
    // Specular highlight dot
    ctx.fillStyle = 'rgba(220, 220, 240, 0.85)';
    ctx.fillRect(cx - 0.5, cy - 0.5, 1, 1);
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
  fillNoise(ctx, x0, y0, [38, 38, 44], 0.45, 2);
  const r = rnd(2);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = r() > 0.4 ? 'rgba(15, 15, 20, 0.75)' : 'rgba(65, 52, 38, 0.6)';
    const rx = x0 + r() * 24;
    const ry = y0 + r() * 24;
    ctx.fillRect(rx, ry, 2 + r() * 6, 2 + r() * 6);
  }
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
  for (let i = 0; i < 10; i++) {
    const cx = x0 + 5 + r() * 22;
    const cy = y0 + 5 + r() * 22;
    const rad = 1.6 + r() * 2;
    ctx.fillStyle = 'rgba(190, 160, 130, 0.95)';
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(245, 230, 210, 0.9)';
    ctx.fillRect(cx - 0.5, cy - 0.5, 1, 1);
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
  ctx.fillStyle = 'rgba(210, 235, 255, 0.25)';
  ctx.fillRect(x0, y0, TILE_PX, TILE_PX);
  fillNoise(ctx, x0, y0, [195, 215, 235], 0.1, 55, 80);
  ctx.strokeStyle = 'rgba(175, 210, 240, 0.7)';
  ctx.strokeRect(x0 + 1, y0 + 1, TILE_PX - 2, TILE_PX - 2);
  ctx.strokeStyle = 'rgba(230, 245, 255, 0.5)';
  ctx.strokeRect(x0 + 4, y0 + 4, TILE_PX - 8, TILE_PX - 8);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0 + 6, y0 + 18);
  ctx.lineTo(x0 + 18, y0 + 6);
  ctx.moveTo(x0 + 12, y0 + 26);
  ctx.lineTo(x0 + 26, y0 + 12);
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawClay(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [105, 98, 77], 0.3, 66);
}

function drawBricks(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [170, 70, 50], 0.2, 77);
  const rand = createSeededRand(77);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 2; col++) {
      const bx = x0 + (row % 2 === 1 ? (col * 16 + 8) % 32 : col * 16);
      const by = y0 + row * 8;
      const shade = (rand() - 0.5) * 40;
      ctx.fillStyle = `rgb(${clamp(170 + shade)},${clamp(70 + shade * 0.5)},${clamp(50 + shade * 0.5)})`;
      ctx.fillRect(bx + 1, by + 1, 14, 6);
    }
  }
  ctx.strokeStyle = 'rgba(195, 190, 182, 0.85)';
  ctx.lineWidth = 1.5;
  for (let y = 0; y <= TILE_PX; y += 8) {
    ctx.beginPath();
    ctx.moveTo(x0, y0 + y);
    ctx.lineTo(x0 + TILE_PX, y0 + y);
    ctx.stroke();
  }
  for (let row = 0; row < 4; row++) {
    const y1 = y0 + row * 8;
    const y2 = y0 + (row + 1) * 8;
    const xOffsets = row % 2 === 0 ? [0, 16, 32] : [8, 24];
    for (const xOff of xOffsets) {
      ctx.beginPath();
      ctx.moveTo(x0 + xOff, y1);
      ctx.lineTo(x0 + xOff, y2);
      ctx.stroke();
    }
  }
  ctx.lineWidth = 1;
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

function drawLava(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [210, 80, 15], 0.3, 94);
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
  fillNoise(ctx, x0, y0, [115, 62, 30], 0.3, 200);
  ctx.strokeStyle = 'rgba(50,28,12,0.6)';
  for (let x = 3; x < TILE_PX; x += 5) {
    ctx.beginPath();
    ctx.moveTo(x0 + x, y0);
    ctx.lineTo(x0 + x, y0 + TILE_PX);
    ctx.stroke();
  }
}

function drawSequoiaLogTop(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [135, 92, 48], 0.2, 201);
  ctx.strokeStyle = 'rgba(80,45,20,0.6)';
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 16, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x0 + 16, y0 + 16, 6, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSequoiaLeaves(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [42, 110, 38], 0.5, 202, 230);
  const r = rnd(203);
  for (let i = 0; i < 25; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(25,80,22,0.5)' : 'rgba(65,135,45,0.4)';
    ctx.beginPath();
    ctx.arc(x0 + r() * TILE_PX, y0 + r() * TILE_PX, 1 + r() * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSpruceLogSide(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [65, 42, 22], 0.3, 300);
  const rand = createSeededRand(300);
  ctx.strokeStyle = 'rgba(35,20,10,0.7)';
  for (let x = 4; x < TILE_PX; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x0 + x, y0);
    ctx.lineTo(x0 + x, y0 + TILE_PX);
    ctx.stroke();
  }
  // Horizontal bark cracks
  ctx.strokeStyle = 'rgba(25, 12, 5, 0.85)';
  for (let i = 0; i < 7; i++) {
    const cx = x0 + Math.floor(rand() * 20);
    const cy = y0 + 4 + Math.floor(rand() * 24);
    const len = 6 + Math.floor(rand() * 10);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(Math.min(x0 + TILE_PX, cx + len), cy);
    ctx.stroke();
  }
}

function drawSpruceLogTop(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [95, 68, 38], 0.25, 301);
  ctx.strokeStyle = 'rgba(55,35,15,0.75)';
  for (const r of [4, 8, 12, 14]) {
    ctx.beginPath();
    ctx.arc(x0 + 16, y0 + 16, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(40,22,10,0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x0, y0, TILE_PX, TILE_PX);
  ctx.lineWidth = 1;
}

function drawSpruceLeaves(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [32, 82, 40], 0.45, 302, 225);
  const r = rnd(303);
  ctx.strokeStyle = 'rgba(15, 55, 22, 0.7)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const nx = x0 + 4 + r() * 24;
    const ny = y0 + 4 + r() * 24;
    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(nx + (r() - 0.5) * 6, ny + (r() - 0.5) * 6);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(65, 135, 70, 0.4)';
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(x0 + r() * 28, y0 + r() * 28, 2, 2);
  }
}

function drawCoral(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [205, 75, 92], 0.3, 410);
  const r = rnd(411);
  ctx.fillStyle = '#f39a8b';
  for (let i = 0; i < 7; i++) {
    const x = x0 + 3 + r() * 24;
    const y = y0 + 5 + r() * 20;
    ctx.fillRect(x, y, 3 + r() * 5, 3 + r() * 5);
  }
}

function drawKelp(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  const r = rnd(412);
  ctx.strokeStyle = '#155d39';
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
  ctx.strokeStyle = '#2f9b52';
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
  ctx.strokeStyle = '#5b3218'; ctx.lineWidth = 3;
  for (const [sx, sy, ex, ey] of [[3, 28, 15, 8], [15, 30, 22, 12], [29, 26, 18, 16]]) {
    ctx.beginPath(); ctx.moveTo(x0 + sx, y0 + sy); ctx.quadraticCurveTo(x0 + 14, y0 + 18, x0 + ex, y0 + ey); ctx.stroke();
  }
}

function drawStickPile(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.strokeStyle = '#9a6232'; ctx.lineWidth = 3;
  for (const [sx, sy, ex, ey] of [[4, 25, 26, 10], [7, 12, 28, 23], [12, 28, 21, 7]]) {
    ctx.beginPath(); ctx.moveTo(x0 + sx, y0 + sy); ctx.lineTo(x0 + ex, y0 + ey); ctx.stroke();
  }
}

function drawDampSoil(ctx, x0, y0) {
  fillNoise(ctx, x0, y0, [76, 48, 29], 0.65, 414);
  ctx.fillStyle = 'rgba(25, 18, 13, 0.35)';
  for (let i = 0; i < 8; i++) ctx.fillRect(x0 + 3 + (i * 11) % 25, y0 + 4 + (i * 7) % 24, 2, 2);
}

function drawMushroom(ctx, x0, y0) {
  ctx.clearRect(x0, y0, TILE_PX, TILE_PX);
  ctx.fillStyle = '#e0b57b'; ctx.fillRect(x0 + 14, y0 + 17, 5, 12);
  ctx.fillStyle = '#a83f35'; ctx.beginPath(); ctx.arc(x0 + 16, y0 + 15, 9, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#f2d9ae'; ctx.fillRect(x0 + 11, y0 + 12, 2, 2); ctx.fillRect(x0 + 19, y0 + 10, 2, 2);
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
    fillNoise(ctx, x, y, [90, 90, 95], 0.1, 900 + i, 255);
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
  // Sequoia variants — recolor base log/leaf painters (tiles 46–48; ATLAS_N=7 fits)
  paint(TILE.SEQUOIA_LOG_SIDE, (c, x, y) => {
    drawLogSide(c, x, y);
    c.fillStyle = 'rgba(120,40,10,0.28)';
    c.fillRect(x, y, TILE_PX, TILE_PX);
  });
  paint(TILE.SEQUOIA_LOG_TOP, (c, x, y) => {
    drawLogTop(c, x, y);
    c.fillStyle = 'rgba(140,70,30,0.25)';
    c.fillRect(x, y, TILE_PX, TILE_PX);
  });
  paint(TILE.SEQUOIA_LEAVES, (c, x, y) => {
    drawLeaves(c, x, y);
    c.fillStyle = 'rgba(20,90,20,0.22)';
    c.fillRect(x, y, TILE_PX, TILE_PX);
  });

  // Spruce variants — dark pine tones (tiles 49–51; ATLAS_N=8 fits)
  paint(TILE.SPRUCE_LOG_SIDE, drawSpruceLogSide);
  paint(TILE.SPRUCE_LOG_TOP, drawSpruceLogTop);
  paint(TILE.SPRUCE_LEAVES, drawSpruceLeaves);
  paint(TILE.CORAL, drawCoral);
  paint(TILE.KELP, drawKelp);
  paint(TILE.SEAGRASS, drawSeagrass);
  paint(TILE.PALM_LEAVES, (c, x, y) => {
    drawLeaves(c, x, y);
    c.fillStyle = 'rgba(70, 155, 48, 0.2)';
    c.fillRect(x, y, TILE_PX, TILE_PX);
  });
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
    // Opaque solid world — transparent:true caused dirt/stone side sorting holes
    transparent: false,
    alphaTest: 0.35,
    depthWrite: true,
    // DoubleSide: bad greedy winding was making dirt/stone side faces vanish (see-through hillsides)
    side: THREE.DoubleSide,
  });

  // Greedy-mesh material: UV in tile units, tile index attribute
  const greedyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      atlas: { value: texture },
      sunIntensity: { value: 1.0 },
      ambientColor: { value: new THREE.Color(0.48, 0.5, 0.58) },
      sunColor: { value: new THREE.Color(1.0, 0.95, 0.85) },
      sunDir: { value: new THREE.Vector3(0.4, 1.0, 0.2).normalize() },
    },
    vertexShader: `
      attribute float tile;
      varying vec2 vUv;
      varying vec4 vColor;
      varying vec2 vAuvBase;
      varying vec3 vNormal;
      varying float vTile;
      void main() {
        vUv = uv;
        vColor = color;
        vTile = tile;
        // Pre-compute atlas UV base in vertex shader (avoids mod/floor per fragment)
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
      varying float vTile;
      void main() {
        vec2 tUv = fract(vUv);
        // tiny inset to reduce bleeding
        tUv = clamp(tUv, 0.02, 0.98);
        vec2 auv = vAuvBase + vec2(tUv.x / ${ATLAS_N}.0, tUv.y / ${ATLAS_N}.0);
        vec4 tex = texture2D(atlas, auv);
        // Soft cutout for leaves/plants only. Force opaque write so solids never see-through.
        if (tex.a < 0.35) discard;
        // Procedural moss growth on stone/cobble top surfaces
        if ((abs(vTile - 3.0) < 0.5 || abs(vTile - 10.0) < 0.5) && vNormal.y > 0.3) {
          float mossNoise = sin(tUv.x * 24.0) * cos(tUv.y * 24.0);
          if (mossNoise > 0.1) {
            tex.rgb = mix(tex.rgb, vec3(0.22, 0.48, 0.16), 0.45);
          }
        }
        float ndl = max(0.0, abs(dot(normalize(vNormal), normalize(sunDir))));
        vec3 light = ambientColor + sunColor * ndl * sunIntensity;
        vec3 rgb = tex.rgb * max(vColor.rgb, vec3(0.15)) * light;
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

export function drawItemIconToCanvas(ctx, itemType, x0 = 0, y0 = 0, sz = 32) {
  ctx.save();
  const s = sz / 32;
  ctx.scale(s, s);

  const it = String(itemType || '').toLowerCase();
  const lx = x0 / s;
  const ly = y0 / s;
  ctx.clearRect(lx, ly, 32, 32);

  if (it.includes('pickaxe')) {
    const mat = it.includes('diamond') ? '#40e0d0' : it.includes('gold') ? '#ffd700' : it.includes('iron') ? '#d8d8d8' : it.includes('stone') ? '#888888' : '#a06a3b';
    ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx + 6, ly + 26); ctx.lineTo(lx + 22, ly + 10); ctx.stroke();
    ctx.strokeStyle = mat; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(lx + 10, ly + 6); ctx.quadraticCurveTo(lx + 24, ly + 8, lx + 26, ly + 22); ctx.stroke();
  } else if (it.includes('axe')) {
    const mat = it.includes('diamond') ? '#40e0d0' : it.includes('gold') ? '#ffd700' : it.includes('iron') ? '#d8d8d8' : it.includes('stone') ? '#888888' : '#a06a3b';
    ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx + 6, ly + 26); ctx.lineTo(lx + 22, ly + 10); ctx.stroke();
    ctx.fillStyle = mat;
    ctx.beginPath(); ctx.moveTo(lx + 16, ly + 6); ctx.lineTo(lx + 26, ly + 12); ctx.lineTo(lx + 20, ly + 20); ctx.closePath(); ctx.fill();
  } else if (it.includes('shovel')) {
    const mat = it.includes('diamond') ? '#40e0d0' : it.includes('gold') ? '#ffd700' : it.includes('iron') ? '#d8d8d8' : it.includes('stone') ? '#888888' : '#a06a3b';
    ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx + 6, ly + 26); ctx.lineTo(lx + 20, ly + 12); ctx.stroke();
    ctx.fillStyle = mat;
    ctx.beginPath(); ctx.arc(lx + 23, ly + 9, 5, 0, Math.PI * 2); ctx.fill();
  } else if (it.includes('hoe')) {
    const mat = it.includes('diamond') ? '#40e0d0' : it.includes('gold') ? '#ffd700' : it.includes('iron') ? '#d8d8d8' : it.includes('stone') ? '#888888' : '#a06a3b';
    ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx + 6, ly + 26); ctx.lineTo(lx + 22, ly + 10); ctx.stroke();
    ctx.strokeStyle = mat; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(lx + 18, ly + 8); ctx.lineTo(lx + 27, ly + 12); ctx.stroke();
  } else if (it.includes('sword')) {
    const mat = it.includes('diamond') ? '#40e0d0' : it.includes('gold') ? '#ffd700' : it.includes('iron') ? '#d8d8d8' : it.includes('stone') ? '#888888' : '#a06a3b';
    ctx.strokeStyle = mat; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx + 10, ly + 22); ctx.lineTo(lx + 26, ly + 6); ctx.stroke();
    ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx + 6, ly + 22); ctx.lineTo(lx + 14, ly + 26); ctx.stroke();
    ctx.strokeStyle = '#4a2e18'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(lx + 6, ly + 26); ctx.lineTo(lx + 4, ly + 28); ctx.stroke();
  } else if (it.includes('helmet') || it.includes('chest') || it.includes('leggings') || it.includes('boots') || it.includes('armor')) {
    const mat = it.includes('diamond') ? '#40e0d0' : it.includes('gold') ? '#ffd700' : it.includes('chain') ? '#aaaaaa' : it.includes('leather') ? '#8b5a2b' : '#d8d8d8';
    ctx.fillStyle = mat;
    ctx.beginPath(); ctx.arc(lx + 16, ly + 16, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
  } else if (it.includes('apple')) {
    ctx.fillStyle = '#ee2222';
    ctx.beginPath(); ctx.arc(lx + 16, ly + 18, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4423'; ctx.fillRect(lx + 15, ly + 6, 2, 4);
    ctx.fillStyle = '#44aa22'; ctx.beginPath(); ctx.ellipse(lx + 19, ly + 7, 3, 1.5, Math.PI/4, 0, Math.PI*2); ctx.fill();
  } else if (it.includes('chicken') || it.includes('meat') || it.includes('pork') || it.includes('food')) {
    ctx.fillStyle = '#d49b4b'; ctx.beginPath(); ctx.ellipse(lx + 18, ly + 14, 8, 6, Math.PI/6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#eeeeee'; ctx.fillRect(lx + 6, ly + 19, 6, 3);
  } else if (it.includes('bread')) {
    ctx.fillStyle = '#c48b3b'; ctx.beginPath(); ctx.ellipse(lx + 16, ly + 16, 12, 6, -Math.PI/6, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#7a4e15'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(lx + 10 + i * 5, ly + 12); ctx.lineTo(lx + 12 + i * 5, ly + 19); ctx.stroke();
    }
  } else if (it.includes('cake')) {
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(lx + 6, ly + 14, 20, 10);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(lx + 6, ly + 10, 20, 6);
    ctx.fillStyle = '#ee2222'; ctx.fillRect(lx + 10, ly + 8, 3, 3); ctx.fillRect(lx + 19, ly + 8, 3, 3);
  } else if (it.includes('shield')) {
    drawShieldTexture(ctx, lx, ly, it.includes('leather') ? 'leather' : 'iron');
  } else if (it.includes('elytra')) {
    drawElytraTexture(ctx, lx, ly, 'left');
  } else if (it.includes('banner')) {
    drawBannerTexture(ctx, lx, ly, 'white', 'stripes');
  } else if (it.includes('carpet')) {
    const col = Object.keys(WOOL_COLORS).find(c => it.includes(c)) || 'white';
    drawCarpetTexture(ctx, lx, ly, col);
  } else if (it.includes('wool')) {
    const col = Object.keys(WOOL_COLORS).find(c => it.includes(c)) || 'white';
    drawWoolTexture(ctx, lx, ly, col);
  } else if (it.includes('log') && (it.includes('top') || it.includes('end'))) {
    const wood = it.includes('birch') ? 'birch' : it.includes('spruce') ? 'spruce' : it.includes('jungle') ? 'jungle' : it.includes('dark') ? 'dark_oak' : it.includes('acacia') ? 'acacia' : 'oak';
    drawLogEndTexture(ctx, lx, ly, wood);
  } else if (it.includes('repeater') || it.includes('comparator') || it.includes('observer') || it.includes('piston')) {
    ctx.fillStyle = '#888888'; ctx.fillRect(lx + 4, ly + 10, 24, 16);
    ctx.fillStyle = '#ee2222'; ctx.fillRect(lx + 10, ly + 6, 3, 5); ctx.fillRect(lx + 19, ly + 6, 3, 5);
  } else {
    ctx.fillStyle = '#aa8866'; ctx.fillRect(lx + 8, ly + 8, 16, 16);
  }

  ctx.restore();
}

export function generateItemIconDataUrl(itemType) {
  if (typeof document === 'undefined') return '';
  const cv = document.createElement('canvas');
  cv.width = 32; cv.height = 32;
  const c = cv.getContext('2d');
  drawItemIconToCanvas(c, itemType, 0, 0, 32);
  return cv.toDataURL();
}

