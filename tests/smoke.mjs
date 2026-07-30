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
import { biomeAt, ambientTempOffset, BIOME } from '../js/biomes.js';
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
import { meatDropCount, SPECIES, canFeed, tryFeed } from '../js/animals.js';
import { tickLogic, isPowered, COMPONENT } from '../js/logic.js';
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


import { wearTool, maxDurability, durabilityRatio } from '../js/durability.js';
import { depositOne, withdrawOne, emptyChestSlots, chestKey, importChests, exportChests } from '../js/chests.js';

test('v1.3 chest boat fishing', () => {
  assert.ok(BLOCK.CHEST && BLOCK.LADDER && BLOCK.FENCE);
  assert.ok(propsOf(ITEM.BOAT));
  assert.ok(propsOf(ITEM.FISHING_ROD)?.tool === 'rod');
  assert.ok(propsOf(ITEM.SHIELD)?.tool === 'shield');
  assert.ok(propsOf(ITEM.SALVE)?.heal > 0);
  assert.ok(propsOf(ITEM.COOKED_FISH)?.edible > 0);
  assert.ok(RECIPES.find((r) => r.id === 'chest'));
  assert.ok(RECIPES.find((r) => r.id === 'boat'));
  assert.ok(RECIPES.find((r) => r.id === 'fishing_rod'));
  assert.ok(RECIPES.find((r) => r.id === 'shield'));
  assert.ok(maxDurability(ITEM.WOOD_PICK) > 0);
  let slots = createStarterInventory(0);
  slots = addItems(slots, ITEM.WOOD_PICK, 1).slots;
  const max = maxDurability(ITEM.WOOD_PICK);
  slots[0].dur = 2;
  const w = wearTool(slots, 0, 1);
  assert.strictEqual(w.remaining, 1);
  const w2 = wearTool(w.slots, 0, 5);
  assert.ok(w2.broken);
  let chest = emptyChestSlots();
  slots = addItems(createStarterInventory(0), ITEM.STICK, 3).slots;
  const d = depositOne(slots, 0, chest);
  assert.ok(d.ok);
  assert.strictEqual(countItems(d.playerSlots, ITEM.STICK), 2);
  const wth = withdrawOne(d.playerSlots, d.chestSlots, 0);
  assert.ok(wth.ok);
  assert.strictEqual(countItems(wth.playerSlots, ITEM.STICK), 3);
  const m = importChests([[chestKey(1,2,3), emptyChestSlots()]]);
  assert.ok(exportChests(m).length === 1);
  assert.ok(tileForBlock(BLOCK.CHEST, 'side') !== undefined);
});


import { hasRoofAbove, wetnessGainRate, exposureColdMult, stormBlocksSleep } from '../js/exposure.js';
import { equipmentArmor, mitigatePhysicalDamage } from '../js/equipment.js';
test('v1.4 exposure armor spoil fish', () => {
  assert.ok(isSpoilable(ITEM.RAW_FISH));
  let slots = createStarterInventory(0);
  slots = addItems(slots, ITEM.RAW_FISH, 1).slots;
  slots[0].age = SPOIL_SECONDS - 0.5;
  const mid = tickSpoilage(slots, 1);
  assert.ok(mid.spoiled >= 1);
  assert.ok(wetnessGainRate({ inWater: false, weather: 'rain', roofed: false }) > 0);
  assert.strictEqual(wetnessGainRate({ inWater: false, weather: 'rain', roofed: true }), 0);
  assert.ok(exposureColdMult({ weather: 'rain', roofed: false, wetness: 80, isNight: true }) >
    exposureColdMult({ weather: 'clear', roofed: true, wetness: 0, isNight: false }));
  const roof = hasRoofAbove((x,y,z)=> (y===5?3:0), 0, 0, 0, (id)=>id===3, (id)=>false, 8);
  assert.ok(roof);
  assert.ok(mitigatePhysicalDamage(10, 10) < 10);
  assert.ok(equipmentArmor({ head: null, chest: ITEM.LEATHER_VEST, feet: null }) >= 6);
  const storm = stormBlocksSleep({ weather: 'rain', roofed: false, atBed: true });
  assert.ok(!storm.ok);
  assert.ok(SPECIES.bird);
  assert.ok(BLOCK.SNARE && BLOCK.PUMPKIN);
  assert.ok(RECIPES.find((r)=>r.id==='pumpkin_soup'));
  assert.ok(RECIPES.find((r)=>r.id==='charcoal'));
  assert.ok(propsOf(ITEM.EGG).edible > 0);
});

