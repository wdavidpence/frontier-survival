/**
 * Pure wind charge burst radius (MC 1.21).
 */

export const WIND_CHARGE_RADIUS = 2.5;
export const WIND_CHARGE_KNOCK = 0.9;

/**
 * Whether entity is inside burst sphere.
 * @param {{x:number,y:number,z:number}} center
 * @param {{x:number,y:number,z:number}} entity
 * @param {number} [radius=WIND_CHARGE_RADIUS]
 */
export function windChargeHits(center, entity, radius = WIND_CHARGE_RADIUS) {
  const r = Math.max(0, Number(radius) || WIND_CHARGE_RADIUS);
  const dx = (entity?.x ?? 0) - (center?.x ?? 0);
  const dy = (entity?.y ?? 0) - (center?.y ?? 0);
  const dz = (entity?.z ?? 0) - (center?.z ?? 0);
  return Math.hypot(dx, dy, dz) <= r;
}

/**
 * Outward knock strength scaled by distance (edge softer).
 */
export function windChargeKnockStrength(center, entity, radius = WIND_CHARGE_RADIUS, maxKnock = WIND_CHARGE_KNOCK) {
  const r = Math.max(0.01, Number(radius) || WIND_CHARGE_RADIUS);
  const dx = (entity?.x ?? 0) - (center?.x ?? 0);
  const dy = (entity?.y ?? 0) - (center?.y ?? 0);
  const dz = (entity?.z ?? 0) - (center?.z ?? 0);
  const d = Math.hypot(dx, dy, dz);
  if (d > r) return 0;
  const t = 1 - d / r;
  return Math.max(0, Number(maxKnock) || WIND_CHARGE_KNOCK) * t;
}
