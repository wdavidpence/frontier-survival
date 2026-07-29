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
import { BLOCK, BLOCK_PROPS, isSolid, isTransparent, getDrop, getHardness, getColor } from '../js/blocks.js';
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
import { ambientMix } from '../js/audio.js';
import { greedyMeshChunk, quadsToArrays, countNaiveFaces } from '../js/mesh-greedy.js';
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

test('ambient mix day vs night fire rain', () => {
  const day = ambientMix({ isNight: false, weather: 'clear', heat: 0, dayPhase: 0.25 });
  const night = ambientMix({ isNight: true, weather: 'clear', heat: 0, dayPhase: 0.75 });
  const fire = ambientMix({ isNight: true, weather: 'clear', heat: 20, dayPhase: 0.75 });
  const rain = ambientMix({ isNight: false, weather: 'rain', heat: 0, dayPhase: 0.3 });
  assert.ok(night.night > day.night);
  assert.ok(day.birds > night.birds);
  assert.ok(fire.fire > 0.1);
  assert.ok(rain.rain > day.rain);
  assert.ok(night.howl > 0);
  const dead = ambientMix({ dead: true, isNight: true, heat: 20 });
  assert.strictEqual(dead.wind, 0);
});

test('greedy mesh merges flat top faces', () => {
  // 8x1x8 solid dirt slab at y=0, air above
  const W = 8;
  const H = 2;
  const getBlock = (x, y, z) => {
    if (x < 0 || z < 0 || x >= W || z >= W || y < 0 || y >= H) return 0;
    return y === 0 ? BLOCK.DIRT : 0;
  };
  const opts = {
    getBlock,
    tileFor: tileForBlock,
    colorFor: getColor,
    isTransparent,
    isSolid,
    baseX: 0,
    baseY: 0,
    baseZ: 0,
    sizeX: W,
    sizeY: H,
    sizeZ: W,
    waterId: BLOCK.WATER,
  };
  const naive = countNaiveFaces(opts);
  const quads = greedyMeshChunk(opts);
  const arrays = quadsToArrays(quads);
  // Top of slab alone is 64 naive faces → 1 greedy quad
  const topQuads = quads.filter((q) => q.faceDir === 'top');
  assert.strictEqual(topQuads.length, 1, `top quads ${topQuads.length}`);
  assert.strictEqual(topQuads[0].w * topQuads[0].h, W * W);
  assert.ok(quads.length < naive, `greedy ${quads.length} < naive ${naive}`);
  assert.ok(arrays.positions.length > 0);
  assert.strictEqual(arrays.tiles.length, arrays.positions.length / 3);
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

import { MODES, getMode, scalePredatorDamage, isValidMode } from '../js/modes.js';
import {
  parseSettings,
  serializeSettings,
  sensitivityFromSlider,
  sliderFromSensitivity,
  writeSettings,
  readSettings,
  SETTINGS_KEY,
} from '../js/settings.js';
import { fallDamageFromSpeed } from '../js/survival.js';
import { RECIPES } from '../js/crafting.js';

test('difficulty modes defined', () => {
  assert.ok(isValidMode('survival'));
  assert.ok(isValidMode('cruel'));
  assert.ok(!isValidMode('creative-x'));
  assert.ok(getMode('challenging').deathDrops);
  assert.ok(getMode('cruel').permadeath);
  assert.ok(getMode('harmless').hungerMult < getMode('survival').hungerMult);
  assert.ok(scalePredatorDamage(10, 'harmless') < 10);
  assert.ok(scalePredatorDamage(10, 'cruel') > 10);
  assert.strictEqual(MODES.survival.id, 'survival');
});

test('settings roundtrip + sensitivity map', () => {
  const s = parseSettings(serializeSettings({ mode: 'challenging', sensitivity: 0.003, helpVisible: false }));
  assert.ok(s.ok);
  assert.strictEqual(s.data.mode, 'challenging');
  assert.ok(Math.abs(s.data.sensitivity - 0.003) < 1e-9);
  assert.strictEqual(s.data.helpVisible, false);
  const mid = sensitivityFromSlider(5);
  assert.ok(mid > 0.001 && mid < 0.004);
  assert.strictEqual(sliderFromSensitivity(mid), 5);
  const mem = {
    _d: {},
    setItem(k, v) { this._d[k] = String(v); },
    getItem(k) { return this._d[k] ?? null; },
    removeItem(k) { delete this._d[k]; },
  };
  assert.ok(writeSettings({ mode: 'cruel', sensitivity: 0.0022, helpVisible: true }, mem).ok);
  const loaded = readSettings(mem, SETTINGS_KEY);
  assert.ok(loaded.ok);
  assert.strictEqual(loaded.data.mode, 'cruel');
});

test('fall damage thresholds', () => {
  assert.strictEqual(fallDamageFromSpeed(5), 0);
  assert.strictEqual(fallDamageFromSpeed(11), 0);
  assert.ok(fallDamageFromSpeed(15) > 10);
  assert.ok(fallDamageFromSpeed(40) <= 80);
});

test('spear and stone axe craftable', () => {
  const spear = RECIPES.find((r) => r.id === 'wood_spear');
  const axe = RECIPES.find((r) => r.id === 'stone_axe');
  assert.ok(spear);
  assert.ok(axe);
  assert.strictEqual(propsOf(ITEM.WOOD_SPEAR).melee, 11);
  assert.ok(propsOf(ITEM.WOOD_SPEAR).meleeRange > 4);
  assert.strictEqual(propsOf(ITEM.STONE_AXE).tool, 'axe');
  let slots = createStarterInventory(0);
  slots = addItems(slots, ITEM.STICK, 4).slots;
  slots = addItems(slots, BLOCK.PLANKS, 2).slots;
  const c1 = craftRecipe(slots, 'wood_spear');
  assert.ok(c1.ok, c1.error);
  assert.ok(countItems(c1.slots, ITEM.WOOD_SPEAR) >= 1);
  slots = addItems(c1.slots, BLOCK.COBBLE, 3).slots;
  slots = addItems(slots, ITEM.STICK, 2).slots;
  const c2 = craftRecipe(slots, 'stone_axe');
  assert.ok(c2.ok, c2.error);
});

test('cold damage mult slows harmless hypothermia', () => {
  let harsh = { ...DEFAULT_SURVIVAL, bodyTemp: 31, hunger: 80 };
  let mild = { ...DEFAULT_SURVIVAL, bodyTemp: 31, hunger: 80 };
  const envBase = {
    dt: 1,
    dayPhase: 0.75,
    weather: 'snow',
    blockHeat: 0,
    sprinting: false,
    moving: false,
    inWater: false,
    sleeping: false,
    hungerMult: 1,
  };
  for (let i = 0; i < 5; i++) {
    harsh = tickSurvival(harsh, { ...envBase, coldDamageMult: 1.6 });
    mild = tickSurvival(mild, { ...envBase, coldDamageMult: 0.25 });
  }
  assert.ok(harsh.health < mild.health, `${harsh.health} vs ${mild.health}`);
});

test('starter inventory respects ration count', () => {
  const a = createStarterInventory(6);
  assert.strictEqual(countItems(a, ITEM.RATION), 6);
  const b = createStarterInventory(0);
  assert.strictEqual(countItems(b, ITEM.RATION), 0);
});


import { spawnArrow, stepProjectile, hitAnimal } from '../js/projectiles.js';
import { tickSpoilage, isSpoilable, SPOIL_SECONDS } from '../js/spoilage.js';
import { unlockAchievement, emptyAchievements, ACHIEVEMENTS } from '../js/achievements.js';

test('v1.2 bow and spoilage', () => {
  assert.ok(propsOf(ITEM.BOW).tool === 'bow');
  assert.ok(propsOf(ITEM.ARROW));
  assert.ok(propsOf(ITEM.BERRIES).edible > 0);
  assert.ok(propsOf(ITEM.BREAD).edible > 0);
  assert.ok(propsOf(ITEM.IRON_PICK).mineMult > propsOf(ITEM.STONE_PICK).mineMult);
  assert.ok(isSpoilable(ITEM.RAW_MEAT));
  let slots = createStarterInventory(0);
  slots = addItems(slots, ITEM.RAW_MEAT, 2).slots;
  slots[0].age = SPOIL_SECONDS - 1;
  const mid = tickSpoilage(slots, 0.5);
  assert.strictEqual(mid.slots[0].id, ITEM.RAW_MEAT);
  const done = tickSpoilage(mid.slots, 2);
  assert.ok(done.spoiled >= 1);
  assert.strictEqual(done.slots[0].id, ITEM.ROTTEN_MEAT);

  const origin = { x: 0, y: 1.5, z: 0 };
  const dir = { x: 0, y: 0, z: -1 };
  let arrow = spawnArrow(origin, dir, { speed: 20, life: 2 });
  const step = stepProjectile(arrow, 0.05);
  assert.ok(step.proj);
  assert.ok(step.proj.z < 0);
  assert.ok(hitAnimal({ x: 1, y: 1.5, z: 1 }, { x: 1, y: 1, z: 1, dead: false }));

  let ach = emptyAchievements();
  ach = unlockAchievement(ach, 'first_fire');
  assert.ok(ach.changed);
  assert.ok(ach.unlocked.first_fire);
  assert.ok(ACHIEVEMENTS.length >= 10);

  assert.ok(BLOCK.IRON_ORE);
  assert.ok(BLOCK.BUSH);
  assert.ok(BLOCK.CROP);
  assert.ok(RECIPES.find((r) => r.id === 'bow'));
  assert.ok(RECIPES.find((r) => r.id === 'smelt_iron'));
  assert.ok(RECIPES.find((r) => r.id === 'bread'));
});

console.log(`\n${passed} tests passed`);
if (process.exitCode) process.exit(1);
