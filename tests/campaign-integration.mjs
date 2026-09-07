import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  depositCompatibleSlots, inventoryTooltip, searchItems, radialQuadrants, keybindConflicts,
  recyclePreview, loadoutPlan, chestOrganization, packTutorialSteps, sortKeepingPinned,
  objectiveFilter, craftReservation, quickTransfer, recipeRecency, LOADOUTS,
} from '../js/campaign-friction.js';
import {
  ghostPreviewInfo, orientationState, replaceTarget, captureBlueprint, pasteBlueprint,
  variantOf, shelterValidation, buildCameraAid, createBuildUndo, buildMilestone, settlementUnlocks,
  DECOR_STATIONS,
} from '../js/campaign-build.js';
import {
  LANDMARKS, visibleLandmarks, setpieceAt, journalPage, locatorEntries, appendBreadcrumb,
  seedPreviewStrip, worldHistoryShelf, travelCaches, fastTravelCheck, routeWeatherWindow,
  offerContract, rareSetpiece, distantSoundCue, expeditionFinale, CONTRACT_KINDS,
} from '../js/campaign-explore.js';
import {
  forecastWindows, purificationPlan, freshnessBand, warmthZone, deathBreadcrumb, DEATH_PRESETS,
  predatorTelegraph, NONCOMBAT_OBJECTIVES, EMERGENCY_RECIPES, staminaMode, triagePriority,
  restBonus, midGameGoals, speciesBehavior, fieldSignFor, observationReward, lifecycleTick,
  biomeVariant, foodChainReaction, dailyRoutine, naturalistCard, chunkPopulationBudget,
  boatLoopPhase, wakePresentation, flotationFatigue, boatRouteLayers, passagePlan, boatStory,
} from '../js/campaign-survival.js';
import {
  controllerAssignment, sharedPings, coopQualityBudget, coopSocial, materialResponse,
  exposureKeyframe, biomeAmbience, musicState, footstepCue, photoModeFlags,
  capabilityRecommendation, roamTelemetry, accessibilityBundle, releaseGateReport,
} from '../js/campaign-systems.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vision = readFileSync(join(root, 'js/frontier-vision-pack.js'), 'utf8');
const game = readFileSync(join(root, 'js/game.js'), 'utf8');

// A. friction (items 4–20)
assert.deepEqual(depositCompatibleSlots({ slots: [{ item: 'Wood', count: 30 }, null, { item: 'Stone', count: 10 }] }, 40), [
  { index: 0, item: 'Wood', take: 30 },
  { index: 2, item: 'Stone', take: 10 },
]);
assert.deepEqual(inventoryTooltip({ item: 'Fish', count: 2, freshness: 0.2, durability: 5, maxDurability: 10 }), [
  'Fish ×2', 'Durability 50%', 'Freshness 20% · eat soon',
]);
assert.equal(searchItems([{ name: 'Iron Pick', category: 'Tool' }, { name: 'Ration', category: 'Food' }], 'pick').length, 1);
const radial = radialQuadrants({ slots: [{ id: 1, count: 1 }, { id: 2, count: 1 }] }, (id) => (id === 1 ? 'Dried Ration' : 'Wood Pick'));
assert.equal(radial.food, 'Dried Ration');
assert.equal(radial.tool, 'Wood Pick');
assert.deepEqual(keybindConflicts({ mine: 'KeyR', place: 'KeyR' })[0].actions, ['mine', 'place']);
assert.equal(recyclePreview({ item: 'Planks', count: 4 }, false).ok, false);
assert.equal(recyclePreview({ item: 'Planks', count: 4 }, true).refund.count, 2);
assert.equal(loadoutPlan('expedition', { slots: [{ item: 'Torch', count: 4 }] }, {}).moves[0].item, 'Torch');
assert.equal(Object.keys(LOADOUTS).length, 3);
assert.equal(chestOrganization({ c1: { label: 'Food', slots: [{ item: 'Fish' }] } })[0].label, 'Food');
assert.equal(packTutorialSteps().length, 5);
const sorted = sortKeepingPinned([{ item: 'Zinc', pinned: true }, { item: 'Iron' }, { item: 'Copper' }]);
assert.equal(sorted[0].item, 'Zinc');
assert.equal(objectiveFilter([{ item: 'Torch' }, { item: 'Pebble' }], ['Rope'])[0].item, 'Torch');
const reservation = craftReservation({ cost: { Wood: 5 } }, [{ key: 'chest', slots: [{ item: 'Wood', count: 7 }] }]);
assert.equal(reservation.craftable, true);
assert.equal(quickTransfer({ item: 'Wood', count: 10 }, { item: 'Wood', count: 60, maxStack: 64 }).count, 4);
assert.deepEqual(recipeRecency(['bed'], ['torch', 'torch', 'axe']), ['bed', 'torch', 'axe']);

