/**
 * Persistent workshop station registry for the v1.12.74 gameplay slice.
 *
 * This module is deliberately free of browser/game imports.  It adapts the
 * existing pure furnace-tick state machine, while keeping station placement,
 * persistence, and slot boundaries in one serializable state object.
 */
import {
  createFurnaceState,
  insertFuel as furnaceInsertFuel,
  insertInput as furnaceInsertInput,
  tickFurnace,
  takeOutput as furnaceTakeOutput,
} from './furnace-tick.js?v=232';
import { fuelValue, smeltRecipe } from './smelting.js?v=220';

export const WORKBENCH = 'workbench';
export const FURNACE = 'furnace';
export const STATION_TYPES = Object.freeze([WORKBENCH, FURNACE]);

/** Numeric IDs are kept here so this contract can be saved without imports. */
export const ITEM_IDS = Object.freeze({
  IRON_ORE: 18,
  IRON_INGOT: 119,
  COAL: 105,
});

export const MAX_STACK = 64;
const DEFAULT_COOK_TIME = 20;
const RECIPE_ID = 'iron_ingot';
const IRON_RECIPE = smeltRecipe(ITEM_IDS.IRON_ORE) || {
  output: ITEM_IDS.IRON_INGOT,
  count: 1,
  fuelCost: DEFAULT_COOK_TIME,
};

/** Data-only recipe description; semantics come from smelting.js. */
export const WORKSHOP_RECIPES = Object.freeze({
  [RECIPE_ID]: Object.freeze({
    id: RECIPE_ID,
    station: FURNACE,
    inputId: ITEM_IDS.IRON_ORE,
    outputId: IRON_RECIPE.output,
    outputCount: IRON_RECIPE.count,
    fuelCost: IRON_RECIPE.fuelCost || DEFAULT_COOK_TIME,
    duration: DEFAULT_COOK_TIME,
  }),
});
export const WORKSHOP_RECIPE = WORKSHOP_RECIPES[RECIPE_ID];
export const FURNACE_COOK_TIME = WORKSHOP_RECIPE.duration;

const ITEM_NAMES = Object.freeze({
  [ITEM_IDS.IRON_ORE]: 'Iron Ore',
  [ITEM_IDS.IRON_INGOT]: 'Iron Ingot',
  [ITEM_IDS.COAL]: 'Coal',
});

function integer(value, fallback = 0) {
  return Number.isInteger(value) ? value : fallback;
}

function positiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function validPosition(position) {
  return position && typeof position === 'object'
    && Number.isInteger(position.x)
    && Number.isInteger(position.y)
    && Number.isInteger(position.z)
    && Number.isFinite(position.x)
    && Number.isFinite(position.y)
    && Number.isFinite(position.z);
}

function copyPosition(position) {
  return { x: position.x, y: position.y, z: position.z };
}

function emptySlot() {
  return { itemId: null, count: 0 };
}

function safeCount(value) {
  return Math.max(0, Math.min(MAX_STACK, integer(value)));
}

function safeItemId(value) {
  return Number.isInteger(value) ? value : null;
}

function copyFurnace(source) {
  const furnace = createFurnaceState();
  if (!source || typeof source !== 'object') return furnace;
  for (const key of ['fuelId', 'inputId', 'outputId']) {
    furnace[key] = safeItemId(source[key]);
  }
  furnace.fuelUnits = Math.max(0, Number(source.fuelUnits) || 0);
  furnace.inputCount = safeCount(source.inputCount);
  furnace.outputCount = safeCount(source.outputCount);
  furnace.progress = Math.max(0, Number(source.progress) || 0);
  furnace.cookTime = Math.max(0.01, Number(source.cookTime) || DEFAULT_COOK_TIME);
  if (source.speedMult != null) {
    furnace.speedMult = Math.max(0.01, Number(source.speedMult) || 1);
  }
  return furnace;
}

function slotFrom(source) {
  if (!source || typeof source !== 'object') return emptySlot();
  const itemId = safeItemId(source.itemId ?? source.id);
  const count = safeCount(source.count);
  return itemId == null || count <= 0 ? emptySlot() : { itemId, count };
}

