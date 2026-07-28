import { Game } from './game.js';

const canvas = document.getElementById('game');
const title = document.getElementById('title-screen');
const death = document.getElementById('death-screen');
const btnStart = document.getElementById('btn-start');
const btnRespawn = document.getElementById('btn-respawn');

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
};

const game = new Game(canvas, hud);

btnStart?.addEventListener('click', (e) => {
  e.stopPropagation();
  game.start();
});

btnRespawn?.addEventListener('click', (e) => {
  e.stopPropagation();
  game.respawn();
});

// Expose for debug
window.__FS = game;

console.info('Frontier Survival boot OK');