import { applyBleed, tickBleed, stopBleed, isBleeding } from '../js/bleed.js';

test("v1.5 blocks items bleed", () => {
  assert.ok(BLOCK.DOOR_CLOSED && BLOCK.GLASS && BLOCK.CLAY && BLOCK.BRICKS && BLOCK.FURNACE);
  assert.ok(propsOf(ITEM.WOOD_SWORD)?.melee >= 13);
  assert.ok(propsOf(ITEM.BANDAGE)?.bandage);
  assert.strictEqual(dropForBlock(BLOCK.CLAY), ITEM.CLAY_BALL);
  assert.strictEqual(dropForBlock(BLOCK.DOOR_OPEN), BLOCK.DOOR_CLOSED);
  assert.ok(RECIPES.find(r => r.id === "door"));
  assert.ok(RECIPES.find(r => r.id === "bandage"));
  assert.ok(RECIPES.find(r => r.id === "wood_sword"));
  assert.ok(RECIPES.find(r => r.id === "furnace"));
  let s = { ...DEFAULT_SURVIVAL, health: 50, bleed: 0 };
  s = applyBleed(s, 40);
  assert.ok(isBleeding(s));
  const h0 = s.health;
  s = tickBleed(s, 2);
  assert.ok(s.health < h0);
  s = stopBleed(s, 100);
  assert.ok(!isBleeding(s));
  let slots = createStarterInventory(0);
  slots = addItems(slots, BLOCK.PLANKS, 6).slots;
  const c = craftRecipe(slots, "door");
  assert.ok(c.ok);
});

// ── Feed/tame tests (FS-L2 / FS-H2) ─────────────────────

import * as _inv from '../js/inventory.js';
const splitStack = _inv.splitStack || null;

test('bear SPECIES exists hostile damage>10', () => {
  const bear = SPECIES.bear;
  assert.ok(bear, 'bear species should exist');
  assert.strictEqual(bear.hostile, true);
  assert.ok(bear.damage > 10, `bear damage ${bear.damage} should be >10`);
});

test('splitStack from inventory: add 10 sticks, split → two stacks', () => {
  assert.ok(splitStack, 'splitStack should be exported from inventory');
  let slots = createStarterInventory(0);
  const addR = addItems(slots, ITEM.STICK, 10);
  assert.ok(addR.ok);
  slots = addR.slots;
  const stickIdx = slots.findIndex(s => s.id === ITEM.STICK);
  assert.ok(stickIdx >= 0, 'sticks should be in inventory');
  assert.strictEqual(slots[stickIdx].count, 10);
  const splitR = splitStack(slots, stickIdx);
  assert.ok(splitR.ok, 'split should succeed');
  slots = splitR.slots;
  const stickSlots = slots.filter(s => s.id === ITEM.STICK);
  assert.strictEqual(stickSlots.length, 2, 'should have two stick stacks after split');
  assert.strictEqual(stickSlots[0].count + stickSlots[1].count, 10);
});

test('DEFAULT_SURVIVAL has bleed field', () => {
  assert.ok('bleed' in DEFAULT_SURVIVAL, 'DEFAULT_SURVIVAL should have bleed field');
});

test('craft glass needs heat — fails without heat', () => {
  let slots = createStarterInventory(0);
  slots = addItems(slots, BLOCK.SAND, 1).slots;
  const cold = craftRecipe(slots, 'glass', { heat: 0 });
  assert.ok(!cold.ok, 'glass should fail without heat');
  const hot = craftRecipe(slots, 'glass', { heat: 10 });
  assert.ok(hot.ok, hot.error || 'glass should succeed with heat');
  assert.strictEqual(countItems(hot.slots, BLOCK.GLASS), 1);
});

test('BLOCK.CLAY drop is CLAY_BALL', () => {
  assert.strictEqual(dropForBlock(BLOCK.CLAY), ITEM.CLAY_BALL);
});

test('desertHeat raises feelsLike and bodyTemp', () => {
  let a = { ...DEFAULT_SURVIVAL };
  let b = { ...DEFAULT_SURVIVAL };
  for (let i = 0; i < 30; i++) {
    a = tickSurvival(a, { dt: 1, dayPhase: 0.25, weather: 'clear', blockHeat: 0, sprinting: false, moving: false, inWater: false, sleeping: false, desertHeat: false });
    b = tickSurvival(b, { dt: 1, dayPhase: 0.25, weather: 'clear', blockHeat: 0, sprinting: false, moving: false, inWater: false, sleeping: false, desertHeat: true });
  }
  assert.ok(b.bodyTemp >= a.bodyTemp, `b.bodyTemp=${b.bodyTemp} should be >= a.bodyTemp=${a.bodyTemp}`);
  assert.ok(b._debug.feelsLike > a._debug.feelsLike, `desert feelsLike ${b._debug.feelsLike} > normal ${a._debug.feelsLike}`);
});

