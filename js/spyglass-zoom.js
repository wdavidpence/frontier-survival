/**
 * Pure spyglass FOV scale helper.
 */
export const SPYGLASS_FOV_SCALE = 0.1;
export function spyglassFov(baseFov, using = true, scale = SPYGLASS_FOV_SCALE) {
  const base = Number(baseFov) || 70;
  if (!using) return base;
  const s = Math.max(0.05, Math.min(1, Number(scale) || SPYGLASS_FOV_SCALE));
  return base * s;
}
export function spyglassSensitivity(baseSens, using = true) {
  const s = Number(baseSens) || 1;
  return using ? s * 0.15 : s;
}
