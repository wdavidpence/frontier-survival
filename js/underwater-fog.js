/**
 * Deterministic fog/color values for a submerged camera.
 * @param {{underwater?: boolean, depth?: number}} [state]
 */
export function underwaterFogStyle({ underwater = false, depth = 0 } = {}) {
  if (!underwater) return { color: null, near: null, far: null, tint: 0 };
  const d = Number.isFinite(Number(depth)) ? Math.max(0, Number(depth)) : 0;
  return {
    // Teal rather than navy keeps shallow BVI reef shelves legible under the fog.
    color: 0x1b7282,
    near: Math.max(2.2, 5.5 - d * 0.12),
    far: Math.max(24, 42 - d * 0.42),
    tint: Math.min(1, 0.58 + d * 0.035),
  };
}
