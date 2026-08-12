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

/** Keep mouse and gamepad ownership independent while exposing one held flag. */
export function combineBreakHeld(mouseHeld, gamepadHeld) {
  return !!mouseHeld || !!gamepadHeld;
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

/**
 * Deterministic Amanatides-Woo traversal for a bounded voxel ray.
 * The callback contract keeps this pure and testable without constructing a
 * renderer-backed World instance.
 */
export function raycastVoxel(origin, direction, maxDist, getVoxel, isHit) {
  const interaction = makeVoxelInteraction(origin, direction, maxDist);
  if (!interaction || typeof getVoxel !== 'function' || typeof isHit !== 'function') return null;
  const { origin: o, direction: d, maxDist: range } = interaction;
  let x = Math.floor(o.x);
  let y = Math.floor(o.y);
  let z = Math.floor(o.z);
  const stepX = d.x > 0 ? 1 : d.x < 0 ? -1 : 0;
  const stepY = d.y > 0 ? 1 : d.y < 0 ? -1 : 0;
  const stepZ = d.z > 0 ? 1 : d.z < 0 ? -1 : 0;
  const deltaX = stepX ? Math.abs(1 / d.x) : Infinity;
  const deltaY = stepY ? Math.abs(1 / d.y) : Infinity;
  const deltaZ = stepZ ? Math.abs(1 / d.z) : Infinity;
  const boundary = (coord, cell, step, delta) => {
    if (!step) return Infinity;
    const distance = step > 0 ? cell + 1 - coord : coord - cell;
    return Math.max(0, distance * delta);
  };
  let nextX = boundary(o.x, x, stepX, deltaX);
  let nextY = boundary(o.y, y, stepY, deltaY);
  let nextZ = boundary(o.z, z, stepZ, deltaZ);
  let faceX = 0;
  let faceY = 0;
  let faceZ = 0;
  let dist = 0;
  const EPS = 1e-9;
  const maxSteps = Math.min(4096, Math.ceil(range * (Math.abs(d.x) + Math.abs(d.y) + Math.abs(d.z))) + 3);

  for (let i = 0; i < maxSteps; i++) {
    const id = getVoxel(x, y, z);
    if (isHit(id)) return { x, y, z, nx: -faceX, ny: -faceY, nz: -faceZ, dist, id };
    const next = Math.min(nextX, nextY, nextZ);
    if (!Number.isFinite(next) || next > range) return null;
    // Stable X → Y → Z precedence for exact edge/corner crossings.
    if (nextX <= next + EPS) {
      x += stepX;
      nextX += deltaX;
      faceX = stepX; faceY = 0; faceZ = 0;
    } else if (nextY <= next + EPS) {
      y += stepY;
      nextY += deltaY;
      faceX = 0; faceY = stepY; faceZ = 0;
    } else {
      z += stepZ;
      nextZ += deltaZ;
      faceX = 0; faceY = 0; faceZ = stepZ;
    }
    dist = next;
  }
  return null;
}
