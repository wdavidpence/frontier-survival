/**
 * Reef shark layout — body, dorsal fin, pectoral fins, caudal fin, pelvic fins, anal fin, eyes, gills.
 * Pure (no THREE / DOM). game.js builds Mesh groups from part lists.
 */

export function reefSharkLayout(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const dark = accentColor(c, 'dark');
  const bright = accentColor(c, 'bright');
  const parts = [];
  const finNames = [];
  const eyeNames = [];

  // Body (elongated torpedo shape) — large, streamlined
  const bodyW = w * 0.75;
  const bodyH = h * 0.4;
  const bodyL = l * 0.9;
  parts.push(part('body', bodyW, bodyH, bodyL, 0, 0, 0, c, 'body'));

  // Dorsal fin — large, triangular, positioned mid-back
  const dorsalW = w * 0.35;
  const dorsalH = h * 0.45;
  const dorsalL = l * 0.5;
  parts.push(part('dorsalFin', dorsalW, dorsalH, dorsalL, 0, h * 0.25, -l * 0.3, bright, 'fin'));

  // Left pectoral fin — large, wing-like, near head
  const pectoralW = w * 0.4;
  const pectoralH = h * 0.35;
  const pectoralL = l * 0.4;
  parts.push(part('pectoralFL', pectoralW, pectoralH, pectoralL, -w * 0.25, -h * 0.1, -l * 0.2, dark, 'fin'));

  // Right pectoral fin — large, wing-like, near head
  const pectoralWR = w * 0.4;
  const pectoralHR = h * 0.35;
  const pectoralLR = l * 0.4;
  parts.push(part('pectoralFR', pectoralWR, pectoralHR, pectoralLR, w * 0.25, -h * 0.1, -l * 0.2, dark, 'fin'));

  // Caudal fin (tail) — large, forked
  const caudalW = w * 0.45;
  const caudalH = h * 0.5;
  const caudalL = l * 0.6;
  parts.push(part('caudalFin', caudalW, caudalH, caudalL, 0, -h * 0.1, -l * 0.85, bright, 'fin'));

  // Left pelvic fin — smaller, positioned under body
  const pelvicW = w * 0.2;
  const pelvicH = h * 0.2;
  const pelvicL = l * 0.3;
  parts.push(part('pelvicFL', pelvicW, pelvicH, pelvicL, -w * 0.15, -h * 0.3, -l * 0.4, dark, 'fin'));

  // Right pelvic fin — smaller, positioned under body
  const pelvicWR = w * 0.2;
  const pelvicHR = h * 0.2;
  const pelvicLR = l * 0.3;
  parts.push(part('pelvicFR', pelvicWR, pelvicHR, pelvicLR, w * 0.15, -h * 0.3, -l * 0.4, dark, 'fin'));

  // Anal fin — small, stabilizing, near tail
  const analW = w * 0.2;
  const analH = h * 0.15;
  const analL = l * 0.35;
  parts.push(part('analFin', analW, analH, analL, 0, -h * 0.25, -l * 0.6, dark, 'fin'));

  // Eyes — positioned on sides of head
  const eyeS = w * 0.08;
  parts.push(part('eyeL', eyeS, eyeS * 0.9, eyeS * 0.7, -w * 0.15, h * 0.05, l * 0.1, [0.05, 0.05, 0.06], 'eye'));
  parts.push(part('eyeR', eyeS, eyeS * 0.9, eyeS * 0.7, w * 0.15, h * 0.05, l * 0.1, [0.05, 0.05, 0.06], 'eye'));
  eyeNames.push('eyeL', 'eyeR');

  // Gills — small slits on sides of body
  const gillW = w * 0.08;
  const gillH = h * 0.12;
  const gillL = l * 0.05;
  parts.push(part('gillL', gillW, gillH, gillL, -w * 0.1, h * 0.0, l * 0.05, dark, 'gill'));
  parts.push(part('gillR', gillW, gillH, gillL, w * 0.1, h * 0.0, l * 0.05, dark, 'gill'));

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
