/**
 * Cow spots + udder silhouette improvement.
 * Pure (no THREE / DOM). game.js builds Mesh groups from part lists.
 */

/**
 * Generate a set of irregular cow spots with varied sizes, positions, and organic shapes.
 * @param {{ w: number, h: number, l: number }} scale — world scale
 * @returns {{ parts: Array, names: string[] }}
 */
export function cowSpotLayout({ w, h, l }) {
  const dark = [0.15, 0.12, 0.1];
  const parts = [];
  const names = [];

  // Spot count and size variation for organic look
  const spotCount = 6;
  for (let i = 0; i < spotCount; i++) {
    const t = i / (spotCount - 1); // 0..1 progression
    // varied sizes: small to large, then taper
    const sizeVar = Math.abs(Math.sin(t * Math.PI)) * 0.6 + 0.2;
    const sx = w * 0.18 * sizeVar;
    const sy = h * 0.14 * sizeVar;
    const sz = l * 0.12 * sizeVar;

    // scattered positions along the body (z ≈ 0, spread in x/y)
    const xOff = (-w * 0.35 + t * w * 0.7) * (0.8 + Math.sin(t * 3) * 0.15);
    const yOff = (h * 0.2 + Math.cos(t * 4) * h * 0.12);

    parts.push({
      name: 'spot' + i,
      sx, sy, sz,
      x: xOff,
      y: yOff,
      z: 0,
      color: dark,
      role: 'body',
    });
    names.push('spot' + i);
  }

  return { parts, names };
}

/**
 * Generate a more realistic udder with 4 teats in a diamond/tetrad pattern.
 * @param {{ w: number, h: number, l: number }} scale — world scale
 * @returns {{ parts: Array, names: string[] }}
 */
export function cowUdderLayout({ w, h, l }) {
  const light = [0.95, 0.92, 0.88];
  const parts = [];
  const names = [];

  // base udder body: rounded, wider at bottom
  parts.push({
    name: 'udderBody',
    sx: w * 0.32,
    sy: h * 0.14,
    sz: l * 0.25,
    x: 0,
    y: h * 0.08,
    z: -l * 0.08,
    color: light,
    role: 'body',
  });

  // 4 teats arranged in a diamond pattern beneath the udder body
  const teatSx = w * 0.1;
  const teatSy = h * 0.06;
  const teatSz = l * 0.05;
  const teatY = h * 0.04;

  // diamond offsets: top, bottom, left, right
  const teatOffsets = [
    { x: 0, z: -l * 0.12 },   // top
    { x: 0, z: l * 0.12 },    // bottom
    { x: -l * 0.1, z: 0 },    // left
    { x: l * 0.1, z: 0 },     // right
  ];

  for (let i = 0; i < teatOffsets.length; i++) {
    const off = teatOffsets[i];
    parts.push({
      name: 'teat' + i,
      sx: teatSx,
      sy: teatSy,
      sz: teatSz,
      x: off.x,
      y: teatY,
      z: off.z,
      color: light,
      role: 'body',
    });
    names.push('teat' + i);
  }

  return { parts, names };
}
