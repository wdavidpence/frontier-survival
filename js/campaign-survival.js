/**
 * Campaign D+E+F — survival fairness, ecology life, and ocean travel helpers.
 * Pure module: deterministic, no DOM, no randomness except seeded hash.
 */

/** Item 52: forecast windows create choices, not surprise damage. */
export function forecastWindows(forecast) {
  const out = [];
  (forecast ?? []).slice(0, 6).forEach((f, i) => {
    out.push({
      inMin: i * 10,
      weather: f.weather || 'clear',
      wind: Math.round(f.wind ?? 6),
      advice: f.weather === 'storm' ? 'Shelter now' : f.weather === 'rain' ? 'Dry kindling' : 'Travel window',
    });
  });
  return out;
}

/** Item 53: purification plan with contamination feedback. */
export function purificationPlan(source) {
  if (!source) return { ok: false, reason: 'no water source' };
  if (source.contaminated) {
    return { ok: true, method: 'Boil 45s', result: 'Clean water', warning: 'Turbid inlet — boiling required' };
  }
  return { ok: true, method: 'Filter 10s', result: 'Clean water', warning: null };
}

/** Item 54: freshness bands + preservation modifiers. */
export function freshnessBand(freshness, preserved) {
  const f = Math.max(0, Math.min(1, Number(freshness) || 0));
  const mult = preserved ? 0.4 : 1;
  const band = f > 0.7 ? 'Fresh' : f > 0.4 ? 'Good' : f > 0.15 ? 'Stale' : 'Spoiled';
  return { band, spoilRate: 0.01 * mult, eatNow: f <= 0.15 };
}

/** Item 55: warmth zones from fire, wind, wetness. */
export function warmthZone({ nearFire, wind, wetness, night }) {
  const draft = Math.max(0, 1 - (Number(wind) || 0) / 30);
  const dryness = 1 - Math.max(0, Math.min(1, (Number(wetness) || 0) / 100));
  const heat = (nearFire ? 0.55 : 0) + draft * 0.3 + dryness * 0.15 - (night ? 0.12 : 0);
  return {
    warmth: Math.max(0, Math.min(1, heat)),
    label: heat >= 0.7 ? 'Toasty' : heat >= 0.45 ? 'Comfortable' : heat >= 0.25 ? 'Drafty' : 'Cold — add fuel',
  };
}

/** Item 56: soft death recovery breadcrumb to lost pack. */
export function deathBreadcrumb(deathPos, ttlSec = 900) {
  if (!deathPos) return null;
  return { x: Math.round(deathPos.x), y: Math.round(deathPos.y), z: Math.round(deathPos.z), ttlSec, label: 'Your lost pack' };
}

/** Item 57: death recovery presets. */
export const DEATH_PRESETS = Object.freeze({
  classic: Object.freeze({ keepHotbar: false, breadcrumb: false, keepXP: false }),
  forgiving: Object.freeze({ keepHotbar: true, breadcrumb: true, keepXP: true }),
  insurance: Object.freeze({ keepHotbar: true, breadcrumb: true, keepXP: true, scattered: 0 }),
});

/** Item 58: predator telegraph phases before damage. */
export function predatorTelegraph(distance, phase) {
  if (distance > 24) return { phase: 'hidden', text: '' };
  if (distance > 12) return { phase: 'tracks', text: 'Fresh tracks nearby' };
  if (distance > 6) return { phase: 'call', text: 'A low growl carries on the wind' };
  return { phase: 'charge', text: 'It is coming — back to the fire or up a wall' };
}

/** Item 60: non-combat objective pool for builders/ecologists. */
export const NONCOMBAT_OBJECTIVES = Object.freeze([
  'tag three shorebird species',
  'dry a rack of fish',
  'map a sea cave',
  'raise a roofed shelter',
  'supply a waystation',
]);

/** Item 61: emergency recipes — useful, never optimal. */
export const EMERGENCY_RECIPES = Object.freeze([
  Object.freeze({ id: 'emergency_torch', out: 'Torch', cost: { Log: 1, Scrap: 1 }, note: 'dims fast' }),
  Object.freeze({ id: 'emergency_bandage', out: 'Bandage', cost: { Cloth: 1, Herb: 1 }, note: 'half potency' }),
  Object.freeze({ id: 'emergency_ration', out: 'Burnt Ration', cost: { RawFish: 1 }, note: 'no campfire needed' }),
]);

