import assert from 'node:assert/strict';
import {
  WHITE_BAY,
  createWhiteBayRouteState,
  chartWhiteBayRoute,
  surveyWhiteBayRoute,
  claimWhiteBayRoute,
  whiteBayRouteHudSummary,
  placeWhiteBay,
} from '../js/white-bay-route.js';

const locked = createWhiteBayRouteState();
assert.equal(locked.phase, 'locked');
assert.equal(locked.destination, null);
assert.match(whiteBayRouteHudSummary(locked), /Tidewatch return charts White Bay/i);

const ignored = chartWhiteBayRoute(locked, { tidewatchClaimed: false });
assert.equal(ignored.phase, 'locked');

const charted = chartWhiteBayRoute(locked, { tidewatchClaimed: true });
assert.equal(charted.phase, 'charted');
assert.equal(charted.destination.id, WHITE_BAY.id);
assert.equal(charted.destination.x, WHITE_BAY.x);
assert.equal(charted.destination.z, WHITE_BAY.z);
assert.deepEqual(placeWhiteBay().name, 'White Bay');
assert.equal(chartWhiteBayRoute(charted, { tidewatchClaimed: false }).phase, 'charted');

const surveyed = surveyWhiteBayRoute(charted);
assert.equal(surveyed.phase, 'surveyed');
assert.equal(surveyWhiteBayRoute(locked).phase, 'locked');
assert.match(whiteBayRouteHudSummary(surveyed), /Return to the Harbor Signal/i);

const claimed = claimWhiteBayRoute(surveyed);
assert.equal(claimed.phase, 'claimed');
assert.equal(claimWhiteBayRoute(charted).phase, 'charted');
assert.equal(createWhiteBayRouteState({ phase: 'surveyed', destination: { x: -42, z: 9 } }).phase, 'surveyed');
console.log('PASS white bay route charts the authored overnight landing');
