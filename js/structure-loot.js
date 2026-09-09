/**
 * Authored ruin interiors + loot tables.
 */

function hash01(a, b) {
  let n = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** Deterministic sea-cave / hillside ruin anchors away from the starter pad. */
export function ruinSitesForSeed(seed = 0) {
  const sites = [
    { name: 'iron-ravine-cache', x: 44, z: 58, kind: 'ruin' },
    { name: 'white-bay-wreck-hold', x: -48, z: 14, kind: 'wreck' },
    { name: 'north-sound-cellar', x: 58, z: -8, kind: 'cellar' },
  ];
  return sites.filter((s) => hash01(s.x + seed, s.z) > 0.12);
}

export function lootTable(kind, seed = 0, slot = 0) {
  const r = hash01((seed | 0) * 17 + slot * 9, kind === 'wreck' ? 3 : kind === 'cellar' ? 5 : 1);
  if (kind === 'wreck') {
    if (r > 0.7) return { idName: 'iron_ingot', count: 2 };
    if (r > 0.4) return { idName: 'cooked_fish', count: 3 };
    return { idName: 'stick', count: 6 };
  }
  if (kind === 'cellar') {
    if (r > 0.65) return { idName: 'bread', count: 3 };
    if (r > 0.35) return { idName: 'coal', count: 4 };
    return { idName: 'seeds', count: 6 };
  }
  if (r > 0.82) return { idName: 'diamond', count: 1 };
  if (r > 0.5) return { idName: 'iron_ingot', count: 1 };
  return { idName: 'coal', count: 3 };
}

export function ruinBlockAt(x, y, z, sites = [], groundFn) {
  for (const site of sites) {
    const dx = x - site.x;
    const dz = z - site.z;
    if (Math.abs(dx) > 2 || Math.abs(dz) > 2) continue;
    const g = typeof groundFn === 'function' ? groundFn(site.x, site.z) : 18;
    const gy = g | 0;
    if (y === gy && Math.abs(dx) <= 2 && Math.abs(dz) <= 2) return 'cobble';
    if (y === gy + 1 && (Math.abs(dx) === 2 || Math.abs(dz) === 2) && !(dx === 0 && dz === 2)) return 'cobble';
    if (y === gy + 2 && Math.abs(dx) <= 1 && Math.abs(dz) <= 1) return 'slab';
    if (y === gy + 1 && dx === 0 && dz === 0) return 'chest';
    if (y === gy + 1 && Math.abs(dx) < 2 && Math.abs(dz) < 2) return 'air';
  }
  return null;
}
