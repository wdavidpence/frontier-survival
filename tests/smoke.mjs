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
import { ITEM, mineMultiplier, dropForBlock, isPlaceable } from '../js/items.js';
import {
  createStarterInventory,
  addItems,
  removeItems,
  countItems,
  hasIngredients,
  craftWith,
} from '../js/inventory.js';
import { craftRecipe, visibleRecipes } from '../js/crafting.js';

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

test('starter inventory has rations', () => {
  const slots = createStarterInventory();
  assert.strictEqual(countItems(slots, ITEM.RATION), 3);
});

test('add and remove items', () => {
  let slots = createStarterInventory();
  let r = addItems(slots, BLOCK.LOG, 5);
  assert.ok(r.ok);
  slots = r.slots;
  assert.strictEqual(countItems(slots, BLOCK.LOG), 5);
  r = removeItems(slots, BLOCK.LOG, 2);
  assert.ok(r.ok);
  assert.strictEqual(countItems(r.slots, BLOCK.LOG), 3);
});

test('craft planks from log', () => {
  let slots = createStarterInventory();
  slots = addItems(slots, BLOCK.LOG, 1).slots;
  const res = craftRecipe(slots, 'planks');
  assert.ok(res.ok, res.error);
  assert.strictEqual(countItems(res.slots, BLOCK.LOG), 0);
  assert.strictEqual(countItems(res.slots, BLOCK.PLANKS), 4);
});

test('craft campfire chain', () => {
  let slots = createStarterInventory();
  slots = addItems(slots, BLOCK.LOG, 5).slots;
  slots = craftRecipe(slots, 'planks').slots;
  // need more planks for sticks: craft another planks from remaining logs? 5 logs -> craft 1 = 4 planks + 4 logs
  // campfire needs 3 logs + 3 sticks; sticks need 2 planks
  slots = craftRecipe(slots, 'sticks').slots; // uses 2 planks -> 4 sticks, 2 planks left, 4 logs
  const res = craftRecipe(slots, 'campfire');
  assert.ok(res.ok, res.error);
  assert.strictEqual(countItems(res.slots, BLOCK.CAMPFIRE), 1);
});

test('craft fails without ingredients', () => {
  const slots = createStarterInventory();
  const res = craftRecipe(slots, 'wood_pick');
  assert.ok(!res.ok);
});

test('visible recipes non-empty', () => {
  assert.ok(visibleRecipes().length >= 5);
});

test('tools speed matching blocks', () => {
  assert.ok(mineMultiplier(ITEM.WOOD_AXE, BLOCK.LOG) > mineMultiplier(null, BLOCK.LOG));
  assert.ok(mineMultiplier(ITEM.STONE_PICK, BLOCK.STONE) > mineMultiplier(ITEM.WOOD_PICK, BLOCK.STONE));
});

test('coal ore drops coal item', () => {
  assert.strictEqual(dropForBlock(BLOCK.COAL_ORE), ITEM.COAL);
  assert.ok(isPlaceable(BLOCK.TORCH));
  assert.ok(!isPlaceable(ITEM.STICK));
});

console.log(`\n${passed} tests passed`);
if (process.exitCode) process.exit(1);
