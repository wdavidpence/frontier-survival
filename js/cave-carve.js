/**
 * Connected cave worms + rooms. Deterministic; uses the same hash2 contract
 * as gen.js so the worker can paste an equivalent body.
 */

export function hash2(x, z) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function wormCenter(x, z, seed, band) {
  const h = hash2(x * 3 + seed * 11 + band * 17, z * 5 + seed * 7 + band * 29);
  const v = hash2(x * 7 + band * 41, z * 11 + seed * 13);
  return { h, v };
}

/**
 * True when this stone cell should become air as part of a cave.
 * Keeps starter beaches intact: no caves above sea+2 or within the Cane Garden pad.
 */
export function shouldCarveCave(x, y, z, height, seed = 0, seaLevel = 16) {
  const yy = y | 0;
  const h = height | 0;
  if (yy < 2 || yy > h - 4) return false;
  if (h <= seaLevel + 2) return false;
  if (yy > seaLevel + 1 && h - yy < 6) return false;
  // Protect authored Cane Garden walking shelf.
  if (x >= -24 && x <= 12 && z >= -30 && z <= 4 && yy >= seaLevel - 2) return false;

  const deep = yy <= 8;
  const band = deep ? 0 : 1;
  const wx = Math.floor(x / 9);
  const wz = Math.floor(z / 9);
  const { h: n, v } = wormCenter(wx, wz, seed, band);
  if (n < (deep ? 0.62 : 0.78)) return false;

  const cx = wx * 9 + 4 + Math.floor(v * 3);
  const cz = wz * 9 + 4 + Math.floor(n * 3);
  const tunnelY = deep
    ? 3 + Math.floor(hash2(wx + seed, wz * 3) * 4)
    : Math.max(4, Math.min(h - 6, seaLevel - 4 + Math.floor(v * 6)));
  const dx = x - cx;
  const dz = z - cz;
  const dy = yy - tunnelY;
  const radius = deep ? 2.35 : 1.65;
  const along = dx * dx * 0.55 + dz * dz * 0.55 + dy * dy * 1.35;
  if (along < radius * radius) return true;

  // Occasional room off the worm.
  const room = hash2(wx * 19 + seed, wz * 23 + band);
  if (room > 0.88) {
    const rx = cx + (room > 0.94 ? 3 : -2);
    const rz = cz + (v > 0.5 ? 2 : -3);
    const r2 = (x - rx) * (x - rx) + (z - rz) * (z - rz) + (yy - tunnelY) * (yy - tunnelY) * 1.1;
    if (r2 < (deep ? 12 : 7)) return true;
  }
  return false;
}

export function caveChestSpot(x, z, seed = 0, seaLevel = 16) {
  const wx = Math.floor(x / 9);
  const wz = Math.floor(z / 9);
  const n = hash2(wx * 31 + seed * 5, wz * 37);
  if (n < 0.965) return null;
  const cx = wx * 9 + 4;
  const cz = wz * 9 + 4;
  if (x !== cx || z !== cz) return null;
  const y = 3 + Math.floor(hash2(wx, wz + seed) * 3);
  return { x: cx, y, z: cz, kind: 'cave' };
}

export function diamondVeinAt(x, y, z, seed = 0) {
  if ((y | 0) < 2 || (y | 0) > 6) return false;
  return hash2(x * 17 + (y | 0) * 13, z * 19 + seed * 3) > 0.991;
}

/**
 * Authored Cane Garden west-bank sea cave: walkable mouth, tunnel, chest.
 * Returns a block id to stamp, or null to leave generated terrain.
 */
export function starterCaveBlock(x, y, z, seaLevel = 16) {
  const along = (z | 0) + 27;
  const across = (x | 0) + 21;
  const up = (y | 0) - (seaLevel | 0);
  if (along < -1 || along > 9) return null;
  // Cobble jambs + lintel so the bay-facing mouth reads as an entrance.
  if (along <= 0) {
    if (Math.abs(across) === 2 && up >= 1 && up <= 3) return 9;
    if (Math.abs(across) <= 1 && up === 4) return 9;
  }
  if (along < 0 || along > 9) return null;
  if (up < 1 || up > 3) return null;
  const wide = along >= 7 ? 2 : 1;
  if (Math.abs(across) > wide) return null;
  if (along === 8 && across === 0 && up === 1) return 22; // chest
  if (along === 0 && across === 0 && up === 2) return 14; // mouth torch
  if (along === 8 && across === 1 && up === 3) return 14; // room torch
  return 0;
}

export const STARTER_CAVE_CHEST = Object.freeze({ x: -21, y: 17, z: -19 });
