/**
 * Pure scaffolding gravity / climb helper (MC-breadth).
 */

/**
 * Whether scaffolding should fall if unsupported below.
 * @param {boolean} supportBelow
 * @param {boolean} floatingAllowed creative-ish
 */
export function scaffoldingShouldFall(supportBelow, floatingAllowed = false) {
  if (floatingAllowed) return false;
  return !supportBelow;
}

/**
 * Horizontal distance from solid anchor along a run of scaffolding.
 * @param {number} runLength
 * @param {number} [maxFloat=6]
 */
export function scaffoldingWithinFloat(runLength, maxFloat = 6) {
  const n = Math.max(0, runLength | 0);
  const m = Math.max(0, maxFloat | 0);
  return n <= m;
}

/**
 * Climb speed when holding jump inside scaffolding.
 * @param {boolean} climbing
 * @param {number} [speed=3.5]
 */
export function scaffoldingClimbVy(climbing, speed = 3.5) {
  return climbing ? Math.max(0, Number(speed) || 3.5) : 0;
}
