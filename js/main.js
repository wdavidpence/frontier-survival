import { Game } from './game.js?v=253';
import { hasSave, clearSaveStorage } from './save.js?v=240';
import { MODES, MODE_ORDER, getMode, difficulty_presets_explain } from './modes.js?v=240';
import {
  writeSettings,
  sensitivityFromSlider,
  sliderFromSensitivity,
  getPlayMode,
  PLAY_MODE_ORDER,
  PLAY_MODE_META,
} from './settings.js?v=240';

const canvas = document.getElementById('game');
const title = document.getElementById('title-screen');
const death = document.getElementById('death-screen');
const btnStart = document.getElementById('btn-start');
const btnContinue = document.getElementById('btn-continue');
const btnNew = document.getElementById('btn-new-world');
const btnRespawn = document.getElementById('btn-respawn');

function refreshContinue() {
  const exists = hasSave();
  if (btnContinue) {
    btnContinue.style.display = exists ? '' : 'none';
    btnContinue.disabled = !exists;
  }
  if (btnNew) {
    btnNew.style.display = exists ? '' : 'none';
  }
  if (btnStart) {
    if (!exists) {
      btnStart.style.display = '';
      btnStart.textContent = 'Start surviving';
    } else {
      btnStart.style.display = 'none';
    }
  }
}

function causeFlavor(cause) {
  const map = {
    hypothermia: 'The cold took you.',
    starvation: 'Hunger hollowed you out.',
    exhaustion: 'You collapsed from fatigue.',
    wolf: "A wolf's jaws closed.",
    bear: 'A bear crushed you.',
    fall: 'The ground was unforgiving.',
    drowning: 'The water kept you.',
    food_poisoning: 'Bad meat finished you.',
    heatstroke: 'The heat cooked you from within.',
    bleeding: 'You bled out.',
  };
  return map[cause] || 'Nature does not negotiate.';
}

const hud = {
  hideTitle() {
    title?.classList.add('hidden');
  },
  showDeath(cause, meta = {}) {
    if (!death) return;
    death.classList.remove('hidden');
    const el = document.getElementById('death-cause');
    if (el) {
      el.textContent = cause ? `${causeFlavor(cause)} (${cause})` : 'You died.';
    }
    const stats = document.getElementById('death-stats');
    if (stats) {
      const day = meta.day ?? '?';
      const kills = meta.kills ?? 0;
      const wolves = meta.wolfKills ?? 0;
      stats.textContent =
        `Survived to day ${day} · Wildlife taken ${kills}` +
        (wolves ? ` (wolves ${wolves})` : '');
    }
    const extra = document.getElementById('death-extra');
    const respawnBtn = document.getElementById('btn-respawn');
    if (meta.permadeath) {
      if (extra) {
        extra.textContent =
          'Cruel mode: your save is wiped. Respawn starts a new frontier.';
      }
      if (respawnBtn) respawnBtn.textContent = 'New world';
    } else if (meta.dropped) {
      if (extra) {
        extra.textContent =
          'Challenging: your pack was lost. Shelter and fire still matter.';
      }
      if (respawnBtn) respawnBtn.textContent = 'Respawn';
    } else {
      if (extra) {
        extra.textContent =
          'Build shelter. Light a fire. Cook meat before it spoils. Eat before you explore.';
      }
      if (respawnBtn) respawnBtn.textContent = 'Respawn';
    }
  },
  hideDeath() {
    death?.classList.add('hidden');
  },
  refreshContinue,
};

const game = new Game(canvas, hud);

function paintModeRow() {
  const row = document.getElementById('mode-row');
  const blurb = document.getElementById('mode-blurb');
  if (!row) return;
  row.innerHTML = '';
  const current = getMode(game.mode).id;
  for (const id of MODE_ORDER) {
    const m = MODES[id];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mode-btn' + (id === current ? ' active' : '');
    btn.textContent = m.name;
    btn.dataset.mode = id;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      game.setMode(id);
      paintModeRow();
    });
    row.appendChild(btn);
  }
  if (blurb) {
    const exp = difficulty_presets_explain(current);
    blurb.innerHTML = `<strong>${exp.title}</strong><br/>${exp.body}`;
  }
}

const PLAY_MODE_SESSION_KEY = 'fs_play_mode_session';

function readSessionPlayMode() {
  try {
    return getPlayMode(sessionStorage.getItem(PLAY_MODE_SESSION_KEY));
  } catch {
    return getPlayMode(game.settings.playMode);
  }
}

