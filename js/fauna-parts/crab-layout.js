/**
 * Crab layout — carapace, abdomen, claws, legs, eyes.
 * Pure (no THREE / DOM). game.js builds Mesh groups from part lists.
 */

export function crabLayout(spec) {
  const { w, h, l } = scaleOf(spec);
  const c = baseCol(spec);
  const dark = accentColor(c, 'dark');
  const parts = [];
  const legNames = [];
  const wingNames = [];
  const eyeNames = [];

  // Carapace (main body shell) — large, rounded
  const carapaceW = w * 0.85;
  const carapaceH = h * 0.6;
  const carapaceL = l * 0.7;
  parts.push(part('carapace', carapaceW, carapaceH, carapaceL, 0, 0, 0, c, 'body'));

  // Abdomen (tail section) — smaller, tucked under
  const abdomenW = w * 0.4;
  const abdomenH = h * 0.3;
  const abdomenL = l * 0.5;
  parts.push(part('abdomen', abdomenW, abdomenH, abdomenL, 0, -h * 0.1, -l * 0.6, dark, 'body'));

  // Left claw — large, prominent
  const clawW = w * 0.5;
  const clawH = h * 0.45;
  const clawL = l * 0.3;
  parts.push(part('clawL', clawW, clawH, clawL, -w * 0.55, 0, 0, c, 'claw'));

  // Right claw — large, prominent
  const clawWR = w * 0.5;
  const clawHR = h * 0.45;
  const clawLR = l * 0.3;
  parts.push(part('clawR', clawWR, clawHR, clawLR, w * 0.55, 0, 0, c, 'claw'));

  // Front legs — smaller, near claws
  const legW = w * 0.15;
  const legH = h * 0.25;
  const legL = l * 0.2;
  parts.push(part('legFL', legW, legH, legL, -w * 0.35, h * 0.05, 0, dark, 'leg'));
  parts.push(part('legFR', legW, legH, legL, w * 0.35, h * 0.05, 0, dark, 'leg'));

  // Middle legs — slightly larger
  const midLegW = w * 0.18;
  const midLegH = h * 0.3;
  const midLegL = l * 0.25;
  parts.push(part('legML', midLegW, midLegH, midLegL, -w * 0.2, 0, 0, dark, 'leg'));
  parts.push(part('legMR', midLegW, midLegH, midLegL, w * 0.2, 0, 0, dark, 'leg'));

  // Back legs — smaller, near abdomen
  const backLegW = w * 0.12;
  const backLegH = h * 0.2;
  const backLegL = l * 0.18;
  parts.push(part('legBL', backLegW, backLegH, backLegL, -w * 0.05, -h * 0.15, 0, dark, 'leg'));
  parts.push(part('legBR', backLegW, backLegH, backLegL, w * 0.05, -h * 0.15, 0, dark, 'leg'));

  // Eyes — on stalks, positioned on top of carapace
  const eyeS = w * 0.05;
  parts.push(part('eyeL', eyeS, eyeS * 0.8, eyeS * 0.6, -w * 0.15, h * 0.35, l * 0.1, c, 'eye'));
  parts.push(part('eyeR', eyeS, eyeS * 0.8, eyeS * 0.6, w * 0.15, h * 0.35, l * 0.1, c, 'eye'));
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
