import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');
const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const journal = readFileSync(new URL('../js/expedition-journal.js', import.meta.url), 'utf8');
const cay = readFileSync(new URL('../js/seaglass-cay.js', import.meta.url), 'utf8');

assert.match(game, /from ['"]\.\/lookout-route\.js\?v=\d+['"];/, 'Game imports lookout-route through a cache-busted production edge');
assert.match(game, /from ['"]\.\/seaglass-cay\.js\?v=\d+['"];/, 'Game imports the Seaglass Cay visual through a cache-busted production edge');
assert.match(game, /_lookoutRouteState\s*=\s*createLookoutRouteState/, 'Game owns legacy-safe lookout route state');
assert.match(game, /lookoutRoute:\s*this\._lookoutRouteState/, 'capture state persists the lookout route');
assert.match(save, /lookoutRoute:\s*state\.lookoutRoute/, 'save payload preserves lookout route state');
assert.match(save, /data\.lookoutRoute/, 'legacy save parser normalizes an omitted lookout route');
assert.match(game, /_handleLookoutRouteUse\(owner\)/, 'P1 and P2 share a lookout-route handler');
assert.match(game, /_handleLookoutRouteUse\(['"]p1['"]\)/, 'P1 routes F-use to Seaglass Cay');
assert.match(game, /_handleLookoutRouteUse\(['"]p2['"]\)/, 'P2 routes controller use to the same cay');
assert.match(game, /chartLookoutRoute\(this\._lookoutRouteState/, 'choosing Lookout charts the second named route');
assert.match(journal, /id: 'seaglass_cay'/, 'Discovery Log includes Seaglass Cay');
assert.match(cay, /export function createSeaglassCay/, 'Seaglass Cay has a production visual factory');
assert.match(cay, /cay-beacon/, 'the cay beacon is named and inspectable');
assert.match(game, /Seaglass Cay/, 'HUD copy names the second offshore route');
console.log('PASS lookout route persistence, shared use, and Seaglass Cay seams');
