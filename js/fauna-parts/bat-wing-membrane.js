/**
 * Bat wing membrane layout — long, thin membranous wings.
 * Pure (no THREE / DOM). game.js builds Mesh groups from part lists.
 */

export function batWingMembrane(span, thickness, name = 'wing') {
  const sx = Math.max(0.05, Number(span) || 0.8);
  const sy = Math.max(0.02, Number(thickness) || 0.06);
  const sz = Math.max(0.03, sx * 0.45);
  return {
    name,
    sx,
    sy,
    sz,
    x: 0,
    y: 0,
    z: 0,
    color: [0.15, 0.12, 0.1],
    role: 'wing',
  };
}

export function batWingLayout(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const dark = accentColor(c, 'dark');
  const cool = accentColor(c, 'cool');
  const parts = [];
  const legNames = [];
  const wingNames = ['wingL', 'wingR'];
  const eyeNames = [];

  // body
  const bodyH = h * 0.55;
  const bodyY = h * 0.45;
  parts.push(part('body', w * 0.85, bodyH, l * 0.7, 0, bodyY, 0, c, 'body'));

  // head
  const headS = w * 0.55;
  parts.push(part('head', headS, headS * 0.85, headS, 0, bodyY + bodyH * 0.35, l * 0.25, c, 'head'));

  // ears
  parts.push(part('earL', w * 0.12, h * 0.28, w * 0.06, -w * 0.18, bodyY + bodyH * 0.55, l * 0.2, dark, 'ear'));
  parts.push(part('earR', w * 0.12, h * 0.28, w * 0.06, w * 0.18, bodyY + bodyH * 0.55, l * 0.2, dark, 'ear'));

  // eyes
  addEyes(parts, eyeNames, headS, bodyY + bodyH * 0.4, l * 0.25 + headS * 0.25, w * 0.08, [0.75, 0.15, 0.15]);

  // wings: long membranous span from shoulder to hind legs
  const wingSpan = clamp01(spec?.wingSpan || 0.9);
  const wingThickness = clamp01(spec?.wingThickness || 0.07);
  const wingL = batWingMembrane(wingSpan, wingThickness, 'wingL');
  wingL.x = -w * 0.5;
  const wingR = batWingMembrane(wingSpan, wingThickness, 'wingR');
  wingR.x = w * 0.5;
  parts.push(wingL, wingR);

  // legs
  parts.push(part('legL', w * 0.08, h * 0.15, w * 0.08, -w * 0.12, bodyY - bodyH * 0.35, 0, dark, 'leg'));
  parts.push(part('legR', w * 0.08, h * 0.15, w * 0.08, w * 0.12, bodyY - bodyH * 0.35, 0, dark, 'leg'));
  legNames.push('legL', 'legR');

  // tail
  parts.push(part('tail', w * 0.08, h * 0.08, w * 0.12, 0, bodyY - bodyH * 0.1, -l * 0.35, dark, 'tail'));

  return { parts, legNames, wingNames, eyeNames };
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

function scaleOf(spec) {
  const s = spec?.scale || [0.5, 0.5, 0.7];
  return {
    w: Math.max(0.15, Number(s[0]) || 0.5),
    h: Math.max(0.15, Number(s[1]) || 0.5),
    l: Math.max(0.2, Number(s[2]) || 0.7),
  };
}

function baseCol(spec) {
  const c = spec?.color || [0.5, 0.45, 0.4];
  return [Number(c[0]) || 0.5, Number(c[1]) || 0.45, Number(c[2]) || 0.4];
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
    case 'light':
      out = [r * 0.35 + 0.55, g * 0.35 + 0.55, b * 0.35 + 0.52];
      break;
    case 'warm':
      out = [Math.min(1, r * 0.7 + 0.35), g * 0.65 + 0.12, b * 0.45];
      break;
    case 'cool':
      out = [r * 0.45, g * 0.5, Math.min(1, b * 0.55 + 0.28)];
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

function addEyes(parts, eyeNames, hx, hy, hz, eyeS, eyeColor) {
  const ex = Math.max(0.04, eyeS);
  parts.push(part('eyeL', ex, ex, ex * 0.7, -hx * 0.28, hy, hz, eyeColor, 'eye'));
  parts.push(part('eyeR', ex, ex, ex * 0.7, hx * 0.28, hy, hz, eyeColor, 'eye'));
  eyeNames.push('eyeL', 'eyeR');
}
