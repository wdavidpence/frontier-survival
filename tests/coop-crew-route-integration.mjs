import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');

assert.match(game, /from ['"]\.\/coop-crew-route\.js\?v=\d+['"];/, 'Game imports co-op crew rendezvous through a cache-busted production edge');
assert.match(game, /crewTogetherAt\(/, 'Game evaluates whether both players share a camp');
assert.match(game, /coopCrewRouteSummary\(/, 'HUD exposes shared-crew White Bay copy');
assert.match(game, /Crew surveyed White Bay together/, 'surveying together notifies the crew');
assert.match(game, /_handleWhiteBayRouteUse\(['"]p2['"]\)/, 'P2 still shares the White Bay handler');
console.log('PASS co-op crew White Bay HUD and shared survey seams');
