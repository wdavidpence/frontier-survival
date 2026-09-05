/**
 * Golden Cove first-hour route.
 * Pure state machine: production facts come from the real game loop.
 */

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
