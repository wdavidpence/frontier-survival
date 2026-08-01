/**
 * Pure ladder climb helper (MC-breadth).
 * Returns vertical velocity contribution while on ladder.
 */

/**
 * @param {{ onLadder: boolean, climbUp: boolean, climbDown: boolean, baseSpeed?: number }} input
 * @returns {number} vy delta suggestion (world units / sec)
 */
export function ladderClimbVy(input) {
  if (!input?.onLadder) return 0;
  const speed = Number.isFinite(input.baseSpeed) ? input.baseSpeed : 3.2;
  if (input.climbUp && !input.climbDown) return speed;
  if (input.climbDown && !input.climbUp) return -speed * 0.85;
  // hold on ladder
  return 0;
}

/**
 * Whether gravity should be suppressed while latched to ladder.
 * @param {boolean} onLadder
 * @param {boolean} jumpPressed
 */
export function ladderSuppressGravity(onLadder, jumpPressed = false) {
  return !!onLadder && !jumpPressed;
}

/**
 * Detach if player moves off ladder block horizontally beyond threshold.
 * @param {number} distFromLadderCenter horizontal distance
 * @param {number} [maxDist=0.65]
 */
export function shouldDetachLadder(distFromLadderCenter, maxDist = 0.65) {
  const d = Math.abs(Number(distFromLadderCenter) || 0);
  const m = Math.max(0.1, Number(maxDist) || 0.65);
  return d > m;
}
