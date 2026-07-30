import { Game } from './game.js';
import { hasSave, clearSaveStorage } from './save.js';
import { MODES, MODE_ORDER, getMode } from './modes.js';
import {
  writeSettings,
  sensitivityFromSlider,
  sliderFromSensitivity,
} from './settings.js';

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
      el.textContent = cause
        ? `Cause: ${cause} — ${causeFlavor(cause)}`
        : causeFlavor(cause);
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
  if (blurb) blurb.textContent = getMode(game.mode).blurb;
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
    game.canvas?.focus?.();
    game.input?.requestLock?.();
    // Drop Esc from confirm()/alert after the call stack clears
    setTimeout(() => {
      try {
        game.input?.clearTransient?.();
        game.input.uiMode = false;
        if (game.paused && game.started && !game.survival?.dead) game.setPaused(false);
        game._ignorePauseT = Math.max(game._ignorePauseT || 0, 1.0);
        game.input?.requestLock?.();
      } catch (_) {}
    }, 0);
    setTimeout(() => {
      try {
        game.input?.pausePressed && (game.input.pausePressed = false);
        if (game.paused && game.started) game.setPaused(false);
      } catch (_) {}
    }, 100);
  } catch (_) {}
}

function startNewWorld() {
  const seed = readSeedInput();
  clearSaveStorage();
  game.mode = getMode(game.settings.mode).id;
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
refreshContinue();

window.__FS = game;

console.info('Frontier Survival boot OK · v1.7.1');