function stationId(value) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function stationRecord(id, type, position) {
  return {
    id,
    type,
    position: copyPosition(position),
    input: emptySlot(),
    fuel: emptySlot(),
    output: emptySlot(),
    activeRecipe: null,
    progress: 0,
    furnace: type === FURNACE ? createFurnaceState() : null,
  };
}

function syncStation(station) {
  if (station.type !== FURNACE || !station.furnace) {
    station.input = emptySlot();
    station.fuel = emptySlot();
    station.output = emptySlot();
    station.activeRecipe = null;
    station.progress = 0;
    return station;
  }
  const furnace = station.furnace;
  station.input = furnace.inputId != null && furnace.inputCount > 0
    ? { itemId: furnace.inputId, count: safeCount(furnace.inputCount) }
    : emptySlot();
  station.output = furnace.outputId != null && furnace.outputCount > 0
    ? { itemId: furnace.outputId, count: safeCount(furnace.outputCount) }
    : emptySlot();
  const burn = fuelValue(furnace.fuelId);
  const existingFuelCount = safeCount(station.fuel?.count);
  const inferredFuelCount = burn > 0 && furnace.fuelUnits > 0
    ? Math.max(1, Math.ceil(furnace.fuelUnits / burn))
    : 0;
  const fuelCount = Math.max(existingFuelCount, inferredFuelCount);
  station.fuel = furnace.fuelId != null && furnace.fuelUnits > 0 && fuelCount > 0
    ? { itemId: furnace.fuelId, count: Math.min(MAX_STACK, fuelCount) }
    : emptySlot();
  station.progress = Math.max(0, Number(furnace.progress) || 0);
  station.activeRecipe = station.input.itemId === ITEM_IDS.IRON_ORE && station.progress > 0
    ? RECIPE_ID
    : null;
  return station;
}

function normalizeStation(raw, fallbackId) {
  if (!raw || typeof raw !== 'object') return null;
  const type = STATION_TYPES.includes(raw.type) ? raw.type : null;
  if (!type) return null;
  const id = stationId(raw.id) || fallbackId;
  if (!id) return null;
  const rawPosition = raw.position && typeof raw.position === 'object' ? raw.position : {};
  const position = {
    x: integer(rawPosition.x),
    y: integer(rawPosition.y),
    z: integer(rawPosition.z),
  };
  const station = stationRecord(id, type, position);
  if (type !== FURNACE) return station;

  const furnace = copyFurnace(raw.furnace);
  const input = slotFrom(raw.input);
  const fuel = slotFrom(raw.fuel);
  const output = slotFrom(raw.output);
  if (furnace.inputId == null && input.itemId != null) furnace.inputId = input.itemId;
  if (furnace.inputCount <= 0 && input.count > 0) furnace.inputCount = input.count;
  if (furnace.outputId == null && output.itemId != null) furnace.outputId = output.itemId;
  if (furnace.outputCount <= 0 && output.count > 0) furnace.outputCount = output.count;
  if (furnace.fuelId == null && fuel.itemId != null) furnace.fuelId = fuel.itemId;
  if (furnace.fuelUnits <= 0 && fuel.itemId != null && fuel.count > 0) {
    furnace.fuelUnits = fuelValue(fuel.itemId) * fuel.count;
  }
  station.furnace = furnace;
  station.fuel = fuel;
  syncStation(station);
  return station;
}

function nextIdFor(state) {
  const requested = integer(state?.nextStationId, 1);
  return Math.max(1, requested);
}

function normalizeState(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const stations = [];
  const used = new Set();
  const rawStations = Array.isArray(source.stations) ? source.stations : [];
  let generated = 1;
  for (const rawStation of rawStations) {
    let fallback = `station-${generated}`;
    while (used.has(fallback)) fallback = `station-${++generated}`;
    const station = normalizeStation(rawStation, fallback);
    if (!station || used.has(station.id)) continue;
    used.add(station.id);
    stations.push(station);
    const match = /^station-(\d+)$/.exec(station.id);
    if (match) generated = Math.max(generated, Number(match[1]) + 1);
  }
  const state = {
    version: 1,
    nextStationId: Math.max(nextIdFor(source), generated),
    stations,
  };
  return state;
}

