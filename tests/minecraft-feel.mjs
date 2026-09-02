import assert from 'node:assert/strict';
import {
  STAND_EYE,
  SNEAK_EYE,
  CHEW_SECONDS,
  MAX_WORLD_DROPS,
  isLeafId,
  isLogId,
  eyeHeightForSneak,
  bodyHeightForSneak,
  sneakHeadroomBlocked,
  sneakBlocksAxis,
  spawnWorldDrop,
  throwDropFromLook,
  tickWorldDrop,
  dropVisualY,
  startChew,
  tickChew,
  knockbackVelocity,
  hotbarNameTick,
  leafHasLogSupport,
  collectUnsupportedLeaves,
  staggerLeafDecay,
} from '../js/minecraft-feel.js';

function test(name, fn) {
  fn();
  console.log('PASS', name);
}

test('sneak eye and body drop toward Minecraft crouch heights', () => {
  assert.ok(SNEAK_EYE < STAND_EYE);
  const eye = eyeHeightForSneak(true, STAND_EYE, 1);
  assert.ok(eye < STAND_EYE);
  assert.ok(Math.abs(eye - SNEAK_EYE) < 0.01);
  const body = bodyHeightForSneak(true, 1.7, 1);
  assert.ok(body < 1.7);
  assert.equal(sneakBlocksAxis(true, true, false), true);
  assert.equal(sneakBlocksAxis(true, true, true), false);
  assert.equal(sneakBlocksAxis(false, true, false), false);
  const blocked = sneakHeadroomBlocked((x, y, z) => (y > 1.2 ? 3 : 0), 0, 0, 0, (id) => id !== 0);
  assert.equal(blocked, true);
});

test('world drops bounce, magnet, and collect like Minecraft items', () => {
  const drop = spawnWorldDrop({ id: 6, count: 2, x: 0, y: 4, z: 0, vx: 1, vy: 2, vz: 0 });
  assert.equal(drop.id, 6);
  assert.equal(drop.count, 2);
  const fallen = tickWorldDrop(drop, 0.5, { groundY: 0 });
  assert.equal(fallen.collected, false);
  assert.ok(fallen.drop.y >= 0.28);
  const near = spawnWorldDrop({ id: 8, x: 1, y: 1, z: 0, vy: 0 });
  near.age = 1;
  const pulled = tickWorldDrop(near, 0.2, { groundY: 0, player: { x: 1.1, y: 0, z: 0 } });
  assert.equal(pulled.collected, true);
  const thrown = throwDropFromLook(101, 1, { x: 0, y: 1.5, z: 0 }, { x: 0, y: 0, z: -1 }, 6);
  assert.ok(thrown.vz < 0);
  assert.ok(thrown.pickupDelay > 0.45);
  assert.ok(dropVisualY({ y: 1, bob: Math.PI / 2 }) > 1);
  assert.ok(MAX_WORLD_DROPS >= 32);
});

test('chew channel takes a Minecraft-like bite window', () => {
  const started = startChew(101);
  assert.equal(started.id, 101);
  const mid = tickChew(started, CHEW_SECONDS * 0.4);
  assert.equal(mid.done, false);
  assert.ok(mid.progress > 0.3 && mid.progress < 0.5);
  const done = tickChew(mid.state, CHEW_SECONDS);
  assert.equal(done.done, true);
  assert.equal(done.id, 101);
  assert.equal(startChew(null), null);
});

test('knockback pushes the player away from the attacker', () => {
  const kb = knockbackVelocity(0, 0, 4, 0, 8);
  assert.ok(kb.x < 0);
  assert.ok(Math.abs(kb.z) < 1e-6);
  assert.ok(kb.y > 2);
});

test('hotbar name fades after a Minecraft overlay hold', () => {
  const shown = hotbarNameTick(null, 6, 0, 0);
  assert.equal(shown.visible, true);
  assert.ok(shown.t > 2);
  const faded = hotbarNameTick(6, 6, 0.1, 0.2);
  assert.equal(faded.visible, false);
  const switched = hotbarNameTick(6, 8, 0, 0);
  assert.equal(switched.id, 8);
  assert.equal(switched.visible, true);
});

test('unsupported leaves decay after their log is gone', () => {
  assert.equal(isLogId(6), true);
  assert.equal(isLeafId(7), true);
  const blocks = new Map([
    ['0,10,0', 6],
    ['1,10,0', 7],
    ['8,10,0', 7],
  ]);
  const get = (x, y, z) => blocks.get(`${x},${y},${z}`) || 0;
  assert.equal(leafHasLogSupport(get, 1, 10, 0), true);
  assert.equal(leafHasLogSupport(get, 8, 10, 0), false);
  const unsupported = collectUnsupportedLeaves(get, { x: 8, y: 10, z: 0 }, 2, 4);
  assert.ok(unsupported.some((c) => c.x === 8 && c.id === 7));
  const queued = staggerLeafDecay(unsupported, 0.1);
  assert.ok(queued[0].delay >= 0);
});
