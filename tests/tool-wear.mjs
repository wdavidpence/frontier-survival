import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { ITEM } from '../js/items.js';
import { ITEM_TIER, TIER_DURABILITY, tierForItem } from '../js/tool-tiers.js';
import { durabilityRatio, maxDurability, wearTool } from '../js/durability.js';

const durabilitySource = readFileSync(new URL('../js/durability.js', import.meta.url), 'utf8');
const gameSource = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');

const specializedTools = [
  ['WOOD_PICK', 'pick', 'wood'],
  ['WOOD_AXE', 'axe', 'wood'],
  ['STONE_PICK', 'pick', 'stone'],
  ['STONE_AXE', 'axe', 'stone'],
  ['IRON_PICK', 'pick', 'iron'],
  ['IRON_AXE', 'axe', 'iron'],
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

function stack(id, dur) {
  return { id, count: 1, ...(dur == null ? {} : { dur }) };
}

test('all current specialized tools use their deterministic tier durability', () => {
  assert.equal(specializedTools.length, 15);
  for (const [name, kind, tier] of specializedTools) {
    const id = ITEM[name];
    assert.ok(Number.isInteger(id), `${name} has an item id`);
    assert.equal(tierForItem(id), tier, `${name} tier`);
    assert.equal(ITEM_TIER[id], tier, `${name} tier mapping`);
    assert.equal(maxDurability(id), TIER_DURABILITY[tier], `${name} durability`);
    assert.equal(maxDurability(id), { wood: 60, stone: 100, iron: 180 }[tier], `${kind} ${name} durability`);
  }
});

test('explicit rod and shield durability and legacy weapon behavior remain intact', () => {
  assert.equal(maxDurability(ITEM.FISHING_ROD), 80);
  assert.equal(maxDurability(ITEM.SHIELD), 120);
  assert.equal(maxDurability(ITEM.WOOD_SWORD), 60);
  assert.equal(maxDurability(ITEM.BOW), 60);
});

test('non-tools are safe and have no durability', () => {
  for (const id of [ITEM.STICK, ITEM.RATION, ITEM.COAL, ITEM.COMPASS, ITEM.BOAT, null, undefined, 999999]) {
    assert.equal(maxDurability(id), 0, `non-tool ${id}`);
    assert.equal(durabilityRatio(stack(id)), 1, `non-tool ratio ${id}`);
  }
});

test('wearTool subtracts exact wear and removes a tool at zero', () => {
  for (const [name, , tier] of specializedTools) {
    const id = ITEM[name];
    const max = TIER_DURABILITY[tier];
    const input = [stack(id, max)];
    const worn = wearTool(input, 0, max - 1);
    assert.equal(worn.broken, false, `${name} survives exact pre-break wear`);
    assert.equal(worn.remaining, 1, `${name} remaining durability`);
    assert.equal(worn.slots[0].dur, 1, `${name} stored durability`);
    const broken = wearTool(worn.slots, 0, 1);
    assert.equal(broken.broken, true, `${name} breaks at zero`);
    assert.equal(broken.remaining, 0, `${name} broken remaining`);
    assert.deepEqual(broken.slots[0], { id: null, count: 0 }, `${name} broken slot cleared`);
  }
});

test('wearTool returns cloned slots and never mutates input, including no-op paths', () => {
  const input = [stack(ITEM.IRON_HOE, 17), stack(ITEM.STICK), stack(ITEM.STONE_MASON, 5)];
  const before = structuredClone(input);
  const worn = wearTool(input, 0, 4);
  assert.notStrictEqual(worn.slots, input);
  assert.notStrictEqual(worn.slots[0], input[0]);
  assert.notStrictEqual(worn.slots[1], input[1]);
  assert.deepEqual(input, before);
  assert.equal(worn.slots[0].dur, 13);
  assert.deepEqual(worn.slots[1], input[1]);

  const noOp = wearTool(input, 1, 99);
  assert.notStrictEqual(noOp.slots, input);
  assert.deepEqual(noOp.slots, input);
  assert.equal(noOp.broken, false);
  assert.equal(noOp.remaining, 0);
  assert.deepEqual(input, before);
});

test('durabilityRatio defaults, clamps, and scales by tier', () => {
  assert.equal(durabilityRatio(null), 1);
  assert.equal(durabilityRatio({ id: null, count: 0 }), 1);
  assert.equal(durabilityRatio({ id: ITEM.IRON_PICK, count: 1 }), 1);
  assert.equal(durabilityRatio({ id: ITEM.IRON_PICK, count: 1, dur: 90 }), 0.5);
  assert.equal(durabilityRatio({ id: ITEM.WOOD_HOE, count: 1, dur: 100 }), 1);
  assert.equal(durabilityRatio({ id: ITEM.WOOD_HOE, count: 1, dur: -1 }), 0);
});

test('durability adapter uses literal current cache-busted imports and stays pure', () => {
  assert.match(durabilitySource, /from ['"]\.\/items\.js\?v=246['"]/);
  assert.match(durabilitySource, /from ['"]\.\/tool-tiers\.js\?v=222['"]/);
  assert.match(durabilitySource, /from ['"]\.\/inventory\.js\?v=216['"]/);
  assert.match(durabilitySource, /tierForItem\(id\)/);
  assert.match(durabilitySource, /TIER_DURABILITY\[tier\]/);
  assert.doesNotMatch(durabilitySource, /import\s*\(/);
  assert.doesNotMatch(durabilitySource, /\bslots\s*\[/, 'adapter must not write its input slots');
});

test('game mining paths reach durability wear and use the current adapter cache', () => {
  assert.match(gameSource, /from ['"]\.\/durability\.js\?v=222['"]/);
  assert.match(gameSource, /wearTool\(this\.player\.slots, this\.player\.hotbarIndex, 1\)/);
  assert.match(gameSource, /wearTool\(p\.slots, p\.hotbarIndex, 1\)/);
  assert.match(gameSource, /if \(w\.broken\) this\.player\.notify\(['"]Tool broke!/);
  assert.match(gameSource, /if \(w\.broken\) p\.notify\(['"]Tool broke!/);
});
