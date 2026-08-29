/** Pure placement preview state used by the first-person building loop. */

export function placementTargetFromHit(hit) {
  if (!hit) return null;
  return {
    x: Math.floor(hit.x + (hit.nx || 0)),
    y: Math.floor(hit.y + (hit.ny || 0)),
    z: Math.floor(hit.z + (hit.nz || 0)),
  };
}

export function placementState({ hit, placeId, isPlaceable, current, player, airId = 0, waterId = 5 } = {}) {
  if (!hit || !isPlaceable || placeId == null) return { visible: false, valid: false, target: null, reason: 'not-placeable' };
  const target = placementTargetFromHit(hit);
  if (current !== airId && current !== waterId) {
    return { visible: true, valid: false, target, reason: 'occupied' };
  }
  if (player && target.x + 1 > player.x - 0.3 && target.x < player.x + 0.3
      && target.y + 1 > player.y && target.y < player.y + 1.8
      && target.z + 1 > player.z - 0.3 && target.z < player.z + 0.3) {
    return { visible: true, valid: false, target, reason: 'inside-player' };
  }
  return { visible: true, valid: true, target, reason: 'ready' };
}