function writeSessionPlayMode(id) {
  const pm = getPlayMode(id);
  try {
    sessionStorage.setItem(PLAY_MODE_SESSION_KEY, pm);
  } catch (_) {}
  return pm;
}

function setPlayMode(id) {
  const pm = writeSessionPlayMode(id);
  game.settings.playMode = pm;
  game.coopMode = pm === 'coop';
  writeSettings(game.settings);
  paintPlayModeRow();
}

function paintPlayModeRow() {
  const row = document.getElementById('play-mode-row');
  const blurb = document.getElementById('play-mode-blurb');
  if (!row) return;
  row.innerHTML = '';
  const current = getPlayMode(game.settings.playMode);
  for (const id of PLAY_MODE_ORDER) {
    const m = PLAY_MODE_META[id];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mode-btn' + (id === current ? ' active' : '');
    btn.textContent = m.name;
    btn.dataset.playMode = id;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setPlayMode(id);
    });
    row.appendChild(btn);
  }
  if (blurb) blurb.textContent = PLAY_MODE_META[current].blurb;
}

// Restore session play mode over persisted settings when present
{
  const sessionPm = readSessionPlayMode();
  if (sessionPm) {
    game.settings.playMode = sessionPm;
    game.coopMode = sessionPm === 'coop';
  }
}

function readSeedInput() {
  const el = document.getElementById('seed-input');
  if (!el) return null;
  const raw = String(el.value || '').trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return Number(raw) >>> 0;
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}


function engageControls() {
  try {
    game.input?.clearTransient?.();
    game.input.uiMode = false;
    game.paused = false;
    game._ignorePauseT = 2.5;
    game.input?.setCaptureEnabled?.(true);
    game.canvas?.focus?.();
    game.input?.requestLock?.();
    game._updateClickToPlay?.();
    // Drop Esc from confirm()/alert after the call stack clears
    const reengage = () => {
      try {
        game.input?.clearTransient?.({ keepMove: true });
        game.input.pausePressed = false;
        game.input.uiMode = false;
        game.paused = false;
        const pause = document.getElementById('pause-screen');
        pause?.classList.add('hidden');
        game.input?.setCaptureEnabled?.(true);
        game._ignorePauseT = Math.max(game._ignorePauseT || 0, 1.5);
        game.canvas?.focus?.();
        game.input?.requestLock?.();
        game._updateClickToPlay?.();
      } catch (_) {}
    };
    setTimeout(reengage, 0);
    setTimeout(reengage, 50);
    setTimeout(reengage, 200);
  } catch (_) {}
}

// Click-to-play banner
document.getElementById('click-to-play')?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  engageControls();
});

function startNewWorld() {
  const seed = readSeedInput();
  clearSaveStorage();
  game.mode = getMode(game.settings.mode).id;
  game.settings.playMode = getPlayMode(game.settings.playMode);
  game.coopMode = game.settings.playMode === 'coop';
  writeSettings(game.settings);
  game.seed = seed != null ? seed : ((Math.random() * 1e6) | 0);
  game.start(game.seed);
  engageControls();
  refreshContinue();
}

const titleSens = document.getElementById('title-sens-slider');
const titleSensLab = document.getElementById('title-sens-label');
if (titleSens) {
  titleSens.value = String(sliderFromSensitivity(game.input.sensitivity));
  if (titleSensLab) titleSensLab.textContent = titleSens.value;
  titleSens.addEventListener('input', () => {
    const v = sensitivityFromSlider(titleSens.value);
    game.input.sensitivity = v;
    game.settings.sensitivity = v;
    writeSettings(game.settings);
    if (titleSensLab) titleSensLab.textContent = titleSens.value;
  });
}

const titleRd = document.getElementById('title-rd-slider');
const titleRdLab = document.getElementById('title-rd-label');
if (titleRd) {
  titleRd.value = String(game.settings.renderDistance ?? 8);
  if (titleRdLab) titleRdLab.textContent = titleRd.value;
  titleRd.addEventListener('input', () => {
    const v = Number(titleRd.value);
    game.settings.renderDistance = v;
    writeSettings(game.settings);
    if (titleRdLab) titleRdLab.textContent = titleRd.value;
    game._applyRenderDistance?.();
  });
}

btnStart?.addEventListener('click', (e) => {
  e.stopPropagation();
  startNewWorld();
});

btnContinue?.addEventListener('click', (e) => {
  e.stopPropagation();
  const res = game.loadGame();
  if (!res.ok) {
    alert(`Could not load save: ${res.error || 'unknown'}`);
    refreshContinue();
  } else {
    engageControls();
  }
});

btnNew?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (hasSave() && !confirm('Start a new world? This clears your saved game.')) return;
  startNewWorld();
});

