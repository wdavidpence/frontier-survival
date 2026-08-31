/**
 * Procedural multi-box creature silhouettes + limb walk/fly poses.
 * Pure (no THREE / DOM). game.js builds Mesh groups from part lists.
 */
import { alligatorLayout as authoredAlligatorLayout } from './fauna-parts/alligator-silhouette.js?v=2';
import { crabLayout as authoredCrabLayout } from './fauna-parts/crab-layout.js?v=2';
import { reefSharkLayout as authoredReefSharkLayout } from './fauna-parts/reef-shark-layout.js?v=2';
import { seaTurtleLayout as authoredSeaTurtleLayout } from './fauna-parts/turtle-layout.js?v=2';
import { tropicalFishLayout as authoredTropicalFishLayout } from './fauna-parts/tropical-fish-layout.js?v=2';

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
  // socket: pale rim set slightly behind each eye so it reads clearly
  // against dark or busy fur/scale colors (silhouette/face contrast pass).
  const sx = ex * 1.4;
  const socketZ = hz - ex * 0.25;
  const socketColor = [0.85, 0.82, 0.76];
  parts.push(part('socketL', sx, sx, sx * 0.55, -hx * 0.28, hy, socketZ, socketColor, 'eye'));
  parts.push(part('socketR', sx, sx, sx * 0.55, hx * 0.28, hy, socketZ, socketColor, 'eye'));
  parts.push(part('eyeL', ex, ex, ex * 0.7, -hx * 0.28, hy, hz, eyeColor, 'eye'));
  parts.push(part('eyeR', ex, ex, ex * 0.7, hx * 0.28, hy, hz, eyeColor, 'eye'));
  // pupils: small dark inset poking slightly forward for a visible catch-point
  const px = ex * 0.4;
  const pz = hz + ex * 0.4;
  const pupilColor = [0.02, 0.02, 0.03];
  parts.push(part('pupilL', px, px, px, -hx * 0.28, hy, pz, pupilColor, 'eye'));
  parts.push(part('pupilR', px, px, px, hx * 0.28, hy, pz, pupilColor, 'eye'));
  // Tiny warm catchlights keep eyes readable against dark fur and foliage.
  const glint = [1.0, 0.98, 0.84];
  parts.push(part('catchL', ex * 0.22, ex * 0.22, ex * 0.10, -hx * 0.28 - ex * 0.08, hy + ex * 0.10, pz + ex * 0.08, glint, 'eye'));
  parts.push(part('catchR', ex * 0.22, ex * 0.22, ex * 0.10, hx * 0.28 - ex * 0.08, hy + ex * 0.10, pz + ex * 0.08, glint, 'eye'));
  // A shared mouth line makes faces expressive without changing collision.
  parts.push(part('mouth', ex * 2.8, ex * 0.20, ex * 0.16, 0, hy - ex * 1.25, hz + ex * 0.46, [0.10, 0.045, 0.035], 'mouth'));
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
  const headS = w * 0.52;
  const headY = legH + bodyH + headS * 0.25;
  const headZ = l * 0.28;
  parts.push(part('head', headS, headS * 0.88, headS * 0.85, 0, headY, headZ, c, 'head'));
  parts.push(part('snout', headS * 0.45, headS * 0.35, headS * 0.4, 0, headY - headS * 0.05, headZ + headS * 0.45, dark, 'snout'));
  parts.push(part('earL', w * 0.14, h * 0.52, w * 0.1, -w * 0.21, headY + headS * 0.5, headZ - headS * 0.05, accentColor(c, 'light'), 'ear'));
  parts.push(part('earR', w * 0.14, h * 0.52, w * 0.1, w * 0.21, headY + headS * 0.5, headZ - headS * 0.05, accentColor(c, 'light'), 'ear'));
  parts.push(part('earTipL', w * 0.12, h * 0.08, w * 0.08, -w * 0.21, headY + headS * 0.5 + h * 0.24, headZ - headS * 0.05, dark, 'ear'));
  parts.push(part('earTipR', w * 0.12, h * 0.08, w * 0.08, w * 0.21, headY + headS * 0.5 + h * 0.24, headZ - headS * 0.05, dark, 'ear'));
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
  const neckH = h * 0.22;
  parts.push(part('neck', w * 0.26, neckH, w * 0.3, 0, bodyY + bodyH * 0.35 + neckH * 0.35, l * 0.34, c, 'body'));
  parts.push(part('throat', w * 0.2, neckH * 0.6, w * 0.15, 0, bodyY + bodyH * 0.35 + neckH * 0.2, l * 0.4, belly, 'body'));
  const headS = w * 0.44;
  const headY = bodyY + bodyH * 0.35 + neckH + headS * 0.25;
  const headZ = l * 0.44;
  parts.push(part('head', headS, headS * 0.68, headS * 1.08, 0, headY, headZ, c, 'head'));
  parts.push(part('snout', headS * 0.38, headS * 0.32, headS * 0.58, 0, headY - headS * 0.06, headZ + headS * 0.52, dark, 'snout'));
  parts.push(part('earL', w * 0.12, h * 0.22, w * 0.07, -w * 0.2, headY + headS * 0.3, headZ - headS * 0.12, dark, 'ear'));
  parts.push(part('earR', w * 0.12, h * 0.22, w * 0.07, w * 0.2, headY + headS * 0.3, headZ - headS * 0.12, dark, 'ear'));
  parts.push(part('hornL', w * 0.11, h * 0.36, w * 0.08, -w * 0.13, headY + headS * 0.55, headZ, accentColor(c, 'light'), 'horn'));
  parts.push(part('hornR', w * 0.11, h * 0.36, w * 0.08, w * 0.13, headY + headS * 0.55, headZ, accentColor(c, 'light'), 'horn'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.08, headZ + headS * 0.25, w * 0.07, [0.08, 0.06, 0.04]);
  parts.push(part('tail', w * 0.1, h * 0.14, w * 0.1, 0, bodyY + bodyH * 0.2, -l * 0.42, dark, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.12, 0, c, w * 0.28, l * 0.28);
  return { parts, legNames, wingNames, eyeNames };
}

export function layoutWolf(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const belly = accentColor(c, 'belly');
  const dark = accentColor(c, 'dark');
  const parts = [];
  const legNames = [];
  const wingNames = [];
  const eyeNames = [];
  const legH = h * 0.4;
  const bodyH = h * 0.4;
  const bodyY = legH + bodyH * 0.5;
  parts.push(part('body', w * 0.88, bodyH, l * 0.8, 0, bodyY, 0, c, 'body'));
  parts.push(part('belly', w * 0.68, bodyH * 0.4, l * 0.55, 0, bodyY - bodyH * 0.12, 0.02, belly, 'body'));
  parts.push(part('mane', w * 0.92, bodyH * 0.45, l * 0.3, 0, bodyY + bodyH * 0.12, l * 0.22, dark, 'body'));
  const headS = w * 0.52;
  const headY = bodyY + bodyH * 0.18;
  const headZ = l * 0.4;
  parts.push(part('head', headS, headS * 0.75, headS * 0.88, 0, headY, headZ, c, 'head'));
  parts.push(part('snout', headS * 0.44, headS * 0.32, headS * 0.78, 0, headY - headS * 0.06, headZ + headS * 0.6, dark, 'snout'));
  parts.push(part('earL', w * 0.13, h * 0.26, w * 0.09, -w * 0.19, headY + headS * 1.1, headZ - headS * 0.05, dark, 'ear'));
  parts.push(part('earR', w * 0.13, h * 0.26, w * 0.09, w * 0.19, headY + headS * 1.1, headZ - headS * 0.05, dark, 'ear'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.12, headZ + headS * 0.28, w * 0.09, [0.85, 0.75, 0.25]);
  parts.push(part('tail', w * 0.22, w * 0.22, l * 0.45, 0, bodyY + bodyH * 0.1, -l * 0.48, dark, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.15, 0, c, w * 0.3, l * 0.26);
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
  const bodyH = h * 0.52;
  const bodyY = legH + bodyH * 0.5;
  parts.push(part('body', w * 1.08, bodyH, l * 0.85, 0, bodyY, 0, c, 'body'));
  parts.push(part('belly', w * 0.88, bodyH * 0.4, l * 0.6, 0, bodyY - bodyH * 0.1, 0, belly, 'body'));
  parts.push(part('hump', w * 0.98, bodyH * 0.3, l * 0.32, 0, bodyY + bodyH * 0.38, l * 0.12, dark, 'body'));
  const headS = w * 0.58;
  const headY = bodyY + bodyH * 0.18;
  const headZ = l * 0.42;
  parts.push(part('head', headS * 1.05, headS * 0.88, headS * 0.95, 0, headY, headZ, c, 'head'));
  parts.push(part('snout', headS * 0.52, headS * 0.4, headS * 0.48, 0, headY - headS * 0.1, headZ + headS * 0.45, dark, 'snout'));
  parts.push(part('earL', w * 0.18, h * 0.14, w * 0.1, -w * 0.3, headY + headS * 0.44, headZ - headS * 0.05, dark, 'ear'));
  parts.push(part('earR', w * 0.18, h * 0.14, w * 0.1, w * 0.3, headY + headS * 0.44, headZ - headS * 0.05, dark, 'ear'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.1, headZ + headS * 0.3, w * 0.08, [0.05, 0.05, 0.05]);
  parts.push(part('tail', w * 0.14, w * 0.12, w * 0.12, 0, bodyY - bodyH * 0.05, -l * 0.4, dark, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.25, 0, c, w * 0.35, l * 0.28);
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

export function layoutChicken(spec) {
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
  parts.push(part('beak', w * 0.16, w * 0.11, w * 0.28, 0, headY - headS * 0.02, headZ + headS * 0.58, warm, 'beak'));
  const crestBaseY = headY + headS * 0.48;
  parts.push(part('crest0', w * 0.10, h * 0.16, w * 0.10, 0, crestBaseY + h * 0.02, headZ + headS * 0.02, [0.86, 0.12, 0.10], 'crest'));
  parts.push(part('crest1', w * 0.09, h * 0.13, w * 0.09, 0, crestBaseY, headZ - headS * 0.12, [0.82, 0.10, 0.09], 'crest'));
  parts.push(part('crest2', w * 0.09, h * 0.13, w * 0.09, 0, crestBaseY, headZ + headS * 0.16, [0.82, 0.10, 0.09], 'crest'));
  parts.push(part('wattle', w * 0.09, h * 0.14, w * 0.09, 0, headY - headS * 0.38, headZ + headS * 0.28, [0.78, 0.10, 0.08], 'crest'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.08, headZ + headS * 0.3, w * 0.07, [0.05, 0.05, 0.05]);
  const wingFold = clamp01(spec?.wingFold || 0);
  parts.push(part('wingL', w * 0.22, h * 0.16, l * 0.46, -w * 0.52 + wingFold * w * 0.3, bodyY + bodyH * 0.02, 0.04, dark, 'wing'));
  parts.push(part('wingR', w * 0.22, h * 0.16, l * 0.46, w * 0.52 - wingFold * w * 0.3, bodyY + bodyH * 0.02, 0.04, dark, 'wing'));
  parts.push(part('tail', w * 0.28, h * 0.34, w * 0.10, 0, bodyY + bodyH * 0.22, -l * 0.46, dark, 'tail'));
  parts.push(part('legL', w * 0.08, legH, w * 0.08, -w * 0.18, legH * 0.5, 0.04, warm, 'leg'));
  parts.push(part('legR', w * 0.08, legH, w * 0.08, w * 0.18, legH * 0.5, 0.04, warm, 'leg'));
  parts.push(part('footL', w * 0.16, w * 0.05, w * 0.18, -w * 0.18, 0.03, 0.08, warm, 'leg'));
  parts.push(part('footR', w * 0.16, w * 0.05, w * 0.18, w * 0.18, 0.03, 0.08, warm, 'leg'));
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
  for (const [i, ox, oz] of [[0, -w * 0.10, -l * 0.10], [1, w * 0.10, -l * 0.10], [2, -w * 0.10, l * 0.08], [3, w * 0.10, l * 0.08]]) {
    parts.push(part(`teat${i}`, w * 0.055, h * 0.09, w * 0.055, ox, legH - h * 0.005, -l * 0.05 + oz, [0.82, 0.62, 0.55], 'body'));
  }
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
  // Irregular layered splotches: varied scale, tone, and body placement read as hide rather than stickers.
  const spotA = [0.16, 0.12, 0.10];
  const spotB = [0.22, 0.17, 0.13];
  const spots = [
    [-w * 0.34, bodyY + bodyH * 0.12, l * 0.18, w * 0.24, bodyH * 0.34, l * 0.18, spotA],
    [-w * 0.19, bodyY - bodyH * 0.04, -l * 0.26, w * 0.18, bodyH * 0.27, l * 0.16, spotB],
    [w * 0.28, bodyY + bodyH * 0.08, l * 0.12, w * 0.25, bodyH * 0.30, l * 0.20, spotA],
    [w * 0.34, bodyY - bodyH * 0.10, -l * 0.26, w * 0.16, bodyH * 0.26, l * 0.14, spotB],
    [-w * 0.08, bodyY + bodyH * 0.18, l * 0.34, w * 0.13, bodyH * 0.20, l * 0.12, spotA],
    [w * 0.08, bodyY - bodyH * 0.19, -l * 0.40, w * 0.12, bodyH * 0.18, l * 0.11, spotB],
  ];
  for (let i = 0; i < spots.length; i++) {
    const [sx, sy, sz, sw, sh, sl, col] = spots[i];
    parts.push(part(`spot${i}`, sw, sh, sl, sx, sy, sz, col, 'body'));
  }
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
  parts.push(part('jawLower', w * 0.40, bodyH * 0.18, l * 0.28, 0, bodyY - bodyH * 0.18, headZ + l * 0.30, belly, 'snout'));
  for (let i = 0; i < 5; i++) {
    const tx = -w * 0.18 + i * w * 0.09;
    parts.push(part(`tooth${i}`, w * 0.045, h * 0.07, l * 0.07, tx, bodyY - bodyH * 0.12, headZ + l * 0.38, [0.90, 0.82, 0.60], 'snout'));
  }
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    parts.push(part(`scute${i}`, w * (0.11 + Math.sin(t * Math.PI) * 0.04), h * 0.12, l * 0.12, 0, bodyY + bodyH * 0.44, l * 0.28 - t * l * 0.72, [0.38, 0.31, 0.18], 'fin'));
  }
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
  // tusks: long, curved, projecting forward from snout for readability
  const tuskSx = w * 0.18;
  const tuskSy = h * 0.12;
  const tuskSz = l * 0.65;
  parts.push(part('tuskL', tuskSx, tuskSy, tuskSz, -w * 0.12, headY - headS * 0.1, headZ + headS * 0.45, [0.92, 0.93, 0.9], 'tusk'));
  parts.push(part('tuskR', tuskSx, tuskSy, tuskSz, w * 0.12, headY - headS * 0.1, headZ + headS * 0.45, [0.92, 0.93, 0.9], 'tusk'));
  parts.push(part('earL', w * 0.14, h * 0.1, w * 0.08, -w * 0.28, headY + headS * 0.3, headZ, dark, 'ear'));
  parts.push(part('earR', w * 0.14, h * 0.1, w * 0.08, w * 0.28, headY + headS * 0.3, headZ, dark, 'ear'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.1, headZ + headS * 0.2, w * 0.07, [0.05, 0.05, 0.05]);
  parts.push(part('tail', w * 0.08, h * 0.12, w * 0.08, 0, bodyY + bodyH * 0.15, -l * 0.4, dark, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.18, 0, c, w * 0.32, l * 0.26);
  return { parts, legNames, wingNames, eyeNames };
}

function layoutPig(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec); const belly = accentColor(c, 'belly'); const dark = accentColor(c, 'dark');
  const parts = []; const legNames = []; const eyeNames = [];
  const legH = h * 0.30; const bodyH = h * 0.48; const bodyY = legH + bodyH * 0.5;
  parts.push(part('body', w * 1.02, bodyH, l * 0.88, 0, bodyY, 0, c, 'body'));
  parts.push(part('belly', w * 0.78, bodyH * 0.36, l * 0.6, 0, bodyY - bodyH * 0.12, 0, belly, 'body'));
  const headS = w * 0.58; const headY = bodyY + bodyH * 0.14; const headZ = l * 0.43;
  parts.push(part('head', headS, headS * 0.82, headS * 0.82, 0, headY, headZ, c, 'head'));
  parts.push(part('snout', headS * 0.62, headS * 0.38, headS * 0.42, 0, headY - headS * 0.10, headZ + headS * 0.42, accentColor(c, 'light'), 'snout'));
  parts.push(part('nostrilL', headS * 0.10, headS * 0.10, headS * 0.05, -headS * 0.18, headY - headS * 0.08, headZ + headS * 0.63, dark, 'snout'));
  parts.push(part('nostrilR', headS * 0.10, headS * 0.10, headS * 0.05, headS * 0.18, headY - headS * 0.08, headZ + headS * 0.63, dark, 'snout'));
  parts.push(part('earL', w * 0.16, h * 0.20, w * 0.10, -w * 0.30, headY + headS * 0.42, headZ - headS * 0.02, dark, 'ear'));
  parts.push(part('earR', w * 0.16, h * 0.20, w * 0.10, w * 0.30, headY + headS * 0.42, headZ - headS * 0.02, dark, 'ear'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.12, headZ + headS * 0.25, w * 0.075, [0.06, 0.04, 0.04]);
  parts.push(part('tail', w * 0.08, h * 0.25, w * 0.08, 0, bodyY + bodyH * 0.1, -l * 0.46, dark, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.17, 0, c, w * 0.32, l * 0.28);
  return { parts, legNames, wingNames: [], eyeNames };
}

function layoutHorse(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec); const belly = accentColor(c, 'belly'); const dark = accentColor(c, 'dark'); const light = accentColor(c, 'light');
  const parts = []; const legNames = []; const eyeNames = [];
  const legH = h * 0.58; const bodyH = h * 0.30; const bodyY = legH + bodyH * 0.5;
  parts.push(part('body', w * 0.82, bodyH, l * 0.92, 0, bodyY, 0, c, 'body'));
  parts.push(part('belly', w * 0.62, bodyH * 0.42, l * 0.62, 0, bodyY - bodyH * 0.16, 0.02, belly, 'body'));
  const neckH = h * 0.46; parts.push(part('neck', w * 0.28, neckH, w * 0.34, 0, bodyY + bodyH * 0.32 + neckH * 0.35, l * 0.30, c, 'body'));
  parts.push(part('mane', w * 0.10, neckH * 0.9, w * 0.10, -w * 0.23, bodyY + bodyH * 0.35 + neckH * 0.35, l * 0.25, dark, 'mane'));
  const headS = w * 0.48; const headY = bodyY + bodyH * 0.35 + neckH; const headZ = l * 0.48;
  parts.push(part('head', headS, headS * 0.70, headS * 1.15, 0, headY, headZ, c, 'head'));
  parts.push(part('muzzle', headS * 0.38, headS * 0.30, headS * 0.65, 0, headY - headS * 0.10, headZ + headS * 0.55, light, 'snout'));
  parts.push(part('earL', w * 0.10, h * 0.22, w * 0.08, -w * 0.18, headY + headS * 0.55, headZ - headS * 0.1, dark, 'ear'));
  parts.push(part('earR', w * 0.10, h * 0.22, w * 0.08, w * 0.18, headY + headS * 0.55, headZ - headS * 0.1, dark, 'ear'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.10, headZ + headS * 0.28, w * 0.07, [0.05, 0.04, 0.03]);
  parts.push(part('tail', w * 0.10, h * 0.35, w * 0.10, 0, bodyY + bodyH * 0.2, -l * 0.48, dark, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.11, 0, c, w * 0.27, l * 0.30);
  return { parts, legNames, wingNames: [], eyeNames };
}

function layoutSheep(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec); const wool = accentColor(c, 'light'); const dark = accentColor(c, 'dark');
  const parts = []; const legNames = []; const eyeNames = [];
  const legH = h * 0.36; const bodyH = h * 0.55; const bodyY = legH + bodyH * 0.5;
  parts.push(part('woolBody', w * 1.06, bodyH, l * 0.9, 0, bodyY, 0, wool, 'body'));
  parts.push(part('woolShoulder', w * 0.88, bodyH * 0.72, l * 0.36, 0, bodyY + bodyH * 0.10, l * 0.28, wool, 'body'));
  const headS = w * 0.46; const headY = bodyY + bodyH * 0.16; const headZ = l * 0.46;
  parts.push(part('head', headS, headS * 0.90, headS * 0.78, 0, headY, headZ, dark, 'head'));
  parts.push(part('muzzle', headS * 0.42, headS * 0.30, headS * 0.42, 0, headY - headS * 0.10, headZ + headS * 0.38, dark, 'snout'));
  parts.push(part('earL', w * 0.14, h * 0.12, w * 0.08, -w * 0.25, headY + headS * 0.25, headZ, dark, 'ear'));
  parts.push(part('earR', w * 0.14, h * 0.12, w * 0.08, w * 0.25, headY + headS * 0.25, headZ, dark, 'ear'));
  addEyes(parts, eyeNames, headS, headY + headS * 0.12, headZ + headS * 0.25, w * 0.075, [0.05, 0.05, 0.04]);
  parts.push(part('tail', w * 0.18, w * 0.20, w * 0.12, 0, bodyY + bodyH * 0.2, -l * 0.46, wool, 'tail'));
  quadLegs(parts, legNames, w, h, l, legH, w * 0.15, 0, dark, w * 0.31, l * 0.28);
  return { parts, legNames, wingNames: [], eyeNames };
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

function layoutDolphin(spec) {
  const { w, h, l } = scaleOf(spec); const c = baseCol(spec); const belly = accentColor(c, 'belly'); const dark = accentColor(c, 'dark');
  const parts = []; const wingNames = ['flipperL', 'flipperR']; const eyeNames = [];
  parts.push(part('body', w * 0.88, h * 0.62, l * 0.72, 0, h * 0.58, 0, c, 'body'));
  parts.push(part('belly', w * 0.62, h * 0.25, l * 0.54, 0, h * 0.42, l * 0.04, belly, 'body'));
  parts.push(part('head', w * 0.68, h * 0.58, l * 0.38, 0, h * 0.68, l * 0.40, c, 'head'));
  parts.push(part('beak', w * 0.30, h * 0.16, l * 0.42, 0, h * 0.62, l * 0.68, dark, 'snout'));
  parts.push(part('dorsalFin', w * 0.12, h * 0.44, w * 0.22, 0, h * 1.04, -l * 0.05, dark, 'fin'));
  parts.push(part('flipperL', w * 0.12, h * 0.10, l * 0.50, -w * 0.72, h * 0.55, l * 0.08, c, 'wing'));
  parts.push(part('flipperR', w * 0.12, h * 0.10, l * 0.50, w * 0.72, h * 0.55, l * 0.08, c, 'wing'));
  parts.push(part('tailL', w * 0.38, h * 0.12, l * 0.22, -w * 0.20, h * 0.52, -l * 0.44, dark, 'tail'));
  parts.push(part('tailR', w * 0.38, h * 0.12, l * 0.22, w * 0.20, h * 0.52, -l * 0.44, dark, 'tail'));
  addEyes(parts, eyeNames, w * 0.42, h * 0.78, l * 0.60, w * 0.08, [0.04, 0.06, 0.08]);
  return { parts, legNames: [], wingNames, eyeNames };
}

function layoutOctopus(spec) {
  const { w, h, l } = scaleOf(spec); const c = baseCol(spec); const light = accentColor(c, 'light'); const dark = accentColor(c, 'dark');
  const parts = []; const legNames = []; const eyeNames = [];
  parts.push(part('mantle', w * 0.92, h * 0.92, l * 0.78, 0, h * 0.88, 0, c, 'body'));
  parts.push(part('underside', w * 0.72, h * 0.22, l * 0.62, 0, h * 0.38, l * 0.04, light, 'body'));
  const tentacles = [[-0.72,0.34,-0.38],[-0.48,0.20,-0.62],[-0.20,0.12,-0.78],[0.20,0.12,-0.78],[0.48,0.20,-0.62],[0.72,0.34,-0.38],[-0.62,0.26,0.30],[0.62,0.26,0.30]];
  tentacles.forEach(([x,y,z], i) => { parts.push(part(`tentacle${i}`, w * 0.18, h * 0.20, l * 0.58, x * w, y * h, z * l, dark, 'leg')); legNames.push(`tentacle${i}`); });
  addEyes(parts, eyeNames, w * 0.44, h * 1.06, l * 0.34, w * 0.10, [0.92, 0.82, 0.30]);
  return { parts, legNames, wingNames: [], eyeNames };
}

function layoutFish(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const parts = [];
  const eyeNames = [];
  parts.push(part('body', w, h, l * 0.8, 0, h * 0.6, 0, c, 'body'));
  parts.push(part('tail', w * 0.12, h * 0.75, l * 0.5, 0, h * 0.6, -l * 0.58, accentColor(c, 'warm'), 'tail'));
  parts.push(part('fin', w * 0.12, h * 0.5, l * 0.3, 0, h * 1.05, -l * 0.05, accentColor(c, 'dark'), 'fin'));
  addEyes(parts, eyeNames, w, h * 0.72, l * 0.4, w * 0.16, [0.04, 0.04, 0.04]);
  return { parts, legNames: [], wingNames: [], eyeNames };
}

function layoutTurtle(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const parts = [];
  const eyeNames = [];
  const dark = accentColor(c, 'dark');
  parts.push(part('shell', w * 1.25, h * 1.1, l * 0.95, 0, h * 0.65, 0, dark, 'body'));
  parts.push(part('body', w * 0.9, h * 0.4, l * 0.7, 0, h * 0.35, l * 0.12, c, 'body'));
  parts.push(part('head', w * 0.42, h * 0.42, w * 0.5, 0, h * 0.52, l * 0.62, c, 'head'));
  parts.push(part('flipperL', w * 0.12, h * 0.16, l * 0.48, -w * 0.7, h * 0.5, l * 0.2, c, 'flipper'));
  parts.push(part('flipperR', w * 0.12, h * 0.16, l * 0.48, w * 0.7, h * 0.5, l * 0.2, c, 'flipper'));
  addEyes(parts, eyeNames, w * 0.4, h * 0.64, l * 0.78, w * 0.1, [0.04, 0.04, 0.04]);
  return { parts, legNames: [], wingNames: [], eyeNames };
}

function layoutShark(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const parts = [];
  const eyeNames = [];
  parts.push(part('body', w, h * 0.75, l * 0.9, 0, h * 0.65, 0, c, 'body'));
  parts.push(part('snout', w * 0.7, h * 0.5, l * 0.5, 0, h * 0.58, l * 0.58, accentColor(c, 'light'), 'snout'));
  parts.push(part('tail', w * 0.18, h * 0.9, l * 0.55, 0, h * 0.65, -l * 0.65, c, 'tail'));
  parts.push(part('dorsalFin', w * 0.12, h * 0.7, w * 0.3, 0, h * 1.15, -l * 0.05, accentColor(c, 'dark'), 'fin'));
  parts.push(part('finL', w * 0.75, h * 0.12, l * 0.32, -w * 0.48, h * 0.45, 0, accentColor(c, 'dark'), 'fin'));
  addEyes(parts, eyeNames, w, h * 0.78, l * 0.48, w * 0.1, [0.04, 0.04, 0.04]);
  return { parts, legNames: [], wingNames: [], eyeNames };
}

function layoutCrab(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const parts = [];
  const legNames = [];
  parts.push(part('body', w, h * 0.7, l * 0.8, 0, h * 0.55, 0, c, 'body'));
  for (const [name, x, z] of [['legFL', -w * 0.75, l * 0.3], ['legFR', w * 0.75, l * 0.3], ['legBL', -w * 0.75, -l * 0.25], ['legBR', w * 0.75, -l * 0.25]]) {
    parts.push(part(name, w * 0.12, h * 0.18, l * 0.42, x, h * 0.25, z, accentColor(c, 'dark'), 'leg'));
    legNames.push(name);
  }
  parts.push(part('clawL', w * 0.25, h * 0.3, l * 0.3, -w * 0.72, h * 0.68, l * 0.55, accentColor(c, 'light'), 'claw'));
  parts.push(part('clawR', w * 0.25, h * 0.3, l * 0.3, w * 0.72, h * 0.68, l * 0.55, accentColor(c, 'light'), 'claw'));
  return { parts, legNames, wingNames: [], eyeNames: [] };
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

function layoutAuthoredAlligator(spec) {
  const layout = authoredAlligatorLayout(spec);
  return { ...layout, legNames: (layout.legNames || []).filter(name => /^leg/.test(name)) };
}

const LAYOUTS = {
  hare: layoutHare,
  deer: layoutDeer,
  wolf: layoutWolf,
  bear: layoutBear,
  bird: layoutBird,
  chicken: layoutChicken,
  parrot: layoutBird,
  cow: layoutCow,
  pig: layoutPig,
  horse: layoutHorse,
  sheep: layoutSheep,
  lamb: layoutSheep,
  alligator: layoutAuthoredAlligator,
  fox: layoutFox,
  boar: layoutBoar,
  bat: layoutBat,
  tropical_fish: authoredTropicalFishLayout,
  sea_turtle: authoredSeaTurtleLayout,
  reef_shark: authoredReefSharkLayout,
  dolphin: layoutDolphin,
  octopus: layoutOctopus,
  crab: authoredCrabLayout,
};

/**
 * @param {string} type
 * @param {{ color?: number[], scale?: number[] }} spec
 */
export function animalPartLayout(type, spec) {
  const fn = LAYOUTS[type] || layoutFallback;
  const layout = fn(spec || {});
  addNaturalMarkings(type, spec || {}, layout);
  if (!layout.parts || layout.parts.length < 5) {
    return layoutFallback(spec || {});
  }
  return layout;
}

/** Add small high-contrast species cues without changing hitboxes or AI. */
function addNaturalMarkings(type, spec, layout) {
  if (!layout?.parts) return;
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const light = accentColor(c, 'light');
  const dark = accentColor(c, 'dark');
  if (type === 'deer') {
    const headS = w * 0.44;
    const legH = h * 0.48;
    const bodyH = h * 0.32;
    const headY = legH + bodyH * 0.5 + bodyH * 0.35 + h * 0.22 + headS * 0.25;
    const headZ = l * 0.44;
    const inner = [0.82, 0.34, 0.30];
    layout.parts.push(part('earInnerL', w * 0.06, h * 0.12, w * 0.025, -w * 0.2, headY + headS * 0.3, headZ - headS * 0.12 + w * 0.05, inner, 'marking'));
    layout.parts.push(part('earInnerR', w * 0.06, h * 0.12, w * 0.025, w * 0.2, headY + headS * 0.3, headZ - headS * 0.12 + w * 0.05, inner, 'marking'));
    for (let i = 0; i < 5; i++) {
      const side = i % 2 ? 1 : -1;
      layout.parts.push(part(`dapple${i}`, w * 0.12, h * 0.10, l * 0.05,
        side * w * (0.12 + (i % 3) * 0.10), h * 0.70 + (i % 2) * h * 0.06,
        l * 0.39, light, 'marking'));
    }
  } else if (type === 'wolf' || type === 'fox') {
    const wolf = type === 'wolf';
    const headS = w * (wolf ? 0.52 : 0.55);
    const legH = h * (wolf ? 0.4 : 0.36);
    const bodyH = h * (wolf ? 0.4 : 0.38);
    const bodyY = legH + bodyH * 0.5;
    const headY = bodyY + bodyH * (wolf ? 0.18 : 0.12);
    const headZ = l * (wolf ? 0.4 : 0.36);
    const earX = w * (wolf ? 0.19 : 0.16);
    const inner = [0.74, 0.28, 0.26];
    layout.parts.push(part('earInnerL', w * 0.07, h * 0.13, w * 0.025, -earX, headY + headS * (wolf ? 1.1 : 0.5), headZ - headS * 0.05 + w * 0.05, inner, 'marking'));
    layout.parts.push(part('earInnerR', w * 0.07, h * 0.13, w * 0.025, earX, headY + headS * (wolf ? 1.1 : 0.5), headZ - headS * 0.05 + w * 0.05, inner, 'marking'));
    const whiskerPad = wolf ? [0.48, 0.40, 0.32] : [0.92, 0.70, 0.42];
    layout.parts.push(part('whiskerPadL', w * 0.16, h * 0.07, w * 0.05, -w * 0.20, headY - headS * 0.08, headZ + headS * 0.50, whiskerPad, 'marking'));
    layout.parts.push(part('whiskerPadR', w * 0.16, h * 0.07, w * 0.05, w * 0.20, headY - headS * 0.08, headZ + headS * 0.50, whiskerPad, 'marking'));
    layout.parts.push(part('chestRuff', w * 0.52, h * 0.28, l * 0.10, 0, h * 0.48, l * 0.33, light, 'marking'));
    layout.parts.push(part('tailTipMark', w * 0.25, w * 0.25, l * 0.12, 0, h * 0.50, -l * 0.67, light, 'marking'));
  } else if (type === 'hare') {
    const headS = w * 0.52;
    const legH = h * 0.28;
    const bodyH = h * 0.42;
    const headY = legH + bodyH + headS * 0.25;
    const headZ = l * 0.28;
    const inner = [0.92, 0.45, 0.46];
    layout.parts.push(part('earInnerL', w * 0.07, h * 0.30, w * 0.025, -w * 0.21, headY + headS * 0.5, headZ - headS * 0.05 + w * 0.05, inner, 'marking'));
    layout.parts.push(part('earInnerR', w * 0.07, h * 0.30, w * 0.025, w * 0.21, headY + headS * 0.5, headZ - headS * 0.05 + w * 0.05, inner, 'marking'));
    layout.parts.push(part('whiskerPadL', w * 0.14, h * 0.08, w * 0.05, -w * 0.16, headY - headS * 0.08, headZ + headS * 0.40, light, 'marking'));
    layout.parts.push(part('whiskerPadR', w * 0.14, h * 0.08, w * 0.05, w * 0.16, headY - headS * 0.08, headZ + headS * 0.40, light, 'marking'));
    layout.parts.push(part('cheekL', w * 0.18, h * 0.16, w * 0.06, -w * 0.25, h * 0.78, l * 0.42, light, 'marking'));
    layout.parts.push(part('cheekR', w * 0.18, h * 0.16, w * 0.06, w * 0.25, h * 0.78, l * 0.42, light, 'marking'));
  } else if (type === 'bird' || type === 'parrot') {
    layout.parts.push(part('wingBarL', w * 0.14, h * 0.06, l * 0.42, -w * 0.55, h * 0.48, 0.02, light, 'marking'));
    layout.parts.push(part('wingBarR', w * 0.14, h * 0.06, l * 0.42, w * 0.55, h * 0.48, 0.02, dark, 'marking'));
  } else if (type === 'bear') {
    const headS = w * 0.58;
    const legH = h * 0.32;
    const bodyH = h * 0.52;
    const bodyY = legH + bodyH * 0.5;
    const headY = bodyY + bodyH * 0.18;
    const headZ = l * 0.42;
    const inner = [0.58, 0.22, 0.20];
    layout.parts.push(part('earInnerL', w * 0.08, h * 0.07, w * 0.025, -w * 0.3, headY + headS * 0.44, headZ - headS * 0.05 + w * 0.05, inner, 'marking'));
    layout.parts.push(part('earInnerR', w * 0.08, h * 0.07, w * 0.025, w * 0.3, headY + headS * 0.44, headZ - headS * 0.05 + w * 0.05, inner, 'marking'));
  } else if (type === 'horse') {
    const headS = w * 0.48;
    const legH = h * 0.58;
    const bodyH = h * 0.30;
    const bodyY = legH + bodyH * 0.5;
    const neckH = h * 0.46;
    const headY = bodyY + bodyH * 0.35 + neckH;
    const headZ = l * 0.48;
    const blaze = [0.98, 0.88, 0.66];
    const nostril = [0.08, 0.035, 0.02];
    const maneGold = [0.92, 0.58, 0.22];
    layout.parts.push(part('faceBlaze', w * 0.16, h * 0.24, w * 0.08, 0, headY + headS * 0.04, headZ + headS * 0.60, blaze, 'marking'));
    layout.parts.push(part('nostrilL', w * 0.06, h * 0.06, w * 0.035, -w * 0.11, headY - headS * 0.12, headZ + headS * 0.78, nostril, 'marking'));
    layout.parts.push(part('nostrilR', w * 0.06, h * 0.06, w * 0.035, w * 0.11, headY - headS * 0.12, headZ + headS * 0.78, nostril, 'marking'));
    layout.parts.push(part('maneGlint0', w * 0.05, h * 0.18, w * 0.05, -w * 0.23, bodyY + bodyH * 0.35 + neckH * 0.35 - h * 0.06, l * 0.25, maneGold, 'mane'));
    layout.parts.push(part('maneGlint1', w * 0.05, h * 0.18, w * 0.05, -w * 0.23, bodyY + bodyH * 0.35 + neckH * 0.35 + h * 0.08, l * 0.25, maneGold, 'mane'));
  } else if (type === 'sheep' || type === 'lamb') {
    layout.parts.push(part('woolHighlight', w * 0.72, h * 0.15, l * 0.28, 0, h * 0.70, l * 0.10, light, 'marking'));
    layout.parts.push(part('woolCrest', w * 0.42, h * 0.12, w * 0.20, 0, h * 0.92, l * 0.25, light, 'marking'));
  } else if (type === 'cow') {
    layout.parts.push(part('muzzlePatch', w * 0.52, h * 0.12, l * 0.08, 0, h * 0.52, l * 0.60, light, 'marking'));
  } else if (type === 'pig' || type === 'boar') {
    const boar = type === 'boar';
    const whiskerPad = boar ? [0.54, 0.42, 0.28] : [0.96, 0.72, 0.48];
    const cheekW = boar ? w * 0.16 : w * 0.18;
    const cheekH = boar ? h * 0.14 : h * 0.16;
    const cheekX = boar ? w * 0.34 : w * 0.32;
    const cheekZ = boar ? l * 0.42 : l * 0.40;
    layout.parts.push(part('whiskerPadL', w * 0.15, h * 0.08, w * 0.05, -w * 0.22, h * 0.62, l * 0.55, whiskerPad, 'marking'));
    layout.parts.push(part('whiskerPadR', w * 0.15, h * 0.08, w * 0.05, w * 0.22, h * 0.62, l * 0.55, whiskerPad, 'marking'));
    layout.parts.push(part('cheekL', cheekW, cheekH, w * 0.06, -cheekX, h * 0.72, cheekZ, light, 'marking'));
    layout.parts.push(part('cheekR', cheekW, cheekH, w * 0.06, cheekX, h * 0.72, cheekZ, light, 'marking'));
  }
}

/**
 * @param {object} pose
 * @param {string[]} legNames
 * @param {string[]} wingNames
 * @param {number} phase
 * @param {number} speed01
 * @param {string} type
 * @param {string} attention
 */
export function animalLimbPose(pose, legNames, wingNames, phase, speed01, type, attention = '') {
  const p = pose && typeof pose === 'object' ? pose : {};
  const spd = clamp01(Number(speed01) || 0);
  const ph = Number(phase) || 0;
  const amp = 0.04 + 0.55 * spd;
  const idle = attention ? attention === 'idle' : spd < 0.12;
  const browse = attention ? attention === 'browse' : spd >= 0.12 && spd < 0.34;
  const alert = attention ? attention === 'alert' || attention === 'flee' : spd >= 0.75;
  // The production mesh sync supplies speed01 from fauna velocity. These
  // bands turn deterministic idle/browse/alert movement into a readable pose.
  const headRx = idle
    ? Math.sin(ph * 0.7) * 0.10
    : browse
      ? -0.38 + Math.sin(ph * 0.5) * 0.06
      : alert
        ? 0.30
        : Math.sin(ph * 0.35) * 0.02;
  const headRz = idle ? Math.sin(ph * 0.45) * 0.12 : alert ? 0.18 : 0;
  const bodyRx = idle
    ? Math.sin(ph * 0.5) * 0.05
    : browse
      ? 0.28
      : alert
        ? -0.30
        : 0;
  const bodyRz = idle ? Math.sin(ph * 0.35) * 0.08 : browse ? 0.18 : alert ? 0.20 : 0;
  if (!p.body) p.body = { rx: 0, rz: 0 };
  p.body.rx = bodyRx;
  p.body.rz = bodyRz;
  for (const name of ['head', 'neck', 'snout']) {
    if (!p[name]) p[name] = { rx: 0, rz: 0 };
    p[name].rx = headRx;
    p[name].rz = headRz;
  }
  for (const name of ['earL', 'earR']) {
    if (!p[name]) p[name] = { rx: 0, rz: 0 };
    const side = name === 'earL' ? 1 : -1;
    p[name].rz = alert ? 0.26 * side : browse ? 0.12 * side : 0;
  }
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

  const fly = type === 'bird' || type === 'parrot' || type === 'bat';
  const wAmp = fly ? 0.2 + 0.55 * Math.max(spd, 0.25) : 0.2 + 0.5 * spd;
  for (const name of wings) {
    if (!p[name]) p[name] = { rx: 0, rz: 0 };
    const sign = name === 'wingR' || name.endsWith('R') ? -1 : 1;
    p[name].rz = Math.sin(ph * 2) * wAmp * sign;
    p[name].rx = Math.sin(ph * 2) * wAmp * 0.35;
  }
  return p;
}
