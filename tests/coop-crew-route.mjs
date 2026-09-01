import assert from 'node:assert/strict';
import { playerNearPoint, crewTogetherAt, coopCrewRouteSummary } from '../js/coop-crew-route.js';

const camp = { x: -42, y: 16, z: 9 };
assert.equal(playerNearPoint({ x: -42, z: 9 }, camp, 8), true);
assert.equal(playerNearPoint({ position: { x: 0, z: 9 } }, camp, 8), false);
assert.equal(crewTogetherAt({ x: -42, z: 10 }, { x: -41, z: 8 }, camp, 8), true);
assert.equal(crewTogetherAt({ x: -42, z: 9 }, { x: 0, z: 0 }, camp, 8), false);
assert.equal(crewTogetherAt(null, { x: -42, z: 9 }, camp), false);

assert.equal(coopCrewRouteSummary({ coopMode: false, together: true }), '');
assert.match(coopCrewRouteSummary({ coopMode: true, together: true, routeName: 'White Bay' }), /Shared crew · both at White Bay/);
assert.match(coopCrewRouteSummary({ coopMode: true, together: false, phase: 'charted' }), /meet at White Bay/);
assert.match(coopCrewRouteSummary({ coopMode: true, together: true, phase: 'surveyed' }), /return together/);
console.log('PASS co-op crew rendezvous at a shared coastal camp');
