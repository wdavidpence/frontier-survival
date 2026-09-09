/**
 * Pure voxel lighting helpers. Sky light from open columns, block light from
 * emissive ids, nearest-torch gather for the greedy shader.
 */

export const LIGHT_MAX = 15;

export function clampLight(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(LIGHT_MAX, n | 0));
}

export function emitLightForBlock(blockId, table = null) {
  const id = blockId | 0;
  if (table && table[id] != null) return clampLight(table[id]);
  if (id === 14) return 12; // torch
  if (id === 15) return 14; // campfire
  if (id === 80) return 7; // candle
  if (id === 34) return 12; // lamp (when powered, caller may pass 0)
  if (id === 35) return 4; // generator
  if (id === 38) return 15; // lava
  if (id === 87) return 8; // enchant table
  return 0;
}

/** Sky light 15 at/above surface, 0 under solid cover. */
export function skyLightAt(y, surfaceY, seaLevel = 16) {
  const yy = Number(y);
  const h = Number(surfaceY);
  if (!Number.isFinite(yy) || !Number.isFinite(h)) return 0;
  if (yy >= h) return LIGHT_MAX;
  const buried = h - yy;
  if (buried <= 1) return 12;
  if (buried <= 3) return 6;
  if (yy >= seaLevel - 1 && buried <= 5) return 3;
  return 0;
}

export function combinedLight(sky, block) {
  return Math.max(clampLight(sky), clampLight(block));
}

/** Shade multiplier used by meshing / shader (0.12..1). */
export function shadeFromLight(light) {
  const t = clampLight(light) / LIGHT_MAX;
  return 0.12 + t * 0.88;
}

/**
 * Pick up to `n` nearest emissive sources for shader uniforms.
 * @param {{x:number,y:number,z:number,strength?:number}[]} sources
 */
export function nearestLights(sources, px, py, pz, n = 4) {
  const list = Array.isArray(sources) ? sources : [];
  const scored = [];
  for (const s of list) {
    if (!s) continue;
    const dx = (s.x || 0) - (px || 0);
    const dy = (s.y || 0) - (py || 0);
    const dz = (s.z || 0) - (pz || 0);
    scored.push({
      x: s.x || 0,
      y: s.y || 0,
      z: s.z || 0,
      strength: Number.isFinite(s.strength) ? s.strength : 1,
      d2: dx * dx + dy * dy + dz * dz,
    });
  }
  scored.sort((a, b) => a.d2 - b.d2);
  return scored.slice(0, Math.max(0, n | 0));
}

export function caveDarkness01(y, surfaceY, seaLevel = 16) {
  const sky = skyLightAt(y, surfaceY, seaLevel);
  return 1 - sky / LIGHT_MAX;
}
