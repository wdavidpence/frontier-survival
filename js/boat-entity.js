/** Dependency-free boat rules for placement, buoyancy, steering, and seating. */

export const BOAT_CONFIG = Object.freeze({
  width: 1.65,
  length: 2.35,
  height: 0.55,
  cruiseSpeed: 5.8,
  turnRate: 2.4,
  riderHeight: 0.72,
  maxBank: 0.1,
});

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createBoat(x, y, z, yaw = 0) {
  return {
    x: Number(x) || 0,
    y: Number(y) || 0,
    z: Number(z) || 0,
    yaw: Number(yaw) || 0,
    vx: 0,
    vz: 0,
    rider: null,
    mounted: false,
  };
}

export function canPlaceBoat({ water = false, clear = true, depth = 1 } = {}) {
  return water === true && clear === true && Number(depth) >= 1;
}

export function buoyancyY(surfaceY, boatY, dt = 0.016) {
  const target = Number(surfaceY) + 0.12;
  const current = Number(boatY);
  const blend = clamp(Number(dt) * 8, 0, 1);
  return current + (target - current) * blend;
}

export function mountBoat(boat, riderId = 'p1') {
  if (!boat || boat.rider != null) return { ok: false, error: 'occupied' };
  boat.rider = riderId;
  boat.mounted = true;
  return { ok: true, boat };
}

export function dismountBoat(boat) {
  if (!boat || boat.rider == null) return { ok: false, error: 'not mounted' };
  const rider = boat.rider;
  boat.rider = null;
  boat.mounted = false;
  return {
    ok: true,
    rider,
    position: {
      x: boat.x + Math.cos(boat.yaw) * 1.25,
      y: boat.y + 0.2,
      z: boat.z - Math.sin(boat.yaw) * 1.25,
    },
  };
}

export function boatAimDistance(boat, origin, direction, maxDist = 4) {
  if (!boat || !origin || !direction) return Infinity;
  const dx = boat.x - origin.x;
  const dy = boat.y + 0.25 - origin.y;
  const dz = boat.z - origin.z;
  const along = dx * direction.x + dy * direction.y + dz * direction.z;
  if (along < 0 || along > maxDist) return Infinity;
  const px = dx - direction.x * along;
  const py = dy - direction.y * along;
  const pz = dz - direction.z * along;
  return px * px + py * py + pz * pz <= 0.95 * 0.95 ? along : Infinity;
}

export function boatWaterFootprintClear(x, z, sampleAt, seaLevel = 16, waterId = 5) {
  if (typeof sampleAt !== 'function') return false;
  const halfWidth = BOAT_CONFIG.width * 0.48;
  const halfLength = BOAT_CONFIG.length * 0.48;
  const samples = [
    [0, 0],
    [-halfWidth, 0], [halfWidth, 0],
    [0, -halfLength], [0, halfLength],
    [-halfWidth, -halfLength], [-halfWidth, halfLength],
    [halfWidth, -halfLength], [halfWidth, halfLength],
  ];
  for (const [dx, dz] of samples) {
    if (sampleAt(Math.floor(Number(x) + dx), seaLevel, Math.floor(Number(z) + dz)) !== waterId) return false;
  }
  return true;
}

export function stepBoat(boat, input = {}, dt = 0.016) {
  if (!boat || boat.rider == null) return boat;
  const forward = Number(input.forward) || 0;
  const turn = Number(input.turn) || 0;
  boat.yaw += clamp(turn, -1, 1) * BOAT_CONFIG.turnRate * dt;
  const speed = clamp(forward, -1, 1) * BOAT_CONFIG.cruiseSpeed;
  const response = clamp(dt * 7, 0, 1);
  boat.vx += (-Math.sin(boat.yaw) * speed - boat.vx) * response;
  boat.vz += (-Math.cos(boat.yaw) * speed - boat.vz) * response;
  boat.x += boat.vx * dt;
  boat.z += boat.vz * dt;
  return boat;
}

export function riderPosition(boat) {
  return {
    x: boat.x,
    y: boat.y + BOAT_CONFIG.riderHeight,
    z: boat.z,
  };
}