/** Item 62: stamina modes distinguish sprint/swim/climb/panic. */
export function staminaMode({ sprint, inWater, climbing, lowHealth }) {
  if (climbing) return { mode: 'climb', drain: 9 };
  if (inWater) return { mode: 'swim', drain: 7 };
  if (lowHealth) return { mode: 'panic', drain: 12 };
  if (sprint) return { mode: 'sprint', drain: 8 };
  return { mode: 'walk', drain: 0 };
}

/** Item 63: medical triage priority list. */
export function triagePriority(survival) {
  const s = survival || {};
  const items = [];
  if ((s.bleed ?? 0) > 0) items.push({ kind: 'bleed', priority: 1, advice: 'Bind the wound first' });
  if ((s.poison ?? 0) > 0) items.push({ kind: 'poison', priority: 2, advice: 'Purge, then bind' });
  if ((s.bodyTemp ?? 37) < 35.5) items.push({ kind: 'cold', priority: 3, advice: 'Fire and dry shelter' });
  if ((s.bodyTemp ?? 37) > 38.5) items.push({ kind: 'heat', priority: 3, advice: 'Shade and water' });
  if ((s.thirst ?? 100) < 25) items.push({ kind: 'dehydration', priority: 4, advice: 'Purify before drinking' });
  return items.sort((a, b) => a.priority - b.priority).slice(0, 4);
}

/** Item 64: rest bonus only inside a genuinely safe shelter. */
export function restBonus(shelterScore, stormOutside, predatorsNear) {
  if (predatorsNear) return { bonus: 0, text: 'Cannot rest with predators near' };
  if (shelterScore >= 0.8) return { bonus: stormOutside ? 0.9 : 0.6, text: 'Deep rest in a safe shelter' };
  if (shelterScore >= 0.5) return { bonus: 0.3, text: 'Light doze' };
  return { bonus: 0, text: 'Sleep exposed — no recovery' };
}

/** Item 65: mid-game goal ladder after first tools. */
export function midGameGoals(state) {
  const g = [];
  if (!state?.boatBuilt) g.push('Build a skiff and cross the channel');
  else if ((state?.voyages ?? 0) < 3) g.push('Chart two more islands');
  else if (!state?.smokehouse) g.push('Build a smokehouse for winter fish');
  else if ((state?.observedSpecies ?? 0) < 10) g.push('Observe ten species for the naturalist journal');
  else g.push('Raise the settlement beacon');
  return g;
}

/** Item 67: species behavior deltas (idle/flee/call/night). */
export function speciesBehavior(type, night, threatDist) {
  const nocturnal = type === 'opossum' || type === 'fox';
  if (threatDist != null && threatDist < 8) return 'flee';
  if (night) return nocturnal ? 'forage' : 'roost';
  return threatDist != null && threatDist < 18 ? 'alert' : 'idle';
}

/** Item 68: persistent field-sign generator from animal state. */
export function fieldSignFor(animal, hash01) {
  if (!animal) return null;
  const kinds = animal.aquatic ? ['wake', 'shell'] : hash01 < 0.4 ? ['track'] : hash01 < 0.65 ? ['feather'] : hash01 < 0.85 ? ['nibble'] : ['scratch'];
  return { kind: kinds[0], species: animal.type, x: Math.round(animal.x), z: Math.round(animal.z), ttlSec: 600 };
}

/** Item 69: observation rewards without killing. */
export function observationReward(observedSpecies) {
  const n = Number(observedSpecies) || 0;
  if (n >= 10) return { stamp: 'Naturalist', reward: 'Blueprint: shorebird aviary' };
  if (n >= 6) return { stamp: 'Watcher', reward: 'Field rations x2' };
  if (n >= 3) return { stamp: 'Spotter', reward: 'Journal stamp' };
  return null;
}

/** Item 70: parent/baby lifecycle with population caps. */
export function lifecycleTick(pop, cap, day) {
  const p = { ...(pop || { adults: 0, babies: 0 }) };
  if (p.adults > 0 && (p.adults + p.babies) < (cap || 8) && day % 3 === 0) p.babies += 1;
  if (p.babies > 0 && day % 6 === 0) { p.babies -= 1; p.adults += 1; }
  if ((p.adults + p.babies) > (cap || 8)) p.adults = Math.max(0, (cap || 8) - p.babies);
  return p;
}

