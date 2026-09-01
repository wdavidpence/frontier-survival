import assert from 'node:assert/strict';
import { GameTime } from '../js/time.js';
import {
  CLEAR_ARRIVAL_GRACE_SEC,
  applyClearArrivalTick,
  clearArrivalActive,
  clearArrivalHudLabel,
  normalizeWeatherGrace,
} from '../js/clear-arrival.js';

const fresh = new GameTime();
assert.equal(fresh.weather, 'clear');
assert.equal(fresh.weatherGrace, CLEAR_ARRIVAL_GRACE_SEC);
assert.equal(clearArrivalHudLabel(fresh), 'Clear arrival');
assert.equal(clearArrivalActive(fresh), true);

const held = new GameTime();
held.weather = 'rain';
applyClearArrivalTick(held, 12);
assert.equal(held.weather, 'clear');
assert.equal(held.weatherGrace, CLEAR_ARRIVAL_GRACE_SEC - 12);

const rolling = new GameTime();
rolling.tick(CLEAR_ARRIVAL_GRACE_SEC + 1, { biome: 'shore' });
assert.equal(rolling.weatherGrace, 0);
assert.equal(clearArrivalHudLabel(rolling), '');

assert.equal(normalizeWeatherGrace(undefined, { fresh: true }), CLEAR_ARRIVAL_GRACE_SEC);
assert.equal(normalizeWeatherGrace(undefined), 0);
assert.equal(normalizeWeatherGrace(-4), 0);

console.log('PASS clear arrival holds a readable cove before the first weather roll');
