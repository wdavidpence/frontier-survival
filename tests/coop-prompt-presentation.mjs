import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(game, /Connect two controllers/, 'missing-pad state keeps human-readable controller guidance');
assert.match(game, /Connect P2 controller/, 'single-pad state identifies the needed controller');
assert.match(game, /Local co-op ready/, 'ready state has a positive confirmation');
assert.doesNotMatch(game, /el\.textContent\s*=\s*status/, 'raw pad status must not replace prompt markup');
assert.match(html, /#coop-pad-prompt[\s\S]*?left:\s*50%[\s\S]*?top:\s*62px[\s\S]*?translateX\(-50%\)/, 'co-op reminder is compact and centered above split views');
console.log('PASS co-op controller prompt stays compact and semantic');
