/**
 * Procedural multi-box creature silhouettes + limb walk/fly poses.
 * Pure (no THREE / DOM). game.js builds Mesh groups from part lists.
 */
export function accentColor(baseRgb, kind) {
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

function quadLegs(parts, legNames, w, h, l, legH, legT, y0, color, spreadX, spreadZ) {
  const dark = accentColor(color, 'dark');
  const specs = [
    ['legFL', -spreadX, spreadZ],
    ['legFR', spreadX, spreadZ],
    ['legBL', -spreadX, -spreadZ],
    ['legBR', spreadX, -spreadZ],
  ];
  for (const [name, x, z] of specs) {
    parts.push(part(name, legT, legH, legT, x, y0 + legH * 0.5, z, dark, 'leg'));
    legNames.push(name);
  }
}

function addEyes(parts, eyeNames, hx, hy, hz, eyeS, eyeColor) {
  const ex = Math.max(0.04, eyeS);
  parts.push(part('eyeL', ex, ex, ex * 0.7, -hx * 0.28, hy, hz, eyeColor, 'eye'));
  parts.push(part('eyeR', ex, ex, ex * 0.7, hx * 0.28, hy, hz, eyeColor, 'eye'));
  eyeNames.push('eyeL', 'eyeR');
}

function layoutHare(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const belly = accentColor(c, 'belly');
  const dark = accentColor(c, 'dark');
  const parts = [];
  const legNames = [];
  const wingNames = [];
  const eyeNames = [];
  const legH = h * 0.28;
  const bodyH = h * 0.42;
  const bodyY = legH + bodyH * 0.5;
  parts.push(part('body', w * 0.95, bodyH, l * 0.75, 0, bodyY, 0, c, 'body'));
  parts.push(part('belly', w * 0.7, bodyH * 0.35, l * 0.55, 0, bodyY - bodyH * 0.12, 0.02, belly, 'body'));
  const headS = w * 0.55;
  const headY = legH + bodyH + headS * 0.25;
  const headZ = l * 0.28;
  parts.push(part('head', headS, headS * 0.85, headS * 0.9, 0, headY, headZ, c, 'head'));
  parts.push(part('snout', headS * 0.45, headS * 0.35, headS * 0.4, 0, headY - headS * 0.05, headZ + headS * 0.45, dark, 'snout'));
  parts.push(part('earL', w * 0.12, h * 0.38, w * 0.08, -w * 0.18, headY + headS * 0.55, headZ - headS * 0.05, dark, 'ear'));
  parts.push(part('earR', w * 0.12, h * 0.38, w * 0.08, w * 0.18, headY + headS * 0.55, headZ - headS * 0.05, dark, 'ear'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.1, headZ + headS * 0.35, w * 0.08, [0.05, 0.05, 0.06]);
  parts.push(part('tail', w * 0.22, w * 0.22, w * 0.22, 0, bodyY + bodyH * 0.1, -l * 0.38, belly, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.14, 0, c, w * 0.28, l * 0.22);
  return { parts, legNames, wingNames, eyeNames };
}

function layoutDeer(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const belly = accentColor(c, 'belly');
  const dark = accentColor(c, 'dark');
  const parts = [];
  const legNames = [];
  const wingNames = [];
  const eyeNames = [];
  const legH = h * 0.48;
  const bodyH = h * 0.32;
  const bodyY = legH + bodyH * 0.5;
  parts.push(part('body', w * 0.85, bodyH, l * 0.85, 0, bodyY, 0, c, 'body'));
  parts.push(part('belly', w * 0.65, bodyH * 0.4, l * 0.6, 0, bodyY - bodyH * 0.15, 0, belly, 'body'));
  const neckH = h * 0.18;
  parts.push(part('neck', w * 0.28, neckH, w * 0.32, 0, bodyY + bodyH * 0.35 + neckH * 0.35, l * 0.32, c, 'body'));
  const headS = w * 0.42;
  const headY = bodyY + bodyH * 0.35 + neckH + headS * 0.25;
  const headZ = l * 0.42;
  parts.push(part('head', headS, headS * 0.7, headS * 1.05, 0, headY, headZ, c, 'head'));
  parts.push(part('snout', headS * 0.4, headS * 0.35, headS * 0.55, 0, headY - headS * 0.05, headZ + headS * 0.5, dark, 'snout'));
  parts.push(part('earL', w * 0.1, h * 0.12, w * 0.06, -w * 0.16, headY + headS * 0.35, headZ - headS * 0.1, dark, 'ear'));
  parts.push(part('earR', w * 0.1, h * 0.12, w * 0.06, w * 0.16, headY + headS * 0.35, headZ - headS * 0.1, dark, 'ear'));
  parts.push(part('hornL', w * 0.06, h * 0.16, w * 0.06, -w * 0.12, headY + headS * 0.55, headZ, accentColor(c, 'light'), 'horn'));
  parts.push(part('hornR', w * 0.06, h * 0.16, w * 0.06, w * 0.12, headY + headS * 0.55, headZ, accentColor(c, 'light'), 'horn'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.08, headZ + headS * 0.25, w * 0.07, [0.08, 0.06, 0.04]);
  parts.push(part('tail', w * 0.1, h * 0.14, w * 0.1, 0, bodyY + bodyH * 0.2, -l * 0.42, dark, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.12, 0, c, w * 0.28, l * 0.28);
  return { parts, legNames, wingNames, eyeNames };
}

function layoutWolf(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const belly = accentColor(c, 'belly');
  const dark = accentColor(c, 'dark');
  const parts = [];
  const legNames = [];
  const wingNames = [];
  const eyeNames = [];
  const legH = h * 0.38;
  const bodyH = h * 0.4;
  const bodyY = legH + bodyH * 0.5;
  parts.push(part('body', w * 0.9, bodyH, l * 0.8, 0, bodyY, 0, c, 'body'));
  parts.push(part('belly', w * 0.7, bodyH * 0.4, l * 0.55, 0, bodyY - bodyH * 0.12, 0.02, belly, 'body'));
  const headS = w * 0.55;
  const headY = bodyY + bodyH * 0.15;
  const headZ = l * 0.38;
  parts.push(part('head', headS, headS * 0.75, headS * 0.85, 0, headY, headZ, c, 'head'));
  parts.push(part('snout', headS * 0.42, headS * 0.38, headS * 0.7, 0, headY - headS * 0.08, headZ + headS * 0.55, dark, 'snout'));
  parts.push(part('earL', w * 0.14, h * 0.22, w * 0.1, -w * 0.18, headY + headS * 0.48, headZ - headS * 0.05, dark, 'ear'));
  parts.push(part('earR', w * 0.14, h * 0.22, w * 0.1, w * 0.18, headY + headS * 0.48, headZ - headS * 0.05, dark, 'ear'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.12, headZ + headS * 0.28, w * 0.09, [0.85, 0.75, 0.25]);
  parts.push(part('tail', w * 0.22, w * 0.22, l * 0.45, 0, bodyY + bodyH * 0.1, -l * 0.48, dark, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.16, 0, c, w * 0.3, l * 0.26);
  return { parts, legNames, wingNames, eyeNames };
}

function layoutBear(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const belly = accentColor(c, 'belly');
  const dark = accentColor(c, 'dark');
  const parts = [];
  const legNames = [];
  const wingNames = [];
  const eyeNames = [];
  const legH = h * 0.32;
  const bodyH = h * 0.5;
  const bodyY = legH + bodyH * 0.5;
  parts.push(part('body', w * 1.05, bodyH, l * 0.85, 0, bodyY, 0, c, 'body'));
  parts.push(part('belly', w * 0.85, bodyH * 0.4, l * 0.6, 0, bodyY - bodyH * 0.1, 0, belly, 'body'));
  const headS = w * 0.55;
  const headY = bodyY + bodyH * 0.2;
  const headZ = l * 0.4;
  parts.push(part('head', headS * 1.05, headS * 0.9, headS * 0.95, 0, headY, headZ, c, 'head'));
  parts.push(part('snout', headS * 0.5, headS * 0.4, headS * 0.45, 0, headY - headS * 0.1, headZ + headS * 0.45, dark, 'snout'));
  parts.push(part('earL', w * 0.16, h * 0.12, w * 0.1, -w * 0.28, headY + headS * 0.42, headZ, dark, 'ear'));
  parts.push(part('earR', w * 0.16, h * 0.12, w * 0.1, w * 0.28, headY + headS * 0.42, headZ, dark, 'ear'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.1, headZ + headS * 0.3, w * 0.08, [0.05, 0.05, 0.05]);
  parts.push(part('tail', w * 0.14, w * 0.12, w * 0.12, 0, bodyY - bodyH * 0.05, -l * 0.4, dark, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.24, 0, c, w * 0.34, l * 0.28);
  return { parts, legNames, wingNames, eyeNames };
}

function layoutBird(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const belly = accentColor(c, 'belly');
  const dark = accentColor(c, 'dark');
  const cool = accentColor(c, 'cool');
  const parts = [];
  const legNames = [];
  const wingNames = ['wingL', 'wingR'];
  const eyeNames = [];
  const legH = h * 0.25;
  const bodyH = h * 0.45;
  const bodyY = legH + bodyH * 0.55;
  parts.push(part('body', w * 0.95, bodyH, l * 0.9, 0, bodyY, 0, c, 'body'));
  parts.push(part('belly', w * 0.7, bodyH * 0.4, l * 0.55, 0, bodyY - bodyH * 0.08, 0.02, belly, 'body'));
  const headS = w * 0.55;
  parts.push(part('head', headS, headS, headS, 0, bodyY + bodyH * 0.35, l * 0.35, c, 'head'));
  parts.push(part('beak', w * 0.12, w * 0.1, w * 0.28, 0, bodyY + bodyH * 0.3, l * 0.35 + headS * 0.55, accentColor(c, 'warm'), 'beak'));
  addEyes(parts, eyeNames, headS, bodyY + bodyH * 0.4, l * 0.35 + headS * 0.25, w * 0.07, [0.05, 0.05, 0.05]);
  parts.push(part('wingL', w * 0.12, h * 0.12, l * 0.7, -w * 0.55, bodyY + bodyH * 0.05, 0, cool, 'wing'));
  parts.push(part('wingR', w * 0.12, h * 0.12, l * 0.7, w * 0.55, bodyY + bodyH * 0.05, 0, cool, 'wing'));
  parts.push(part('tail', w * 0.35, h * 0.08, l * 0.35, 0, bodyY, -l * 0.45, dark, 'tail'));
  parts.push(part('legL', w * 0.08, legH, w * 0.08, -w * 0.15, legH * 0.5, 0.02, dark, 'leg'));
  parts.push(part('legR', w * 0.08, legH, w * 0.08, w * 0.15, legH * 0.5, 0.02, dark, 'leg'));
  legNames.push('legL', 'legR');
  return { parts, legNames, wingNames, eyeNames };
}

function layoutChicken(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const belly = accentColor(c, 'belly');
  const dark = accentColor(c, 'dark');
  const warm = accentColor(c, 'warm');
  const parts = [];
  const legNames = [];
  const wingNames = ['wingL', 'wingR'];
  const eyeNames = [];
  const legH = h * 0.3;
  const bodyH = h * 0.48;
  const bodyY = legH + bodyH * 0.5;
  parts.push(part('body', w * 1.0, bodyH, l * 0.85, 0, bodyY, 0, c, 'body'));
  parts.push(part('belly', w * 0.75, bodyH * 0.4, l * 0.55, 0, bodyY - bodyH * 0.1, 0, belly, 'body'));
  const headS = w * 0.45;
  const headY = bodyY + bodyH * 0.35;
  const headZ = l * 0.28;
  parts.push(part('head', headS, headS, headS, 0, headY, headZ, c, 'head'));
  parts.push(part('beak', w * 0.14, w * 0.1, w * 0.22, 0, headY - headS * 0.05, headZ + headS * 0.5, warm, 'beak'));
  parts.push(part('crest', w * 0.12, h * 0.16, w * 0.2, 0, headY + headS * 0.45, headZ, [0.85, 0.15, 0.12], 'crest'));
  parts.push(part('wattle', w * 0.08, h * 0.1, w * 0.08, 0, headY - headS * 0.35, headZ + headS * 0.2, [0.8, 0.12, 0.1], 'crest'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.08, headZ + headS * 0.3, w * 0.07, [0.05, 0.05, 0.05]);
  parts.push(part('wingL', w * 0.18, h * 0.22, l * 0.4, -w * 0.48, bodyY, 0.02, dark, 'wing'));
  parts.push(part('wingR', w * 0.18, h * 0.22, l * 0.4, w * 0.48, bodyY, 0.02, dark, 'wing'));
  parts.push(part('tail', w * 0.35, h * 0.28, w * 0.12, 0, bodyY + bodyH * 0.15, -l * 0.4, dark, 'tail'));
  parts.push(part('legL', w * 0.1, legH, w * 0.1, -w * 0.18, legH * 0.5, 0.02, warm, 'leg'));
  parts.push(part('legR', w * 0.1, legH, w * 0.1, w * 0.18, legH * 0.5, 0.02, warm, 'leg'));
  legNames.push('legL', 'legR');
  return { parts, legNames, wingNames, eyeNames };
}

function layoutCow(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const belly = accentColor(c, 'belly');
  const dark = accentColor(c, 'dark');
  const light = accentColor(c, 'light');
  const parts = [];
  const legNames = [];
  const wingNames = [];
  const eyeNames = [];
  const legH = h * 0.38;
  const bodyH = h * 0.42;
  const bodyY = legH + bodyH * 0.5;
  parts.push(part('body', w * 1.05, bodyH, l * 0.9, 0, bodyY, 0, c, 'body'));
  parts.push(part('belly', w * 0.85, bodyH * 0.45, l * 0.65, 0, bodyY - bodyH * 0.12, 0, belly, 'body'));
  parts.push(part('udder', w * 0.35, h * 0.1, w * 0.3, 0, legH + h * 0.06, -l * 0.05, light, 'body'));
  const headS = w * 0.55;
  const headY = bodyY + bodyH * 0.15;
  const headZ = l * 0.42;
  parts.push(part('head', headS * 1.1, headS * 0.85, headS * 0.9, 0, headY, headZ, c, 'head'));
  parts.push(part('snout', headS * 0.7, headS * 0.4, headS * 0.45, 0, headY - headS * 0.15, headZ + headS * 0.4, light, 'snout'));
  parts.push(part('earL', w * 0.22, h * 0.1, w * 0.08, -w * 0.4, headY + headS * 0.15, headZ, dark, 'ear'));
  parts.push(part('earR', w * 0.22, h * 0.1, w * 0.08, w * 0.4, headY + headS * 0.15, headZ, dark, 'ear'));
  parts.push(part('hornL', w * 0.08, h * 0.12, w * 0.08, -w * 0.22, headY + headS * 0.45, headZ - headS * 0.05, light, 'horn'));
  parts.push(part('hornR', w * 0.08, h * 0.12, w * 0.08, w * 0.22, headY + headS * 0.45, headZ - headS * 0.05, light, 'horn'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.1, headZ + headS * 0.25, w * 0.08, [0.05, 0.05, 0.05]);
  parts.push(part('tail', w * 0.08, h * 0.35, w * 0.08, 0, bodyY, -l * 0.48, dark, 'tail'));
  // spots
  parts.push(part('spot1', w * 0.28, bodyH * 0.35, l * 0.2, -w * 0.25, bodyY + bodyH * 0.05, l * 0.1, dark, 'body'));
  parts.push(part('spot2', w * 0.22, bodyH * 0.3, l * 0.18, w * 0.28, bodyY, -l * 0.15, dark, 'body'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.18, 0, c, w * 0.32, l * 0.3);
  return { parts, legNames, wingNames, eyeNames };
}

function layoutAlligator(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const belly = accentColor(c, 'belly');
  const dark = accentColor(c, 'dark');
  const parts = [];
  const legNames = [];
  const wingNames = [];
  const eyeNames = [];
  const legH = h * 0.22;
  const bodyH = h * 0.35;
  const bodyY = legH + bodyH * 0.45;
  parts.push(part('body', w * 0.95, bodyH, l * 0.55, 0, bodyY, 0.05 * l, c, 'body'));
  parts.push(part('belly', w * 0.7, bodyH * 0.35, l * 0.4, 0, bodyY - bodyH * 0.12, 0.05 * l, belly, 'body'));
  parts.push(part('ridge', w * 0.2, bodyH * 0.2, l * 0.45, 0, bodyY + bodyH * 0.4, 0, dark, 'fin'));
  const headZ = l * 0.35;
  parts.push(part('head', w * 0.7, bodyH * 0.7, l * 0.2, 0, bodyY, headZ, c, 'head'));
  parts.push(part('snout', w * 0.45, bodyH * 0.4, l * 0.35, 0, bodyY - bodyH * 0.05, headZ + l * 0.22, dark, 'snout'));
  addEyes(parts, eyeNames, w * 0.55, bodyY + bodyH * 0.25, headZ + l * 0.05, w * 0.08, [0.85, 0.75, 0.15]);
  parts.push(part('tail', w * 0.55, bodyH * 0.55, l * 0.5, 0, bodyY - bodyH * 0.05, -l * 0.4, c, 'tail'));
  parts.push(part('tailTip', w * 0.25, bodyH * 0.25, l * 0.2, 0, bodyY - bodyH * 0.08, -l * 0.62, dark, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.18, 0, c, w * 0.4, l * 0.18);
  return { parts, legNames, wingNames, eyeNames };
}

function layoutFox(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const belly = accentColor(c, 'belly');
  const dark = accentColor(c, 'dark');
  const light = accentColor(c, 'light');
  const parts = [];
  const legNames = [];
  const wingNames = [];
  const eyeNames = [];
  const legH = h * 0.36;
  const bodyH = h * 0.38;
  const bodyY = legH + bodyH * 0.5;
  parts.push(part('body', w * 0.85, bodyH, l * 0.75, 0, bodyY, 0, c, 'body'));
  parts.push(part('belly', w * 0.6, bodyH * 0.4, l * 0.5, 0, bodyY - bodyH * 0.12, 0.02, belly, 'body'));
  const headS = w * 0.55;
  const headY = bodyY + bodyH * 0.12;
  const headZ = l * 0.36;
  parts.push(part('head', headS, headS * 0.7, headS * 0.85, 0, headY, headZ, c, 'head'));
  parts.push(part('snout', headS * 0.4, headS * 0.35, headS * 0.55, 0, headY - headS * 0.08, headZ + headS * 0.45, dark, 'snout'));
  parts.push(part('earL', w * 0.14, h * 0.24, w * 0.08, -w * 0.16, headY + headS * 0.5, headZ - headS * 0.05, dark, 'ear'));
  parts.push(part('earR', w * 0.14, h * 0.24, w * 0.08, w * 0.16, headY + headS * 0.5, headZ - headS * 0.05, dark, 'ear'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.1, headZ + headS * 0.28, w * 0.08, [0.15, 0.55, 0.2]);
  parts.push(part('tail', w * 0.28, w * 0.28, l * 0.55, 0, bodyY + bodyH * 0.05, -l * 0.5, c, 'tail'));
  parts.push(part('tailTip', w * 0.22, w * 0.22, w * 0.22, 0, bodyY + bodyH * 0.08, -l * 0.72, light, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.14, 0, c, w * 0.28, l * 0.24);
  return { parts, legNames, wingNames, eyeNames };
}

function layoutBoar(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const belly = accentColor(c, 'belly');
  const dark = accentColor(c, 'dark');
  const light = accentColor(c, 'light');
  const parts = [];
  const legNames = [];
  const wingNames = [];
  const eyeNames = [];
  const legH = h * 0.32;
  const bodyH = h * 0.48;
  const bodyY = legH + bodyH * 0.5;
  parts.push(part('body', w * 1.0, bodyH, l * 0.85, 0, bodyY, 0, c, 'body'));
  parts.push(part('belly', w * 0.75, bodyH * 0.4, l * 0.55, 0, bodyY - bodyH * 0.12, 0, belly, 'body'));
  const headS = w * 0.6;
  const headY = bodyY + bodyH * 0.05;
  const headZ = l * 0.4;
  parts.push(part('head', headS, headS * 0.7, headS * 0.8, 0, headY, headZ, c, 'head'));
  parts.push(part('snout', headS * 0.55, headS * 0.4, headS * 0.45, 0, headY - headS * 0.05, headZ + headS * 0.4, dark, 'snout'));
  parts.push(part('tuskL', w * 0.06, h * 0.1, w * 0.12, -w * 0.18, headY - headS * 0.15, headZ + headS * 0.35, light, 'horn'));
  parts.push(part('tuskR', w * 0.06, h * 0.1, w * 0.12, w * 0.18, headY - headS * 0.15, headZ + headS * 0.35, light, 'horn'));
  parts.push(part('earL', w * 0.14, h * 0.1, w * 0.08, -w * 0.28, headY + headS * 0.3, headZ, dark, 'ear'));
  parts.push(part('earR', w * 0.14, h * 0.1, w * 0.08, w * 0.28, headY + headS * 0.3, headZ, dark, 'ear'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.1, headZ + headS * 0.2, w * 0.07, [0.05, 0.05, 0.05]);
  parts.push(part('tail', w * 0.08, h * 0.12, w * 0.08, 0, bodyY + bodyH * 0.15, -l * 0.4, dark, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.18, 0, c, w * 0.32, l * 0.26);
  return { parts, legNames, wingNames, eyeNames };
}

function layoutBat(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const dark = accentColor(c, 'dark');
  const cool = accentColor(c, 'cool');
  const parts = [];
  const legNames = [];
  const wingNames = ['wingL', 'wingR'];
  const eyeNames = [];
  const bodyH = h * 0.55;
  const bodyY = h * 0.45;
  parts.push(part('body', w * 0.85, bodyH, l * 0.7, 0, bodyY, 0, c, 'body'));
  const headS = w * 0.55;
  parts.push(part('head', headS, headS * 0.85, headS, 0, bodyY + bodyH * 0.35, l * 0.25, c, 'head'));
  parts.push(part('earL', w * 0.12, h * 0.28, w * 0.06, -w * 0.18, bodyY + bodyH * 0.55, l * 0.2, dark, 'ear'));
  parts.push(part('earR', w * 0.12, h * 0.28, w * 0.06, w * 0.18, bodyY + bodyH * 0.55, l * 0.2, dark, 'ear'));
  addEyes(parts, eyeNames, headS, bodyY + bodyH * 0.4, l * 0.25 + headS * 0.25, w * 0.08, [0.75, 0.15, 0.15]);
  parts.push(part('wingL', w * 0.9, h * 0.08, l * 0.55, -w * 0.7, bodyY + bodyH * 0.05, 0, cool, 'wing'));
  parts.push(part('wingR', w * 0.9, h * 0.08, l * 0.55, w * 0.7, bodyY + bodyH * 0.05, 0, cool, 'wing'));
  parts.push(part('legL', w * 0.08, h * 0.15, w * 0.08, -w * 0.12, bodyY - bodyH * 0.35, 0, dark, 'leg'));
  parts.push(part('legR', w * 0.08, h * 0.15, w * 0.08, w * 0.12, bodyY - bodyH * 0.35, 0, dark, 'leg'));
  legNames.push('legL', 'legR');
  parts.push(part('tail', w * 0.08, h * 0.08, w * 0.12, 0, bodyY - bodyH * 0.1, -l * 0.35, dark, 'tail'));
  return { parts, legNames, wingNames, eyeNames };
}

function layoutFallback(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const dark = accentColor(c, 'dark');
  const parts = [];
  const legNames = [];
  const wingNames = [];
  const eyeNames = [];
  const legH = h * 0.35;
  const bodyH = h * 0.4;
  const bodyY = legH + bodyH * 0.5;
  parts.push(part('body', w, bodyH, l * 0.75, 0, bodyY, 0, c, 'body'));
  parts.push(part('head', w * 0.55, h * 0.3, w * 0.55, 0, bodyY + bodyH * 0.25, l * 0.35, c, 'head'));
  parts.push(part('snout', w * 0.3, h * 0.12, w * 0.3, 0, bodyY + bodyH * 0.2, l * 0.5, dark, 'snout'));
  addEyes(parts, eyeNames, w * 0.5, bodyY + bodyH * 0.3, l * 0.45, w * 0.08, [0.05, 0.05, 0.05]);
  quadLegs(parts, legNames, w, h, l, legH, w * 0.15, 0, c, w * 0.3, l * 0.25);
  return { parts, legNames, wingNames, eyeNames };
}

const LAYOUTS = {
  hare: layoutHare,
  deer: layoutDeer,
  wolf: layoutWolf,
  bear: layoutBear,
  bird: layoutBird,
  chicken: layoutChicken,
  cow: layoutCow,
  alligator: layoutAlligator,
  fox: layoutFox,
  boar: layoutBoar,
  bat: layoutBat,
};

/**
 * @param {string} type
 * @param {{ color?: number[], scale?: number[] }} spec
 */
export function animalPartLayout(type, spec) {
  const fn = LAYOUTS[type] || layoutFallback;
  const layout = fn(spec || {});
  if (!layout.parts || layout.parts.length < 5) {
    return layoutFallback(spec || {});
  }
  return layout;
}

/**
 * @param {object} pose
 * @param {string[]} legNames
 * @param {string[]} wingNames
 * @param {number} phase
 * @param {number} speed01
 * @param {string} type
 */
export function animalLimbPose(pose, legNames, wingNames, phase, speed01, type) {
  const p = pose && typeof pose === 'object' ? pose : {};
  const spd = clamp01(Number(speed01) || 0);
  const ph = Number(phase) || 0;
  const amp = 0.04 + 0.55 * spd;
  const legs = Array.isArray(legNames) ? legNames : [];
  const wings = Array.isArray(wingNames) ? wingNames : [];

  for (const name of legs) {
    if (!p[name]) p[name] = { rx: 0, rz: 0 };
    let sign = 1;
    if (name === 'legFR' || name === 'legBL' || name === 'legR') sign = -1;
    if (name === 'legFL' || name === 'legBR' || name === 'legL') sign = 1;
    // diagonal pairs
    if (name.endsWith('FR') || name.endsWith('BL')) sign = -1;
    if (name.endsWith('FL') || name.endsWith('BR')) sign = 1;
    if (name === 'legR') sign = -1;
    if (name === 'legL') sign = 1;
    p[name].rx = Math.sin(ph) * amp * sign;
    p[name].rz = 0;
  }

  const fly = type === 'bird' || type === 'bat';
  const wAmp = fly ? 0.2 + 0.55 * Math.max(spd, 0.25) : 0.2 + 0.5 * spd;
  for (const name of wings) {
    if (!p[name]) p[name] = { rx: 0, rz: 0 };
    const sign = name === 'wingR' || name.endsWith('R') ? -1 : 1;
    p[name].rz = Math.sin(ph * 2) * wAmp * sign;
    p[name].rx = Math.sin(ph * 2) * wAmp * 0.35;
  }
  return p;
}
