import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ITEM,
  IRON_RAVINE,
  placeDestination,
  createDestinationState,
  deserializeDestinationState,
  prepareDestination,
  activateDestination,
  arriveDestination,
  resolveDestination,
  returnDestination,
  claimDestinationReward,
  getDestinationHudSummary,
} from '../js/expedition-destination.js';

const moduleSource = readFileSync(new URL('../js/expedition-destination.js', import.meta.url), 'utf8');

function expectPhase(state, phase) {
  assert.equal(state.phase, phase);
  assert.equal(state.destination.id, IRON_RAVINE.id);
}

function readyState() {
  return prepareDestination(createDestinationState({ seed: 'red-test-seed', campPosition: { x: 12, y: 4, z: -9 } }));
}

assert.equal(ITEM.IRON_PICK, IRON_RAVINE.requiredCapability, 'destination gate names the iron pick capability');
assert.equal(ITEM.MAP, 'map', 'Map is an existing future capability');
assert.ok(Array.isArray(IRON_RAVINE.rewardTable) && IRON_RAVINE.rewardTable.length > 0, 'destination has a reward table');
assert.deepEqual(IRON_RAVINE.rewardTable.map((reward) => reward.id), [ITEM.MAP, ITEM.TORCH], 'reward table grants Map and preserves torch');
assert.ok(!IRON_RAVINE.rewardTable.some((reward) => reward.id === 'copper_ore'), 'reward table does not grant unsupported copper ore');
assert.ok(!/Math\.random|document\.|window\.|THREE\./.test(moduleSource), 'contract remains dependency-free');

{
  const camp = { x: 101, y: 7, z: -43 };
  const first = placeDestination('stable-seed', camp);
  const second = placeDestination('stable-seed', camp);
  assert.deepEqual(first, second, 'same seed and camp produce the same destination');
  assert.notDeepEqual(first, placeDestination('different-seed', camp), 'different seed changes placement');
  assert.equal(first.id, IRON_RAVINE.id, 'placement carries a stable destination id');
  assert.ok([first.x, first.y, first.z].every(Number.isInteger), 'placement coordinates are integers');
  assert.ok([first.x, first.y, first.z].every(Number.isFinite), 'placement coordinates are finite');
  assert.ok(Math.hypot(first.x - camp.x, first.z - camp.z) >= IRON_RAVINE.minimumCampDistance, 'destination keeps minimum camp separation');
}

{
  const state = readyState();
  const before = structuredClone(state);
  assert.throws(() => resolveDestination(state), /phase|transition/i, 'invalid phase transition is rejected');
  assert.deepEqual(state, before, 'invalid transition does not mutate the input');
}

{
  const state = readyState();
  const before = structuredClone(state);
  assert.throws(() => activateDestination(state, []), /iron pick|capability/i, 'activation requires an iron pick');
  assert.deepEqual(state, before, 'failed capability gate does not mutate the input');
  expectPhase(activateDestination(state, [ITEM.IRON_PICK]), 'en_route');
}

{
  const prepared = readyState();
  const activated = activateDestination(prepared, { [ITEM.IRON_PICK]: 1 });
  assert.deepEqual(activateDestination(activated, [ITEM.IRON_PICK]), activated, 'activation is idempotent after activation');
  const active = arriveDestination(activated);
  const returning = resolveDestination(active);
  const completed = returnDestination(returning);
  expectPhase(prepared, 'prepared');
  expectPhase(activated, 'en_route');
  expectPhase(active, 'active');
  expectPhase(returning, 'returning');
  expectPhase(completed, 'completed');
  assert.throws(() => returnDestination(active), /phase|transition/i, 'return cannot skip resolution');
}

{
  const completed = returnDestination(resolveDestination(arriveDestination(activateDestination(readyState(), [ITEM.IRON_PICK]))));
  const firstClaim = claimDestinationReward(completed);
  assert.equal(firstClaim.state.phase, 'claimed');
  assert.deepEqual(firstClaim.rewards, IRON_RAVINE.rewardTable, 'first claim returns the destination rewards');
  const secondClaim = claimDestinationReward(firstClaim.state);
  assert.deepEqual(secondClaim.rewards, [], 'repeated claim returns no duplicate rewards');
  assert.deepEqual(secondClaim.state, firstClaim.state, 'repeated claim is idempotent');
}

{
  const defaults = createDestinationState();
  expectPhase(defaults, 'unprepared');
  const legacy = deserializeDestinationState({
    status: 'prepared',
    destination: { x: 4, y: 2, z: -8 },
  }, { seed: 'legacy-seed', campPosition: { x: 0, y: 0, z: 0 } });
  expectPhase(legacy, 'prepared');
  assert.equal(legacy.destination.x, 4, 'legacy coordinates are retained');
  assert.equal(legacy.destination.y, 2, 'legacy coordinates are retained');
  assert.equal(legacy.destination.z, -8, 'legacy coordinates are retained');
  assert.equal(deserializeDestinationState(null).phase, 'unprepared', 'null save data falls back to defaults');
}

{
  const original = createDestinationState({ seed: 'clone-seed' });
  const copy = createDestinationState({ seed: 'clone-seed' });
  original.destination.x += 1000;
  original.destination.rewardTable[0].quantity += 99;
  assert.notEqual(original.destination.x, copy.destination.x, 'destination objects are isolated');
  assert.notEqual(original.destination.rewardTable[0].quantity, copy.destination.rewardTable[0].quantity, 'reward tables are isolated');
  const prepared = prepareDestination(copy);
  assert.equal(copy.phase, 'unprepared', 'transitions do not mutate their input');
  assert.equal(prepared.phase, 'prepared');
}

{
  const summary = getDestinationHudSummary(readyState());
  assert.match(summary, /Iron Ravine/);
  assert.match(summary, /Prepared/);
  assert.match(summary, /iron pick/i);
  assert.match(summary, /\(-?\d+, -?\d+, -?\d+\)/, 'HUD summary includes integer coordinates');
}

console.log('PASS expedition destination contract');