// B. build (items 22–35)
assert.equal(ghostPreviewInfo({ x: 1, y: 2, z: 3, face: 'top' }, 'slab_wood').half, true);
assert.equal(orientationState(5).label, 'E');
assert.equal(replaceTarget({ x: 1, y: 2, z: 3 }, new Map([['1,2,3', 4]])).current, 4);
const bp = captureBlueprint({ '1,2,3': 5, '99,2,3': 5 }, { x: 0, y: 2, z: 3 }, 8);
assert.equal(bp.blocks.length, 1);
assert.equal(pasteBlueprint(bp, { x: 10, y: 2, z: 3 }, { 5: 1 }).placements[0].x, 11);
assert.equal(variantOf('railing', 'stone'), 'railing_stone');
assert.ok(Object.keys(DECOR_STATIONS).length >= 6);
assert.equal(shelterValidation({ roofCells: 9, wallCells: 12, hasDoor: true, lightCells: 1, rain: true }).verdict, 'Storm-ready');
assert.equal(buildCameraAid(-85).pitch, -65);
const undo = createBuildUndo(2);
undo.push([{ id: 5 }]); undo.push([{ id: 6 }]); undo.push([{ id: 7 }]);
assert.equal(undo.depth(), 2);
assert.equal(undo.pop()[0].id, 7);
assert.equal(buildMilestone(10, 5).title, 'First Lean-to');
assert.equal(buildMilestone(10, 5 + 0) && buildMilestone(70, 60).title, 'Hamlet');
assert.equal(settlementUnlocks({ edits: 40, roofed: true, campfire: true, voyages: 2, observedSpecies: 6 }).length, 4);

// C. exploration (items 36–50)
assert.ok(LANDMARKS.length >= 5);
assert.ok(visibleLandmarks({ x: 420, z: -360 }, () => 40).length >= 1);
assert.ok(['ruins', 'sea_cave', 'shipwreck', 'salt_pond', 'cliff_path', 'tide_puzzle'].includes(setpieceAt({ x: 3, z: 9 }, 42) ?? 'shipwreck'));
assert.equal(journalPage({ name: 'Cove', x: 1.7, z: -2.2, day: 3 }).position[0], 2);
const locs = locatorEntries({ x: 0, z: 0 }, [{ id: 'camp', label: 'Camp', pos: { x: 0, z: -10 } }]);
assert.equal(locs[0].compass, 'N');
assert.equal(appendBreadcrumb([], { x: 1, y: 2, z: 3 }).length, 1);
assert.equal(seedPreviewStrip(7, { coastCells: 800, maxRise: 33 }).maxRise, 33);
assert.equal(worldHistoryShelf([{ seed: 1, days: 2 }, { seed: 2, days: 1 }])[0].seed, 2);
assert.ok(travelCaches([{ x: 0, z: 0 }, { x: 100, z: 0 }, { x: 200, z: 0 }], 150).length >= 1);
assert.equal(fastTravelCheck([{ id: 'a', x: 0, z: 0, supplied: true }, { id: 'b', x: 120, z: 0, supplied: true }], 'a', 'b', 1000).ok, true);
assert.equal(routeWeatherWindow([{ weather: 'storm', wind: 30 }, { weather: 'clear', wind: 5 }], 0.5).clearWindowInMin, 10);
assert.ok(CONTRACT_KINDS.includes(offerContract(7, 2).kind));
assert.ok(rareSetpiece(5, true, 0.01) === 'bioluminescent_cove' || rareSetpiece(5, true, 0.01) === 'firefly_bank');
assert.equal(rareSetpiece(5, false, 0.5), null);
assert.equal(distantSoundCue({ x: 0, z: 0 }, [{ x: 10, z: 0, kind: 'cay' }]).cue, 'distant birdsong');
assert.equal(expeditionFinale({ destinationReached: true }, 'return').worldChange, 'camp_flag');

