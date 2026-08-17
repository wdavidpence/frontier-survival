import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { BLOCK, BLOCK_PROPS } from '../js/blocks.js';
import { ITEM, ITEM_PROPS } from '../js/items.js';
import { visibleRecipes } from '../js/crafting.js';
import { ITEM_TIER } from '../js/tool-tiers.js';
import {
  WORK_CLASS,
  requiredToolForWork,
  workTimeMultiplier,
} from '../js/harvest-balance.js';
import {
  toolTypeForHeld,
  workClassForBlock,
  workDurationForBlock,
} from '../js/mine-tier.js';

const gameSource = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');
const mineTierSource = readFileSync(new URL('../js/mine-tier.js', import.meta.url), 'utf8');
const harvestSource = readFileSync(new URL('../js/harvest-balance.js', import.meta.url), 'utf8');
const BASE = 4.2;

const specializedTools = [
  ['WOOD_HOE', 'hoe', 'wood'],
  ['STONE_HOE', 'hoe', 'stone'],
  ['IRON_HOE', 'hoe', 'iron'],
  ['WOOD_SPADE', 'spade', 'wood'],
  ['STONE_SPADE', 'spade', 'stone'],
  ['IRON_SPADE', 'spade', 'iron'],
  ['WOOD_MASON', 'mason', 'wood'],
  ['STONE_MASON', 'mason', 'stone'],
  ['IRON_MASON', 'mason', 'iron'],
];

const recipeByResult = new Map(
  visibleRecipes().flatMap((recipe) => recipe.results.map((result) => [result.id, recipe])),
);

function durationRatio(blockId, itemId) {
  return workDurationForBlock(blockId, itemId, BASE) / BASE;
}

test('specialized tool IDs are unique and have tiered work props', () => {
  const ids = specializedTools.map(([name]) => ITEM[name]);
  assert.ok(ids.every((id) => Number.isInteger(id)), 'all specialized IDs exist');
  assert.equal(new Set(ids).size, ids.length, 'specialized IDs are unique');
  for (const [name, tool, tier] of specializedTools) {
    const id = ITEM[name];
    assert.equal(ITEM_PROPS[id]?.tool, tool, `${name} category`);
    assert.equal(ITEM_PROPS[id]?.workMult, { wood: 2.3, stone: 3.45, iron: 5.1 }[tier], `${name} speed metadata`);
    assert.equal(ITEM_TIER[id], tier, `${name} tier mapping`);
    assert.equal(ITEM_PROPS[id]?.maxStack, 1, `${name} non-stackable`);
  }
});

test('each specialized tool has a reachable valid progression recipe', () => {
  for (const [name, tool, tier] of specializedTools) {
    const id = ITEM[name];
    const recipe = recipeByResult.get(id);
    assert.ok(recipe, `${name} recipe exists`);
    assert.equal(recipe.category, 'tools');
    assert.equal(recipe.tier, { wood: 1, stone: 2, iron: 3 }[tier]);
    assert.ok(recipe.ingredients.length >= 2, `${name} has a handle and head ingredient`);
    for (const ingredient of recipe.ingredients) {
      assert.ok(BLOCK_PROPS[ingredient.id] || ITEM_PROPS[ingredient.id], `${name} ingredient ${ingredient.id} is valid`);
      assert.ok(Number.isInteger(ingredient.count) && ingredient.count > 0);
    }
  }
});

test('work classes expose stable required tool identifiers and deterministic tier multipliers', () => {
  assert.deepEqual(WORK_CLASS, {
    FARMING: 'farming',
    PREP: 'prep',
    WOODWORKING: 'woodworking',
    MASONRY: 'masonry',
  });
  assert.equal(requiredToolForWork(WORK_CLASS.FARMING), 'hoe');
  assert.equal(requiredToolForWork(WORK_CLASS.PREP), 'spade');
  assert.equal(requiredToolForWork(WORK_CLASS.WOODWORKING), 'axe');
  assert.equal(requiredToolForWork(WORK_CLASS.MASONRY), 'mason');
  assert.equal(workTimeMultiplier(WORK_CLASS.FARMING, 'wood'), 0.9);
  assert.equal(workTimeMultiplier(WORK_CLASS.PREP, 'stone'), 0.8);
  assert.equal(workTimeMultiplier(WORK_CLASS.WOODWORKING, 'iron'), 0.6);
  assert.equal(workTimeMultiplier(WORK_CLASS.MASONRY, 'hand'), 1);
  assert.equal(requiredToolForWork('not-a-work-class'), null);
  assert.equal(workTimeMultiplier('not-a-work-class', 'wood'), null);
});

