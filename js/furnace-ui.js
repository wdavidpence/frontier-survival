/**
 * DOM presentation for furnace-family stations.
 * Gameplay owns the furnace state; this module only formats and renders it.
 */

export const FURNACE_UI_STATIONS = Object.freeze({
  furnace: 'Furnace',
  smoker: 'Smoker',
  blast_furnace: 'Blast Furnace',
});

export function createFurnaceUiState() {
  return { open: false, key: null, stationId: null };
}

export function furnaceUiSnapshot(furnace, stationId = 'furnace') {
  const state = furnace || {};
  const cookTime = Math.max(1, Number(state.cookTime) || 20);
  const progress = Math.max(0, Number(state.progress) || 0);
  return {
    stationId,
    stationName: FURNACE_UI_STATIONS[stationId] || 'Furnace',
    inputId: state.inputId ?? null,
    inputCount: Math.max(0, Number(state.inputCount) || 0),
    fuelId: state.fuelId ?? null,
    fuelUnits: Math.max(0, Number(state.fuelUnits) || 0),
    outputId: state.outputId ?? null,
    outputCount: Math.max(0, Number(state.outputCount) || 0),
    progress,
    cookTime,
    progressFraction: Math.max(0, Math.min(1, progress / cookTime)),
    active: progress > 0 && state.inputId != null && state.fuelUnits > 0,
  };
}

export function renderFurnaceUi(panel, furnace, stationId, nameOf = (id) => (id == null ? 'Empty' : String(id))) {
  if (!panel) return null;
  const view = furnaceUiSnapshot(furnace, stationId);
  const set = (name, value) => {
    const el = panel.querySelector(`[data-furnace-${name}], [data-furnace-slot="${name}"]`);
    if (el) el.textContent = value;
  };
  set('title', view.stationName);
  set('input', view.inputId == null ? 'Empty' : `${nameOf(view.inputId)} ×${view.inputCount}`);
  set('fuel', view.fuelId == null ? 'Empty' : `${nameOf(view.fuelId)} · ${Math.floor(view.fuelUnits)} fuel`);
  set('output', view.outputId == null ? 'Empty' : `${nameOf(view.outputId)} ×${view.outputCount}`);
  set('status', view.active ? 'Cooking…' : view.outputCount > 0 ? 'Output ready' : 'Waiting for input + fuel');
  set('percent', `${Math.round(view.progressFraction * 100)}%`);
  const bar = panel.querySelector('[data-furnace-progress]');
  if (bar) bar.style.width = `${Math.round(view.progressFraction * 100)}%`;
  panel.dataset.stationId = view.stationId;
  panel.dataset.active = view.active ? 'true' : 'false';
  return view;
}

export function bindFurnaceUi(panel, handlers = {}) {
  if (!panel || panel.dataset.bound === 'true') return;
  panel.dataset.bound = 'true';
  const on = (selector, handler) => {
    const el = panel.querySelector(selector);
    if (el && typeof handler === 'function') el.addEventListener('click', handler);
  };
  on('[data-furnace-action="input"]', () => handlers.onInput?.());
  on('[data-furnace-action="fuel"]', () => handlers.onFuel?.());
  on('[data-furnace-action="output"]', () => handlers.onOutput?.());
  on('[data-furnace-action="close"]', () => handlers.onClose?.());
}
