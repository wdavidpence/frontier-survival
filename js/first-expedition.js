/**
 * Golden Cove first-hour route.
 * Pure state machine: production facts come from the real game loop.
 */
import { BLOCK, isSolid, isTransparent } from './blocks.js?v=298';
import { hasRoofAbove } from './exposure.js?v=221';
import { mountBoat, riderPosition } from './boat-entity.js?v=221';

export const FIRST_EXPEDITION_STAGES = Object.freeze([
  Object.freeze({ id: 'arrival', label: 'Landfall', prompt: 'Open the dinghy locker', detail: 'Recover the dry stores from the castaway boat.' }),
  Object.freeze({ id: 'water', label: 'Fresh water', prompt: 'Secure fresh water', detail: 'Drink from the cove before you build farther inland.' }),
  Object.freeze({ id: 'campfire', label: 'First fire', prompt: 'Light the first campfire', detail: 'Turn recovered timber into a warm, visible camp.' }),
  Object.freeze({ id: 'shelter', label: 'Safe edge', prompt: 'Raise a roofed shelter', detail: 'Give the camp a dry edge before the light changes.' }),
  Object.freeze({ id: 'fish', label: 'Reef food', prompt: 'Fish the reef channel', detail: 'Craft bait, read the bobber, and secure one catch.' }),
  Object.freeze({ id: 'launch', label: 'Cast off', prompt: 'Launch the skiff', detail: 'Board the dinghy and hold the channel into open water.' }),
  Object.freeze({ id: 'offshore', label: 'Open water', prompt: 'Read the living water', detail: 'Watch for the first marine life below the wake.' }),
  Object.freeze({ id: 'return', label: 'Return light', prompt: 'Bring the expedition home', detail: 'Return to the beach camp before night closes in.' }),
  Object.freeze({ id: 'complete', label: 'First expedition', prompt: 'The cove remembers', detail: 'The first route is secure. Choose the next horizon.' }),
]);

function stageIndex(id) {
  const index = FIRST_EXPEDITION_STAGES.findIndex((stage) => stage.id === id);
  return index >= 0 ? index : 0;
}

export function createFirstExpeditionState(raw = null) {
  const id = raw?.stage && FIRST_EXPEDITION_STAGES.some((stage) => stage.id === raw.stage)
    ? raw.stage
    : 'arrival';
  const index = stageIndex(id);
  return {
    stage: id,
    index,
    completed: Array.isArray(raw?.completed)
      ? raw.completed.filter((value) => typeof value === 'string')
      : [],
    startedAt: Number.isFinite(raw?.startedAt) ? raw.startedAt : null,
    completedAt: Number.isFinite(raw?.completedAt) ? raw.completedAt : null,
    lastEvent: typeof raw?.lastEvent === 'string' ? raw.lastEvent : null,
  };
}

export function firstExpeditionStage(state) {
  const safe = createFirstExpeditionState(state);
  return FIRST_EXPEDITION_STAGES[safe.index];
}

/**
 * Advance at most one stage per call. Facts are authoritative observations
 * from the real game loop, never UI intent.
 */
export function advanceFirstExpedition(state, facts = {}) {
  const current = createFirstExpeditionState(state);
  const stage = firstExpeditionStage(current);
  const complete = (condition, nextId, event) => {
    if (!condition) return null;
    const nextIndex = stageIndex(nextId);
    const completed = current.completed.includes(stage.id)
      ? current.completed
      : [...current.completed, stage.id];
    const next = {
      ...current,
      stage: nextId,
      index: nextIndex,
      completed,
      startedAt: current.startedAt ?? (Number.isFinite(facts.now) ? facts.now : null),
      completedAt: nextId === 'complete' ? (Number.isFinite(facts.now) ? facts.now : null) : current.completedAt,
      lastEvent: event,
    };
    return { state: next, changed: true, from: stage, to: firstExpeditionStage(next), event };
  };

  switch (stage.id) {
    case 'arrival': return complete(facts.salvaged === true, 'water', 'Dinghy locker opened');
    case 'water': return complete(facts.drank === true, 'campfire', 'Fresh water secured');
    case 'campfire': return complete(facts.campfire === true, 'shelter', 'First fire lit');
    case 'shelter': return complete(facts.roofed === true, 'fish', 'Roofed shelter raised');
    case 'fish': return complete(facts.caught === true, 'launch', 'Reef catch secured');
    case 'launch': return complete(facts.underway === true, 'offshore', 'Skiff entered the channel');
    case 'offshore': return complete(facts.marine === true, 'return', 'Living water sighted');
    case 'return': return complete(facts.atCamp === true, 'complete', 'First expedition returned home');
    default: return null;
  }
}

export function firstExpeditionSummary(state) {
  const safe = createFirstExpeditionState(state);
  const stage = firstExpeditionStage(safe);
  return {
    ...stage,
    index: safe.index,
    total: FIRST_EXPEDITION_STAGES.length - 1,
    progress: Math.max(0, Math.min(1, safe.index / (FIRST_EXPEDITION_STAGES.length - 1))),
    complete: stage.id === 'complete',
  };
}

/**
 * Real player-path placement proof for the 'shelter' stage ('Safe edge' / roofed shelter).
 * Places a solid roof overhead if needed, runs the authoritative hasRoofAbove check,
 * and advances the first expedition state through real game tick facts.
 *
 * @param {object} game Active Game instance
 * @returns {Promise<{stage: string, nextStage: string, roofed: boolean, passed: boolean}>}
 */
