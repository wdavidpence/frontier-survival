/**
 * Campaign C — exploration story helpers (items 36–50).
 * Pure module: deterministic, no DOM.
 */

/** Item 37: authored landmark registry (silhouette + sea-level visibility). */
export const LANDMARKS = Object.freeze([
  Object.freeze({ id: 'sugartree', name: 'Sugarloaf Peak', x: 420, z: -360, minAlt: 34, kind: 'peak' }),
  Object.freeze({ id: 'arch', name: 'Twin Arch', x: -510, z: 240, minAlt: 12, kind: 'arch' }),
  Object.freeze({ id: 'lighthouse', name: 'Broken Lighthouse', x: 300, z: 520, minAlt: 18, kind: 'ruin' }),
  Object.freeze({ id: 'palmroyal', name: 'Royal Palm Grove', x: -180, z: -540, minAlt: 8, kind: 'grove' }),
  Object.freeze({ id: 'catalpa', name: 'Catalpa Cay', x: 640, z: 120, minAlt: 5, kind: 'cay' }),
]);

export function visibleLandmarks(pos, altitudeAt, radius = 900) {
  const out = [];
  for (const lm of LANDMARKS) {
    const d = Math.hypot(lm.x - (pos?.x || 0), lm.z - (pos?.z || 0));
    if (d > radius) continue;
    const alt = altitudeAt ? altitudeAt(lm.x, lm.z) : lm.minAlt;
    if (alt >= lm.minAlt) out.push({ ...lm, distance: d });
  }
  return out.sort((a, b) => a.distance - b.distance);
}

/** Item 38: set-piece table consumed by world gen decoration pass. */
export const SETPIECES = Object.freeze(['ruins', 'sea_cave', 'shipwreck', 'salt_pond', 'cliff_path', 'tide_puzzle']);

export function setpieceAt(cell, seed) {
  const h = (Math.abs(cell.x * 73856093 ^ cell.z * 19349663 ^ (seed | 0)) >>> 0) % 997;
  if (h > 40) return null;
  return SETPIECES[h % SETPIECES.length];
}

/** Item 39: journal page builder for discoveries. */
export function journalPage(discovery) {
  return {
    id: discovery.id || `d_${Math.round(discovery.x || 0)}_${Math.round(discovery.z || 0)}`,
    title: discovery.name || 'Unmarked place',
    position: [Math.round(discovery.x || 0), Math.round(discovery.z || 0)],
    weather: discovery.weather || 'clear',
    ecology: discovery.ecology || 'coastal',
    note: discovery.note || '',
    day: Math.max(1, Math.round(discovery.day || 1)),
  };
}

/** Item 40: locator bar entries with live bearing/distance. */
export function locatorEntries(pos, targets) {
  const out = [];
  const TAU = Math.PI * 2;
  for (const t of targets ?? []) {
    if (!t || !t.pos || !pos) continue;
    const dx = t.pos.x - pos.x, dz = t.pos.z - pos.z;
    const d = Math.hypot(dx, dz);
    const deg = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    out.push({ id: t.id, label: t.label, degrees: deg, compass: dirs[Math.round(deg / 45) % 8], distance: d, urgent: !!t.urgent });
  }
  return out.sort((a, b) => (b.urgent - a.urgent) || a.distance - b.distance).slice(0, 6);
}

/** Item 41: breadcrumb routes persisted through saves. */
export function appendBreadcrumb(trail, pos, spacing = 12) {
  const list = Array.isArray(trail) ? trail : [];
  const last = list[list.length - 1];
  if (last && Math.hypot(pos.x - last.x, pos.z - last.z) < spacing) return list;
  return [...list, { x: Math.round(pos.x), y: Math.round(pos.y), z: Math.round(pos.z) }].slice(-120);
}

/** Item 42: seed preview strip facts. */
export function seedPreviewStrip(seed, stats) {
  return {
    seed: Number(seed) || 0,
    coastKm: (Math.max(0, Number(stats?.coastCells) || 0) * 0.01).toFixed(1),
    maxRise: Math.round(Math.max(0, Number(stats?.maxRise) || 0)),
    pois: (stats?.pois ?? ['Cove', 'Reef', 'Peak']).slice(0, 3),
  };
}

