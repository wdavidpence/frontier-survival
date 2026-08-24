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
  assert.match(input, /this\.breakHeld = combineBreakHeld/);
  assert.match(input, /addEventListener\('pointerdown'/);
  assert.match(input, /addEventListener\('pointerup'/);
  assert.match(game, /this\._raycastInteraction\(origin, dir, 6\)/);
  assert.match(game, /_raycastInteraction\(origin, direction, maxDist = 6\)[\s\S]*?this\.world\.raycast\(origin, direction, maxDist\)/);
  assert.match(game, /hit\.id === BLOCK\.LOG/);
  assert.match(game, /this\.world\.excavateBlock\(hit\.x, hit\.y, hit\.z\)/);
  assert.match(game, /resolveBlockDrop\(hit\.id, dropForBlock\)/);
});

test('player pitch and Three camera pitch stay aligned for harvest aiming', () => {
  const game = read('../js/game.js');
  const player = read('../js/player.js');
  const pitch = 0.45;
  const lookDirectionY = -Math.sin(pitch);
  const cameraForwardY = Math.sin(-pitch);
  assert.ok(lookDirectionY < 0, 'positive player pitch must aim the interaction ray downward');
  assert.ok(cameraForwardY < 0, 'negated Three camera pitch must aim the view downward');
  assert.ok(Math.abs(lookDirectionY - cameraForwardY) < 1e-12);
  assert.match(player, /-Math\.sin\(this\.pitch\)/);
  assert.match(game, /this\.camera\.rotation\.x = -this\.player\.pitch/);
  assert.match(game, /this\.camera2\.rotation\.x = -this\.player2\.pitch/);
  assert.doesNotMatch(game, /this\.camera\.rotation\.x = this\.player\.pitch/);
  assert.doesNotMatch(game, /this\.camera2\.rotation\.x = this\.player2\.pitch/);
});