function cloneRaw(value) {
  if (Array.isArray(value)) return value.map(cloneRaw);
  if (!value || typeof value !== 'object') return value;
  const result = {};
  for (const [key, child] of Object.entries(value)) result[key] = cloneRaw(child);
  return result;
}

function withStation(state, id, operation) {
  const current = normalizeState(state);
  const index = current.stations.findIndex((station) => station.id === id);
  if (index < 0) return state;
  const next = cloneRaw(current);
  const changed = operation(next.stations[index]);
  return changed === false ? state : next;
}

function validFurnaceStation(state, id) {
  const station = Array.isArray(state?.stations)
    ? state.stations.find((entry) => entry?.id === id)
    : null;
  return station?.type === FURNACE && station.furnace ? station : null;
}

export function createWorkshopState() {
  return { version: 1, nextStationId: 1, stations: [] };
}

/** Place a station; invalid calls return the exact prior state unchanged. */
export function placeStation(state, type, position, requestedId = null) {
  if (!STATION_TYPES.includes(type) || !validPosition(position)) return state;
  const current = normalizeState(state);
  const id = requestedId == null ? `station-${current.nextStationId}` : stationId(requestedId);
  if (!id || current.stations.some((station) => station.id === id)) return state;
  const next = cloneRaw(current);
  next.stations.push(stationRecord(id, type, position));
  next.nextStationId = requestedId == null ? current.nextStationId + 1 : current.nextStationId;
  return next;
}

/** Return an isolated station snapshot suitable for UI/read-only callers. */
export function getStation(state, id) {
  const station = Array.isArray(state?.stations)
    ? state.stations.find((entry) => entry?.id === id)
    : null;
  return station ? cloneRaw(station) : null;
}

export function insertInput(state, id, itemId, count = 1) {
  if (!positiveInteger(count) || itemId !== ITEM_IDS.IRON_ORE) return state;
  const station = validFurnaceStation(state, id);
  if (!station) return state;
  const slot = station.input;
  if (slot.itemId != null && slot.itemId !== itemId) return state;
  if (slot.count + count > MAX_STACK) return state;
  return withStation(state, id, (target) => {
    if (furnaceInsertInput(target.furnace, itemId, count) !== 0) return false;
    syncStation(target);
    return true;
  });
}

export function removeInput(state, id, count = 1) {
  if (!positiveInteger(count)) return state;
  const station = validFurnaceStation(state, id);
  if (!station || station.activeRecipe || count > station.input.count) return state;
  return withStation(state, id, (target) => {
    target.furnace.inputCount -= count;
    if (target.furnace.inputCount <= 0) {
      target.furnace.inputCount = 0;
      target.furnace.inputId = null;
      target.furnace.progress = 0;
    }
    syncStation(target);
    return true;
  });
}

export function insertFuel(state, id, itemId, count = 1) {
  if (!positiveInteger(count) || fuelValue(itemId) <= 0) return state;
  const station = validFurnaceStation(state, id);
  if (!station) return state;
  const slot = station.fuel;
  if (slot.itemId != null && slot.itemId !== itemId) return state;
  if (slot.count + count > MAX_STACK) return state;
  return withStation(state, id, (target) => {
    if (furnaceInsertFuel(target.furnace, itemId, count) !== 0) return false;
    target.fuel = { itemId, count: slot.count + count };
    syncStation(target);
    return true;
  });
}

export function removeFuel(state, id, count = 1) {
  if (!positiveInteger(count)) return state;
  const station = validFurnaceStation(state, id);
  if (!station || count > station.fuel.count) return state;
  return withStation(state, id, (target) => {
    const burn = fuelValue(target.furnace.fuelId);
    target.furnace.fuelUnits = Math.max(0, target.furnace.fuelUnits - burn * count);
    target.fuel = {
      itemId: target.furnace.fuelUnits > 0 ? target.furnace.fuelId : null,
      count: target.furnace.fuelUnits > 0 ? target.fuel.count - count : 0,
    };
    if (target.furnace.fuelUnits <= 0) target.furnace.fuelId = null;
    syncStation(target);
    return true;
  });
}

