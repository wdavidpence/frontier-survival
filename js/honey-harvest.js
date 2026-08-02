/**
 * Pure honey-hive harvest rules. A hive refills slowly and harvesting without
 * smoke/campfire calm enrages the resident bees for a short chase window.
 */

export const HONEY_HARVEST = Object.freeze({
  capacity: 3,
  refillSeconds: 45,
  angrySeconds: 12,
  honeyPerHarvest: 1,
});

export function createHoneyHive(overrides = {}) {
  return {
    honey: Math.max(0, Math.min(HONEY_HARVEST.capacity, overrides.honey ?? HONEY_HARVEST.capacity)),
    refillT: Math.max(0, overrides.refillT ?? 0),
    harvestCooldown: Math.max(0, overrides.harvestCooldown ?? 0),
    harvested: !!overrides.harvested,
  };
}

export function tickHoneyHive(hive, dt) {
  if (!hive || !Number.isFinite(dt) || dt <= 0) return hive;
  hive.harvestCooldown = Math.max(0, (hive.harvestCooldown || 0) - dt);
  if ((hive.honey || 0) < HONEY_HARVEST.capacity) {
    hive.refillT = (hive.refillT || 0) + dt;
    while (hive.refillT >= HONEY_HARVEST.refillSeconds && hive.honey < HONEY_HARVEST.capacity) {
      hive.refillT -= HONEY_HARVEST.refillSeconds;
      hive.honey++;
    }
  } else {
    hive.refillT = 0;
  }
  return hive;
}

export function harvestHoney(hive, { calm = false } = {}) {
  if (!hive) return { ok: false, honey: 0, angered: false, reason: 'missing hive' };
  if ((hive.harvestCooldown || 0) > 0) return { ok: false, honey: 0, angered: false, reason: 'hive recovering' };
  if ((hive.honey || 0) < HONEY_HARVEST.honeyPerHarvest) {
    return { ok: false, honey: 0, angered: false, reason: 'hive is empty' };
  }
  hive.honey -= HONEY_HARVEST.honeyPerHarvest;
  hive.harvestCooldown = 2;
  hive.harvested = true;
  const angered = !calm;
  return {
    ok: true,
    honey: HONEY_HARVEST.honeyPerHarvest,
    angered,
    angryT: angered ? HONEY_HARVEST.angrySeconds : 0,
    reason: angered ? 'bees angered' : 'calm harvest',
  };
}
