import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');
const signal = readFileSync(new URL('../js/harbor-signal.js', import.meta.url), 'utf8');

assert.match(signal, /export function createHarborSignal/, 'the harbor signal has a production visual factory');
assert.match(signal, /export function updateHarborSignal/, 'the harbor signal has a bounded update lifecycle');
assert.match(signal, /export function disposeHarborSignal/, 'the harbor signal disposes owned GPU resources');
assert.match(game, /from ['"]\.\/harbor-signal\.js\?v=\d+['"];/, 'Game imports the harbor signal through a cache-busted production edge');
assert.match(game, /_buildHarborSignalVisual\s*\(/, 'Game owns a harbor signal build lifecycle');
assert.match(game, /state\.phase === 'claimed'/, 'the harbor signal is gated by the claimed return-reward state');
assert.match(game, /_discoverJournalEntry\(['"]harbor_signal['"]/, 'claiming the return reward records the harbor transformation');
assert.match(game, /updateHarborSignal\(this\._harborSignalGroup/, 'the harbor signal is updated from the real frame path');
console.log('PASS harbor signal reward-to-building integration');
