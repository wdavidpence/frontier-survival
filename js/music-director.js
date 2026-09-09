/**
 * Adaptive music mix — original beds, not Minecraft stems.
 * Returns 0..1 gains for exploration / ocean / cave / storm / danger.
 */

export function musicMix({
  biome = null,
  cave = false,
  ocean = false,
  night = false,
  storm = false,
  danger = 0,
  boat = false,
  dead = false,
} = {}) {
  if (dead) {
    return { master: 0, explore: 0, ocean: 0, cave: 0, storm: 0, danger: 0 };
  }
  const d = Math.max(0, Math.min(1, Number(danger) || 0));
  const isOcean = ocean || biome === 'ocean' || boat;
  const isCave = !!cave;
  let explore = isCave || isOcean ? 0.12 : night ? 0.22 : 0.42;
  let oceanG = isOcean ? (boat ? 0.55 : 0.38) : biome === 'shore' || biome === 'tropical' ? 0.16 : 0;
  let caveG = isCave ? 0.52 : 0;
  let stormG = storm ? 0.45 : 0;
  let dangerG = d * 0.7;
  if (dangerG > 0.35) {
    explore *= 0.35;
    oceanG *= 0.5;
  }
  if (stormG > 0) explore *= 0.45;
  return {
    master: 1,
    explore,
    ocean: oceanG,
    cave: caveG,
    storm: stormG,
    danger: dangerG,
  };
}

export function musicCrossfade(prev, next, dt, rate = 0.6) {
  const a = prev || musicMix({ dead: true });
  const b = next || musicMix();
  const t = Math.max(0, Math.min(1, (Number(dt) || 0) * rate));
  const out = {};
  for (const k of ['master', 'explore', 'ocean', 'cave', 'storm', 'danger']) {
    const av = Number(a[k]) || 0;
    const bv = Number(b[k]) || 0;
    out[k] = av + (bv - av) * t;
  }
  return out;
}

/** Pan -1..1 from world delta vs listener. */
export function spatialPan(dx, dz, maxDist = 18) {
  const d = Math.hypot(dx || 0, dz || 0);
  const pan = Math.max(-1, Math.min(1, (dx || 0) / Math.max(1, maxDist)));
  const gain = Math.max(0, 1 - d / Math.max(1, maxDist));
  return { pan, gain: gain * gain };
}