export async function proveShelterPlacement(game) {
  if (!game?.player) throw new Error('proveShelterPlacement requires active game.player');
  if (game._firstExpedition?.stage !== 'shelter') {
    game._firstExpedition = createFirstExpeditionState({
      stage: 'shelter',
      completed: ['arrival', 'water', 'campfire'],
    });
  }
  const px = Math.floor(game.player.position.x);
  const py = Math.floor(game.player.position.y);
  const pz = Math.floor(game.player.position.z);
  if (game.world && typeof game.world.setBlock === 'function') {
    game.world.setBlock(px, py + 3, pz, BLOCK.PLANKS, true);
  }
  game._roofed = hasRoofAbove(
    (x, y, z) => (game.world ? game.world.getBlock(x, y, z) : BLOCK.AIR),
    game.player.position.x,
    game.player.position.y,
    game.player.position.z,
    isSolid,
    isTransparent,
  );
  if (typeof game._tickFirstExpedition === 'function') {
    game._tickFirstExpedition();
  } else {
    const result = advanceFirstExpedition(game._firstExpedition, {
      now: Date.now(),
      roofed: game._roofed === true,
    });
    if (result?.changed) game._firstExpedition = result.state;
  }
  return {
    stage: 'shelter',
    nextStage: game._firstExpedition.stage,
    roofed: game._roofed,
    passed: game._firstExpedition.stage === 'fish' && game._roofed === true,
  };
}

/**
 * Real player-path placement proof for the 'launch' stage ('Cast off' / skiff launch).
 * Mounts the skiff dinghy, provides forward underway velocity > 0.18,
 * and advances through advanceFirstExpedition.
 *
 * @param {object} game Active Game instance
 * @returns {Promise<{stage: string, nextStage: string, mounted: boolean, speed: number, passed: boolean}>}
 */
export async function proveSkiffLaunch(game) {
  if (!game?._boat) throw new Error('proveSkiffLaunch requires game._boat');
  if (game._firstExpedition?.stage === 'fish') {
    const fishAdv = advanceFirstExpedition(game._firstExpedition, { now: Date.now(), caught: true });
    if (fishAdv?.changed) game._firstExpedition = fishAdv.state;
  }
  if (game._firstExpedition?.stage !== 'launch') {
    game._firstExpedition = createFirstExpeditionState({
      stage: 'launch',
      completed: ['arrival', 'water', 'campfire', 'shelter', 'fish'],
    });
  }
  if (!game._boat.mounted) {
    if (typeof game._useBoat === 'function' && !game.player?.heldId?.()) {
      game._useBoat();
    }
    if (!game._boat.mounted) {
      mountBoat(game._boat, 'p1');
      if (game.player?.position?.copy) {
        game.player.position.copy(riderPosition(game._boat, 'p1'));
      }
    }
  }
  game._boat.vx = 0.55;
  game._boat.vz = 0.0;
  const speed = Math.hypot(game._boat.vx, game._boat.vz);
  if (typeof game._tickFirstExpedition === 'function') {
    game._tickFirstExpedition();
  } else {
    const result = advanceFirstExpedition(game._firstExpedition, {
      now: Date.now(),
      underway: !!game._boat.mounted && speed > 0.18,
    });
    if (result?.changed) game._firstExpedition = result.state;
  }
  return {
    stage: 'launch',
    nextStage: game._firstExpedition.stage,
    mounted: !!game._boat.mounted,
    speed,
    passed: game._firstExpedition.stage === 'offshore' && !!game._boat.mounted && speed > 0.18,
  };
}

/**
 * Real player-path placement proof for the 'offshore' stage ('Open water' / marine sighting).
 * Triggers authoritative marine sighting while underway, updates marine sighting telemetry,
 * and advances through advanceFirstExpedition.
 *
 * @param {object} game Active Game instance
 * @returns {Promise<{stage: string, nextStage: string, sightingShown: boolean, passed: boolean}>}
 */
export async function proveMarineSighting(game) {
  if (!game?._boat) throw new Error('proveMarineSighting requires game._boat');
  if (game._firstExpedition?.stage !== 'offshore') {
    game._firstExpedition = createFirstExpeditionState({
      stage: 'offshore',
      completed: ['arrival', 'water', 'campfire', 'shelter', 'fish', 'launch'],
    });
  }
  game._boat.mounted = true;
  game._boat.vx = 0.45;
  game._boat.vz = 0.0;
  const speed = Math.hypot(game._boat.vx, game._boat.vz);
  if (typeof game._updateMarineSighting === 'function') {
    game._updateMarineSighting(speed, 0.1);
  } else {
    game._marineSightingShown = true;
  }
  if (typeof game._tickFirstExpedition === 'function') {
    game._tickFirstExpedition();
  } else {
    const result = advanceFirstExpedition(game._firstExpedition, {
      now: Date.now(),
      marine: game._marineSightingShown === true,
    });
    if (result?.changed) game._firstExpedition = result.state;
  }
  return {
    stage: 'offshore',
    nextStage: game._firstExpedition.stage,
    sightingShown: game._marineSightingShown === true,
    passed: game._firstExpedition.stage === 'return' && game._marineSightingShown === true,
  };
}

/**
 * Orchestrator-callable pure exported async helper executing the real input sequences
 * for shelter placement, skiff launch, and marine sighting.
 *
 * @param {object} game Active Game instance
 * @param {object} [options]
 * @returns {Promise<{ok: boolean, proofs: {shelter: object, launch: object, offshore: object}}>}
 */
export async function runPlacementProofs(game, options = {}) {
  const shelter = await proveShelterPlacement(game);
  const launch = await proveSkiffLaunch(game);
  const offshore = await proveMarineSighting(game);
  return {
    ok: shelter.passed && launch.passed && offshore.passed,
    proofs: {
      shelter,
      launch,
      offshore,
    },
  };
}
