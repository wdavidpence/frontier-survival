import assert from 'node:assert/strict';
import { shouldCarveCave, diamondVeinAt, starterCaveBlock } from '../js/cave-carve.js';
import { nextFlowCells, floodFromSources } from '../js/fluid-flow.js';
import { skyLightAt, nearestLights, caveDarkness01 } from '../js/voxel-light.js';
import { villagersForSite, applyTrade, villagerLayout, arrivalTraders } from '../js/village-life.js';
import { musicMix, musicCrossfade } from '../js/music-director.js';
import { lootTable, ruinSitesForSeed } from '../js/structure-loot.js';
import { horseJumpVelocity, gliderVelocity } from '../js/glider-flight.js';
import { encodeWorldCode, decodeWorldCode } from '../js/world-share.js';
import { tickHopper, ensureHopper } from '../js/hopper-world.js';
import { hydrateNearWater, isHydratedFarmland } from '../js/farmland.js';
import { qualitySettings } from '../js/quality-policy.js';
import { ITEM } from '../js/items.js';
import { BLOCK } from '../js/blocks.js';
import { visibleRecipes } from '../js/crafting.js';
import { fogTintForBiome } from '../js/biome-dress.js';

assert.equal(ITEM.DIAMOND_PICK > 0, true, 'diamond pick exists');
assert.equal(ITEM.GLIDER > 0, true, 'glider exists');
assert.equal(BLOCK.ENCHANT_TABLE, 87);
assert.equal(BLOCK.HOPPER, 86);
assert.equal(BLOCK.TRAPDOOR_CLOSED, 83);
assert.equal(BLOCK.SIGN, 85);
const recipes = visibleRecipes();
for (const id of ['diamond_pick', 'glider', 'hopper', 'enchant_table', 'trapdoor', 'sign']) {
  assert.ok(recipes.some((r) => r.id === id), `recipe ${id}`);
}

const qVis = qualitySettings('visual');
const qPerf = qualitySettings('performance');
assert.ok(qVis.pbr > qPerf.pbr, 'visual preset raises PBR');
assert.ok(qVis.volumetricFog > qPerf.volumetricFog, 'visual preset raises fog');
assert.ok(qVis.waterReflect > qPerf.waterReflect, 'visual preset raises water reflect');
assert.ok(qVis.sss > qPerf.sss, 'visual preset raises SSS');

assert.equal(skyLightAt(18, 16), 15);
assert.ok(caveDarkness01(4, 20) > 0.5);
const lights = nearestLights([{ x: 1, y: 2, z: 3 }, { x: 40, y: 2, z: 3 }], 0, 2, 0, 1);
assert.equal(lights.length, 1);
assert.equal(lights[0].x, 1);

assert.equal(shouldCarveCave(-10, 16, -28, 18, 1), false, 'starter pad not carved');
assert.equal(typeof diamondVeinAt(2, 4, 2, 9), 'boolean');
assert.equal(starterCaveBlock(-21, 18, -27, 16), 14);
assert.equal(starterCaveBlock(-19, 17, -27, 16), 9);
assert.equal(starterCaveBlock(-21, 20, -27, 16), 9);
assert.equal(starterCaveBlock(-21, 17, -19, 16), 22);
assert.equal(starterCaveBlock(-21, 17, -24, 16), 0);
assert.equal(starterCaveBlock(0, 17, 0, 16), null);

const cells = nextFlowCells(0, 10, 0, (x, y, z) => (y === 9 ? 0 : 5));
assert.ok(cells.some((c) => c.y === 9));
const filled = [];
floodFromSources([{ x: 0, y: 5, z: 0 }], () => 0, (x, y, z) => filled.push([x, y, z]), 8);
assert.ok(filled.length > 0);

const people = villagersForSite({ cx: 0, cz: 0, seed: 3, structureCount: 6, ground: 17 });
assert.ok(people.length >= 2);
const trade = applyTrade([{ id: 1, count: 16 }], people[0].trades[0], () => 1);
assert.equal(typeof trade.ok, 'boolean');

const mix = musicMix({ biome: 'ocean', boat: true });
assert.ok(mix.ocean > mix.explore);
const faded = musicCrossfade(mix, musicMix({ cave: true }), 0.5);
assert.ok(faded.cave >= 0);

assert.ok(ruinSitesForSeed(1).length >= 1);
assert.ok(lootTable('ruin', 2, 0).count >= 1);

assert.equal(horseJumpVelocity(true, true, true, 0), 8.2);
assert.ok(gliderVelocity(-10, true, false) > -10);

const code = encodeWorldCode({ seed: 42, mode: 'coop', day: 3 });
const decoded = decodeWorldCode(code);
assert.equal(decoded.ok, true);
assert.equal(decoded.seed, 42);
assert.equal(decoded.mode, 'coop');

const h = ensureHopper({});
const above = [{ id: 7, count: 4 }];
const below = [{ id: null, count: 0 }];
tickHopper(h, above, below);
assert.ok(below[0].count > 0 || h.buf.slots.some((s) => s && s.count > 0));

const wet = hydrateNearWater({ x: 0, z: 0, moisture: 0 }, [{ x: 1, z: 0 }], 4, 0.5);
assert.equal(isHydratedFarmland(wet.moisture, 0.3), true);

const layout = villagerLayout('fisher');
const arrivals = arrivalTraders({ x: 0, y: 17, z: -20, yaw: 0.92 });
assert.equal(arrivals.length, 2);
assert.ok(arrivals.every((v) => v.z >= -29));
assert.ok(layout.parts.length >= 6);
assert.ok(people[0].y > 0);

const tint = fogTintForBiome('ocean', [0.5, 0.6, 0.7]);
assert.equal(tint.length, 3);
assert.ok(tint[2] > tint[0], 'ocean fog leans blue');
console.log('PASS mc-class pack contracts');
