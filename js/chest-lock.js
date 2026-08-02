/**
 * Pure chest lock / owner helper (MC-breadth). Additive to chests.js.
 */

/**
 * @typedef {{ ownerId: string|null, locked: boolean }} ChestLock
 */

export function createChestLock(ownerId = null) {
  return { ownerId: ownerId == null ? null : String(ownerId), locked: false };
}

export function setChestOwner(lock, ownerId) {
  const L = lock || createChestLock();
  L.ownerId = ownerId == null ? null : String(ownerId);
  return L;
}

export function setChestLocked(lock, locked) {
  const L = lock || createChestLock();
  L.locked = !!locked;
  return L;
}

/**
 * Can actor open chest?
 * Unlocked → anyone. Locked → owner only (or no owner → deny).
 * @param {ChestLock|null|undefined} lock
 * @param {string|null|undefined} actorId
 */
export function canOpenChest(lock, actorId) {
  if (!lock || !lock.locked) return true;
  if (lock.ownerId == null) return false;
  return String(actorId ?? '') === lock.ownerId;
}

export function toggleChestLock(lock, actorId) {
  const L = lock || createChestLock();
  if (L.ownerId != null && String(actorId ?? '') !== L.ownerId) {
    return { ok: false, lock: L, error: 'not owner' };
  }
  if (L.ownerId == null && actorId != null) L.ownerId = String(actorId);
  L.locked = !L.locked;
  return { ok: true, lock: L };
}
