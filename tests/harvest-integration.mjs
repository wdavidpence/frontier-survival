import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { BLOCK } from '../js/blocks.js';
import { ITEM } from '../js/items.js';
import {
  harvestClassForBlock,
  toolTierForHeld,
  harvestDurationForBlock,
} from '../js/mine-tier.js';

const mineTierSource = readFileSync(new URL('../js/mine-tier.js', import.meta.url), 'utf8');
const gameSource = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');

const expectedClasses = new Map([
  [BLOCK.LOG, 'log'],
  [BLOCK.SPRUCE_LOG, 'log'],
  [BLOCK.SEQUOIA_LOG, 'log'],
  [BLOCK.PLANKS, 'log'],
  [BLOCK.STAIRS_WOOD, 'log'],
  [BLOCK.SLAB_WOOD, 'log'],
  [BLOCK.DIRT, 'dirt'],
  [BLOCK.GRASS, 'dirt'],
  [BLOCK.FARMLAND, 'dirt'],
  [BLOCK.DAMP_SOIL, 'dirt'],
  [BLOCK.SAND, 'sand'],
  [BLOCK.STONE, 'stone'],
  [BLOCK.COBBLE, 'stone'],
  [BLOCK.SANDSTONE, 'stone'],
  [BLOCK.BRICKS, 'stone'],
  [BLOCK.WALL, 'stone'],
  [BLOCK.COAL_ORE, 'coal_ore'],
  [BLOCK.IRON_ORE, 'metal_ore'],
  [BLOCK.CLAY_DEEP_ORE, 'metal_ore'],
  [BLOCK.SULFUR_ORE, 'metal_ore'],
  [BLOCK.OIL_SEEP, 'metal_ore'],
]);

const expectedTools = new Map([
  [null, 'hand'],
  [undefined, 'hand'],
  [ITEM.WOOD_PICK, 'wood'],
  [ITEM.WOOD_AXE, 'wood'],
  [ITEM.STONE_PICK, 'stone'],
  [ITEM.STONE_AXE, 'stone'],
  [ITEM.IRON_PICK, 'iron'],
  [ITEM.IRON_AXE, 'iron'],
  [ITEM.STICK, 'hand'],
  [999999, 'hand'],
]);

