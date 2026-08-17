const PHASES = new Set(['unprepared', 'prepared', 'en_route', 'active', 'returning', 'completed', 'claimed']);

export const ITEM = Object.freeze({
  IRON_PICK: 'iron_pick',
  MAP: 'map',
  TORCH: 'torch',
});

const REWARDS = Object.freeze([
  Object.freeze({ id: ITEM.MAP, quantity: 3 }),
  Object.freeze({ id: ITEM.TORCH, quantity: 2 }),
]);

export const IRON_RAVINE = Object.freeze({
  id: 'iron_ravine',
  name: 'Iron Ravine',
  requiredCapability: ITEM.IRON_PICK,
  minimumCampDistance: 24,
  rewardTable: REWARDS,
});

function cloneRewards(rewards) {
  return (Array.isArray(rewards) ? rewards : []).map((reward) => ({
    id: String(reward.id),
    quantity: Number.isFinite(reward.quantity) ? Math.max(0, Math.trunc(reward.quantity)) : 0,
  }));
}

function validNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizePosition(position = { x: 0, y: 0, z: 0 }) {
  if (!position || !validNumber(position.x) || !validNumber(position.z)) {
    throw new TypeError('camp position requires finite x and z coordinates');
  }
  const y = position.y === undefined ? 0 : position.y;
  if (!validNumber(y)) throw new TypeError('camp position requires a finite y coordinate');
  return { x: position.x, y, z: position.z };
}