test('held tool and block adapters reach farming, prep, woodwork, masonry, and mining seams', () => {
  assert.equal(toolTypeForHeld(null), 'hand');
  assert.equal(toolTypeForHeld(ITEM.WOOD_AXE), 'axe');
  assert.equal(toolTypeForHeld(ITEM.WOOD_HOE), 'hoe');
  assert.equal(toolTypeForHeld(ITEM.STONE_SPADE), 'spade');
  assert.equal(toolTypeForHeld(ITEM.IRON_MASON), 'mason');
  assert.equal(toolTypeForHeld(ITEM.STICK), 'hand');
  assert.equal(workClassForBlock(BLOCK.CROP), WORK_CLASS.FARMING);
  assert.equal(workClassForBlock(BLOCK.FARMLAND), WORK_CLASS.FARMING);
  assert.equal(workClassForBlock(BLOCK.DIRT), WORK_CLASS.PREP);
  assert.equal(workClassForBlock(BLOCK.SAND), WORK_CLASS.PREP);
  assert.equal(workClassForBlock(BLOCK.CLAY), WORK_CLASS.PREP);
  assert.equal(workClassForBlock(BLOCK.DAMP_SOIL), WORK_CLASS.PREP);
  assert.equal(workClassForBlock(BLOCK.LOG), WORK_CLASS.WOODWORKING);
  assert.equal(workClassForBlock(BLOCK.SPRUCE_LEAVES), WORK_CLASS.WOODWORKING);
  assert.equal(workClassForBlock(BLOCK.PLANKS), WORK_CLASS.WOODWORKING);
  assert.equal(workClassForBlock(BLOCK.STICK_PILE), WORK_CLASS.WOODWORKING);
  assert.equal(workClassForBlock(BLOCK.STONE), 'stone');
  assert.equal(workClassForBlock(BLOCK.COBBLE), 'stone');
  assert.equal(workClassForBlock(BLOCK.SANDSTONE), 'stone');
  assert.equal(workClassForBlock(BLOCK.BRICKS), WORK_CLASS.MASONRY);
  assert.equal(workClassForBlock(BLOCK.WALL), WORK_CLASS.MASONRY);
  assert.equal(workClassForBlock(BLOCK.COAL_ORE), 'coal_ore');
  assert.equal(workClassForBlock(BLOCK.IRON_ORE), 'metal_ore');
});

test('matching specialized tools reduce work duration by the existing tier ratios', () => {
  assert.equal(durationRatio(BLOCK.FARMLAND, ITEM.WOOD_HOE), (2 / 3) * 0.9);
  assert.ok(Math.abs(durationRatio(BLOCK.SAND, ITEM.STONE_SPADE) - ((2 / 3) * 0.8)) < 1e-12);
  assert.equal(durationRatio(BLOCK.BRICKS, ITEM.IRON_MASON), 2 * 0.6);
  assert.equal(durationRatio(BLOCK.LOG, ITEM.STONE_AXE), 0.8);
  assert.equal(durationRatio(BLOCK.STONE, ITEM.WOOD_PICK), 2 * 0.9);
  assert.equal(durationRatio(BLOCK.BRICKS, ITEM.WOOD_MASON), 2 * 0.9);
});

test('wrong specialized tool falls back to hand work timing', () => {
  assert.equal(durationRatio(BLOCK.FARMLAND, ITEM.WOOD_SPADE), 2 / 3);
  assert.equal(durationRatio(BLOCK.SAND, ITEM.WOOD_HOE), 2 / 3);
  assert.equal(durationRatio(BLOCK.BRICKS, ITEM.WOOD_AXE), 2);
  assert.equal(durationRatio(BLOCK.LOG, ITEM.WOOD_PICK), 1);
  assert.equal(durationRatio(BLOCK.DIRT, ITEM.WOOD_PICK), 2 / 3);
  assert.equal(durationRatio(BLOCK.STONE, ITEM.WOOD_MASON), 2);
  assert.equal(workDurationForBlock(999999, ITEM.IRON_MASON), null);
});

test('source keeps the pure adapter deterministic and wires P1/P2 mining to it', () => {
  assert.doesNotMatch(harvestSource, /Math\.random|\b(?:window|document|DOM|Three|THREE)\b/);
  assert.match(mineTierSource, /export function workDurationForBlock\(/);
  assert.match(gameSource, /import\s*\{[^}]*resolveBlockDrop,[^}]*workDurationForBlock[^}]*\}\s*from ['"]\.\/mine-tier\.js\?v=\d+['"]/s);
  const p1 = gameSource.slice(gameSource.indexOf('  _handleMining(dt) {'), gameSource.indexOf('  _handlePlace() {'));
  const p2 = gameSource.slice(gameSource.indexOf('  _handleCoopP2World(dt) {'), gameSource.indexOf('  _spawnCoopP2(spawn) {'));
  for (const [name, source] of [['P1', p1], ['P2', p2]]) {
    assert.match(source, /workDurationForBlock\(/, `${name} adapter call`);
    assert.match(source, /HARVEST_BASE_SECONDS/, `${name} named base duration`);
    assert.match(source, /dt\s*\/\s*\(workDuration\s*\?\?\s*harvestDuration\)/, `${name} progress uses authoritative work duration`);
  }
});
