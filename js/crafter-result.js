/**
 * Pure crafter result buffer (MC 1.21).
 */

/**
 * @typedef {{ id: number|null, count: number }} CrafterResult
 */

/** Create an empty crafter result buffer. */
export function createCrafterResult() {
  return { id: null, count: 0 };
}

/** Check whether the buffer holds a pending output. */
export function crafterHasResult(state) {
  const s = state || createCrafterResult();
  return s.id != null && s.count > 0;
}

/** Store a craft output in the buffer (called after successful match). */
export function crafterSetResult(state, output) {
  const s = state || createCrafterResult();
  if (output?.id != null) {
    s.id = output.id;
    s.count = Math.max(1, Math.floor(output.count || 1));
  } else {
    s.id = null;
    s.count = 0;
  }
  return s;
}

/** Claim and clear the buffered result. Returns what was taken. */
export function crafterTakeResult(state) {
  const s = state || createCrafterResult();
  const taken = { id: s.id, count: s.count };
  s.id = null;
  s.count = 0;
  return taken;
}
