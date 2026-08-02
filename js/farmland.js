/** Pure farmland moisture helpers (no DOM/canvas). */

export function clampMoisture(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** True when moisture is wet enough to accelerate crop growth. */
export function isHydratedFarmland(moisture, threshold = 0.3) {
  return clampMoisture(moisture) >= Number(threshold) || 0;
}

/**
 * Raise moisture when water is within Chebyshev distance `range`.
 * @param {{x:number,z:number,moisture?:number}} plot
 * @param {{x:number,z:number}[]} waterCells
 */
export function hydrateNearWater(plot, waterCells = [], range = 4, amount = 0.25) {
  const p = plot || { x: 0, z: 0, moisture: 0 };
  const r = Math.max(0, Number(range) || 0);
  let near = false;
  for (const w of waterCells) {
    if (!w) continue;
    const d = Math.max(Math.abs((w.x|0) - (p.x|0)), Math.abs((w.z|0) - (p.z|0)));
    if (d <= r) { near = true; break; }
  }
  const cur = clampMoisture(p.moisture);
  return {
    ...p,
    moisture: clampMoisture(near ? Math.max(cur, amount) : cur * 0.98),
    hydrated: near || cur >= 0.3,
  };
}

export default { clampMoisture, isHydratedFarmland, hydrateNearWater };
