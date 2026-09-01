import assert from 'node:assert/strict';
import {
  SEAGLASS_CAY,
  createLookoutRouteState,
  chartLookoutRoute,
  surveyLookoutRoute,
  claimLookoutRoute,
  lookoutRouteHudSummary,
  placeSeaglassCay,
} from '../js/lookout-route.js';

const locked = createLookoutRouteState();
assert.equal(locked.version, 1);
assert.equal(locked.phase, 'locked');
assert.equal(locked.destination, null);
assert.match(lookoutRouteHudSummary(locked), /Lookout plan charts Seaglass Cay/i);

const ignored = chartLookoutRoute(locked, { harborChoice: 'landing', seed: 7, campPosition: { x: 0, y: 10, z: 0 } });
assert.equal(ignored.phase, 'locked');

const charted = chartLookoutRoute(locked, { harborChoice: 'lookout', seed: 7, campPosition: { x: 0, y: 10, z: 0 } });
assert.equal(charted.phase, 'charted');
assert.equal(charted.destination.id, SEAGLASS_CAY.id);
assert.equal(charted.destination.name, 'Seaglass Cay');
assert.ok(Math.hypot(charted.destination.x, charted.destination.z) >= SEAGLASS_CAY.minimumCampDistance);
assert.match(lookoutRouteHudSummary(charted), /Charted/i);

const kept = chartLookoutRoute(charted, { harborChoice: 'landing' });
assert.equal(kept.phase, 'charted', 'cycling away from Lookout does not erase a charted route');

const surveyed = surveyLookoutRoute(charted);
assert.equal(surveyed.phase, 'surveyed');
assert.equal(surveyLookoutRoute(surveyed).phase, 'surveyed');
assert.equal(surveyLookoutRoute(locked).phase, 'locked');

const claimed = claimLookoutRoute(surveyed);
assert.equal(claimed.phase, 'claimed');
assert.equal(claimLookoutRoute(claimed).phase, 'claimed');
assert.equal(claimLookoutRoute(charted).phase, 'charted');

const restored = createLookoutRouteState({ phase: 'surveyed', destination: placeSeaglassCay(3, { x: 2, y: 8, z: -4 }) });
assert.equal(restored.phase, 'surveyed');
assert.equal(restored.destination.name, 'Seaglass Cay');
assert.equal(createLookoutRouteState({ phase: 'charted' }).phase, 'locked', 'missing destination stays locked');
console.log('PASS lookout route charts Seaglass Cay from the Lookout plan');
