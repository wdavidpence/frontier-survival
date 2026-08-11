/**
 * Shared contract for first-person voxel interactions.
 *
 * Keeping button semantics and ray validation here makes mining/tree cutting
 * independent of browser event quirks and camera pitch. The world raycaster
 * remains responsible for voxel traversal; this module only normalizes and
 * validates its inputs.
 */

export const PRIMARY_BREAK_BUTTON = 0;
export const DEFAULT_INTERACTION_DISTANCE = 6;
const MIN_DIRECTION_LENGTH = 1e-8;

/**
 * Return whether an event/button represents the primary (left) mouse button.
 * Accepts a number for pure callers and a MouseEvent-like object for handlers.
 * @param {number|{button?:number}|null|undefined} eventOrButton
 */
export function isPrimaryBreakButton(eventOrButton) {
  const button = typeof eventOrButton === 'number'
    ? eventOrButton
    : eventOrButton?.button;
  return button === PRIMARY_BREAK_BUTTON;
}

/**
 * Normalize an arbitrary look vector, rejecting invalid camera state.
 * @param {{x?:number,y?:number,z?:number}|null|undefined} direction
 * @returns {{x:number,y:number,z:number}|null}
 */
export function normalizeInteractionDirection(direction) {
  const x = Number(direction?.x);
  const y = Number(direction?.y);
  const z = Number(direction?.z);
  const length = Math.hypot(x, y, z);
  if (!Number.isFinite(length) || length < MIN_DIRECTION_LENGTH) return null;
  return { x: x / length, y: y / length, z: z / length };
}

/**
 * Prepare safe inputs for a voxel raycast. A steep camera pitch is just another
 * unit direction, so the interaction range is measured in world units rather
 * than changing with the horizontal projection of the look vector.
 * @param {{x?:number,y?:number,z?:number}|null|undefined} origin
 * @param {{x?:number,y?:number,z?:number}|null|undefined} direction
 * @param {number} [maxDist]
 * @returns {{origin:{x:number,y:number,z:number},direction:{x:number,y:number,z:number},maxDist:number}|null}
 */
export function makeVoxelInteraction(
  origin,
  direction,
  maxDist = DEFAULT_INTERACTION_DISTANCE,
) {
  const x = Number(origin?.x);
  const y = Number(origin?.y);
  const z = Number(origin?.z);
  const range = Number(maxDist);
  const normalized = normalizeInteractionDirection(direction);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
  if (!Number.isFinite(range) || range <= 0 || !normalized) return null;
  return {
    origin: { x, y, z },
    direction: normalized,
    maxDist: range,
  };
}