btnRespawn?.addEventListener('click', (e) => {
  e.stopPropagation();
  game.respawn();
  if (!getMode(game.mode).permadeath) {
    game.saveGame({ quiet: true });
  }
});

paintModeRow();
paintPlayModeRow();
refreshContinue();

// On-screen controls (always available after start — proves input path works)
function wireTouchControls() {
  const pad = document.getElementById('touch-pad');
  const look = document.getElementById('touch-look');
  if (!pad || !look) return;
  const setDir = () => {
    let x = 0, z = 0;
    pad.querySelectorAll('button.held[data-dir]').forEach((b) => {
      const d = b.getAttribute('data-dir');
      if (d === 'f') z -= 1;
      if (d === 'b') z += 1;
      if (d === 'l') x -= 1;
      if (d === 'r') x += 1;
    });
    game.input?.setVirtualMove?.(x, z);
  };
  pad.querySelectorAll('button').forEach((btn) => {
    const down = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('held');
      if (btn.dataset.act === 'jump') game.input?.setVirtualJump?.(true);
      if (btn.dataset.act === 'crouch') game.input?.setVirtualCrouch?.(true);
      setDir();
      game.input?.setCaptureEnabled?.(true);
    };
    const up = (e) => {
      e.preventDefault();
      btn.classList.remove('held');
      if (btn.dataset.act === 'jump') game.input?.setVirtualJump?.(false);
      if (btn.dataset.act === 'crouch') game.input?.setVirtualCrouch?.(false);
      setDir();
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
  });
  let lx = null, ly = null;
  const lookDown = (e) => {
    e.preventDefault();
    lx = e.clientX; ly = e.clientY;
    look.setPointerCapture?.(e.pointerId);
    game.input?.setCaptureEnabled?.(true);
    if (game.input) game.input.softLook = true;
  };
  const lookMove = (e) => {
    if (lx == null) return;
    e.preventDefault();
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    game.input?.nudgeLook?.(dx, dy);
  };
  const lookUp = () => { lx = ly = null; };
  look.addEventListener('pointerdown', lookDown);
  look.addEventListener('pointermove', lookMove);
  look.addEventListener('pointerup', lookUp);
  look.addEventListener('pointercancel', lookUp);
}

function showPlayChrome(on) {
  document.getElementById('touch-pad')?.classList.toggle('hidden', !on);
  document.getElementById('touch-look')?.classList.toggle('hidden', !on);
  document.getElementById('ctrl-debug')?.classList.toggle('hidden', !on);
}

wireTouchControls();
// ── Gamepad title-screen navigation ────────────────────────────
/**
 * Navigate title Continue/New/Co-op with D-pad + Cross confirm, Circle back.
 * No mouse required on PS5 browser (or any gamepad-connected environment).
 */
