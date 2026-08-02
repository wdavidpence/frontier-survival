/** Ominous trial key state used by vault interactions. */
export function createOminousTrialKey(hasKey = false) {
  return { hasKey: Boolean(hasKey), usedFor: null };
}

export function grantOminousTrialKey(state) {
  if (hasOminousTrialKey(state)) return state;
  return { ...state, hasKey: true };
}

export function hasOminousTrialKey(state) {
  return Boolean(state?.hasKey);
}

export function useOminousTrialKey(state) {
  if (!hasOminousTrialKey(state)) return { ok: false };
  state.hasKey = false;
  state.usedFor = null;
  return { ok: true };
}
