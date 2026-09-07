/**
 * Campaign G/H/I — co-op, sensory, performance & inclusion helpers (items 83–100).
 * Pure module: deterministic, no DOM, no WebGL.
 */

/** Item 84: instant controller assignment with player-color feedback. */
export function controllerAssignment(pads) {
  const out = [];
  const colors = ['#ffd166', '#4cc9f0'];
  (pads ?? []).slice(0, 2).forEach((pad, i) => {
    out.push({ index: i, player: i === 0 ? 'P1' : 'P2', color: colors[i], connected: !!pad?.connected, name: pad?.id || 'controller' });
  });
  return out;
}

/** Item 85: shared map pings + partner callouts. */
export function sharedPings(pings, pos, partnerPos) {
  const out = [];
  for (const p of pings ?? []) {
    if (!p?.pos) continue;
    const d = Math.hypot(p.pos.x - (pos?.x || 0), p.pos.z - (pos?.z || 0));
    out.push({ ...p, distance: Math.round(d), ttl: Math.max(0, (p.ttl ?? 60) - 0) });
  }
  if (partnerPos) {
    const d = Math.hypot(partnerPos.x - (pos?.x || 0), partnerPos.z - (pos?.z || 0));
    out.push({ id: 'partner', label: 'Partner', distance: Math.round(d), ttl: 999, ping: false });
  }
  return out.filter((p) => p.ttl > 0).sort((a, b) => a.distance - b.distance).slice(0, 5);
}

/** Item 86: independent co-op quality budgets without desyncing sim. */
export function coopQualityBudget(coop, baseBudget) {
  const b = { ...(baseBudget || { particles: 160, fauna: 60, clouds: 1 }) };
  if (!coop) return b;
  return {
    particles: Math.round(b.particles * 0.6),
    fauna: Math.round(b.fauna * 0.7),
    clouds: Math.round(b.clouds * 100) / 100,
    simulationSync: true,
  };
}

/** Item 87: shared build permissions, rescue, trade, revive. */
export function coopSocial(state, actor) {
  const s = state || {};
  return {
    canBuild: actor === 'p1' || s.grantBuild !== false,
    canRevive: !!(s.downedPartner && s.distanceToPartner < 4),
    tradeWindow: !!(s.nearPartner && s.nearPartner < 3 && !s.combat),
    rescuePrompt: s.downedPartner ? `Hold F to revive partner (${Math.round(s.distanceToPartner || 0)}m)` : null,
  };
}

/** Item 89: restrained wet/material response multipliers. */
export function materialResponse(material, wetness) {
  const w = Math.max(0, Math.min(1, (Number(wetness) || 0) / 100));
  const table = {
    sand: { darken: 0.22, gloss: 0.5 },
    bark: { darken: 0.14, gloss: 0.12 },
    stone: { darken: 0.10, gloss: 0.30 },
    foliage: { darken: 0.08, gloss: 0.06 },
    metal: { darken: 0.05, gloss: 0.8 },
  };
  const m = table[material] || table.stone;
  return { darken: m.darken * w, gloss: m.gloss * w, fallback: material == null };
}

/** Item 90: moon/exposure keyframes over dayPhase (0..1). */
export function exposureKeyframe(dayPhase, storm) {
  const p = Math.max(0, Math.min(1, Number(dayPhase) || 0));
  const moon = p > 0.55 || p < 0.08;
  const dawn = p >= 0.08 && p < 0.22;
  const dusk = p >= 0.44 && p <= 0.55;
  const exposure = storm ? 0.82 : moon ? 0.9 : dawn || dusk ? 1.06 : 1.0;
  return { moon, dawn, dusk, exposure, cloudDepth: storm ? 1 : moon ? 0.35 : 0.55 };
}

/** Item 91: positional biome ambience selector. */
export function biomeAmbience(biome, night, underwater) {
  if (underwater) return 'underwater_muffle';
  if (biome === 'mangrove') return night ? 'night_insects_mangrove' : 'mangrove_drip';
  if (biome === 'beach') return night ? 'surf_night' : 'surf_day';
  if (biome === 'forest') return night ? 'owl_and_crickets' : 'birds_day';
  return 'wind_open';
}

/** Item 92: adaptive music state machine with crossfade length. */
export function musicState(prev, ctx) {
  const c = ctx || {};
  let want = 'exploration';
  if (c.underwater) want = 'ocean';
  if (c.danger > 0.6) want = 'danger';
  if (c.cave) want = 'cave';
  if (prev === want) return { state: want, crossfade: 0 };
  return { state: want, crossfade: prev === 'danger' && want === 'exploration' ? 4 : 2 };
}

/** Item 93: material footstep + tool impact selector with subtitle. */
export function footstepCue(underFoot, sprint) {
  const table = {
    sand: { cue: 'step_sand', subtitle: null },
    grass: { cue: 'step_grass', subtitle: null },
    stone: { cue: 'step_stone', subtitle: null },
    wood: { cue: 'step_wood', subtitle: null },
    water: { cue: 'splash', subtitle: '*splash*' },
  };
  const hit = table[underFoot] || table.grass;
  return { ...hit, sprintGain: sprint ? 1.15 : 1 };
}

/** Item 94: photo mode — capture without mutating world state. */
export function photoModeFlags(game) {
  return {
    hudHidden: true,
    simulationFrozen: false,
    worldMutationsBlocked: true,
    shutter: !!game?.camera,
    aspect: game?.camera?.aspect ?? 1.77,
  };
}

/** Item 97: capability detection recommendation. */
export function capabilityRecommendation(cap) {
  const c = cap || {};
  if (!c.webgl2) return { preset: 'performance', note: 'WebGL1 fallback — flat materials, tight budgets' };
  const score = (c.maxTextureSize || 4096) * (c.maxTextureUnits || 8);
  if (score > 200000) return { preset: 'visual', note: 'Full visual preset available' };
  if (score > 60000) return { preset: 'balanced', note: 'Balanced preset recommended' };
  return { preset: 'performance', note: 'Low-end GPU detected' };
}

/** Item 98: roam telemetry window summary. */
export function roamTelemetry(samples) {
  const s = (samples ?? []).filter((x) => Number.isFinite(x));
  if (!s.length) return null;
  const sorted = s.slice().sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1];
  return { frames: s.length, medianMs: Math.round(median * 100) / 100, p95Ms: Math.round(p95 * 100) / 100, stalled: p95 > 50 };
}

/** Item 99: accessibility settings bundle. */
export function accessibilityBundle(settings) {
  const s = settings || {};
  return {
    reducedMotion: !!s.reducedMotion,
    highContrast: !!s.highContrast,
    colorVisionSafe: !!s.colorVisionSafe,
    captions: s.captions !== false,
    uiScale: Math.max(0.8, Math.min(1.6, Number(s.uiScale) || 1)),
    remapping: !!s.keybinds,
  };
}

/** Item 100: release gate report shape (checker lives in tests + CI prose). */
export function releaseGateReport(input) {
  const i = input || {};
  const required = ['provenance', 'smoke', 'runtimeStart', 'consoleHealth', 'screenshot', 'mobileCheck', 'livePropagation'];
  const missing = required.filter((k) => !i[k]);
  return { pass: missing.length === 0, missing, gate: 'v1.28' };
}
