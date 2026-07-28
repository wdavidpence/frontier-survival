import { Game } from './game.js';
import { hasSave } from './save.js';

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
    btnStart.textContent = exists ? 'New world (same as below)' : 'Start surviving';
    // Keep Start as new game always for clarity when no continue
    if (!exists) btnStart.textContent = 'Start surviving';
    else btnStart.style.display = 'none';
  }
}

const hud = {
  hideTitle() {
    title?.classList.add('hidden');
  },
  showDeath(cause) {
    if (!death) return;
    death.classList.remove('hidden');
    const el = document.getElementById('death-cause');
    if (el) el.textContent = cause ? `Cause: ${cause}` : '';
  },
  hideDeath() {
    death?.classList.add('hidden');
  },
  refreshContinue,
};

const game = new Game(canvas, hud);

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
  game.saveGame({ quiet: true });
});

refreshContinue();

// Expose for debug
window.__FS = game;

console.info('Frontier Survival boot OK');
