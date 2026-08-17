import assert from 'node:assert/strict';
import {
  WORKBENCH,
  FURNACE,
  ITEM_IDS,
  WORKSHOP_RECIPES,
  MAX_STACK,
  createWorkshopState,
  placeStation,
  getStation,
  insertInput,
  removeInput,
  insertFuel,
  removeFuel,
  tickStation,
  takeOutput,
  serializeWorkshopState,
  deserializeWorkshopState,
  cloneWorkshopState,
  getStationSummary,
} from '../js/workshop-stations.js';

const { IRON_ORE, IRON_INGOT, COAL } = ITEM_IDS;

function furnace(state = createWorkshopState(), position = { x: 2, y: 3, z: -4 }) {
  const placed = placeStation(state, FURNACE, position);
  assert.notStrictEqual(placed, state);
  return [placed, placed.stations[0].id];
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test('exports stable station and iron recipe data', () => {
  assert.equal(WORKBENCH, 'workbench');
  assert.equal(FURNACE, 'furnace');
  assert.deepEqual(WORKSHOP_RECIPES.iron_ingot, {
    id: 'iron_ingot',
    station: FURNACE,
    inputId: IRON_ORE,
    outputId: IRON_INGOT,
    outputCount: 1,
    fuelCost: 20,
    duration: 20,
  });
});

test('fresh state is deterministic and has no shared station data', () => {
  assert.deepEqual(createWorkshopState(), createWorkshopState());
  const [state] = furnace();
  const again = cloneWorkshopState(state);
  assert.deepEqual(again, state);
  assert.notStrictEqual(again.stations, state.stations);
  assert.notStrictEqual(again.stations[0], state.stations[0]);
});

test('placement accepts integer finite positions and rejects invalid input atomically', () => {
  const initial = createWorkshopState();
  const workbench = placeStation(initial, WORKBENCH, { x: 0, y: 1, z: -2 });
  assert.equal(workbench.stations.length, 1);
  assert.deepEqual(workbench.stations[0].position, { x: 0, y: 1, z: -2 });
  assert.equal(workbench.stations[0].type, WORKBENCH);
  assert.strictEqual(placeStation(initial, 'smoker', { x: 0, y: 0, z: 0 }), initial);
  assert.strictEqual(placeStation(initial, FURNACE, { x: 1.5, y: 0, z: 0 }), initial);
  assert.strictEqual(placeStation(initial, FURNACE, { x: 1, y: Infinity, z: 0 }), initial);
  assert.strictEqual(placeStation(initial, FURNACE, { x: 1, y: 0 }), initial);
});

test('input stack insertion and removal are atomic and capacity bounded', () => {
  let [state, id] = furnace();
  state = insertInput(state, id, IRON_ORE, MAX_STACK);
  assert.equal(getStation(state, id).input.count, MAX_STACK);
  assert.strictEqual(insertInput(state, id, IRON_ORE, 1), state);
  assert.strictEqual(insertInput(state, id, 9999, 1), state);
  assert.strictEqual(insertInput(state, id, IRON_ORE, 0), state);
  const removed = removeInput(state, id, 4);
  assert.equal(getStation(removed, id).input.count, MAX_STACK - 4);
  assert.strictEqual(removeInput(removed, id, MAX_STACK), removed);
});

test('fuel insertion rejects incompatible and over-capacity stacks atomically', () => {
  let [state, id] = furnace();
  state = insertFuel(state, id, COAL, MAX_STACK);
  const full = getStation(state, id);
  assert.equal(full.fuel.itemId, COAL);
  assert.equal(full.fuel.count, MAX_STACK);
  assert.ok(full.furnace.fuelUnits > 0);
  assert.strictEqual(insertFuel(state, id, 1004, 1), state);
  assert.strictEqual(insertFuel(state, id, COAL, 1), state);
  const removed = removeFuel(state, id, 2);
  assert.equal(getStation(removed, id).fuel.count, MAX_STACK - 2);
});

test('furnace only consumes fuel while a valid recipe can process', () => {
  let [state, id] = furnace();
  state = insertFuel(state, id, COAL, 1);
  const before = getStation(state, id).furnace.fuelUnits;
  state = tickStation(state, id, 10);
  assert.equal(getStation(state, id).furnace.fuelUnits, before);
  state = insertInput(state, id, IRON_ORE, 1);
  state = tickStation(state, id, 10);
  const working = getStation(state, id);
  assert.equal(working.input.count, 1);
  assert.equal(working.progress, 10);
  assert.equal(working.furnace.fuelUnits, before - 10);
});

test('progress completes exactly once and repeated idle ticks do not duplicate output', () => {
  let [state, id] = furnace();
  state = insertFuel(state, id, COAL, 1);
  state = insertInput(state, id, IRON_ORE, 1);
  state = tickStation(state, id, 19);
  assert.equal(getStation(state, id).output.count, 0);
  state = tickStation(state, id, 1);
  assert.deepEqual(getStation(state, id).output, { itemId: IRON_INGOT, count: 1 });
  const idle = tickStation(state, id, 100);
  assert.deepEqual(getStation(idle, id).output, { itemId: IRON_INGOT, count: 1 });
  const taken = takeOutput(idle, id);
  assert.deepEqual(taken.output, { id: IRON_INGOT, count: 1 });
  assert.deepEqual(getStation(taken.state, id).output, { itemId: null, count: 0 });
  assert.deepEqual(takeOutput(taken.state, id).output, null);
});

test('large dt processes only queued input and available furnace capacity', () => {
  let [state, id] = furnace();
  state = insertFuel(state, id, COAL, 2);
  state = insertInput(state, id, IRON_ORE, 5);
  state = tickStation(state, id, 1000);
  const station = getStation(state, id);
  assert.equal(station.input.count, 0);
  assert.deepEqual(station.output, { itemId: IRON_INGOT, count: 5 });
  assert.equal(station.activeRecipe, null);
  assert.equal(station.progress, 0);
  const again = tickStation(state, id, 1000);
  assert.deepEqual(getStation(again, id).output, station.output);
});

test('legacy and partial saves deserialize with safe defaults', () => {
  const loaded = deserializeWorkshopState({
    stations: [{
      id: 'legacy-furnace',
      type: FURNACE,
      position: { x: 7 },
      furnace: { inputId: IRON_ORE, inputCount: 2, fuelId: COAL, fuelUnits: 20 },
    }],
  });
  const station = getStation(loaded, 'legacy-furnace');
  assert.deepEqual(station.position, { x: 7, y: 0, z: 0 });
  assert.deepEqual(station.input, { itemId: IRON_ORE, count: 2 });
  assert.deepEqual(station.output, { itemId: null, count: 0 });
  assert.equal(station.progress, 0);
  assert.equal(station.activeRecipe, null);
  assert.equal(deserializeWorkshopState(null).stations.length, 0);
  assert.deepEqual(deserializeWorkshopState(JSON.stringify(serializeWorkshopState(loaded))), loaded);
});

test('clone and serialization isolate nested mutable references', () => {
  let [state, id] = furnace();
  state = insertInput(state, id, IRON_ORE, 2);
  const clone = cloneWorkshopState(state);
  clone.stations[0].position.x = 99;
  clone.stations[0].furnace.inputCount = 99;
  assert.equal(getStation(state, id).position.x, 2);
  assert.equal(getStation(state, id).furnace.inputCount, 2);
  const saved = serializeWorkshopState(state);
  saved.stations[0].position.x = -99;
  assert.equal(getStation(state, id).position.x, 2);
});

test('station summaries are concise and useful for HUD text', () => {
  let [state, id] = furnace();
  state = insertFuel(state, id, COAL, 1);
  state = insertInput(state, id, IRON_ORE, 2);
  const summary = getStationSummary(state, id);
  assert.match(summary, /Furnace/);
  assert.match(summary, /Iron Ore 2/);
  assert.match(summary, /Fuel 1/);
  assert.match(summary, /Output 0/);
});

console.log('workshop station tests passed');
