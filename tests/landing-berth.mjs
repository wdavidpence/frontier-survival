import assert from 'node:assert/strict';
import {
  LANDING_BERTH,
  createLandingBerthState,
  openLandingBerth,
  boatNearBerth,
  moorBoatAtBerth,
  launchBoatFromBerth,
  landingBerthHudSummary,
} from '../js/landing-berth.js';

const locked = createLandingBerthState();
assert.equal(locked.phase, 'locked');
assert.equal(locked.slip, null);
assert.match(landingBerthHudSummary(locked), /Landing plan opens/i);

const ignored = openLandingBerth(locked, { harborChoice: 'lookout', harborPosition: { x: 10, y: 17, z: -8 } });
assert.equal(ignored.phase, 'locked');

const opened = openLandingBerth(locked, { harborChoice: 'landing', harborPosition: { x: 10, y: 17, z: -8 } });
assert.equal(opened.phase, 'open');
assert.equal(opened.id, LANDING_BERTH.id);
assert.ok(opened.slip);
assert.equal(opened.slip.z, -8 + 3.2);
assert.equal(openLandingBerth(opened, { harborChoice: 'lookout' }).phase, 'open');

const farBoat = { x: 80, y: 17, z: 80, vx: 1, vz: 1, beached: false };
assert.equal(boatNearBerth(opened, farBoat), false);
assert.equal(moorBoatAtBerth(opened, farBoat).ok, false);

const nearBoat = { x: opened.slip.x + 1, y: 16.2, z: opened.slip.z + 1, vx: 2, vz: -1, beached: false };
const moored = moorBoatAtBerth(opened, nearBoat);
assert.equal(moored.ok, true);
assert.equal(moored.state.phase, 'moored');
assert.equal(moored.boat.beached, true);
assert.equal(moored.boat.vx, 0);
assert.equal(moored.boat.x, opened.slip.x);
assert.match(landingBerthHudSummary(moored.state), /moored/i);

const launched = launchBoatFromBerth(moored.state, moored.boat, 16);
assert.equal(launched.ok, true);
assert.equal(launched.state.phase, 'open');
assert.equal(launched.boat.beached, false);
assert.ok(launched.boat.z > opened.slip.z);
assert.equal(launchBoatFromBerth(opened, nearBoat).ok, false);
console.log('PASS landing berth moors and launches a skiff');
