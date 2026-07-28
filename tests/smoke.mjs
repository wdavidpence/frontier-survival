/**
 * Pure-logic smoke tests (no browser/Three).
 * Run: node tests/smoke.mjs
 */
import assert from 'assert';
import {
  DEFAULT_SURVIVAL,
  ambientTempC,
  tickSurvival,
  canSprint,
  moveSpeedMultiplier,
  eatFood,
  applyDamage,
} from '../js/survival.js';
import { heightAt, fbm, hash2 } from '../js/gen.js';
import { BLOCK, BLOCK_PROPS, isSolid, getDrop, getHardness } from '../js/blocks.js';

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('PASS', name);
  } catch (e) {
    console.error('FAIL', name, e.message);
    process.exitCode = 1;
  }
}

test('hash2 deterministic', () => {
  assert.strictEqual(hash2(1, 2), hash2(1, 2));
  assert.notStrictEqual(hash2(1, 2), hash2(2, 1));
});

test('fbm in range', () => {
  const v = fbm(0.5, 0.5, 4);
  assert.ok(v >= 0 && v <= 1);
});

test('heightAt finite', () => {
  const h = heightAt(10, -20, 42);
  assert.ok(Number.isFinite(h));
  assert.ok(h > 0 && h < 48);
});

test('blocks solid flags', () => {
  assert.strictEqual(isSolid(BLOCK.AIR), false);
  assert.strictEqual(isSolid(BLOCK.STONE), true);
  assert.strictEqual(isSolid(BLOCK.WATER), false);
  assert.ok(getHardness(BLOCK.STONE) > getHardness(BLOCK.DIRT));
  assert.strictEqual(getDrop(BLOCK.STONE), BLOCK.COBBLE);
  assert.ok(BLOCK_PROPS[BLOCK.CAMPFIRE].heat > 0);
});

test('noon warmer than midnight', () => {
  const day = ambientTempC(0.25, 'clear');
  const night = ambientTempC(0.75, 'clear');
  assert.ok(day > night, `${day} vs ${night}`);
});

test('snow colder ambient', () => {
  assert.ok(ambientTempC(0.25, 'snow') < ambientTempC(0.25, 'clear'));
});

test('starvation damages over time', () => {
  let s = { ...DEFAULT_SURVIVAL, hunger: 0 };
  for (let i = 0; i < 50; i++) {
    s = tickSurvival(s, {
      dt: 0.2,
      dayPhase: 0.25,
      weather: 'clear',
      blockHeat: 20,
      sprinting: false,
      moving: false,
      inWater: false,
      sleeping: false,
    });
  }
  assert.ok(s.health < 100);
});

test('cold night without fire kills eventually', () => {
  let s = { ...DEFAULT_SURVIVAL, bodyTemp: 36 };
  for (let i = 0; i < 800; i++) {
    s = tickSurvival(s, {
      dt: 0.25,
      dayPhase: 0.75,
      weather: 'snow',
      blockHeat: 0,
      sprinting: false,
      moving: false,
      inWater: false,
      sleeping: false,
    });
    if (s.dead) break;
  }
  assert.ok(s.dead, 'expected hypothermia death');
  assert.strictEqual(s.causeOfDeath, 'hypothermia');
});

test('campfire heat prevents freeze in same scenario window', () => {
  let s = { ...DEFAULT_SURVIVAL, bodyTemp: 36.5 };
  for (let i = 0; i < 200; i++) {
    s = tickSurvival(s, {
      dt: 0.25,
      dayPhase: 0.75,
      weather: 'clear',
      blockHeat: 25,
      sprinting: false,
      moving: false,
      inWater: false,
      sleeping: false,
    });
  }
  assert.ok(!s.dead);
  assert.ok(s.bodyTemp > 34, `temp ${s.bodyTemp}`);
});

test('sprint requires stamina', () => {
  assert.ok(canSprint(DEFAULT_SURVIVAL));
  assert.ok(!canSprint({ ...DEFAULT_SURVIVAL, stamina: 0 }));
  assert.ok(moveSpeedMultiplier(DEFAULT_SURVIVAL, true) > 1);
});

test('eat food restores hunger', () => {
  const s = eatFood({ ...DEFAULT_SURVIVAL, hunger: 10 }, 40);
  assert.ok(s.hunger > 40);
});

test('applyDamage can kill', () => {
  const s = applyDamage(DEFAULT_SURVIVAL, 200, 'fall');
  assert.ok(s.dead);
  assert.strictEqual(s.causeOfDeath, 'fall');
});

console.log(`\n${passed} tests passed`);
if (process.exitCode) process.exit(1);
