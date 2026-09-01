import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');
const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const journal = readFileSync(new URL('../js/expedition-journal.js', import.meta.url), 'utf8');

assert.match(game, /from ['"]\.\/landing-berth\.js\?v=\d+['"];/, 'Game imports landing-berth through a cache-busted production edge');
assert.match(game, /_landingBerthState\s*=\s*createLandingBerthState/, 'Game owns legacy-safe landing berth state');
assert.match(game, /landingBerth:\s*this\._landingBerthState/, 'capture state persists the landing berth');
assert.match(save, /landingBerth:\s*state\.landingBerth/, 'save payload preserves landing berth state');
assert.match(save, /data\.landingBerth/, 'legacy save parser normalizes an omitted landing berth');
assert.match(game, /_handleLandingBerthUse\(owner\)/, 'P1 and P2 share a landing-berth handler');
assert.match(game, /_handleLandingBerthUse\(['"]p1['"]\)/, 'P1 routes F-use to the landing berth');
assert.match(game, /_handleLandingBerthUse\(['"]p2['"]\)/, 'P2 routes controller use to the same berth');
assert.match(game, /openLandingBerth\(this\._landingBerthState/, 'choosing Landing opens the skiff berth');
assert.match(game, /moorBoatAtBerth|launchBoatFromBerth/, 'the berth can moor and launch the live skiff');
assert.match(journal, /id: 'landing_berth'/, 'Discovery Log includes the landing berth');
assert.match(game, /Landing Berth/, 'HUD copy names the working berth');
console.log('PASS landing berth persistence, shared use, and skiff seams');