/** Advance one persistent furnace through the existing furnace-tick semantics. */
export function tickStation(state, id, dt = 0, speedMult = 1) {
  const amount = Number(dt);
  if (!Number.isFinite(amount) || amount <= 0) return state;
  const station = validFurnaceStation(state, id);
  if (!station) return state;
  if (station.output.count >= MAX_STACK) return state;
  return withStation(state, id, (target) => {
    const furnace = target.furnace;
    const beforeUnits = furnace.fuelUnits;
    const beforeFuelId = furnace.fuelId;
    const beforeFuelCount = target.fuel.count;
    const freeOutput = MAX_STACK - furnace.outputCount;
    const pending = Math.min(Math.max(0, furnace.inputCount), freeOutput);
    if (pending <= 0 || furnace.inputId !== ITEM_IDS.IRON_ORE || !smeltRecipe(furnace.inputId)) {
      tickFurnace(furnace, amount, speedMult);
      syncStation(target);
      return true;
    }
    // Cap the delegated tick before the output stack could overflow.
    const duration = furnace.cookTime || FURNACE_COOK_TIME;
    let maxUnits = 0;
    let progress = furnace.progress;
    for (let i = 0; i < pending; i += 1) {
      maxUnits += Math.max(0, duration - progress);
      progress = 0;
    }
    tickFurnace(furnace, Math.min(amount, maxUnits), speedMult);
    if (beforeFuelId != null && furnace.fuelId === beforeFuelId && beforeUnits > furnace.fuelUnits) {
      const burn = fuelValue(beforeFuelId);
      const remainingItems = burn > 0 ? Math.ceil(furnace.fuelUnits / burn) : 0;
      target.fuel = {
        itemId: remainingItems > 0 ? beforeFuelId : null,
        count: Math.min(beforeFuelCount, remainingItems),
      };
    } else if (furnace.fuelId == null || furnace.fuelUnits <= 0) {
      target.fuel = emptySlot();
    }
    syncStation(target);
    return true;
  });
}

/** Take output functionally; the original state is never mutated. */
export function takeOutput(state, id) {
  const station = validFurnaceStation(state, id);
  if (!station || station.output.count <= 0) return { state, output: null };
  const next = cloneWorkshopState(state);
  const target = next.stations.find((entry) => entry.id === id);
  const output = furnaceTakeOutput(target.furnace);
  syncStation(target);
  return { state: next, output };
}

export function serializeWorkshopState(state) {
  return cloneRaw(normalizeState(state));
}

export function deserializeWorkshopState(serialized) {
  let raw = serialized;
  if (typeof serialized === 'string') {
    try {
      raw = JSON.parse(serialized);
    } catch {
      raw = null;
    }
  }
  return normalizeState(raw);
}

export function cloneWorkshopState(state) {
  return deserializeWorkshopState(serializeWorkshopState(state));
}

export function getStationSummary(state, id) {
  const station = getStation(state, id);
  if (!station) return 'Unknown station';
  const label = station.type === FURNACE ? 'Furnace' : 'Workbench';
  const inputName = station.input.itemId == null ? 'Input 0' : `${ITEM_NAMES[station.input.itemId] || `Item ${station.input.itemId}`} ${station.input.count}`;
  const fuelName = station.fuel.itemId == null ? 'Fuel 0' : `Fuel ${station.fuel.count}`;
  const outputName = station.output.itemId == null ? 'Output 0' : `Output ${station.output.count}`;
  const progress = station.activeRecipe ? ` ${Math.round((station.progress / FURNACE_COOK_TIME) * 100)}%` : '';
  return `${label} ${station.id}: ${inputName} | ${fuelName} | ${outputName}${progress}`;
}

// Explicit aliases make the adapter easy to discover from future game code.
export const insertStationInput = insertInput;
export const removeStationInput = removeInput;
export const insertStationFuel = insertFuel;
export const removeStationFuel = removeFuel;
export const tickFurnaceStation = tickStation;
export const takeStationOutput = takeOutput;
export const saveWorkshopState = serializeWorkshopState;
export const loadWorkshopState = deserializeWorkshopState;
