/** Deterministic dinghy rules: two seats, beach pushing, sail wear, and repair. */

export const BOAT_CONFIG = Object.freeze({
  width: 1.65,
  length: 2.35,
  height: 0.55,
  cruiseSpeed: 5.8,
  turnRate: 2.4,
  riderHeight: 0.72,
  maxBank: 0.1,
  capacity: 2,
  pushDistance: 1.15,
  pushLimit: 3,
  waterDrag: 0.92,
  sailWearPerSecond: 0.0022,
  mastWearPerSecond: 0.0008,
  hullWearPerSecond: 0.00025,
});

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const finite = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;

function riderList(boat) {
  if (!boat) return [];
  const list = Array.isArray(boat.riders) ? boat.riders.filter(id => id === 'p1' || id === 'p2') : [];
  if (!list.length && (boat.rider === 'p1' || boat.rider === 'p2')) list.push(boat.rider);
  return [...new Set(list)].slice(0, BOAT_CONFIG.capacity);
}

function syncRiders(boat, list) {
  boat.riders = [...new Set(list)].slice(0, BOAT_CONFIG.capacity);
  boat.rider = boat.riders[0] || null;
  boat.rider2 = boat.riders[1] || null;
  boat.mounted = boat.riders.length > 0;
  return boat;
}

export function createBoat(x, y, z, yaw = 0) {
  return {
    x: finite(x),
    y: finite(y),
    z: finite(z),
    yaw: finite(yaw),
    vx: 0,
    vz: 0,
    rider: null,
    rider2: null,
    riders: [],
    mounted: false,
    beached: false,
    hull: 0.86,
    mast: 0.58,
    sail: 0.46,
    pushes: 0,
  };
}

export function normalizeBoatState(raw = {}) {
  const boat = createBoat(raw.x, raw.y, raw.z, raw.yaw);
  boat.vx = finite(raw.vx);
  boat.vz = finite(raw.vz);
  boat.beached = raw.beached === true;
  boat.hull = clamp(finite(raw.hull, boat.hull), 0, 1);
  boat.mast = clamp(finite(raw.mast, boat.mast), 0, 1);
  boat.sail = clamp(finite(raw.sail, boat.sail), 0, 1);
  boat.pushes = Math.max(0, Math.floor(finite(raw.pushes)));
  syncRiders(boat, riderList(raw));
  return boat;
}

export function canPlaceBoat({ water = false, clear = true, depth = 1 } = {}) {
  return water === true && clear === true && Number(depth) >= 1;
}

export function buoyancyY(surfaceY, boatY, dt = 0.016) {
  const target = finite(surfaceY) + 0.12;
  const current = finite(boatY);
  const blend = clamp(finite(dt) * 8, 0, 1);
  return current + (target - current) * blend;
}

export function hasRider(boat, riderId) {
  return riderList(boat).includes(riderId);
}

export function mountBoat(boat, riderId = 'p1') {
  if (!boat || (riderId !== 'p1' && riderId !== 'p2')) return { ok: false, error: 'invalid rider' };
  const list = riderList(boat);
  if (list.includes(riderId)) return { ok: true, boat, seat: list.indexOf(riderId) };
  if (list.length >= BOAT_CONFIG.capacity) return { ok: false, error: 'full' };
  syncRiders(boat, [...list, riderId]);
  return { ok: true, boat, seat: list.length };
}

