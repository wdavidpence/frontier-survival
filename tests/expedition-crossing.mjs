import assert from 'node:assert/strict';
import { createCrossingState, deserializeCrossingState, tickCrossing, crossingHudSummary } from '../js/expedition-crossing.js';

const destination = { x: 30, y: 16, z: 0 };
const origin = { x: 0, y: 16, z: 0 };

function test(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); process.exitCode = 1; }
}

test('first crossing starts with a deterministic route distance', () => {
  const state = createCrossingState({ start: origin, destination });
  assert.equal(state.phase, 'idle');
  assert.equal(state.totalDistance, 30);
  assert.equal(state.distance, 30);
});

test('mounted boat advances crossing progress and preserves the best progress', () => {
  const initial = createCrossingState({ start: origin, destination });
  const underway = tickCrossing(initial, { boat: { x: 15, y: 16, z: 0, mounted: true }, destination, bothAboard: true });
  assert.equal(underway.phase, 'underway');
  assert.equal(underway.progress, 0.5);
  assert.equal(underway.bothAboard, true);
  const backedUp = tickCrossing(underway, { boat: { x: 5, y: 16, z: 0, mounted: true }, destination, bothAboard: true });
  assert.equal(backedUp.progress, 0.5);
  assert.equal(backedUp.maxProgress, 0.5);
});

test('beached boat inside the destination radius completes the crossing', () => {
  const initial = createCrossingState({ start: origin, destination });
  const landed = tickCrossing(initial, { boat: { x: 28, y: 16, z: 0, mounted: false, beached: true }, destination });
  assert.equal(landed.phase, 'landed');
  assert.match(crossingHudSummary(landed, 'Iron Ravine'), /complete/);
});

test('legacy or malformed crossing saves deserialize safely', () => {
  const state = deserializeCrossingState({ phase: 'bad', progress: 2 }, { start: origin, destination });
  assert.equal(state.phase, 'idle');
  assert.equal(state.progress, 1);
  assert.equal(state.destination.x, 30);
});
