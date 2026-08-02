/**
 * Pure cool-ocean tint helper for fauna accent colors.
 * Provides a dedicated accentColor with 'cool'/'ocean' variants,
 * plus helpers to extract and apply the cool tint.
 */

export function coolTint(baseRgb) {
  const r = Number(baseRgb?.[0]) || 0.5;
  const g = Number(baseRgb?.[1]) || 0.5;
  const b = Number(baseRgb?.[2]) || 0.5;
  return [
    Math.max(0, Math.min(1, r * 0.45)),
    Math.max(0, Math.min(1, g * 0.5)),
    Math.max(0, Math.min(1, b * 0.55 + 0.28)),
  ];
}

export function oceanTint(baseRgb) {
  const r = Number(baseRgb?.[0]) || 0.5;
  const g = Number(baseRgb?.[1]) || 0.5;
  const b = Number(baseRgb?.[2]) || 0.5;
  return [
    Math.max(0, Math.min(1, r * 0.35 + 0.15)),
    Math.max(0, Math.min(1, g * 0.4 + 0.2)),
    Math.max(0, Math.min(1, b * 0.6 + 0.25)),
  ];
}

export function applyCoolTint(color, strength) {
  const s = clamp01(Number(strength) || 0.5);
  const cool = coolTint(color);
  return [
    color[0] * (1 - s) + cool[0] * s,
    color[1] * (1 - s) + cool[1] * s,
    color[2] * (1 - s) + cool[2] * s,
  ];
}

export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
