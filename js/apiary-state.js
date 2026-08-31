/** Pure Island Apiary timing and activity rules. */
export const APIARY_HARVEST_COOLDOWN_SEC = 150;

export function pollinatorActivity({ dayPhase = 0.25, weather = 'clear', flowers = 0, distance = 0 } = {}) {
  const daylight = Math.max(0, Math.min(1, Math.sin(Math.max(0, Math.min(1, dayPhase)) * Math.PI)));
  const weatherFactor = weather === 'rain' || weather === 'snow' ? 0.12 : 1;
  const flowerFactor = Math.max(0, Math.min(1, Number(flowers || 0) / 7));
  const distanceFactor = Math.max(0, Math.min(1, 1 - Math.max(0, Number(distance || 0)) / 34));
  const activity = daylight * weatherFactor * (0.22 + flowerFactor * 0.78) * distanceFactor;
  return {
    active: activity > 0.06,
    activity,
    visibleBees: Math.round(2 + activity * 10),
    buzzGain: activity * 0.075,
  };
}

export function apiaryHarvest({ now = 0, lastHarvest = -Infinity, cooldown = APIARY_HARVEST_COOLDOWN_SEC, seed = 0 } = {}) {
  const elapsed = Math.max(0, Number(now) - Number(lastHarvest));
  const remaining = Math.max(0, cooldown - elapsed);
  if (remaining > 0) return { ready: false, remaining, honey: 0, comb: 0, wax: 0 };
  const variation = Math.abs(Math.sin((Number(seed) || 0) * 12.9898 + Math.floor(Number(now) || 0) * 0.137));
  return {
    ready: true,
    remaining: 0,
    honey: variation > 0.58 ? 2 : 1,
    comb: 1,
    wax: variation > 0.82 ? 1 : 0,
  };
}
