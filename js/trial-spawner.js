/**
 * Pure trial spawner wave counter (MC 1.21).
 */

/**
 * @typedef {{ wave: number, mobsAlive: number, cooldown: number, ominous: boolean }} TrialSpawnerState
 */

export function createTrialSpawner(ominous = false) {
  return { wave: 0, mobsAlive: 0, cooldown: 0, ominous: !!ominous };
}

/**
 * Start next wave if idle.
 * @param {TrialSpawnerState} state
 * @param {number} [mobsPerWave=3]
 */
export function trialSpawnerStartWave(state, mobsPerWave = 3) {
  const s = state || createTrialSpawner();
  if (s.mobsAlive > 0 || s.cooldown > 0) return { ok: false, state: s };
  s.wave += 1;
  const n = Math.max(1, mobsPerWave | 0) + (s.ominous ? 1 : 0);
  s.mobsAlive = n;
  return { ok: true, state: s, spawnCount: n };
}

export function trialSpawnerMobDied(state) {
  const s = state || createTrialSpawner();
  s.mobsAlive = Math.max(0, (s.mobsAlive | 0) - 1);
  if (s.mobsAlive === 0) s.cooldown = 40;
  return s;
}

export function trialSpawnerTickCooldown(state, dt = 1) {
  const s = state || createTrialSpawner();
  if (s.cooldown > 0) s.cooldown = Math.max(0, s.cooldown - Math.max(0, Number(dt) || 0));
  return s;
}

export function trialSpawnerIsIdle(state) {
  return (state?.mobsAlive || 0) === 0 && (state?.cooldown || 0) <= 0;
}
