/**
 * Pure smoke tests for js/tool-tiers.js (no browser/Three).
 * Run: node tests/smoke-tool-tiers.mjs
 */
import assert from 'assert';
import { ITEM } from '../js/items.js';
import {
  TIER_ORDER,
  ITEM_TIER,
  HARVEST_LEVEL,
  TOOL_SPEED_MULTIPLIER,
  TIER_DURABILITY,
  tierForItem,
  tierIndex,
  tierMeetsRequirement,
  speedForItem,
} from '../js/tool-tiers.js';

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

test('TIER_ORDER is wood < stone < iron', () => {
  assert.deepStrictEqual(TIER_ORDER, ['wood', 'stone', 'iron']);
  assert.strictEqual(TIER_ORDER.length, 3);
});

test('HARVEST_LEVEL ascending', () => {
  assert.strictEqual(HARVEST_LEVEL.wood, 1);
  assert.strictEqual(HARVEST_LEVEL.stone, 2);
  assert.strictEqual(HARVEST_LEVEL.iron, 3);
});

test('TOOL_SPEED_MULTIPLIER ascending', () => {
  assert.ok(TOOL_SPEED_MULTIPLIER.iron > TOOL_SPEED_MULTIPLIER.stone);
  assert.ok(TOOL_SPEED_MULTIPLIER.stone > TOOL_SPEED_MULTIPLIER.wood);
});

test('TIER_DURABILITY ascending', () => {
  assert.ok(TIER_DURABILITY.iron > TIER_DURABILITY.stone);
  assert.ok(TIER_DURABILITY.stone > TIER_DURABILITY.wood);
});

test('ITEM_TIER maps all six tools', () => {
  assert.strictEqual(ITEM_TIER[ITEM.WOOD_PICK], 'wood');
  assert.strictEqual(ITEM_TIER[ITEM.WOOD_AXE], 'wood');
  assert.strictEqual(ITEM_TIER[ITEM.STONE_PICK], 'stone');
  assert.strictEqual(ITEM_TIER[ITEM.STONE_AXE], 'stone');
  assert.strictEqual(ITEM_TIER[ITEM.IRON_PICK], 'iron');
  assert.strictEqual(ITEM_TIER[ITEM.IRON_AXE], 'iron');
});

test('tierForItem returns tier for tools, null otherwise', () => {
  assert.strictEqual(tierForItem(ITEM.WOOD_PICK), 'wood');
  assert.strictEqual(tierForItem(ITEM.STONE_AXE), 'stone');
  assert.strictEqual(tierForItem(ITEM.IRON_PICK), 'iron');
  assert.strictEqual(tierForItem(ITEM.COAL), null);
  assert.strictEqual(tierForItem(ITEM.RATION), null);
});

test('tierIndex returns correct position', () => {
  assert.strictEqual(tierIndex('wood'), 0);
  assert.strictEqual(tierIndex('stone'), 1);
  assert.strictEqual(tierIndex('iron'), 2);
  assert.strictEqual(tierIndex('diamond'), -1);
});

test('tierMeetsRequirement directional checks', () => {
  assert.ok(tierMeetsRequirement('iron', 'wood'));
  assert.ok(tierMeetsRequirement('stone', 'wood'));
  assert.ok(tierMeetsRequirement('iron', 'stone'));
  assert.ok(!tierMeetsRequirement('wood', 'iron'));
  assert.ok(!tierMeetsRequirement('stone', 'iron'));
  assert.ok(tierMeetsRequirement('wood', 'wood'));   // same tier ok
});

test('speedForItem returns multiplier for tools, 1 for non-tools', () => {
  assert.ok(speedForItem(ITEM.IRON_PICK) > speedForItem(ITEM.STONE_PICK));
  assert.ok(speedForItem(ITEM.STONE_PICK) > speedForItem(ITEM.WOOD_PICK));
  assert.strictEqual(speedForItem(ITEM.COAL), 1);
  assert.strictEqual(speedForItem(null), 1);
});

if (process.exitCode) process.exit(1);
console.log(`\nAll ${passed} tool-tiers tests passed.`);