// D/E/F. survival + ecology + ocean
assert.equal(forecastWindows([{ weather: 'storm', wind: 40 }])[0].advice, 'Shelter now');
assert.equal(purificationPlan({ contaminated: true }).method, 'Boil 45s');
assert.equal(freshnessBand(0.1).band, 'Spoiled');
assert.ok(warmthZone({ nearFire: true, wind: 4, wetness: 0, night: false }).warmth > 0.7);
assert.equal(deathBreadcrumb({ x: 3, y: 4, z: 5 }).label, 'Your lost pack');
assert.equal(DEATH_PRESETS.insurance.scattered, 0);
assert.equal(predatorTelegraph(3).phase, 'charge');
assert.equal(predatorTelegraph(50).phase, 'hidden');
assert.ok(NONCOMBAT_OBJECTIVES.length >= 5);
assert.equal(EMERGENCY_RECIPES.length, 3);
assert.equal(staminaMode({ climbing: true }).mode, 'climb');
assert.equal(triagePriority({ bleed: 2, thirst: 10 })[0].kind, 'bleed');
assert.equal(restBonus(0.9, false, false).bonus, 0.6);
assert.equal(restBonus(0.9, false, true).bonus, 0);
assert.ok(midGameGoals({}).length >= 1);
assert.equal(speciesBehavior('fox', true, null), 'forage');
assert.ok(['wake', 'shell'].includes(fieldSignFor({ aquatic: true, type: 'turtle', x: 1, z: 2 }, 0.2).kind));
assert.equal(observationReward(10).stamp, 'Naturalist');
assert.ok(lifecycleTick({ adults: 2, babies: 0 }, 8, 3).babies === 1);
assert.equal(biomeVariant('tropical').drops[0], 'Coconut');
assert.equal(foodChainReaction('bait', 'drop'), 'bait_school');
assert.equal(dailyRoutine(true, 0.5, false), 'den_rest');
assert.equal(naturalistCard('turtle', 4).habitat, 'reef');
assert.ok(chunkPopulationBudget({ x: 4, z: 9 }, 7).want <= 4);
assert.equal(boatLoopPhase(false, 0.5, true), 'beach_ready');
assert.equal(wakePresentation(5, 0.9).spray, 'mist');
assert.equal(flotationFatigue(10, 50).emergencyReturn, 'swim_for_it');
assert.ok(boatRouteLayers(12).includes('shark-patrol'));
assert.ok(passagePlan({ x: 0, z: 0 }, { x: 240, z: 0 }, { x: 1, z: 0 }).etaMin >= 1);
assert.equal(boatStory({ repairs: 2, voyages: 4 }).decal, 'voyager-mark');

// G/H/I. co-op + sensory + inclusion
assert.equal(controllerAssignment([{ connected: true }, { connected: false }])[1].player, 'P2');
assert.ok(sharedPings([{ id: 'p', pos: { x: 5, z: 0 }, ttl: 10 }], { x: 0, z: 0 }, { x: 2, z: 0 }).length === 2);
assert.ok(coopQualityBudget(true, { particles: 100, fauna: 40, clouds: 1 }).particles < 100);
assert.equal(coopSocial({ downedPartner: true, distanceToPartner: 2 }, 'p1').canRevive, true);
assert.ok(materialResponse('sand', 100).darken > 0);
assert.equal(exposureKeyframe(0.7, false).moon, true);
assert.equal(biomeAmbience('beach', true, false), 'surf_night');
assert.equal(musicState('exploration', { danger: 0.9 }).state, 'danger');
assert.equal(footstepCue('water', false).subtitle, '*splash*');
assert.equal(photoModeFlags({ camera: { aspect: 2 } }).worldMutationsBlocked, true);
assert.equal(capabilityRecommendation({ webgl2: false }).preset, 'performance');
assert.ok(roamTelemetry([10, 12, 11, 40]).frames === 4);
assert.equal(accessibilityBundle({ uiScale: 1.2 }).uiScale, 1.2);
assert.equal(releaseGateReport({ smoke: true }).missing[0], 'provenance');

// Production edges: vision pack wires the campaign helpers through cache-busted imports.
assert.match(vision, /from ['"]\.\/campaign-explore\.js\?v=\d+['"]/, 'Vision pack imports campaign-explore');
assert.match(vision, /from ['"]\.\/campaign-survival\.js\?v=\d+['"]/, 'Vision pack imports campaign-survival');
assert.match(vision, /from ['"]\.\/campaign-friction\.js\?v=\d+['"]/, 'Vision pack imports campaign-friction');
assert.match(vision, /from ['"]\.\/campaign-build\.js\?v=\d+['"]/, 'Vision pack imports campaign-build');
assert.match(vision, /locatorEntries\(pos, locatorTargets\)/);
assert.match(vision, /triagePriority\(survival\)/);
assert.match(vision, /predatorTelegraph\(d\)/);
assert.match(vision, /boatRouteLayers\(depthUnderBoat\)/);
assert.match(vision, /radialQuadrants\(game\.player, displayName\)/);
assert.match(vision, /buildMilestone\(edits, game\._lastMilestoneTier/);
assert.match(vision, /\[data-gcv="locator"\]/);
assert.match(vision, /\[data-gcv="triage"\]/);
assert.match(vision, /\[data-gcv="pack"\]/);
assert.match(vision, /\[data-gcv="homestead"\]/);
assert.match(game, /from ['"]\.\/frontier-vision-pack\.js\?v=\d+['"]/, 'Game imports vision pack through a cache-busted edge');

console.log('PASS campaign bundle: friction, build, exploration, survival, ecology, ocean, co-op, sensory, and vision-pack production edges');