export function dismountBoat(boat, riderId = 'p1') {
  if (!boat || !hasRider(boat, riderId)) return { ok: false, error: 'not mounted' };
  const yaw = boat.yaw;
  const seat = riderList(boat).indexOf(riderId);
  syncRiders(boat, riderList(boat).filter(id => id !== riderId));
  return {
    ok: true,
    rider: riderId,
    position: {
      x: boat.x + Math.cos(yaw) * 1.25 + (seat === 1 ? -0.55 : 0.55),
      y: boat.y + 0.2,
      z: boat.z - Math.sin(yaw) * 1.25,
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
    [0, 0], [-halfWidth, 0], [halfWidth, 0], [0, -halfLength], [0, halfLength],
    [-halfWidth, -halfLength], [-halfWidth, halfLength], [halfWidth, -halfLength], [halfWidth, halfLength],
  ];
  for (const [dx, dz] of samples) {
    if (sampleAt(Math.floor(finite(x) + dx), seaLevel, Math.floor(finite(z) + dz)) !== waterId) return false;
  }
  return true;
}

export function dinghySpeedMultiplier(boat) {
  if (!boat) return 0;
  const hull = clamp(finite(boat.hull), 0, 1);
  const mast = clamp(finite(boat.mast), 0, 1);
  const sail = clamp(finite(boat.sail), 0, 1);
  if (hull <= 0 || mast <= 0) return 0;
  // Tattered sail + damaged mast still move the boat, but slowly.
  return clamp((0.20 + sail * 0.52 + mast * 0.28) * (0.55 + hull * 0.45), 0.12, 1);
}

export function stepBoat(boat, input = {}, dt = 0.016) {
  if (!boat || riderList(boat).length === 0 || boat.beached) return boat;
  const forward = Number(input.forward) || 0;
  const turn = Number(input.turn) || 0;
  const power = dinghySpeedMultiplier(boat);
  boat.yaw += clamp(turn, -1, 1) * BOAT_CONFIG.turnRate * dt * (0.65 + power * 0.35);
  const speed = clamp(forward, -1, 1) * BOAT_CONFIG.cruiseSpeed * power;
  const response = clamp(dt * 7, 0, 1);
  boat.vx += (-Math.sin(boat.yaw) * speed - boat.vx) * response;
  boat.vz += (-Math.cos(boat.yaw) * speed - boat.vz) * response;
  boat.vx *= Math.pow(BOAT_CONFIG.waterDrag, dt * 60);
  boat.vz *= Math.pow(BOAT_CONFIG.waterDrag, dt * 60);
  boat.x += boat.vx * dt;
  boat.z += boat.vz * dt;
  return boat;
}

export function degradeBoat(boat, dt = 0, underway = false) {
  if (!boat || !underway || riderList(boat).length === 0) return boat;
  const seconds = Math.max(0, finite(dt));
  const speed = Math.hypot(boat.vx || 0, boat.vz || 0);
  const wear = seconds * (0.45 + Math.min(1, speed / BOAT_CONFIG.cruiseSpeed));
  boat.sail = clamp(finite(boat.sail, 0.46) - BOAT_CONFIG.sailWearPerSecond * wear, 0, 1);
  boat.mast = clamp(finite(boat.mast, 0.58) - BOAT_CONFIG.mastWearPerSecond * wear, 0, 1);
  boat.hull = clamp(finite(boat.hull, 0.86) - BOAT_CONFIG.hullWearPerSecond * wear, 0, 1);
  return boat;
}

export function pushBoat(boat, direction = {}, dt = 1) {
  if (!boat || !boat.beached) return { ok: false, error: 'afloat' };
  const dx = finite(direction.x);
  const dz = finite(direction.z);
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return { ok: false, error: 'no direction' };
  const distance = BOAT_CONFIG.pushDistance * clamp(finite(dt, 1), 0.25, 2);
  boat.x += (dx / len) * distance;
  boat.z += (dz / len) * distance;
  boat.pushes = Math.max(0, boat.pushes + 1);
  return { ok: true, boat, distance };
}

export function boatRepairPlan(boat) {
  if (!boat) return null;
  if (boat.sail < 0.98) return { part: 'sail', label: 'tattered sail', needs: [{ id: 109, count: 2 }, { id: 100, count: 1 }], gain: 0.34 };
  if (boat.mast < 0.98) return { part: 'mast', label: 'damaged mast', needs: [{ id: 100, count: 3 }, { id: 8, count: 2 }], gain: 0.28 };
  if (boat.hull < 0.98) return { part: 'hull', label: 'wooden hull', needs: [{ id: 8, count: 2 }, { id: 109, count: 1 }], gain: 0.24 };
  return null;
}

export function repairBoat(boat, part) {
  if (!boat) return boat;
  const gain = part === 'sail' ? 0.34 : part === 'mast' ? 0.28 : 0.24;
  if (part === 'sail') boat.sail = clamp(boat.sail + gain, 0, 1);
  if (part === 'mast') boat.mast = clamp(boat.mast + gain, 0, 1);
  if (part === 'hull') boat.hull = clamp(boat.hull + gain, 0, 1);
  return boat;
}

export function riderPosition(boat, riderId = 'p1') {
  const side = riderId === 'p2' ? 0.46 : -0.46;
  return {
    x: boat.x + Math.cos(boat.yaw) * side,
    y: boat.y + BOAT_CONFIG.riderHeight,
    z: boat.z - Math.sin(boat.yaw) * side,
  };
}
