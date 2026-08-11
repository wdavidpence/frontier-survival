import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_INTERACTION_DISTANCE,
  isPrimaryBreakButton,
  makeVoxelInteraction,
  normalizeInteractionDirection,
} from '../js/interaction-contract.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('primary break contract accepts left mouse and rejects non-primary buttons', () => {
  assert.equal(isPrimaryBreakButton(0), true);
  assert.equal(isPrimaryBreakButton({ button: 0 }), true);
  assert.equal(isPrimaryBreakButton(1), false);
  assert.equal(isPrimaryBreakButton({ button: 2 }), false);
  assert.equal(isPrimaryBreakButton(null), false);
});

test('interaction direction is unit length at extreme camera pitch', () => {
  const direction = normalizeInteractionDirection({ x: 1e-12, y: -1, z: -1e-12 });
  assert.ok(direction);
  assert.ok(Math.abs(Math.hypot(direction.x, direction.y, direction.z) - 1) < 1e-12);
  assert.ok(direction.y < -0.999999999999);
  assert.equal(normalizeInteractionDirection({ x: 0, y: 0, z: 0 }), null);
  assert.equal(normalizeInteractionDirection({ x: NaN, y: 0, z: 1 }), null);
});

test('voxel interaction contract validates origin, range, and normalized direction', () => {
  const ray = makeVoxelInteraction(
    { x: 2.5, y: 18.25, z: -3.5 },
    { x: 0, y: -4, z: -3 },
  );
  assert.deepEqual(ray.origin, { x: 2.5, y: 18.25, z: -3.5 });
  assert.equal(ray.maxDist, DEFAULT_INTERACTION_DISTANCE);
  assert.ok(Math.abs(Math.hypot(ray.direction.x, ray.direction.y, ray.direction.z) - 1) < 1e-12);
  assert.equal(makeVoxelInteraction({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }), null);
  assert.equal(makeVoxelInteraction({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, 0), null);
});

test('left-mouse mining and tree cutting retain the complete reachable path', () => {
  const input = read('../js/input.js');
  const game = read('../js/game.js');
  assert.match(input, /isPrimaryBreakButton\(e\)/);
  assert.match(input, /this\.breakHeld = true/);
  assert.match(input, /addEventListener\('pointerdown'/);
  assert.match(input, /addEventListener\('pointerup'/);
  assert.match(game, /this\.world\.raycast\(origin, dir, 6\)/);
  assert.match(game, /hit\.id === BLOCK\.LOG/);
  assert.match(game, /this\.world\.setBlock\(hit\.x, hit\.y, hit\.z, BLOCK\.AIR\)/);
  assert.match(game, /resolveBlockDrop\(hit\.id, dropForBlock\)/);
});
