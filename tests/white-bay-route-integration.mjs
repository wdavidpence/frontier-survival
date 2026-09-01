import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');
const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const journal = readFileSync(new URL('../js/expedition-journal.js', import.meta.url), 'utf8');
const camp = readFileSync(new URL('../js/white-bay-camp.js', import.meta.url), 'utf8');

assert.match(game, /from ['"]\.\/white-bay-route\.js\?v=\d+['"];/, 'Game imports white-bay-route through a cache-busted production edge');
assert.match(game, /from ['"]\.\/white-bay-camp\.js\?v=\d+['"];/, 'Game imports the White Bay camp visual through a cache-busted production edge');
assert.match(game, /_whiteBayRouteState\s*=\s*createWhiteBayRouteState/, 'Game owns legacy-safe White Bay route state');
assert.match(game, /whiteBayRoute:\s*this\._whiteBayRouteState/, 'capture state persists the White Bay route');
assert.match(save, /whiteBayRoute:\s*state\.whiteBayRoute/, 'save payload preserves White Bay route state');
assert.match(save, /data\.whiteBayRoute/, 'legacy save parser normalizes an omitted White Bay route');
assert.match(game, /_handleWhiteBayRouteUse\(owner\)/, 'P1 and P2 share a White Bay handler');
assert.match(game, /_handleWhiteBayRouteUse\(['"]p1['"]\)/, 'P1 routes F-use to White Bay');
assert.match(game, /_handleWhiteBayRouteUse\(['"]p2['"]\)/, 'P2 routes controller use to the same camp');
assert.match(game, /chartWhiteBayRoute\(this\._whiteBayRouteState/, 'claiming Tidewatch charts White Bay');
assert.match(journal, /id: 'white_bay'/, 'Discovery Log includes White Bay');
assert.match(camp, /bay-lean-to/, 'the overnight camp is named and inspectable');
assert.match(game, /White Bay/, 'HUD copy names the third coastal destination');
console.log('PASS white bay persistence, shared use, and overnight camp seams');
