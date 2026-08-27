import assert from 'node:assert/strict';
import test from 'node:test';
import { BLOCK } from '../js/blocks.js';
import { ITEM, dropForBlock, propsOf } from '../js/items.js';
import { applyTropicalEcology, TROPICAL_ECOLOGY, tropicalPlantIds, tropicalTuberIds } from '../js/tropical-ecology.js';
import { forestFloorDetail } from '../js/gen.js';

const solid = new Uint8Array(16 * 48 * 16);
const idx = (x, y, z) => x + 16 * (z + 16 * y);
function fixture() {
  const data = new Uint8Array(solid);
  for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
    data[idx(x, 18, z)] = BLOCK.GRASS;
    data[idx(x, 17, z)] = BLOCK.DIRT;
    data[idx(x, 16, z)] = BLOCK.DIRT;
  }
  return data;
}

test('tropical ecology exports all six additions and four edible tubers', () => {
  assert.deepEqual(tropicalPlantIds(), [BLOCK.BROMELIAD, BLOCK.HELICONIA, BLOCK.TARO, BLOCK.PANDANUS, BLOCK.PNEUMATOPHORE, BLOCK.BANYAN_ROOTS]);
  assert.deepEqual(tropicalTuberIds(), [BLOCK.CASSAVA_TUBER, BLOCK.YAUTIA_CORM, BLOCK.YAM_TUBER, BLOCK.BATATA_TUBER]);
  assert.equal(TROPICAL_ECOLOGY.mushroomChance, 0.003);
});

test('mushroom dressing is reduced to a rare forest-floor event', () => {
  let mushrooms = 0;
  for (let z = 0; z < 64; z++) for (let x = 0; x < 64; x++) {
    if (forestFloorDetail(x, z, 1884808540, 'forest', 24, BLOCK.GRASS, BLOCK.AIR) === 'mushroom') mushrooms++;
  }
  assert.ok(mushrooms < 30, `expected sparse mushrooms, got ${mushrooms}`);
});

test('tuber blocks drop real Puerto Rican/Caribbean root foods', () => {
  assert.equal(dropForBlock(BLOCK.CASSAVA_TUBER), ITEM.YUCA);
  assert.equal(dropForBlock(BLOCK.YAUTIA_CORM), ITEM.YAUTIA);
  assert.equal(dropForBlock(BLOCK.YAM_TUBER), ITEM.NYAME);
  assert.equal(dropForBlock(BLOCK.BATATA_TUBER), ITEM.BATATA);
  for (const id of [ITEM.YUCA, ITEM.YAUTIA, ITEM.NYAME, ITEM.BATATA]) {
    assert.ok(propsOf(id)?.edible > 0);
    assert.ok(propsOf(id)?.cookable, `raw root ${id} should be cookable`);
  }
});

test('ecology pass is deterministic and bounded', () => {
  const a = applyTropicalEcology(fixture(), { baseX: 0, baseZ: 0, seed: 1884808540 });
  const b = applyTropicalEcology(fixture(), { baseX: 0, baseZ: 0, seed: 1884808540 });
  assert.deepEqual(a, b);
  const counts = {};
  for (const id of a) counts[id] = (counts[id] || 0) + 1;
  assert.ok((counts[BLOCK.MUSHROOM] || 0) <= 1);
  assert.ok((counts[BLOCK.CASSAVA_TUBER] || 0) + (counts[BLOCK.YAUTIA_CORM] || 0) + (counts[BLOCK.YAM_TUBER] || 0) + (counts[BLOCK.BATATA_TUBER] || 0) <= 4);
});
