import assert from 'node:assert/strict';
import {
  sandyBeachHeight,
  isSandyBeachSurface,
  waterEditsAfterExcavation,
} from '../js/shore-water.js';
import { heightAt, coastalGradeHeight, sandyCoastHeight } from '../js/gen.js';
import { biomeAt } from '../js/biomes.js';

const AIR = 0;
const SAND = 4;
const WATER = 5;
const STONE = 3;
const seaLevel = 16;

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}

test('sandy shoreline is level with the water surface when adjacent to water', () => {
  assert.equal(sandyBeachHeight({ height: seaLevel + 1, biome: 'shore', seaLevel, adjacentWater: true }), seaLevel - 1);
  assert.equal(sandyBeachHeight({ height: seaLevel + 3, biome: 'ocean', seaLevel, adjacentWater: true }), seaLevel - 1);
});

test('rocky shore relief is preserved above the waterline', () => {
  assert.equal(sandyBeachHeight({ height: seaLevel + 3, biome: 'shore', seaLevel, adjacentWater: true, rocky: true }), seaLevel + 3);
  assert.equal(isSandyBeachSurface({ height: seaLevel + 2, biome: 'shore', seaLevel, rocky: true }), false);
});

test('actual generated sandy coast cells flatten to the waterline', () => {
  const seed = 12345;
  const candidates = [];
  for (let x = -64; x <= 64; x++) {
    for (let z = -64; z <= 64; z++) {
      const biome = biomeAt(x, z, seed);
      const raw = heightAt(x, z, seed);
      const graded = coastalGradeHeight(x, z, seed);
      const nearWater = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => heightAt(x + dx, z + dz, seed) < seaLevel);
      if ((biome === 'shore' || biome === 'ocean') && raw >= seaLevel && graded > seaLevel - 1 && nearWater) {
        candidates.push(sandyCoastHeight(x, z, seed, biome, graded, false));
      }
    }
  }
  assert.ok(candidates.length > 0, 'seed must expose at least one graded sandy coast cell');
  assert.ok(candidates.every(height => height === seaLevel - 1));
});

test('excavating coastal sand fills the new cell from adjacent water', () => {
  const blocks = new Map([
    ['0,15,0', SAND],
    ['1,15,0', WATER],
    ['2,15,0', WATER],
  ]);
  const getBlock = (x, y, z) => blocks.get(`${x},${y},${z}`) ?? AIR;
  assert.deepEqual(
    waterEditsAfterExcavation({ x: 0, y: 15, z: 0, getBlock, waterId: WATER, airId: AIR, seaLevel }),
    [[0, 15, 0, WATER]],
  );
});

test('an isolated water cell collapses when one land wall is broken', () => {
  const blocks = new Map([
    ['0,15,0', WATER],
    ['-1,15,0', STONE],
    ['1,15,0', STONE],
    ['0,15,-1', STONE],
    ['0,15,1', AIR],
    ['0,14,0', STONE],
  ]);
  const getBlock = (x, y, z) => blocks.get(`${x},${y},${z}`) ?? AIR;
  assert.deepEqual(
    waterEditsAfterExcavation({ x: 0, y: 15, z: 1, getBlock, waterId: WATER, airId: AIR, seaLevel }),
    [[0, 15, 0, AIR]],
  );
});

test('connected ocean water remains after a shoreline excavation', () => {
  const blocks = new Map([
    ['0,15,0', SAND],
    ['1,15,0', WATER],
    ['2,15,0', WATER],
  ]);
  const getBlock = (x, y, z) => blocks.get(`${x},${y},${z}`) ?? AIR;
  assert.deepEqual(
    waterEditsAfterExcavation({ x: 0, y: 15, z: 0, getBlock, waterId: WATER, airId: AIR, seaLevel }),
    [[0, 15, 0, WATER]],
  );
});
