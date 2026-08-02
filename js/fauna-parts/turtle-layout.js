/**
 * Sea turtle layout — carapace, plastron, head, flippers, tail.
 * Pure (no THREE / DOM). game.js builds Mesh groups from part lists.
 */

export function seaTurtleLayout(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const belly = accentColor(c, 'belly');
  const dark = accentColor(c, 'dark');
  const parts = [];
  const legNames = [];
  const wingNames = [];
  const eyeNames = [];

  // Carapace (top shell) — main body
  const carapaceH = h * 0.55;
  const carapaceY = h * 0.35;
  parts.push(part('carapace', w * 0.9, carapaceH, l * 0.85, 0, carapaceY, 0, c, 'body'));

  // Plastron (belly shell) — slightly recessed
  const plastronH = h * 0.4;
  const plastronY = carapaceY - carapaceH * 0.15;
  parts.push(part('plastron', w * 0.75, plastronH, l * 0.7, 0, plastronY, 0.02, belly, 'body'));

  // Head — small, positioned forward
  const headS = w * 0.35;
  const headY = carapaceY + carapaceH * 0.45;
  const headZ = l * 0.25;
  parts.push(part('head', headS, headS * 0.8, headS * 0.9, 0, headY, headZ, c, 'head'));

  // Neck — connects head to body
  const neckS = w * 0.15;
  const neckH = h * 0.25;
  parts.push(part('neck', neckS, neckH, neckS * 0.9, 0, carapaceY + carapaceH * 0.3, headZ - headS * 0.1, dark, 'neck'));

  // Front flippers — large, paddle-shaped
  const flipperW = w * 0.45;
  const flipperH = h * 0.4;
  const flipperL = l * 0.35;
  parts.push(part('flipperFL', flipperW, flipperH, flipperL, -w * 0.25, carapaceY + carapaceH * 0.1, -l * 0.4, c, 'flipper'));
  parts.push(part('flipperFR', flipperW, flipperH, flipperL, w * 0.25, carapaceY + carapaceH * 0.1, -l * 0.4, c, 'flipper'));

  // Back flippers — smaller, angled
  const backFlipperW = w * 0.3;
  const backFlipperH = h * 0.25;
  const backFlipperL = l * 0.3;
  parts.push(part('flipperBL', backFlipperW, backFlipperH, backFlipperL, -w * 0.15, carapaceY + carapaceH * 0.25, -l * 0.45, dark, 'flipper'));
  parts.push(part('flipperBR', backFlipperW, backFlipperH, backFlipperL, w * 0.15, carapaceY + carapaceH * 0.25, -l * 0.45, dark, 'flipper'));

  // Tail — small, posterior
  const tailS = w * 0.1;
  const tailL = l * 0.3;
  parts.push(part('tail', tailS, tailS * 0.6, tailL, 0, carapaceY + carapaceH * 0.5, -l * 0.42, dark, 'tail'));

  // Eyes — small dots on head
  const eyeS = w * 0.06;
  parts.push(part('eyeL', eyeS, eyeS * 0.7, eyeS * 0.5, -headS * 0.2, headY + headS * 0.1, headZ + headS * 0.3, [0.05, 0.05, 0.06], 'eye'));
  parts.push(part('eyeR', eyeS, eyeS * 0.7, eyeS * 0.5, headS * 0.2, headY + headS * 0.1, headZ + headS * 0.3, [0.05, 0.05, 0.06], 'eye'));
  eyeNames.push('eyeL', 'eyeR');

  return { parts, legNames, wingNames, eyeNames };
}

function scaleOf(spec) {
  const s = spec?.scale || [0.5, 0.5, 0.7];
  return {
    w: Math.max(0.15, Number(s[0]) || 0.5),
    h: Math.max(0.15, Number(s[1]) || 0.5),
    l: Math.max(0.2, Number(s[2]) || 0.7),
  };
}

function baseCol(spec) {
  const c = spec?.color || [0.35, 0.4, 0.38];
  return [Number(c[0]) || 0.35, Number(c[1]) || 0.4, Number(c[2]) || 0.38];
}

function accentColor(baseRgb, kind) {
  const r = Number(baseRgb?.[0]) || 0.5;
  const g = Number(baseRgb?.[1]) || 0.5;
  const b = Number(baseRgb?.[2]) || 0.5;
  let out;
  switch (kind) {
    case 'belly':
      out = [r * 0.55 + 0.42, g * 0.55 + 0.4, b * 0.55 + 0.36];
      break;
    case 'dark':
      out = [r * 0.55, g * 0.52, b * 0.5];
      break;
    default:
      out = [r, g, b];
  }
  return [
    Math.max(0, Math.min(1, out[0])),
    Math.max(0, Math.min(1, out[1])),
    Math.max(0, Math.min(1, out[2])),
  ];
}

function part(name, sx, sy, sz, x, y, z, color, role) {
  return {
    name,
    sx: Math.max(0.02, sx),
    sy: Math.max(0.02, sy),
    sz: Math.max(0.02, sz),
    x,
    y,
    z,
    color: [color[0], color[1], color[2]],
    role: role || name,
  };
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
