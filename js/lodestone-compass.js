/**
 * Pure lodestone compass track helper.
 */
export function lodestoneBearing(from, lodestone) {
  const dx = (lodestone?.x ?? 0) - (from?.x ?? 0);
  const dz = (lodestone?.z ?? 0) - (from?.z ?? 0);
  return Math.atan2(dx, dz);
}
export function lodestoneDistance(from, lodestone) {
  const dx = (lodestone?.x ?? 0) - (from?.x ?? 0);
  const dy = (lodestone?.y ?? 0) - (from?.y ?? 0);
  const dz = (lodestone?.z ?? 0) - (from?.z ?? 0);
  return Math.hypot(dx, dy, dz);
}
export function lodestoneInDimension(compassDim, stoneDim) {
  return String(compassDim || '') === String(stoneDim || '');
}