const titleGamepad = {
  /** Index into the visible nav-order list. */
  focus: -1,
  /** Debounce timer for D-pad repeats. */
  _debounce: 0,
  /** Previously-seen button states (edge detection). */
  _prev: {},

  /** Order of navigable elements on the title screen. */
  get navOrder() {
    return [btnContinue, btnStart, btnNew]
      .filter((el) => el && getComputedStyle(el).display !== 'none')
      .concat(
        // Play mode buttons (visible in the row)
        [...document.querySelectorAll('#play-mode-row .mode-btn')],
        // Difficulty mode buttons
        [...document.querySelectorAll('#mode-row .mode-btn')]
      );
  },

  /** Check if a gamepad is connected. */
  hasGamepad() {
    try {
      const pads = navigator.getGamepads?.() || [];
      return pads.some((p) => p != null);
    } catch {
      return false;
    }
  },

  /** Set the focused element by index in navOrder. */
  setFocus(idx) {
    const items = this.navOrder;
    // Remove old highlight.
    for (const el of items) {
      if (el) el.classList.remove('title-btn-gp');
    }
    this.focus = Math.max(0, Math.min(idx, items.length - 1));
    const target = items[this.focus];
    if (target) {
      target.classList.add('title-btn-gp');
      // Ensure the focused element is visible in scroll context.
      target.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }
  },

  /** Activate the currently focused element. */
  activate() {
    const items = this.navOrder;
    const target = items[this.focus];
    if (!target) return false;
    // Trigger a click event so existing handlers fire.
    target.click();
    return true;
  },

  /** Back / cancel — re-focus the primary action button (Start/Continue). */
  back() {
    // Reset focus to the first primary button.
    const primary = [btnContinue, btnStart, btnNew].find(
      (el) => el && getComputedStyle(el).display !== 'none'
    );
    if (primary) {
      const idx = this.navOrder.indexOf(primary);
      this.setFocus(idx >= 0 ? idx : 0);
    }
  },

  /** Poll once per frame while on the title screen. */
  poll() {
    // Only active when title is visible and a gamepad exists.
    if (!title || !title.classList.contains('overlay') || title.classList.contains('hidden')) {
      // Title hidden — clear highlights.
      if (this.focus >= 0) {
        for (const el of this.navOrder) {
          if (el) el.classList.remove('title-btn-gp');
        }
        this.focus = -1;
      }
      return;
    }

    const pads = navigator.getGamepads?.() || [];
    let gp = null;
    for (const p of pads) {
      if (p) { gp = p; break; }
    }
    if (!gp) return;

    // Update gamepad-connected class on body.
    document.body.classList.add('gamepad-connected');

    // Edge-detect buttons.
    const btn = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const edge = (i) => {
      const cur = btn(i);
      const prev = this._prev[i] || false;
      this._prev[i] = cur;
      return cur && !prev;
    };

    // Debounce for D-pad repeat prevention (200ms).
    if (this._debounce > 0) {
      this._debounce--;
      return;
    }

    // D-pad up (12) / down (13).
    if (edge(12)) { // Up
      this.setFocus(this.focus - 1);
      this._debounce = 3;
    } else if (edge(13)) { // Down
      this.setFocus(this.focus + 1);
      this._debounce = 3;
    }

    // D-pad left (14) / right (15) — navigate within mode rows.
    if (edge(14)) { // Left in a row
      this._navigateRow(-1);
      this._debounce = 3;
    } else if (edge(15)) { // Right in a row
      this._navigateRow(1);
      this._debounce = 3;
    }

    // Cross / A (button 0) — confirm.
    if (edge(0)) {
      this.activate();
      this._debounce = 6;
    }

    // Circle / B (button 1) — back to primary button.
    if (edge(1)) {
      this.back();
      this._debounce = 6;
    }

    // Initialize focus on first poll if not set.
    if (this.focus < 0) {
      this.setFocus(0);
    }
  },

  /** Navigate left/right within the current row (play-mode or difficulty). */
  _navigateRow(dir) {
    const items = this.navOrder;
    const current = items[this.focus];
    if (!current) return;

    // Find which row the current element belongs to.
    const playModeRow = document.getElementById('play-mode-row');
    const modeRow = document.getElementById('mode-row');

    let rowEl = null;
    if (playModeRow && playModeRow.contains(current)) rowEl = playModeRow;
    else if (modeRow && modeRow.contains(current)) rowEl = modeRow;

    if (!rowEl) return; // Not in a row, skip.

    // Find siblings in the same row.
    const rowItems = [...rowEl.querySelectorAll('.mode-btn')];
    const currentRowIdx = rowItems.indexOf(current);
    if (currentRowIdx < 0) return;

    const newRowIdx = Math.max(0, Math.min(currentRowIdx + dir, rowItems.length - 1));
    const target = rowItems[newRowIdx];
    if (target) {
      // Update navOrder index.
      const globalIdx = items.indexOf(target);
      if (globalIdx >= 0) {
        this.setFocus(globalIdx);
      }
    }
  },

  /** Reset state (e.g., when buttons change visibility). */
  reset() {
    this.focus = -1;
    this._prev = {};
    for (const el of this.navOrder) {
      if (el) el.classList.remove('title-btn-gp');
    }
  },
};

// Bind gamepad connect/disconnect events for the title screen.
window.addEventListener('gamepadconnected', () => {
  document.body.classList.add('gamepad-connected');
  titleGamepad.reset();
});
window.addEventListener('gamepaddisconnected', () => {
  if (!titleGamepad.hasGamepad()) {
    document.body.classList.remove('gamepad-connected');
  }
  titleGamepad.reset();
});

// Poll gamepad in an independent rAF loop (only when title is visible).
(function pollTitleGamepad() {
  try { titleGamepad.poll(); } catch {}
  requestAnimationFrame(pollTitleGamepad);
})();

// Reset focus when continue/start/new visibility changes.
const origRefreshContinue = hud.refreshContinue;
hud.refreshContinue = function () {
  origRefreshContinue.apply(this, arguments);
  titleGamepad.reset();
};

// ── End gamepad title navigation ───────────────────────────────

const _engage = engageControls;
engageControls = function() {
  _engage();
  showPlayChrome(true);
};

window.__FS = game;

console.info('Frontier Survival boot OK · v1.13.2');
