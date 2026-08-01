/**
 * Pure piston push line length helper (MC-breadth).
 */

export const PISTON_MAX_PUSH = 12;

/**
 * How many blocks can be pushed along a line of solidity flags.
 * @param {boolean[]} solidAhead true = occupied cell in push order (nearest first)
 * @param {number} [maxPush=PISTON_MAX_PUSH]
 * @returns {number} count to push, or -1 if jammed (too long / immovable)
 */
export function pistonPushCount(solidAhead, maxPush = PISTON_MAX_PUSH) {
  const max = Math.max(1, maxPush | 0);
  const arr = Array.isArray(solidAhead) ? solidAhead : [];
  let n = 0;
  for (let i = 0; i < arr.length; i++) {
    if (!arr[i]) return n; // air = end of stack
    n++;
    if (n > max) return -1;
  }
  // line full of solids without air = jammed against end
  return -1;
}

/**
 * Whether retract leaves sticky pull of 1 block.
 * @param {boolean} sticky
 * @param {boolean} hadBlockAttached
 */
export function pistonStickyPull(sticky, hadBlockAttached) {
  return !!(sticky && hadBlockAttached);
}
