import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  BLOCK_CLASS,
  BLOCK_CLASSES,
  TOOL_TIER,
  TOOL_TIERS,
  BARE_HAND_TIME_MULTIPLIERS,
  TOOL_TIME_MULTIPLIERS,
  bareHandTimeMultiplier,
  toolTimeMultiplier,
  harvestTimeMultiplier,
  compareHarvestTimes,
} from '../js/harvest-balance.js';

const source = readFileSync(new URL('../js/harvest-balance.js', import.meta.url), 'utf8');

const expectedBareHandTimes = {
  log: 1,
  dirt: 2 / 3,
  sand: 2 / 3,
  stone: 2,
  coal_ore: 2,
  metal_ore: 4,
};

const expectedToolTimes = {
  hand: 1,
  wood: 0.9,
  stone: 0.8,
  copper: 0.7,
  iron: 0.6,
  steel: 0.5,
  diamond: 0.4,
};

test('exports stable block and tool string IDs in progression order', () => {
  assert.deepEqual(BLOCK_CLASS, {
    LOG: 'log',
    DIRT: 'dirt',
    SAND: 'sand',
    STONE: 'stone',
    COAL_ORE: 'coal_ore',
    METAL_ORE: 'metal_ore',
  });
  assert.deepEqual(BLOCK_CLASSES, Object.values(BLOCK_CLASS));
  assert.deepEqual(TOOL_TIER, {
    HAND: 'hand',
    WOOD: 'wood',
    STONE: 'stone',
    COPPER: 'copper',
    IRON: 'iron',
    STEEL: 'steel',
    DIAMOND: 'diamond',
  });
  assert.deepEqual(TOOL_TIERS, Object.values(TOOL_TIER));
});

test('bare-hand block classes match the requested exact time ratios', () => {
  for (const [blockClass, expected] of Object.entries(expectedBareHandTimes)) {
    assert.equal(bareHandTimeMultiplier(blockClass), expected, blockClass);
    assert.equal(BARE_HAND_TIME_MULTIPLIERS[blockClass], expected, blockClass);
  }
});

test('tool tiers match the requested exact time ratios', () => {
  for (const [toolTier, expected] of Object.entries(expectedToolTimes)) {
    assert.equal(toolTimeMultiplier(toolTier), expected, toolTier);
    assert.equal(TOOL_TIME_MULTIPLIERS[toolTier], expected, toolTier);
  }
});

test('harvest time is the product of block and tool time multipliers', () => {
  assert.equal(harvestTimeMultiplier('log', 'hand'), 1);
  assert.equal(harvestTimeMultiplier('dirt', 'wood'), 0.6);
  assert.equal(harvestTimeMultiplier('stone', 'copper'), 1.4);
  assert.equal(harvestTimeMultiplier('metal_ore', 'diamond'), 1.6);

  for (const blockClass of BLOCK_CLASSES) {
    for (const toolTier of TOOL_TIERS) {
      const result = harvestTimeMultiplier(blockClass, toolTier);
      assert.equal(result, expectedBareHandTimes[blockClass] * expectedToolTimes[toolTier]);
      assert.ok(Number.isFinite(result));
    }
  }
});

test('tool progression is strictly monotonic from hand through diamond', () => {
  for (const blockClass of BLOCK_CLASSES) {
    const times = TOOL_TIERS.map((toolTier) => harvestTimeMultiplier(blockClass, toolTier));
    for (let index = 1; index < times.length; index += 1) {
      assert.ok(times[index] < times[index - 1], `${blockClass}: tier ${index}`);
    }
  }
});

test('block progression preserves dirt/sand, stone/coal, and metal-ore bands', () => {
  assert.equal(bareHandTimeMultiplier('dirt'), bareHandTimeMultiplier('sand'));
  assert.equal(bareHandTimeMultiplier('stone'), bareHandTimeMultiplier('coal_ore'));
  assert.ok(bareHandTimeMultiplier('log') > bareHandTimeMultiplier('dirt'));
  assert.ok(bareHandTimeMultiplier('stone') > bareHandTimeMultiplier('log'));
  assert.ok(bareHandTimeMultiplier('metal_ore') > bareHandTimeMultiplier('stone'));
});

test('unknown inputs are rejected safely with null', () => {
  for (const value of ['unknown', '', null, undefined, 1, {}, []]) {
    assert.equal(bareHandTimeMultiplier(value), null);
    assert.equal(toolTimeMultiplier(value), null);
    assert.equal(harvestTimeMultiplier(value, 'hand'), null);
    assert.equal(harvestTimeMultiplier('log', value), null);
    assert.equal(compareHarvestTimes('log', value, 'hand'), null);
    assert.equal(compareHarvestTimes(value, 'hand', 'wood'), null);
  }
});

test('comparison helper returns first-time divided by second-time', () => {
  assert.equal(compareHarvestTimes('log', 'wood', 'stone'), 0.9 / 0.8);
  assert.equal(compareHarvestTimes('metal_ore', 'steel', 'diamond'), 0.5 / 0.4);
  assert.equal(compareHarvestTimes('dirt', 'hand', 'hand'), 1);
  assert.ok(compareHarvestTimes('stone', 'diamond', 'hand') < 1);
});

test('contract data and results are JSON-serialization friendly', () => {
  for (const data of [
    BLOCK_CLASS,
    BLOCK_CLASSES,
    TOOL_TIER,
    TOOL_TIERS,
    BARE_HAND_TIME_MULTIPLIERS,
    TOOL_TIME_MULTIPLIERS,
    compareHarvestTimes('log', 'wood', 'diamond'),
  ]) {
    const roundTrip = JSON.parse(JSON.stringify(data));
    assert.deepEqual(roundTrip, data);
  }
});

test('exported lookup data is immutable and functions do not share mutable results', () => {
  assert.ok(Object.isFrozen(BLOCK_CLASS));
  assert.ok(Object.isFrozen(BLOCK_CLASSES));
  assert.ok(Object.isFrozen(TOOL_TIER));
  assert.ok(Object.isFrozen(TOOL_TIERS));
  assert.ok(Object.isFrozen(BARE_HAND_TIME_MULTIPLIERS));
  assert.ok(Object.isFrozen(TOOL_TIME_MULTIPLIERS));

  const first = compareHarvestTimes('log', 'hand', 'diamond');
  const second = compareHarvestTimes('log', 'hand', 'diamond');
  assert.equal(first, second);
});

test('source is dependency-free and browser-runtime independent', () => {
  assert.doesNotMatch(source, /\bimport\s/);
  assert.doesNotMatch(source, /\bexport\s+default\b/);
  assert.doesNotMatch(source, /Math\.random|\b(?:window|document|DOM|Three|THREE)\b/);
});
