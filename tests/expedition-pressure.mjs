import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PRESSURE_ID,
  THREAT_LABEL,
  DESTINATION_ID,
  REQUIRED_SUPPLIES,
  NIGHT_STALKERS,
  createPressureState,
  deserializePressureState,
  triggerPressure,
  securePressure,
  getPressureHudSummary,
} from '../js/expedition-pressure.js';

const moduleSource = readFileSync(new URL('../js/expedition-pressure.js', import.meta.url), 'utf8');

assert.equal(PRESSURE_ID, 'night_stalkers');
assert.equal(THREAT_LABEL, 'Night Stalkers');
assert.equal(DESTINATION_ID, 'iron_ravine');
assert.deepEqual(REQUIRED_SUPPLIES, [
  { id: 'torch', quantity: 1 },
  { id: 'ration', quantity: 1 },
]);
assert.equal(NIGHT_STALKERS.preparationDriven, true);
assert.match(NIGHT_STALKERS.encounterNote, /preparation-driven/i);
assert.match(NIGHT_STALKERS.encounterNote, /night/i);
assert.match(NIGHT_STALKERS.encounterNote, /bad weather/i);
assert.doesNotMatch(moduleSource, /Math\.random|document\.|window\.|THREE\.|from ['"]|import\s/);

{
  const state = createPressureState();
  assert.deepEqual(state, {
    version: 1,
    id: PRESSURE_ID,
    label: THREAT_LABEL,
    destinationId: DESTINATION_ID,
    phase: 'dormant',
    requirements: REQUIRED_SUPPLIES,
    preparationDriven: true,
    environment: null,
    consumed: [],
  });
  assert.deepEqual(createPressureState(), state, 'fresh defaults are stable');
}

{
  const legacy = deserializePressureState({
    status: 'threatened',
    destination: 'iron_ravine',
    environmentSnapshot: { timeOfDay: 'night', weather: 'rain' },
  });
  assert.equal(legacy.phase, 'threatened');
  assert.equal(legacy.destinationId, DESTINATION_ID);
  assert.deepEqual(legacy.environment, { dayNight: 'night', weather: 'rain' });
  assert.equal(deserializePressureState(null).phase, 'dormant');
  assert.equal(deserializePressureState({ phase: 'unknown' }).phase, 'dormant');
}

{
  const dormant = createPressureState();
  const threatened = triggerPressure(dormant, { dayNight: 'night', weather: 'rain' });
  assert.equal(threatened.phase, 'threatened');
  assert.deepEqual(threatened.environment, { dayNight: 'night', weather: 'rain' });
  assert.equal(dormant.phase, 'dormant', 'trigger does not mutate its input');

  const repeated = triggerPressure(threatened, { dayNight: 'day', weather: 'clear' });
  assert.deepEqual(repeated, threatened, 'trigger is idempotent and keeps the first snapshot');
}

{
  const threatened = triggerPressure(createPressureState(), { timeOfDay: 'day', weather: 'fog' });
  const before = structuredClone(threatened);
  assert.throws(
    () => securePressure(threatened, { torch: 1 }),
    /ration/i,
    'missing preparation supply is rejected'
  );
  assert.deepEqual(threatened, before, 'failed secure does not mutate the input');
}

{
  const threatened = triggerPressure(createPressureState(), { dayNight: 'night', weather: 'storm' });
  const result = securePressure(threatened, ['torch', 'ration']);
  assert.equal(result.state.phase, 'secured');
  assert.deepEqual(result.consumed, ['torch', 'ration']);
  assert.deepEqual(result.state.consumed, ['torch', 'ration']);
  assert.deepEqual(threatened.consumed, [], 'secure returns a clone');

  const repeated = securePressure(result.state, { torch: 99, ration: 99 });
  assert.deepEqual(repeated.consumed, [], 'repeated secure consumes nothing');
  assert.deepEqual(repeated.state, result.state, 'repeated secure is idempotent');
}

{
  const threatened = triggerPressure(createPressureState(), { dayNight: 'night', weather: 'clear' });
  const fromSlots = securePressure(threatened, {
    inventory: [
      { id: 'torch', quantity: 1 },
      { id: 'ration', quantity: 1 },
    ],
  });
  assert.deepEqual(fromSlots.consumed, ['torch', 'ration'], 'slot inventories satisfy stable ids');
}

{
  const dormant = createPressureState();
  assert.throws(() => securePressure(dormant, ['torch', 'ration']), /phase|threat/i);
  const summary = getPressureHudSummary(dormant);
  assert.match(summary, /Night Stalkers/);
  assert.match(summary, /Dormant/);
  assert.match(summary, /Iron Ravine/);
  assert.match(summary, /torch/i);
  assert.match(summary, /ration/i);
  assert.match(getPressureHudSummary(null), /Dormant/);
  assert.match(getPressureHudSummary(triggerPressure(dormant, { dayNight: 'night', weather: 'rain' })), /Threatened/);
  assert.match(getPressureHudSummary(securePressure(triggerPressure(dormant, {}), ['torch', 'ration']).state), /Secured/);
}

console.log('PASS expedition pressure contract');
