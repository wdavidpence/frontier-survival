/** First-look clear-weather grace so a new cove stays readable. */

export const CLEAR_ARRIVAL_GRACE_SEC = 90;

export function normalizeWeatherGrace(raw, { fresh = false } = {}) {
  const n = Number(raw);
  if (Number.isFinite(n)) return Math.max(0, n);
  return fresh ? CLEAR_ARRIVAL_GRACE_SEC : 0;
}

export function applyClearArrivalTick(time, dt = 0) {
  if (!time) return time;
  const step = Number.isFinite(Number(dt)) ? Math.max(0, Number(dt)) : 0;
  const grace = Number(time.weatherGrace);
  if (!Number.isFinite(grace) || grace <= 0) {
    time.weatherGrace = 0;
    return time;
  }
  time.weatherGrace = Math.max(0, grace - step);
  time.weather = 'clear';
  return time;
}

export function clearArrivalActive(time) {
  return Number(time?.weatherGrace) > 0;
}

export function clearArrivalHudLabel(time) {
  return clearArrivalActive(time) ? 'Clear arrival' : '';
}
