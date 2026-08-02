/**
 * Improved alligator silhouette: scute ridge + pronounced jaw.
 * Pure (no THREE / DOM). game.js builds Mesh groups from part lists.
 */

/**
 * Improved alligator silhouette: scute ridge + pronounced jaw.
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

export function part(name, sx, sy, sz, x, y, z, color, role) {
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

export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function scaleOf(spec) {
  const s = spec?.scale || [0.5, 0.5, 0.7];
  return {
    w: Math.max(0.15, Number(s[0]) || 0.5),
    h: Math.max(0.15, Number(s[1]) || 0.5),
    l: Math.max(0.2, Number(s[2]) || 0.7),
  };
}

export function baseCol(spec) {
  const c = spec?.color || [0.5, 0.45, 0.4];
  return [Number(c[0]) || 0.5, Number(c[1]) || 0.45, Number(c[2]) || 0.4];
}

/**
 * Build scute bumps along the alligator's ridge.
 * Each scute is a small triangular plate with slight height variation for organic look.
 * @param {number} count - number of scutes (default 6)
 * @param {number} baseY - base y position
 * @param {number} headZ - z offset for head region
 * @param {number} tailZ - z offset for tail region
 * @returns {{ parts: Array, names: string[] }}
 */
export function alligatorScuteRidge(count, baseY, headZ, tailZ, w = 0.5, h = 0.5, l = 0.7) {
  count = Math.max(4, Math.min(10, Math.round(count || 6)));
  const parts = [];
  const names = [];
  const scuteCount = count;

  for (let i = 0; i < scuteCount; i++) {
    const t = i / (scuteCount - 1);
    // scutes get slightly larger toward the middle of the body
    const sizeVar = 1.0 + Math.sin(t * Math.PI) * 0.15;
    const sx = w * 0.18 * sizeVar;
    const sy = h * 0.12 * sizeVar;
    const sz = l * 0.15 * sizeVar;

    // slight height variation for organic look
    const yOff = (Math.sin(t * Math.PI * 3) * 0.03);

    parts.push(
      part('ridgeScute' + i + 'L', sx, sy, sz, 0, baseY + yOff, headZ + t * (tailZ - headZ) + 0.15, [0.6, 0.5, 0.4], 'fin')
    );
    parts.push(
      part('ridgeScute' + i + 'R', sx, sy, sz, 0, baseY + yOff, headZ + t * (tailZ - headZ) - 0.15, [0.6, 0.5, 0.4], 'fin')
    );
    names.push('ridgeScute' + i + 'L', 'ridgeScute' + i + 'R');
  }

  return { parts, names };
}

/**
 * Build a pronounced jaw/snout with visible teeth and textured surface.
 * @param {number} w - width scale
 * @param {number} h - height scale
 * @param {number} l - length scale
 * @param {number} headY - y position of head base
 * @param {number} headZ - z offset
 * @returns {{ parts: Array, names: string[] }}
 */
export function alligatorJaw(w, h, l, headY, headZ) {
  const parts = [];
  const names = [];

  // upper jaw: elongated and slightly curved downward
  parts.push(
    part('jawUpper', w * 0.5, h * 0.35, l * 0.42, 0, headY - h * 0.08, headZ + l * 0.18, [0.7, 0.6, 0.4], 'snout')
  );

  // lower jaw: slightly shorter and curves upward to meet upper
  parts.push(
    part('jawLower', w * 0.45, h * 0.32, l * 0.38, 0, headY - h * 0.12, headZ + l * 0.22, [0.65, 0.55, 0.35], 'snout')
  );

  // visible teeth along the jaw line (upper)
  const toothCount = 4;
  for (let i = 0; i < toothCount; i++) {
    const t = i / (toothCount - 1);
    const toothSx = w * 0.06;
    const toothSy = h * 0.05;
    const toothSz = l * 0.08;
    const xOff = -w * 0.2 + t * w * 0.4;
    parts.push(
      part('toothU' + i, toothSx, toothSy, toothSz, xOff, headY - h * 0.15, headZ + l * 0.25, [0.9, 0.85, 0.6], 'snout')
    );
    names.push('toothU' + i);
  }

  // visible teeth along the jaw line (lower)
  for (let i = 0; i < toothCount; i++) {
    const t = i / (toothCount - 1);
    const toothSx = w * 0.06;
    const toothSy = h * 0.05;
    const toothSz = l * 0.08;
    const xOff = -w * 0.2 + t * w * 0.4;
    parts.push(
      part('toothL' + i, toothSx, toothSy, toothSz, xOff, headY - h * 0.18, headZ + l * 0.28, [0.9, 0.85, 0.6], 'snout')
    );
    names.push('toothL' + i);
  }

  return { parts, names };
}

/**
 * Build the complete improved alligator layout with scute ridge and pronounced jaw.
 * @param {object} spec - optional spec with { color?, scale? }
 * @returns {{ parts: Array, legNames: string[], wingNames: string[], eyeNames: string[] }}
 */
export function alligatorLayout(spec) {
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

  // body and belly (same as before)
  parts.push(part('body', w * 0.95, bodyH, l * 0.55, 0, bodyY, 0.05 * l, c, 'body'));
  parts.push(part('belly', w * 0.7, bodyH * 0.35, l * 0.4, 0, bodyY - bodyH * 0.12, 0.05 * l, belly, 'body'));

  // scute ridge along the back
  const headZ = l * 0.35;
  const tailZ = -l * 0.4;
  const { parts: ridgeParts, names: ridgeNames } = alligatorScuteRidge(6, bodyY + bodyH * 0.4, headZ, tailZ, w, h, l);
  parts.push(...ridgeParts);
  // track ridge names for limb pose if needed
  legNames.push(...ridgeNames);

  // snout/jaw with teeth
  const jaw = alligatorJaw(w, h, l, bodyY, headZ);
  parts.push(...jaw.parts);
  eyeNames.push(...jaw.names);

  // eyes on top of the head
  addEyes(parts, eyeNames, w * 0.55, bodyY + bodyH * 0.25, headZ + l * 0.05, w * 0.08, [0.85, 0.75, 0.15]);

  // tail
  parts.push(part('tail', w * 0.55, bodyH * 0.55, l * 0.5, 0, bodyY - bodyH * 0.05, -l * 0.4, c, 'tail'));
  parts.push(part('tailTip', w * 0.25, bodyH * 0.25, l * 0.2, 0, bodyY - bodyH * 0.08, -l * 0.62, dark, 'tail'));

  // legs
  quadLegs(parts, legNames, w, h, l, legH, w * 0.18, 0, c, w * 0.4, l * 0.18);

  return { parts, legNames, wingNames, eyeNames };
}

function addEyes(parts, eyeNames, hx, hy, hz, eyeS, eyeColor) {
  const ex = Math.max(0.04, eyeS);
  parts.push(part('eyeL', ex, ex, ex * 0.7, -hx * 0.28, hy, hz, eyeColor, 'eye'));
  parts.push(part('eyeR', ex, ex, ex * 0.7, hx * 0.28, hy, hz, eyeColor, 'eye'));
  eyeNames.push('eyeL', 'eyeR');
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
