/**
 * Pure vault reward unlock-once-per-player (MC 1.21).
 */

/**
 * @typedef {{ unlocked: Set<string> }} VaultState
 */

export function createVaultState() {
  return { unlocked: new Set() };
}

/**
 * @param {VaultState} vault
 * @param {string} playerId
 * @returns {boolean} true if player can unlock (first time)
 */
export function vaultCanUnlock(vault, playerId) {
  const id = String(playerId ?? '');
  if (!id) return false;
  const v = vault || createVaultState();
  return !v.unlocked.has(id);
}

/**
 * Mark unlocked; returns reward key or null if already taken.
 * @param {VaultState} vault
 * @param {string} playerId
 * @param {string} [rewardId='loot']
 */
export function vaultUnlock(vault, playerId, rewardId = 'loot') {
  const v = vault || createVaultState();
  const id = String(playerId ?? '');
  if (!id || v.unlocked.has(id)) {
    return { ok: false, reward: null, vault: v };
  }
  v.unlocked.add(id);
  return { ok: true, reward: rewardId, vault: v };
}

export function vaultUnlockCount(vault) {
  return vault?.unlocked?.size || 0;
}
