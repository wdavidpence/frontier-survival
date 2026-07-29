import { Game } from './game.js';
import { hasSave } from './save.js';
import { MODES, MODE_ORDER, getMode } from './modes.js';
import {
  readSettings,
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

const hud = {
  hideTitle() {
    title?.classList.add('hidden');
  },
  showDeath(cause, meta = {}) {
    if (!death) return;
    death.classList.remove('hidden');
    const el = document.getElementById('death-cause');
    if (el) el.textContent = cause ? `Cause: ${cause}` : '';
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
          'Nature does not negotiate. Build shelter. Light a fire. Eat before you explore.';
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

// Title sensitivity
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
  game.newGame();
});

btnContinue?.addEventListener('click', (e) => {
  e.stopPropagation();
  const res = game.loadGame();
  if (!res.ok) {
    alert(`Could not load save: ${res.error || 'unknown'}`);
    refreshContinue();
  }
});

btnNew?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (hasSave() && !confirm('Start a new world? This clears your saved game.')) return;
  game.newGame();
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

// Expose for debug
window.__FS = game;

console.info('Frontier Survival boot OK · v1.1');
