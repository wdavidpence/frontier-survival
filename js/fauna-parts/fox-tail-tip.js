/**
 * Fox tail tip contrast improvement.
 * Pure (no THREE / DOM). game.js builds Mesh groups from part lists.
 */

/**
 * Generate a fox tail with high-contrast tip (white/cream tip on dark body).
 * @param {{ w: number, h: number, l: number }} scale — world scale
 * @returns {{ parts: Array, names: string[] }}
 */
export function foxTailLayout({ w, h, l }) {
  const dark = [0.12, 0.08, 0.06];
  const cream = [0.95, 0.93, 0.88];
  const parts = [];
  const names = [];

  // main tail body: fluffy, dark fur
  parts.push({
    name: 'tailBody',
    sx: w * 0.28,
    sy: w * 0.28,
    sz: l * 0.55,
    x: 0,
    y: h * 0.05,
    z: -l * 0.5,
    color: dark,
    role: 'tail',
  });

  // fluffy tip: bright cream/white for high contrast against dark body
  parts.push({
    name: 'tailTip',
    sx: w * 0.22,
    sy: w * 0.22,
    sz: w * 0.22,
    x: 0,
    y: h * 0.08,
    z: -l * 0.72,
    color: cream,
    role: 'tail',
  });

  return { parts, names };
}