/** Item 43: world-history shelf (previous seeds + why left). */
export function worldHistoryShelf(records) {
  return (records ?? [])
    .filter((r) => r && r.seed != null)
    .map((r) => ({ seed: r.seed, days: Math.round(r.days || 0), reason: r.reason || 'sailed on', ended: r.ended || 'unknown' }))
    .slice(-10)
    .reverse();
}

/** Item 44: travel cache planner — caches reduce repetition on long trips. */
export function travelCaches(route, interval = 140) {
  const pts = route ?? [];
  const caches = [];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    acc += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    if (acc >= interval) {
      acc = 0;
      caches.push({ x: pts[i].x, z: pts[i].z, restock: ['Water', 'Ration', 'Torch'] });
    }
  }
  return caches;
}

/** Item 45: fast travel only between supplied waystations. */
export function fastTravelCheck(waystations, fromId, toId, now, cooldownSec = 120) {
  const a = (waystations ?? []).find((w) => w.id === fromId);
  const b = (waystations ?? []).find((w) => w.id === toId);
  if (!a || !b) return { ok: false, reason: 'unknown waystation' };
  if (!a.supplied || !b.supplied) return { ok: false, reason: 'waystation unsupplied' };
  if ((b.lastArrival ?? -Infinity) + cooldownSec > now) return { ok: false, reason: 'beacon recharging' };
  const fuel = Math.ceil(Math.hypot(a.x - b.x, a.z - b.z) / 60);
  return { ok: true, fuel, minutes: Math.max(1, Math.round(fuel * 0.5)) };
}

/** Item 46: weather window + tide route validity. */
export function routeWeatherWindow(forecast, tideNow) {
  const safe = (forecast ?? []).findIndex((f) => f.weather === 'clear' && f.wind < 18);
  return {
    clearWindowInMin: safe < 0 ? null : safe * 10,
    landingSafe: tideNow > 0.35 && tideNow < 0.8,
    note: safe < 0 ? 'Hold at camp' : 'A clear window opens on the forecast',
  };
}

/** Item 47: exploration contracts. */
export const CONTRACT_KINDS = Object.freeze(['photograph', 'observe', 'harvest', 'repair', 'map', 'rescue']);

export function offerContract(seed, day) {
  const pick = CONTRACT_KINDS[(Math.abs((seed | 0) ^ (day * 2654435761)) >>> 0) % CONTRACT_KINDS.length];
  return { kind: pick, reward: 'journal stamp + supplies', expiresDay: day + 2 };
}

/** Item 48: rare non-hostile set-piece scheduler (rare + spaced). */
export function rareSetpiece(day, night, rng01) {
  if (rng01 > 0.06) return null;
  if (night) return rng01 < 0.03 ? 'bioluminescent_cove' : 'firefly_bank';
  return rng01 < 0.03 ? 'whale_breach' : 'flock_migration';
}

/** Item 49: distant sound cue leads toward a real discovery. */
export function distantSoundCue(pos, landmarks) {
  let best = null;
  for (const lm of landmarks ?? []) {
    const d = Math.hypot(lm.x - pos.x, lm.z - pos.z);
    if (d > 400) continue;
    if (!best || d < best.distance) best = { lm, distance: d };
  }
  if (!best) return null;
  const cue = best.lm.kind === 'cay' ? 'distant birdsong' : best.lm.kind === 'ruin' ? 'wind through stone' : 'surf against rocks';
  return { cue, toward: [best.lm.x, best.lm.z], distance: Math.round(best.distance) };
}

/** Item 50: first-expedition finale mutates visible world state on return. */
export function expeditionFinale(state, phase) {
  const s = { ...(state || {}) };
  if (phase === 'return' && s.destinationReached) {
    s.flag = 'flag_raised';
    s.bannerText = 'The voyage is logged — your camp flies the chart flag.';
    s.worldChange = 'camp_flag';
  }
  return s;
}
