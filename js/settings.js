/**
 * Client settings persistence (mode, sensitivity) — pure + storage adapters.
 */

export const SETTINGS_KEY = 'frontier_survival_settings_v1';

export const DEFAULT_SETTINGS = {
  mode: 'survival',
  sensitivity: 0.0022,
  helpVisible: true,
  renderDistance: 5,
};

/**
 * @param {unknown} raw
 * @returns {{ ok: true, data: typeof DEFAULT_SETTINGS } | { ok: false, error: string }}
 */
export function parseSettings(raw) {
  if (raw == null) return { ok: false, error: 'empty' };
  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return { ok: false, error: 'invalid json' };
    }
  }
  if (!data || typeof data !== 'object') return { ok: false, error: 'not object' };
  const mode = typeof data.mode === 'string' ? data.mode : DEFAULT_SETTINGS.mode;
  let sensitivity = Number(data.sensitivity);
  if (!Number.isFinite(sensitivity)) sensitivity = DEFAULT_SETTINGS.sensitivity;
  sensitivity = Math.max(0.0006, Math.min(0.008, sensitivity));
  const helpVisible = data.helpVisible !== false;
  let renderDistance = Number(data.renderDistance);
  if (!Number.isFinite(renderDistance)) renderDistance = DEFAULT_SETTINGS.renderDistance;
  renderDistance = Math.max(2, Math.min(10, Math.round(renderDistance)));
  return {
    ok: true,
    data: {
      mode,
      sensitivity,
      helpVisible,
      renderDistance,
    },
  };
}

export function serializeSettings(settings) {
  return JSON.stringify({
    mode: settings.mode || DEFAULT_SETTINGS.mode,
    sensitivity: settings.sensitivity ?? DEFAULT_SETTINGS.sensitivity,
    helpVisible: settings.helpVisible !== false,
    renderDistance: settings.renderDistance ?? DEFAULT_SETTINGS.renderDistance,
  });
}

export function readSettings(storage = globalThis.localStorage, key = SETTINGS_KEY) {
  if (!storage) return { ok: true, data: { ...DEFAULT_SETTINGS } };
  try {
    const raw = storage.getItem(key);
    if (!raw) return { ok: true, data: { ...DEFAULT_SETTINGS } };
    const parsed = parseSettings(raw);
    if (!parsed.ok) return { ok: true, data: { ...DEFAULT_SETTINGS } };
    return parsed;
  } catch {
    return { ok: true, data: { ...DEFAULT_SETTINGS } };
  }
}

export function writeSettings(settings, storage = globalThis.localStorage, key = SETTINGS_KEY) {
  if (!storage) return { ok: false, error: 'no storage' };
  try {
    storage.setItem(key, serializeSettings(settings));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/** Map slider 1–10 to sensitivity */
export function sensitivityFromSlider(n) {
  const t = Math.max(1, Math.min(10, Number(n) || 5));
  // 1 → 0.0008, 5 → 0.0022, 10 → 0.0055
  return 0.0008 + ((t - 1) / 9) * (0.0055 - 0.0008);
}

export function sliderFromSensitivity(s) {
  const v = Number(s);
  if (!Number.isFinite(v)) return 5;
  const t = ((v - 0.0008) / (0.0055 - 0.0008)) * 9 + 1;
  return Math.max(1, Math.min(10, Math.round(t)));
}
