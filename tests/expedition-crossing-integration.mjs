import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSavePayload, parseSavePayload, SAVE_VERSION } from '../js/save.js';

const game = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');

function test(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); process.exitCode = 1; }
}

test('game owns and captures the persisted first-crossing state', () => {
  assert.match(game, /_crossingState\s*=\s*createCrossingState/);
  assert.match(game, /crossing:\s*this\._crossingState/);
  assert.match(game, /tickCrossing\(this\._crossingState/);
});

test('legacy save payloads accept crossing state without a version bump', () => {
  const state = {
    seed: 7,
    survival: { health: 100 },
    time: { elapsed: 0, weather: 'clear', weatherTimer: 60, dayLengthSec: 900 },
    player: { x: 0, y: 16, z: 0, yaw: 0, pitch: 0, hotbarIndex: 0, slots: [], equipment: {} },
    edits: [],
    crossing: { phase: 'underway', progress: 0.4 },
  };
  const payload = buildSavePayload(state);
  assert.equal(SAVE_VERSION, 2);
  assert.deepEqual(parseSavePayload(payload).data.crossing, state.crossing);
  const legacy = { ...payload, crossing: undefined };
  assert.equal(parseSavePayload(legacy).data.crossing, null);
});
