/**
 * Parrot layout — body, head, beak, wings, tail, eyes, feet.
 * Pure (no THREE / DOM). game.js builds Mesh groups from part lists.
 */

export function parrotLayout(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const dark = accentColor(c, 'dark');
  const bright = accentColor(c, 'bright');
  const parts = [];
  const legNames = [];
  const wingNames = [];
  const eyeNames = [];

  // Body (main torso) — large, rounded
  const bodyW = w * 0.7;
  const bodyH = h * 0.65;
  const bodyL = l * 0.7;
  parts.push(part('body', bodyW, bodyH, bodyL, 0, 0, 0, c, 'body'));

  // Head — small, positioned forward
  const headS = w * 0.35;
  const headY = h * 0.25;
  const headZ = l * 0.2;
  parts.push(part('head', headS, headS * 0.8, headS * 0.9, 0, headY, headZ, c, 'head'));

  // Beak — small, pointed, bright color
  const beakW = w * 0.15;
  const beakH = h * 0.2;
  const beakL = l * 0.15;
  parts.push(part('beak', beakW, beakH, beakL, headS * 0.45, headY + headS * 0.3, headZ + headS * 0.2, bright, 'beak'));

  // Left wing — large, colorful
  const wingW = w * 0.6;
  const wingH = h * 0.5;
  const wingL = l * 0.4;
  parts.push(part('wingL', wingW, wingH, wingL, -w * 0.35, 0, 0, bright, 'wing'));

  // Right wing — large, colorful
  const wingWR = w * 0.6;
  const wingHR = h * 0.5;
  const wingLR = l * 0.4;
  parts.push(part('wingR', wingWR, wingHR, wingLR, w * 0.35, 0, 0, bright, 'wing'));

  // Tail — long, colorful feathers
  const tailW = w * 0.3;
  const tailH = h * 0.15;
  const tailL = l * 0.8;
  parts.push(part('tail', tailW, tailH, tailL, 0, -h * 0.2, -l * 0.6, dark, 'tail'));

  // Eyes — large, expressive
  const eyeS = w * 0.08;
  parts.push(part('eyeL', eyeS, eyeS * 0.9, eyeS * 0.7, -headS * 0.25, headY + headS * 0.1, headZ + headS * 0.3, [0.05, 0.05, 0.06], 'eye'));
  parts.push(part('eyeR', eyeS, eyeS * 0.9, eyeS * 0.7, headS * 0.25, headY + headS * 0.1, headZ + headS * 0.3, [0.05, 0.05, 0.06], 'eye'));
  eyeNames.push('eyeL', 'eyeR');

  // Feet — small, positioned below body
  const footW = w * 0.12;
  const footH = h * 0.15;
  const footL = l * 0.15;
  parts.push(part('footL', footW, footH, footL, -w * 0.15, -h * 0.35, 0, dark, 'foot'));
  parts.push(part('footR', footW, footH, footL, w * 0.15, -h * 0.35, 0, dark, 'foot'));
  legNames.push('footL', 'footR');

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
    case 'bright':
      out = [r * 1.3, g * 1.2, b * 1.1];
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