/** Item 71: biome variant palettes. */
export function biomeVariant(biome) {
  const table = {
    tropical: { tint: '#f2e6c8', behavior: 'active', drops: ['Coconut', 'Palm Frond'] },
    mangrove: { tint: '#a9c6a0', behavior: 'skittish', drops: ['Mud Clay', 'Root Fiber'] },
    coastal: { tint: '#e8dcc2', behavior: 'foraging', drops: ['Shell', 'Seaweed'] },
  };
  return table[biome] || table.coastal;
}

/** Item 72: food-chain reaction table. */
export function foodChainReaction(who, event) {
  const key = `${who}:${event}`;
  const table = {
    'bait:drop': 'bait_school',
    'shorebird:lowtide': 'shorebird_flock',
    'reef:night': 'reef_predator_patrol',
    'carcass:any': 'scavenger_activity',
  };
  return table[key] || null;
}

/** Item 73: daily animal routines keyed to water/shade/food. */
export function dailyRoutine(night, heat, nearWater) {
  if (night) return nearWater ? 'nocturnal_drink' : 'den_rest';
  if (heat > 0.75) return 'shade_rest';
  if (nearWater) return 'graze_wateredge';
  return 'forage';
}

/** Item 74: naturalist journal card. */
export function naturalistCard(species, firstSighting) {
  return {
    species,
    silhouette: `sil_${species}`,
    call: /bird|heron|egret|chicken/.test(species) ? 'call_bird' : 'call_mammal',
    habitat: /turtle|fish|shark/.test(species) ? 'reef' : 'coast',
    firstSightingDay: firstSighting ?? null,
  };
}

/** Item 75: deterministic chunk population budget. */
export function chunkPopulationBudget(cell, seed, cap = 4) {
  const h = (Math.abs((cell.x * 73856093) ^ (cell.z * 19349663) ^ (seed | 0)) >>> 0);
  return { want: h % (cap + 1), cap };
}

/** Item 77: seamless boat loop phases. */
export function boatLoopPhase(mounted, hull, inShallows) {
  if (mounted) return 'underway';
  if (hull <= 0) return 'wrecked';
  if (inShallows) return 'beach_ready';
  return 'floating';
}

/** Item 78: wake/spray presentation values from boat speed. */
export function wakePresentation(speed, hull) {
  const s = Math.max(0, Number(speed) || 0);
  return {
    wakeScale: Math.min(1, s / 6),
    spray: s > 4 && hull > 0.5 ? 'mist' : s > 4 ? 'drip' : 'none',
    drag: hull < 0.35 ? 0.6 : 0.15,
  };
}

/** Item 79: offshore flotation fatigue + emergency return. */
export function flotationFatigue(breath, distanceShore) {
  const b = Math.max(0, Math.min(100, Number(breath) ?? 100));
  if (b < 25) return { mustSurface: true, emergencyReturn: distanceShore < 80 ? 'swim_for_it' : 'inflate_raft' };
  return { mustSurface: false, emergencyReturn: null };
}

/** Item 80: route layers visible from the boat deck. */
export function boatRouteLayers(depth) {
  const d = Number(depth) || 0;
  const layers = [];
  if (d < 3) layers.push('kelp');
  if (d < 8) layers.push('school-fish');
  if (d >= 3 && d < 14) layers.push('reef');
  if (d >= 14) layers.push('deep-water');
  if (d >= 8) layers.push('shark-patrol');
  if (d >= 4 && d <= 10) layers.push('turtle-lane');
  return layers;
}

/** Item 81: buoy/drift/current passage planner. */
export function passagePlan(from, to, currentVec) {
  const dx = to.x - from.x, dz = to.z - from.z;
  const dist = Math.hypot(dx, dz);
  const set = Math.hypot(currentVec?.x || 0, currentVec?.z || 0);
  return {
    distance: Math.round(dist),
    driftCompDeg: Math.round((Math.atan2(-(currentVec?.x || 0), -(currentVec?.z || 0)) * 180 / Math.PI + 360) % 360),
    etaMin: Math.max(1, Math.round(dist / Math.max(1.5, 5 - set))),
    buoy: (dist % 120 < 60) ? 'bearing-buoy-ahead' : 'none',
  };
}

/** Item 82: boat cosmetic journey reflections. */
export function boatStory(boat) {
  const b = boat || {};
  const repairs = Number(b.repairs) || 0;
  const voyages = Number(b.voyages) || 0;
  return {
    patches: repairs,
    pennants: Math.min(3, voyages),
    saltBleach: Math.min(1, voyages / 5),
    decal: voyages >= 3 ? 'voyager-mark' : null,
  };
}
