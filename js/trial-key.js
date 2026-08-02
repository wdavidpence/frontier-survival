/** Deterministic trial key state used by vault interactions. */
export function createTrialKey(hasKey = false) {
  return { hasKey: Boolean(hasKey), usedFor: null };
}
export function trialKeyPickup(state) {
  return { ...state, hasKey: true };
}
export function hasTrialKey(state) {
  return Boolean(state?.hasKey);
}
export function trialKeyUse(state, vaultId) {
  if (!hasTrialKey(state)) return { ok: false, vaultId: null };
  state.hasKey = false;
  state.usedFor = String(vaultId);
  return { ok: true, vaultId: String(vaultId) };
}
