/**
 * Pure hanging sign attach face.
 */
export const HANGING_FACES = ['north', 'south', 'east', 'west', 'ceiling'];
export function hangingSignFaceFromYaw(yaw, ceiling = false) {
  if (ceiling) return 'ceiling';
  const y = Number(yaw);
  if (!Number.isFinite(y)) return 'south';
  let a = ((y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  const deg = (a * 180) / Math.PI;
  if (deg >= -45 && deg < 45) return 'south';
  if (deg >= 45 && deg < 135) return 'west';
  if (deg >= -135 && deg < -45) return 'east';
  return 'north';
}
export function isHangingFace(f) {
  return HANGING_FACES.includes(String(f || '').toLowerCase());
}
