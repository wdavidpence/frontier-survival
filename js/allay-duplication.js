/**
 * Pure allay duplication amnesia timer.
 */
export const ALLAY_DUPE_COOLDOWN_SEC = 300;
export function allayCanDuplicate(amnesiaLeft) {
  return (Number(amnesiaLeft) || 0) <= 0;
}
export function allayDuplicateStart(cd = ALLAY_DUPE_COOLDOWN_SEC) {
  return Math.max(0, Number(cd) || ALLAY_DUPE_COOLDOWN_SEC);
}
export function allayAmnesiaTick(left, dt) {
  return Math.max(0, (Number(left) || 0) - Math.max(0, Number(dt) || 0));
}
