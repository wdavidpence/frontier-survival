/**
 * Deterministic fog/color values for a submerged camera.
 * @param {{underwater?: boolean, depth?: number}} [state]
 */
export function underwaterFogStyle({ underwater = false, depth = 0 } = {}) {
  if (!underwater) return { color: null, near: null, far: null, tint: 0 };
  const d = Number.isFinite(Number(depth)) ? Math.max(0, Number(depth)) : 0;
  return {
    color: 0x0b5368,
    near: Math.max(1.5, 3.5 - d * 0.08),
    far: Math.max(16, 30 - d * 0.55),
    tint: Math.min(1, 0.72 + d * 0.04),
  };
}
