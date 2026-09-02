/**
 * Minecraft-class sky placement: world-fixed sun/moon aligned to arrival yaw,
 * CSS glow projection, and a player-followed shadow target.
 * Pure helpers — no DOM / THREE.
 */

export function wrapPhase(phase) {
  const p = Number(phase);
  if (!Number.isFinite(p)) return 0.25;
  return ((p % 1) + 1) % 1;
}

/** Elevation arc: 0 sunrise, PI/2 noon, PI sunset. */
export function sunArcRadians(phase) {
  return ((wrapPhase(phase) - 0.05) / 0.5) * Math.PI;
}

/**
 * World-fixed sun direction. `azimuthYaw` is the arrival look so noon sits
 * in the opening vista instead of a hardcoded world axis.
 */
export function sunDirection(phase = 0.25, azimuthYaw = 0) {
  const arc = sunArcRadians(phase);
  const elev = Math.max(0.06, Math.sin(arc));
  const along = Math.cos(arc);
  const fx = -Math.sin(azimuthYaw);
  const fz = -Math.cos(azimuthYaw);
  const rx = Math.cos(azimuthYaw);
  const rz = -Math.sin(azimuthYaw);
  const x = fx * elev * 0.22 + rx * along;
  const y = elev;
  const z = fz * elev * 0.22 + rz * along;
  const len = Math.hypot(x, y, z) || 1;
  return { x: x / len, y: y / len, z: z / len, elev, along };
}

export function moonDirection(phase = 0.25, azimuthYaw = 0) {
  return sunDirection(wrapPhase(phase) + 0.5, azimuthYaw);
}

/** Map NDC (-1..1) to CSS percent for the sky glow. Behind-camera → hidden. */
export function skyGlowFromNdc(ndcX, ndcY, ndcZ) {
  if (!Number.isFinite(ndcX) || !Number.isFinite(ndcY) || ndcZ < 0) {
    return { x: 78, y: 17, visible: false };
  }
  return {
    x: Math.max(6, Math.min(94, (ndcX * 0.5 + 0.5) * 100)),
    y: Math.max(4, Math.min(72, (1 - (ndcY * 0.5 + 0.5)) * 100)),
    visible: true,
  };
}

export function shadowFollow(player, dir, distance = 68) {
  const px = Number(player?.x) || 0;
  const py = Number(player?.y) || 0;
  const pz = Number(player?.z) || 0;
  const dx = Number(dir?.x) || 0.35;
  const dy = Math.max(0.35, Number(dir?.y) || 0.8);
  const dz = Number(dir?.z) || 0.2;
  const len = Math.hypot(dx, dy, dz) || 1;
  return {
    lightX: px + (dx / len) * distance,
    lightY: py + (dy / len) * distance,
    lightZ: pz + (dz / len) * distance,
    targetX: px,
    targetY: py,
    targetZ: pz,
  };
}
