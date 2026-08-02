/**
 * Tropical fish layout — body, tail fin, dorsal fin, pectoral fins, anal fin, eye, mouth.
 * Pure (no THREE / DOM). game.js builds Mesh groups from part lists.
 */

export function tropicalFishLayout(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const dark = accentColor(c, 'dark');
  const bright = accentColor(c, 'bright');
  const parts = [];
  const finNames = [];
  const eyeNames = [];

  // Body (streamlined torso) — elongated
  const bodyW = w * 0.65;
  const bodyH = h * 0.45;
  const bodyL = l * 0.85;
  parts.push(part('body', bodyW, bodyH, bodyL, 0, 0, 0, c, 'body'));

  // Tail fin — large, forked, colorful
  const tailW = w * 0.4;
  const tailH = h * 0.55;
  const tailL = l * 0.6;
  parts.push(part('tailFin', tailW, tailH, tailL, 0, -h * 0.1, -l * 0.85, bright, 'fin'));

  // Dorsal fin — top, tall
  const dorsalW = w * 0.3;
  const dorsalH = h * 0.45;
  const dorsalL = l * 0.5;
  parts.push(part('dorsalFin', dorsalW, dorsalH, dorsalL, 0, h * 0.25, -l * 0.3, bright, 'fin'));

  // Pectoral fin (left) — side, near head
  const pectoralW = w * 0.2;
  const pectoralH = h * 0.25;
  const pectoralL = l * 0.3;
  parts.push(part('pectoralFL', pectoralW, pectoralH, pectoralL, -w * 0.15, -h * 0.05, -l * 0.2, dark, 'fin'));

  // Pectoral fin (right) — side, near head
  const pectoralWR = w * 0.2;
  const pectoralHR = h * 0.25;
  const pectoralLR = l * 0.3;
  parts.push(part('pectoralFR', pectoralWR, pectoralHR, pectoralLR, w * 0.15, -h * 0.05, -l * 0.2, dark, 'fin'));

  // Anal fin (bottom) — small, stabilizing
  const analW = w * 0.2;
  const analH = h * 0.15;
  const analL = l * 0.35;
  parts.push(part('analFin', analW, analH, analL, 0, -h * 0.25, -l * 0.4, dark, 'fin'));

  // Eye — large, expressive, positioned on sides
  const eyeS = w * 0.08;
  parts.push(part('eyeL', eyeS, eyeS * 0.9, eyeS * 0.7, -w * 0.12, h * 0.05, l * 0.1, [0.05, 0.05, 0.06], 'eye'));
  parts.push(part('eyeR', eyeS, eyeS * 0.9, eyeS * 0.7, w * 0.12, h * 0.05, l * 0.1, [0.05, 0.05, 0.06], 'eye'));
  eyeNames.push('eyeL', 'eyeR');

  // Mouth — small, positioned at front
  const mouthW = w * 0.08;
  const mouthH = h * 0.1;
  const mouthL = l * 0.05;
  parts.push(part('mouth', mouthW, mouthH, mouthL, -w * 0.3, h * 0.02, l * 0.05, dark, 'mouth'));

  return { parts, finNames, eyeNames };
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
