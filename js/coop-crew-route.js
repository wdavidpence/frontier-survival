function finiteCoord(entity, axis) {
  if (!entity) return NaN;
  if (Number.isFinite(entity[axis])) return entity[axis];
  const value = entity.position?.[axis];
  return Number.isFinite(value) ? value : NaN;
}

export function playerNearPoint(player, point, radius = 8) {
  if (!player || !point) return false;
  const x = finiteCoord(player, 'x');
  const z = finiteCoord(player, 'z');
  const px = Number(point.x);
  const pz = Number(point.z);
  const md = Number.isFinite(radius) && radius > 0 ? radius : 8;
  if (![x, z, px, pz].every((n) => Number.isFinite(n))) return false;
  const dx = x - px;
  const dz = z - pz;
  return dx * dx + dz * dz <= md * md;
}

export function crewTogetherAt(p1, p2, point, radius = 8) {
  return playerNearPoint(p1, point, radius) && playerNearPoint(p2, point, radius);
}

export function coopCrewRouteSummary({ coopMode = false, together = false, routeName = 'White Bay', phase = 'charted' } = {}) {
  if (!coopMode) return '';
  const name = String(routeName || 'White Bay');
  if (together) {
    if (phase === 'surveyed') return `Shared crew · both at ${name} · return together`;
    return `Shared crew · both at ${name}`;
  }
  if (phase === 'surveyed') return `Shared crew · meet back at the Harbor Signal`;
  return `Shared crew · meet at ${name}`;
}