function hashSeed(seed) {
  const text = String(seed ?? 'default');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

export function placeDestination(seed = 'default', campPosition = { x: 0, y: 0, z: 0 }) {
  const camp = normalizePosition(campPosition);
  const first = hashSeed(seed);
  const second = hashSeed(`${String(seed ?? 'default')}:radius`);
  const angle = (first / 0x100000000) * Math.PI * 2;
  const radius = IRON_RAVINE.minimumCampDistance + 8 + (second % 12);
  return {
    id: IRON_RAVINE.id,
    x: Math.round(camp.x + Math.cos(angle) * radius),
    y: Math.round(camp.y),
    z: Math.round(camp.z + Math.sin(angle) * radius),
  };
}

function destinationRecord(position, source = {}) {
  const point = normalizePosition(position);
  return {
    id: IRON_RAVINE.id,
    name: IRON_RAVINE.name,
    requiredCapability: IRON_RAVINE.requiredCapability,
    minimumCampDistance: IRON_RAVINE.minimumCampDistance,
    x: Math.round(point.x),
    y: Math.round(point.y),
    z: Math.round(point.z),
    rewardTable: cloneRewards(source.rewardTable ?? IRON_RAVINE.rewardTable),
  };
}

function makeState(position, phase = 'unprepared', source = {}) {
  const normalizedPhase = PHASES.has(phase) ? phase : 'unprepared';
  const destination = destinationRecord(position, source);
  const claimed = normalizedPhase === 'claimed' || source.rewardClaimed === true || source.rewardsClaimed === true;
  return {
    version: 1,
    id: IRON_RAVINE.id,
    phase: claimed ? 'claimed' : normalizedPhase,
    destination,
    rewardClaimed: claimed,
    claimedRewards: claimed ? cloneRewards(source.claimedRewards ?? destination.rewardTable) : [],
  };
}

export function createDestinationState(options = {}) {
  if (!options || typeof options !== 'object') return makeState(placeDestination());
  if ('phase' in options || 'status' in options || 'rewardClaimed' in options || 'rewardsClaimed' in options) {
    return deserializeDestinationState(options);
  }
  const seed = options.seed ?? 'default';
  const campPosition = options.campPosition ?? options.spawnPosition ?? { x: 0, y: 0, z: 0 };
  const point = options.destination?.x !== undefined ? options.destination : placeDestination(seed, campPosition);
  return makeState(point, 'unprepared', options);
}

function normalizePhase(value) {
  const phase = String(value ?? 'unprepared').toLowerCase();
  if (phase === 'ready') return 'prepared';
  if (phase === 'traveling' || phase === 'travelling') return 'en_route';
  if (phase === 'resolved' || phase === 'returned') return 'completed';
  return PHASES.has(phase) ? phase : 'unprepared';
}

export function deserializeDestinationState(raw, context = {}) {
  if (!raw || typeof raw !== 'object') return createDestinationState(context);
  const fallbackPoint = placeDestination(raw.seed ?? context.seed ?? 'default', raw.campPosition ?? context.campPosition ?? { x: 0, y: 0, z: 0 });
  const sourcePoint = raw.destination ?? raw.position ?? fallbackPoint;
  const phase = normalizePhase(raw.phase ?? raw.status);
  return makeState(sourcePoint, phase, raw);
}

function cloneState(state) {
  if (!state || typeof state !== 'object' || !state.destination) throw new TypeError('destination state is required');
  return {
    ...state,
    destination: {
      ...state.destination,
      rewardTable: cloneRewards(state.destination.rewardTable ?? IRON_RAVINE.rewardTable),
    },
    claimedRewards: cloneRewards(state.claimedRewards),
  };
}

function requirePhase(state, expected, next) {
  if (state.phase === next) return cloneState(state);
  if (state.phase !== expected) throw new Error(`invalid destination phase transition: ${state.phase} -> ${next}`);
  const copy = cloneState(state);
  copy.phase = next;
  return copy;
}

function hasCapability(capabilities, wanted) {
  if (typeof capabilities === 'string') return capabilities === wanted;
  if (Array.isArray(capabilities)) return capabilities.includes(wanted);
  if (capabilities instanceof Set) return capabilities.has(wanted);
  if (!capabilities || typeof capabilities !== 'object') return false;
  if (capabilities[wanted] === true || (typeof capabilities[wanted] === 'number' && capabilities[wanted] > 0)) return true;
  return hasCapability(capabilities.items, wanted) || hasCapability(capabilities.inventory, wanted) || hasCapability(capabilities.capabilities, wanted);
}

export function prepareDestination(state) {
  return requirePhase(state, 'unprepared', 'prepared');
}

export function activateDestination(state, capabilities) {
  if (state?.phase === 'en_route') return cloneState(state);
  if (state?.phase !== 'prepared') throw new Error(`invalid destination phase transition: ${state?.phase} -> en_route`);
  if (!hasCapability(capabilities, IRON_RAVINE.requiredCapability)) {
    throw new Error(`activation requires capability ${IRON_RAVINE.requiredCapability}`);
  }
  return requirePhase(state, 'prepared', 'en_route');
}

export function arriveDestination(state) {
  return requirePhase(state, 'en_route', 'active');
}

export function resolveDestination(state) {
  return requirePhase(state, 'active', 'returning');
}

export function returnDestination(state) {
  return requirePhase(state, 'returning', 'completed');
}

export function claimDestinationReward(state) {
  if (state?.phase === 'claimed') return { state: cloneState(state), rewards: [] };
  if (state?.phase !== 'completed') throw new Error(`invalid destination phase transition: ${state?.phase} -> claimed`);
  const copy = cloneState(state);
  copy.phase = 'claimed';
  copy.rewardClaimed = true;
  copy.claimedRewards = cloneRewards(copy.destination.rewardTable);
  return { state: copy, rewards: cloneRewards(copy.claimedRewards) };
}

const PHASE_LABELS = {
  unprepared: 'Unprepared',
  prepared: 'Prepared',
  en_route: 'En route',
  active: 'Active',
  returning: 'Returning',
  completed: 'Completed',
  claimed: 'Claimed',
};

export function getDestinationHudSummary(state) {
  const safe = state?.destination ? state : createDestinationState();
  const destination = safe.destination;
  const phase = PHASE_LABELS[safe.phase] ?? 'Unprepared';
  return `${destination.name} · ${phase} · Requires iron pick · (${destination.x}, ${destination.y}, ${destination.z})`;
}
