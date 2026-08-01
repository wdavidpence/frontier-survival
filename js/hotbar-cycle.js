/**
 * Pure per-player hotbar cycle helper (coop P0).
 * Edge-trigger friendly: call only on button-down edges from input layer.
 */

export const HOTBAR_SIZE_DEFAULT = 9;

/**
 * Cycle hotbar index.
 * @param {number} index current 0..size-1
 * @param {number} delta +1 next, -1 prev
 * @param {number} [size=9]
 */
export function cycleHotbarIndex(index, delta, size = HOTBAR_SIZE_DEFAULT) {
  const n = Math.max(1, size | 0);
  let i = index | 0;
  if (!Number.isFinite(i)) i = 0;
  const d = delta | 0;
  i = ((i + d) % n + n) % n;
  return i;
}

/**
 * Apply d-pad / shoulder semantic to hotbar.
 * left/up or LB → -1; right/down or RB → +1; none → same index
 * @param {number} index
 * @param {{ left?: boolean, right?: boolean, up?: boolean, down?: boolean, lb?: boolean, rb?: boolean }} edges edge-triggered booleans
 * @param {number} [size]
 */
export function hotbarFromPadEdges(index, edges = {}, size = HOTBAR_SIZE_DEFAULT) {
  let delta = 0;
  if (edges.left || edges.up || edges.lb) delta -= 1;
  if (edges.right || edges.down || edges.rb) delta += 1;
  if (delta === 0) return index | 0;
  // Prefer single step even if multiple edges (avoid double jump)
  delta = delta > 0 ? 1 : -1;
  return cycleHotbarIndex(index, delta, size);
}

/**
 * Independent hotbar state for p1/p2.
 */
export function createDualHotbarState(size = HOTBAR_SIZE_DEFAULT) {
  return { p1: 0, p2: 0, size: Math.max(1, size | 0) };
}

export function applyDualHotbarEdge(state, slot, edges) {
  const s = state || createDualHotbarState();
  const key = slot === 'p2' ? 'p2' : 'p1';
  s[key] = hotbarFromPadEdges(s[key], edges, s.size);
  return s;
}