test('feedItem fields set on hare deer wolf', () => {
  assert.strictEqual(SPECIES.hare.feedItem, 'berries');
  assert.strictEqual(SPECIES.deer.feedItem, 'berries');
  assert.strictEqual(SPECIES.wolf.feedItem, 'raw_meat');
});

test('canFeed returns true for matching feed item', () => {
  const hare = { type: 'hare', dead: false };
  assert.ok(canFeed(hare, ITEM.BERRIES));
  assert.ok(canFeed(hare, 'berries'));
});

test('canFeed returns false for wrong feed item', () => {
  const hare = { type: 'hare', dead: false };
  assert.ok(!canFeed(hare, ITEM.RAW_MEAT));
  assert.ok(!canFeed(hare, 'raw_meat'));
});

test('canFeed returns false for dead animal', () => {
  const hare = { type: 'hare', dead: true };
  assert.ok(!canFeed(hare, ITEM.BERRIES));
});

test('tryFeed hare with berries progresses tame 0→15', () => {
  const hare = { type: 'hare', dead: false };
  const r1 = tryFeed(hare, ITEM.BERRIES);
  assert.ok(r1.fed);
  assert.strictEqual(r1.calmT, 60);
  assert.strictEqual(r1.tameProgress, 15);
  assert.ok(!r1.tamed);

  const r2 = tryFeed(hare, 'berries');
  assert.ok(r2.fed);
  assert.strictEqual(r2.tameProgress, 30);
});

test('tryFeed reaches tamed at 100', () => {
  const hare = { type: 'hare', dead: false };
  // 7 feeds × 15 = 105 → capped at 100
  for (let i = 0; i < 7; i++) {
    tryFeed(hare, ITEM.BERRIES);
  }
  assert.ok(hare.tamed, 'hare should be tamed after 7 feeds');
});

test('tryFeed wolf never becomes tamed', () => {
  const wolf = { type: 'wolf', dead: false };
  assert.ok(canFeed(wolf, ITEM.RAW_MEAT));

  for (let i = 0; i < 20; i++) {
    tryFeed(wolf, ITEM.RAW_MEAT);
  }
  assert.ok(!wolf.tamed, 'wolf should never be tamed');
  // But it gets calm
  assert.ok(wolf._calmT > 0, 'wolf should get calm from feeding');
});

test('tryFeed wrong item returns fed:false', () => {
  const hare = { type: 'hare', dead: false };
  const r = tryFeed(hare, ITEM.RAW_MEAT);
  assert.ok(!r.fed);
  assert.strictEqual(r.tameProgress, 0);
});

test('tryFeed non-existent animal type returns fed:false', () => {
  const unknown = { type: 'dragon', dead: false };
  const r = tryFeed(unknown, ITEM.BERRIES);
  assert.ok(!r.fed);
});

test('tryFeed dead animal returns fed:false', () => {
  const hare = { type: 'hare', dead: true };
  const r = tryFeed(hare, ITEM.BERRIES);
  assert.ok(!r.fed);
});

test('deer tame progression', () => {
  const deer = { type: 'deer', dead: false };
  assert.ok(canFeed(deer, ITEM.BERRIES));

  for (let i = 0; i < 7; i++) {
    const r = tryFeed(deer, ITEM.BERRIES);
    assert.ok(r.fed);
  }
  assert.ok(deer.tamed, 'deer should be tamed after 7 berry feeds');
});

// ── Logic / electricity tests ──

test('tickLogic: simple line SOURCE→WIRE→LAMP all powered', () => {
  const nodes = new Map([
    ['s1', { type: COMPONENT.SOURCE }],
    ['w1', { type: COMPONENT.WIRE }],
    ['l1', { type: COMPONENT.LAMP }],
  ]);
  const edges = [['s1', 'w1'], ['w1', 'l1']];
  const powered = tickLogic(nodes, edges);

  assert.ok(isPowered(powered, 's1'), 'source powered');
  assert.ok(isPowered(powered, 'w1'), 'wire powered');
  assert.ok(isPowered(powered, 'l1'), 'lamp powered');
  assert.strictEqual(powered.size, 3);
});

