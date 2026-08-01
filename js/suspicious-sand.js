/**
 * Pure suspicious sand/gravel brush loot stage (MC archaeology).
 */

export function createSuspiciousBlock(lootId = null) {
  return { dusted: 0, lootId: lootId == null ? null : lootId, revealed: false };
}

/**
 * Dust one stage (0..3); at 3 reveals loot.
 * @param {{ dusted: number, lootId: number|null, revealed: boolean }} state
 */
export function suspiciousBrush(state) {
  const s = state || createSuspiciousBlock();
  if (s.revealed) return { state: s, loot: s.lootId, done: true };
  s.dusted = Math.min(3, (s.dusted | 0) + 1);
  if (s.dusted >= 3) {
    s.revealed = true;
    return { state: s, loot: s.lootId, done: true };
  }
  return { state: s, loot: null, done: false };
}

export function suspiciousStage(state) {
  return Math.max(0, Math.min(3, state?.dusted | 0));
}
