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
import { ITEM, mineMultiplier, dropForBlock, isPlaceable, propsOf } from '../js/items.js';
import {
  createStarterInventory,
  addItems,
  removeItems,
  countItems,
  hasIngredients,
  craftWith,
} from '../js/inventory.js';
import { craftRecipe, visibleRecipes } from '../js/crafting.js';
import { meatDropCount, SPECIES } from '../js/animals.js';
import { tileForBlock, tileUVs, atlasTileCount, TILE, crackTileForProgress } from '../js/atlas-core.js';
import {
  equipmentWarmth,
  equipItem,
  emptyEquipment,
  canSleep,
  applySleepRest,
} from '../js/equipment.js';
import {
  buildSavePayload,
  parseSavePayload,
  serializeSave,
  writeSaveToStorage,
  readSaveFromStorage,
  clearSaveStorage,
  SAVE_KEY,
} from '../js/save.js';

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

test('raw meat cookable and risky', () => {
  const raw = propsOf(ITEM.RAW_MEAT);
  assert.ok(raw.edible > 0);
  assert.ok(raw.eatDamage > 0);
  assert.strictEqual(raw.cookable, ITEM.COOKED_MEAT);
  assert.ok(propsOf(ITEM.COOKED_MEAT).edible > raw.edible);
});

test('cook meat recipe needs heat context', () => {
  let slots = createStarterInventory();
  slots = addItems(slots, ITEM.RAW_MEAT, 1).slots;
  const cold = craftRecipe(slots, 'cook_meat', { heat: 0 });
  assert.ok(!cold.ok);
  const hot = craftRecipe(slots, 'cook_meat', { heat: 12 });
  assert.ok(hot.ok, hot.error);
  assert.strictEqual(countItems(hot.slots, ITEM.COOKED_MEAT), 1);
  assert.strictEqual(countItems(hot.slots, ITEM.RAW_MEAT), 0);
});

test('fauna species and meat drops', () => {
  assert.ok(meatDropCount(SPECIES.deer, () => 0) >= 2);
  assert.ok(SPECIES.wolf.hostile);
  assert.ok(SPECIES.hare.hp < SPECIES.deer.hp);
  assert.ok(!SPECIES.deer.hostile);
});

test('atlas tiles map blocks and cracks', () => {
  assert.ok(atlasTileCount() >= 20);
  assert.notStrictEqual(tileForBlock(BLOCK.GRASS, 'top'), tileForBlock(BLOCK.GRASS, 'side'));
  assert.strictEqual(tileForBlock(BLOCK.DIRT, 'top'), TILE.DIRT);
  assert.strictEqual(tileForBlock(BLOCK.BED, 'top'), TILE.BED);
  const uvs = tileUVs(TILE.STONE);
  assert.strictEqual(uvs.length, 4);
  assert.ok(uvs[0][0] >= 0 && uvs[0][0] <= 1);
  assert.strictEqual(crackTileForProgress(0), TILE.CRACK0);
  assert.strictEqual(crackTileForProgress(0.99), TILE.CRACK5);
});

test('equipment warmth and equip', () => {
  let eq = emptyEquipment();
  assert.strictEqual(equipmentWarmth(eq), 0);
  const r = equipItem(eq, ITEM.WOOL_COAT);
  assert.ok(r.ok);
  eq = r.equipment;
  assert.strictEqual(equipmentWarmth(eq), 8);
  const hat = equipItem(eq, ITEM.FUR_HAT);
  assert.ok(hat.ok);
  assert.strictEqual(equipmentWarmth(hat.equipment), 12);
});

test('sleep gates and rest', () => {
  const base = { ...DEFAULT_SURVIVAL, sleep: 70, hunger: 50, bodyTemp: 36.5 };
  assert.ok(!canSleep(base, { atBed: false, isNight: true }).ok);
  assert.ok(canSleep(base, { atBed: true, isNight: true }).ok);
  assert.ok(!canSleep({ ...base, sleep: 10 }, { atBed: true, isNight: false }).ok);
  assert.ok(!canSleep({ ...base, hunger: 5 }, { atBed: true, isNight: true }).ok);
  const rested = applySleepRest({ ...base, sleep: 90, stamina: 10 }, 8);
  assert.ok(rested.sleep < 90);
  assert.strictEqual(rested.stamina, 100);
});

test('cloth and bed recipes', () => {
  let slots = createStarterInventory();
  slots = addItems(slots, ITEM.HIDE, 4).slots;
  slots = craftRecipe(slots, 'cloth').slots;
  assert.strictEqual(countItems(slots, ITEM.CLOTH), 2);
  slots = addItems(slots, ITEM.HIDE, 2).slots;
  slots = addItems(slots, ITEM.CLOTH, 4).slots;
  slots = craftRecipe(slots, 'wool_coat').slots;
  assert.strictEqual(countItems(slots, ITEM.WOOL_COAT), 1);
  slots = addItems(slots, BLOCK.PLANKS, 3).slots;
  slots = addItems(slots, ITEM.CLOTH, 3).slots;
  const bed = craftRecipe(slots, 'bed');
  assert.ok(bed.ok, bed.error);
  assert.strictEqual(countItems(bed.slots, BLOCK.BED), 1);
});

test('save roundtrip preserves seed inventory edits', () => {
  const state = {
    seed: 12345,
    mode: 'survival',
    survival: {
      health: 80,
      maxHealth: 100,
      hunger: 55,
      maxHunger: 100,
      stamina: 90,
      maxStamina: 100,
      bodyTemp: 36.2,
      sleep: 12,
      wetness: 0,
      warmthFromClothes: 0,
      dead: false,
      causeOfDeath: null,
    },
    time: { elapsed: 900, weather: 'rain', weatherTimer: 40, dayLengthSec: 420 },
    player: {
      x: 1.5,
      y: 20,
      z: -3.25,
      yaw: 0.5,
      pitch: -0.1,
      hotbarIndex: 2,
      slots: [
        { id: ITEM.RATION, count: 2 },
        { id: BLOCK.LOG, count: 7 },
        { id: null, count: 0 },
      ],
    },
    edits: [
      [10, 18, 5, BLOCK.CAMPFIRE],
      [10, 18, 6, BLOCK.TORCH],
    ],
  };
  const json = serializeSave(state);
  const parsed = parseSavePayload(json);
  assert.ok(parsed.ok, parsed.error);
  assert.strictEqual(parsed.data.seed, 12345);
  assert.strictEqual(parsed.data.survival.health, 80);
  assert.strictEqual(parsed.data.player.slots[1].count, 7);
  assert.strictEqual(parsed.data.edits.length, 2);
  assert.strictEqual(parsed.data.edits[0][3], BLOCK.CAMPFIRE);
  assert.strictEqual(parsed.data.time.weather, 'rain');

  const mem = {
    _d: {},
    setItem(k, v) { this._d[k] = String(v); },
    getItem(k) { return this._d[k] ?? null; },
    removeItem(k) { delete this._d[k]; },
  };
  assert.ok(writeSaveToStorage(json, mem, SAVE_KEY).ok);
  const loaded = readSaveFromStorage(mem, SAVE_KEY);
  assert.ok(loaded.ok);
  assert.strictEqual(loaded.data.player.x, 1.5);
  clearSaveStorage(mem, SAVE_KEY);
  assert.ok(!readSaveFromStorage(mem, SAVE_KEY).ok);

  const bad = parseSavePayload('{"v":999}');
  assert.ok(!bad.ok);
});

console.log(`\n${passed} tests passed`);
if (process.exitCode) process.exit(1);
