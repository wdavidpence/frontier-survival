/**
 * Stronger biome identity: palettes + extra dressing flags.
 */

export const BIOME_PALETTE = Object.freeze({
  ocean: Object.freeze({ fog: [0.22, 0.42, 0.52], grass: [0.22, 0.48, 0.36], accent: [0.10, 0.55, 0.62] }),
  tropical: Object.freeze({ fog: [0.42, 0.62, 0.58], grass: [0.34, 0.64, 0.28], accent: [0.95, 0.72, 0.28] }),
  mangrove: Object.freeze({ fog: [0.28, 0.38, 0.32], grass: [0.18, 0.42, 0.24], accent: [0.22, 0.55, 0.38] }),
  shore: Object.freeze({ fog: [0.55, 0.68, 0.70], grass: [0.45, 0.58, 0.32], accent: [0.86, 0.78, 0.55] }),
  forest: Object.freeze({ fog: [0.32, 0.42, 0.28], grass: [0.22, 0.48, 0.18], accent: [0.35, 0.22, 0.12] }),
  desert: Object.freeze({ fog: [0.72, 0.62, 0.42], grass: [0.62, 0.52, 0.28], accent: [0.90, 0.70, 0.32] }),
  tundra: Object.freeze({ fog: [0.62, 0.70, 0.78], grass: [0.55, 0.62, 0.58], accent: [0.88, 0.92, 0.96] }),
});

export function paletteForBiome(biome) {
  return BIOME_PALETTE[biome] || BIOME_PALETTE.tropical;
}

export function extraDress(biome, x, z, hash01) {
  const h = typeof hash01 === 'function' ? hash01(x, z) : 0.5;
  if (biome === 'desert') return h > 0.82 ? 'scrub' : h > 0.7 ? 'sand-ripple' : null;
  if (biome === 'tundra') return h > 0.78 ? 'drift' : h > 0.6 ? 'frost' : null;
  if (biome === 'forest') return h > 0.86 ? 'litter' : h > 0.74 ? 'fern' : null;
  if (biome === 'tropical') return h > 0.9 ? 'flower' : null;
  if (biome === 'ocean') return h > 0.88 ? 'kelp' : null;
  return null;
}

export function fogTintForBiome(biome, base) {
  const p = paletteForBiome(biome);
  const b = base || [0.5, 0.6, 0.7];
  return [
    b[0] * 0.45 + p.fog[0] * 0.55,
    b[1] * 0.45 + p.fog[1] * 0.55,
    b[2] * 0.45 + p.fog[2] * 0.55,
  ];
}
