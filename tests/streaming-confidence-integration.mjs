import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');

assert.match(game, /from ['"]\.\/streaming-confidence\.js\?v=\d+['"];/, 'Game imports streaming confidence through a cache-busted production edge');
assert.match(game, /streamingConfidenceFromStats\(/, 'the 1s performance report classifies live frame stats');
assert.match(game, /this\._streamConfidence/, 'Game stores a HUD-facing streaming verdict');
assert.match(game, /streamingConfidenceHudLabel\(this\._streamConfidence/, 'status HUD exposes streaming confidence copy');
assert.match(game, /confidence:/, 'runtime performance object exposes the confidence verdict');
console.log('PASS streaming confidence reaches the live HUD and performance probe');