function assertDuration(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} !== ${expected}`);
}

test('mine-tier imports the harvest contract with a literal cache-busted path', () => {
  assert.match(mineTierSource, /from ['"]\.\/harvest-balance\.js\?v=\d+['"]/);
});

test('harvestClassForBlock maps every requested real block family', () => {
  for (const [blockId, expected] of expectedClasses) {
    assert.equal(harvestClassForBlock(blockId), expected, `block ${blockId}`);
  }
  assert.equal(harvestClassForBlock(null), null);
  assert.equal(harvestClassForBlock(undefined), null);
  assert.equal(harvestClassForBlock(999999), null);
});

test('toolTierForHeld maps existing tools and safely falls back to hand', () => {
  for (const [itemId, expected] of expectedTools) {
    assert.equal(toolTierForHeld(itemId), expected, `item ${itemId}`);
  }
});

test('harvestDurationForBlock returns exact hand and tool times', () => {
  assertDuration(harvestDurationForBlock(BLOCK.LOG, null), 4.2, 'log hand');
  assertDuration(harvestDurationForBlock(BLOCK.DIRT, null), 2.8, 'dirt hand');
  assertDuration(harvestDurationForBlock(BLOCK.SAND, null), 2.8, 'sand hand');
  assertDuration(harvestDurationForBlock(BLOCK.STONE, null), 8.4, 'stone hand');
  assertDuration(harvestDurationForBlock(BLOCK.COAL_ORE, null), 8.4, 'coal hand');
  assertDuration(harvestDurationForBlock(BLOCK.IRON_ORE, null), 16.8, 'iron hand');
  assertDuration(harvestDurationForBlock(BLOCK.SULFUR_ORE, null), 16.8, 'sulfur hand');

  for (const toolId of [ITEM.WOOD_PICK, ITEM.WOOD_AXE]) {
    assertDuration(harvestDurationForBlock(BLOCK.LOG, toolId), 3.78, `wood log ${toolId}`);
    assertDuration(harvestDurationForBlock(BLOCK.STONE, toolId), 7.56, `wood stone ${toolId}`);
    assertDuration(harvestDurationForBlock(BLOCK.IRON_ORE, toolId), 15.12, `wood ore ${toolId}`);
  }
  for (const toolId of [ITEM.STONE_PICK, ITEM.STONE_AXE]) {
    assertDuration(harvestDurationForBlock(BLOCK.LOG, toolId), 3.36, `stone log ${toolId}`);
    assertDuration(harvestDurationForBlock(BLOCK.STONE, toolId), 6.72, `stone stone ${toolId}`);
    assertDuration(harvestDurationForBlock(BLOCK.IRON_ORE, toolId), 13.44, `stone ore ${toolId}`);
  }
  for (const toolId of [ITEM.IRON_PICK, ITEM.IRON_AXE]) {
    assertDuration(harvestDurationForBlock(BLOCK.LOG, toolId), 2.52, `iron log ${toolId}`);
    assertDuration(harvestDurationForBlock(BLOCK.STONE, toolId), 5.04, `iron stone ${toolId}`);
    assertDuration(harvestDurationForBlock(BLOCK.IRON_ORE, toolId), 10.08, `iron ore ${toolId}`);
  }
  const reductionChecks = [
    [[ITEM.WOOD_PICK, ITEM.WOOD_AXE], 0.9, 'wood 10% reduction'],
    [[ITEM.STONE_PICK, ITEM.STONE_AXE], 0.8, 'stone 20% reduction'],
    [[ITEM.IRON_PICK, ITEM.IRON_AXE], 0.6, 'iron 40% reduction'],
  ];
  for (const [[pickId, axeId], multiplier, label] of reductionChecks) {
    assertDuration(harvestDurationForBlock(BLOCK.LOG, pickId) / 4.2, multiplier, `${label} pick`);
    assertDuration(harvestDurationForBlock(BLOCK.LOG, axeId) / 4.2, multiplier, `${label} axe`);
  }
});

test('harvestDurationForBlock has unknown-block safety and hand fallback', () => {
  assert.equal(harvestDurationForBlock(null, ITEM.IRON_PICK), null);
  assert.equal(harvestDurationForBlock(999999, ITEM.IRON_PICK), null);
  assertDuration(harvestDurationForBlock(BLOCK.LOG, ITEM.STICK), 4.2, 'wrong tool hand fallback');
  assertDuration(harvestDurationForBlock(BLOCK.LOG, 999999), 4.2, 'unknown tool hand fallback');
  assertDuration(harvestDurationForBlock(BLOCK.LOG, null, 7), 7, 'custom base');
});

test('P1 and P2 mining use harvest duration adapter and not legacy hardness formula', () => {
  assert.match(gameSource, /const HARVEST_BASE_SECONDS = 4\.2/);
  const p1 = gameSource.slice(gameSource.indexOf('  _handleMining(dt) {'), gameSource.indexOf('  _handlePlace() {'));
  const p2 = gameSource.slice(gameSource.indexOf('  _handleCoopP2World(dt) {'), gameSource.indexOf('  _spawnCoopP2(spawn) {'));
  for (const [name, source] of [['P1', p1], ['P2', p2]]) {
    assert.match(source, /harvestDurationForBlock\(/, `${name} adapter call`);
    assert.match(source, /HARVEST_BASE_SECONDS/, `${name} named base duration`);
    assert.match(source, /const harvestDuration = harvestDurationForBlock\(/, `${name} duration adapter assignment`);
    assert.match(source, /dt\s*\/\s*\(workDuration\s*\?\?\s*harvestDuration\)/, `${name} progress uses authoritative duration`);
    assert.doesNotMatch(source, /\(_breakSpeed\s*\*\s*mult\s*\*\s*dt\)\s*\/\s*hard/, `${name} legacy formula removed`);
    assert.doesNotMatch(source, /getHardness\(hit\.id\)/, `${name} no mining hardness timing`);
    assert.doesNotMatch(source, /mineMultiplier\([^)]*hit\.id\)/, `${name} no mining multiplier timing`);
  }
});
