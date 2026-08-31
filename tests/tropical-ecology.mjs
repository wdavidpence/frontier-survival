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

test('Cane Garden Bay ecology plants two leaning hero palms with attached crowns', () => {
  const WORLD_HEIGHT = 48;
  const CHUNK_SIZE = 16;
  const at = (data, lx, y, lz) => data[(lz * WORLD_HEIGHT + y) * CHUNK_SIZE + lx];
  const fillBeach = () => {
    const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    for (let z = 0; z < CHUNK_SIZE; z++) for (let x = 0; x < CHUNK_SIZE; x++) {
      data[(z * WORLD_HEIGHT + 16) * CHUNK_SIZE + x] = BLOCK.SAND;
      data[(z * WORLD_HEIGHT + 15) * CHUNK_SIZE + x] = BLOCK.SAND;
    }
    return data;
  };
  const palms = [];
  for (const [baseX, baseZ] of [[-32, -32], [-16, -32]]) {
    const data = applyTropicalEcology(fillBeach(), { baseX, baseZ, seed: 1884808540 });
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        if (at(data, lx, 17, lz) === BLOCK.PALM_TRUNK) palms.push({ x: baseX + lx, z: baseZ + lz });
      }
    }
  }
  const keys = palms.map((p) => `${p.x},${p.z}`).sort();
  assert.ok(keys.includes('-21,-26'), `missing west hero palm, got ${keys.join('|')}`);
  assert.ok(keys.includes('-15,-26'), `missing east hero palm, got ${keys.join('|')}`);
  {
    const data = applyTropicalEcology(fillBeach(), { baseX: -32, baseZ: -32, seed: 1884808540 });
    let neighbors = 0;
    const lx = -21 - (-32);
    const lz = -26 - (-32);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dz === 0) continue;
      if (at(data, lx + dx, 17, lz + dz) === BLOCK.PALM_TRUNK) neighbors++;
    }
    assert.equal(neighbors, 0, 'palm trunk must be a single leaning column, not a 5-block wooden pad');
  }
  for (const [baseX, baseZ] of [[-32, -32], [-16, -32]]) {
    const data = applyTropicalEcology(fillBeach(), { baseX, baseZ, seed: 1884808540 });
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          if (at(data, lx, y, lz) !== BLOCK.PALM_LEAVES) continue;
          let attached = false;
          for (let dz = -2; dz <= 2 && !attached; dz++) {
            for (let dx = -2; dx <= 2 && !attached; dx++) {
              for (const dy of [1, 0, -1]) {
                const tx = lx + dx;
                const ty = y + dy;
                const tz = lz + dz;
                if (tx < 0 || tx >= CHUNK_SIZE || tz < 0 || tz >= CHUNK_SIZE || ty < 0) continue;
                if (at(data, tx, ty, tz) === BLOCK.PALM_TRUNK) attached = true;
              }
            }
          }
          assert.ok(attached, `palm leaf at ${baseX + lx},${y},${baseZ + lz} is not attached to a trunk`);
        }
      }
    }
  }
});