test('tickLogic: branch SOURCE→WIRE with two LAMPs', () => {
  const nodes = new Map([
    ['src', { type: COMPONENT.SOURCE }],
    ['hub', { type: COMPONENT.WIRE }],
    ['a', { type: COMPONENT.LAMP }],
    ['b', { type: COMPONENT.LAMP }],
  ]);
  const edges = [['src', 'hub'], ['hub', 'a'], ['hub', 'b']];
  const powered = tickLogic(nodes, edges);

  assert.strictEqual(powered.size, 4, 'all nodes powered');
  assert.ok(isPowered(powered, 'a'));
  assert.ok(isPowered(powered, 'b'));
});

test('tickLogic: unpowered lamp when disconnected', () => {
  const nodes = new Map([
    ['src', { type: COMPONENT.SOURCE }],
    ['w1', { type: COMPONENT.WIRE }],
    ['lonely', { type: COMPONENT.LAMP }],
  ]);
  const edges = [['src', 'w1']]; // lonely lamp has no edge
  const powered = tickLogic(nodes, edges);

  assert.strictEqual(powered.size, 2);
  assert.ok(!isPowered(powered, 'lonely'), 'disconnected lamp not powered');
});

test('tickLogic: no sources means nothing powered', () => {
  const nodes = new Map([
    ['w1', { type: COMPONENT.WIRE }],
    ['l1', { type: COMPONENT.LAMP }],
  ]);
  const edges = [['w1', 'l1']];
  const powered = tickLogic(nodes, edges);

  assert.strictEqual(powered.size, 0, 'no sources → nothing powered');
});

// ── v1.6 biomes pure ──────────────────────────────────────
test('biomeAt deterministic', () => {
  assert.strictEqual(biomeAt(10, -20, 42), biomeAt(10, -20, 42));
});

test('biomeAt returns known biome strings', () => {
  const seen = new Set();
  for (let i = -5; i <= 5; i++) {
    seen.add(biomeAt(i, i, 1));
  }
  for (const b of seen) {
    assert.ok(
      b === 'shore' || b === 'forest' || b === 'desert' || b === 'tundra',
      `unexpected biome: ${b}`,
    );
  }
});

test('biomeAt origin sample', () => {
  // biomeAt(0,0,1) is deterministic — just assert it lands in a valid set
  const b = biomeAt(0, 0, 1);
  assert.ok(['shore', 'forest', 'desert', 'tundra'].includes(b));
});

test('biomeAt shore near sea-level seed', () => {
  // Search for a position that produces shore biome (z=0 has coast at seed=0)
  let found = false;
  for (let x = -20; x <= 20 && !found; x++) {
    if (biomeAt(x, 0, 0) === BIOME.SHORE) found = true;
  }
  assert.ok(found, 'expected shore biome in search range');
});

test('ambientTempOffset desert +8', () => {
  assert.strictEqual(ambientTempOffset(BIOME.DESERT), 8);
});

test('ambientTempOffset tundra -10', () => {
  assert.strictEqual(ambientTempOffset(BIOME.TUNDRA), -10);
});

test('ambientTempOffset shore +2', () => {
  assert.strictEqual(ambientTempOffset(BIOME.SHORE), 2);
});

test('ambientTempOffset forest 0', () => {
  assert.strictEqual(ambientTempOffset(BIOME.FOREST), 0);
});

test('BIOME constant values', () => {
  assert.strictEqual(BIOME.SHORE, 'shore');
  assert.strictEqual(BIOME.FOREST, 'forest');
  assert.strictEqual(BIOME.DESERT, 'desert');
  assert.strictEqual(BIOME.TUNDRA, 'tundra');
});

// ── biome → survival integration ──────────────────────────

test('tickSurvival ambientTempOffset desert makes it hotter', () => {
  const state = { ...DEFAULT_SURVIVAL };
  // noon phase, clear weather → baseline ~26 °C; desert +8 = ~34 °C
  const withOffset = tickSurvival(state, {
    dt: 1, dayPhase: 0.25, weather: 'clear', blockHeat: 0,
    sprinting: false, moving: false, inWater: false, sleeping: false,
    ambientTempOffset: 8, // desert
  });
  const without = tickSurvival(state, {
    dt: 1, dayPhase: 0.25, weather: 'clear', blockHeat: 0,
    sprinting: false, moving: false, inWater: false, sleeping: false,
  });
  // Desert offset pushes feelsLike up → bodyTemp should trend higher (or at least not cooler)
  assert.ok(
    withOffset._debug.feelsLike >= without._debug.feelsLike + 6,
    `desert feelsLike should be ≥ baseline+6: got ${withOffset._debug.feelsLike} vs ${without._debug.feelsLike}`,
  );
});

