import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');
const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const signal = readFileSync(new URL('../js/harbor-signal.js', import.meta.url), 'utf8');

assert.match(game, /from ['"]\.\/harbor-choice\.js\?v=\d+['"];/, 'Game imports player harbor-choice state through a cache-busted production edge');
assert.match(game, /_harborChoiceState\s*=\s*createHarborChoiceState/, 'Game owns legacy-safe persistent harbor choice state');
assert.match(game, /harborChoice:\s*this\._harborChoiceState/, 'capture state persists the shared harbor choice');
assert.match(save, /harborChoice:\s*state\.harborChoice/, 'save payload preserves harbor choice state');
assert.match(save, /data\.harborChoice/, 'legacy save parser normalizes an omitted harbor choice');
assert.match(game, /_handleHarborSignalUse\(owner\)/, 'P1 and P2 share a signal interaction handler');
assert.match(game, /_handleHarborSignalUse\(['"]p1['"]\)/, 'P1 routes F-use to the harbor signal');
assert.match(game, /_handleHarborSignalUse\(['"]p2['"]\)/, 'P2 routes controller use to the same harbor signal');
assert.match(signal, /choice === 'lookout'/, 'Lookout plan adds a chart-table and spyglass');
assert.match(signal, /choice === 'landing'/, 'Landing plan adds a supply pier and mooring posts');
assert.match(signal, /lookout-spyglass/, 'Lookout visual is named and inspectable');
assert.match(signal, /landing-pier/, 'Landing visual is named and inspectable');
assert.match(game, /harborChoiceSummary\(this\._harborChoiceState\)/, 'HUD exposes the current harbor plan');
console.log('PASS harbor choice persistence and shared interaction seams');
