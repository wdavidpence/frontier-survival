/**
 * Boar tusk length and readability improvement.
 * Pure (no THREE / DOM). game.js builds Mesh groups from part lists.
 */

/**
 * Generate long, curved tusks with clear visibility.
 * @param {{ w: number, h: number, l: number }} scale — world scale
 * @returns {{ parts: Array, names: string[] }}
 */
export function boarTuskLayout({ w, h, l }) {
  const dark = [0.18, 0.15, 0.12];
  const ivory = [0.92, 0.93, 0.9];
  const parts = [];
  const names = [];

  // tusks: long, curved, projecting forward from snout
  const tuskSx = w * 0.18;
  const tuskSy = h * 0.12;
  const tuskSz = l * 0.65;

  // left tusk — curves outward and forward
  parts.push({
    name: 'tuskL',
    sx: tuskSx,
    sy: tuskSy,
    sz: tuskSz,
    x: -w * 0.12,
    y: h * 0.08,
    z: l * 0.35,
    color: ivory,
    role: 'tusk',
  });

  // right tusk — curves outward and forward
  parts.push({
    name: 'tuskR',
    sx: tuskSx,
    sy: tuskSy,
    sz: tuskSz,
    x: w * 0.12,
    y: h * 0.08,
    z: l * 0.35,
    color: ivory,
    role: 'tusk',
  });

  return { parts, names };
}