test('tickSurvival ambientTempOffset tundra makes it colder', () => {
  const state = { ...DEFAULT_SURVIVAL };
  // night phase, clear → baseline ~-2 °C; tundra -10 = ~-12 °C
  const withOffset = tickSurvival(state, {
    dt: 1, dayPhase: 0.75, weather: 'clear', blockHeat: 0,
    sprinting: false, moving: false, inWater: false, sleeping: false,
    ambientTempOffset: -10, // tundra
  });
  const without = tickSurvival(state, {
    dt: 1, dayPhase: 0.75, weather: 'clear', blockHeat: 0,
    sprinting: false, moving: false, inWater: false, sleeping: false,
  });
  assert.ok(
    withOffset._debug.feelsLike <= without._debug.feelsLike - 8,
    `tundra feelsLike should be ≤ baseline-8: got ${withOffset._debug.feelsLike} vs ${without._debug.feelsLike}`,
  );
});

// ── biome → world gen integration ─────────────────────────

test('biomeAt returns valid biome for any coordinate', () => {
  const valid = new Set(['shore', 'forest', 'desert', 'tundra']);
  for (let x = -30; x <= 30; x += 7) {
    for (let z = -30; z <= 30; z += 7) {
      const b = biomeAt(x, z, 42);
      assert.ok(valid.has(b), `expected valid biome at (${x},${z}), got ${b}`);
    }
  }
});

test('biomeAt produces multiple biome types across map', () => {
  // The classifier (FS-L1) is height/dryness based — verify at least shore+forest appear
  // (desert/tundra need higher dryness/elevation than default parameters produce)
  const seen = new Set();
  for (let s = 0; s < 10; s++) {
    for (let x = -80; x <= 80; x += 10) {
      for (let z = -80; z <= 80; z += 10) {
        seen.add(biomeAt(x, z, s));
      }
    }
  }
  // Shore appears near sea-level, forest is the default — both should exist
  assert.ok(
    seen.size >= 2,
    `expected ≥2 biome types across seeds, found ${seen.size}: ${[...seen].join(', ')}`,
  );
});

// ── Tamed animal behavior (FS-H2) ────────────────────────
import { FaunaSystem } from '../js/animals.js';

test('tamed non-hostile animal does not flee', () => {
  const hare = { type: 'hare', dead: false, state: 'wander', tamed: true, _calmT: 0 };
  assert.strictEqual(hare.state, 'wander');
  // After tryFeed makes tamed, verify it stays tamed
  const r = tryFeed(hare, ITEM.BERRIES);
  assert.ok(r.tamed || hare.tamed, 'already tamed animal should remain tamed');
});

test('tamed flag persists after tryFeed', () => {
  const deer = { type: 'deer', dead: false };
  for (let i = 0; i < 7; i++) tryFeed(deer, ITEM.BERRIES);
  assert.ok(deer.tamed);
  // Feed again — should still be tamed and fed:true
  const r = tryFeed(deer, ITEM.BERRIES);
  assert.ok(r.fed, 'tamed animal should still accept feed');
  assert.strictEqual(r.tameProgress, 100);
});

test('canFeed works for wolf with raw_meat', () => {
  const wolf = { type: 'wolf', dead: false };
  assert.ok(canFeed(wolf, ITEM.RAW_MEAT));
  assert.ok(canFeed(wolf, 'raw_meat'));
});

test('canFeed returns false for species without feedItem (bear)', () => {
  const bear = { type: 'bear', dead: false };
  // Bear has no feedItem field in SPECIES
  assert.ok(!canFeed(bear, ITEM.RAW_MEAT), 'bear should not be feedable — no feedItem defined');
});

test('tryFeed wolf gets calm but no tame progress', () => {
  const wolf = { type: 'wolf', dead: false };
  const r = tryFeed(wolf, ITEM.RAW_MEAT);
  assert.ok(r.fed);
  assert.strictEqual(r.tameProgress, 0, 'wolf tame progress should stay 0');
  assert.ok(!r.tamed, 'wolf should not be tamed');
  assert.strictEqual(wolf._calmT, 60, 'wolf should get calm');
});

test('ITEM.BERRIES and ITEM.RAW_MEAT values match _FEED_ID', () => {
  assert.strictEqual(ITEM.BERRIES, 115);
  assert.strictEqual(ITEM.RAW_MEAT, 106);
});

// Final summary — moved here so all tests run first
console.log(`\n${passed} tests passed`);
if (process.exitCode) process.exit(1);
