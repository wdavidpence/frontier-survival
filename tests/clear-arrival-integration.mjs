import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const game = readFileSync(join(root, 'js/game.js'), 'utf8');
const save = readFileSync(join(root, 'js/save.js'), 'utf8');
const time = readFileSync(join(root, 'js/time.js'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const publicHtml = readFileSync(join(root, 'public/index.html'), 'utf8');

assert.match(game, /from ['"]\.\/clear-arrival\.js\?v=\d+['"]/, 'Game imports clear-arrival through a cache-busted production edge');
assert.match(game, /clearArrivalHudLabel\(this\.time\)/);
assert.match(game, /applyClearArrivalTick\(this\.time/);
assert.match(game, /this\.time\.weatherGrace = normalizeWeatherGrace\(saveData\.time\?\.weatherGrace\)/);
assert.match(game, /weatherGrace: this\.time\.weatherGrace/);
assert.match(game, /_skyBackdrop\.classList\.toggle\('clear-arrival'/);
assert.match(save, /weatherGrace: state\.time\.weatherGrace/);
assert.match(time, /this\.weatherGrace = CLEAR_ARRIVAL_GRACE_SEC/);
assert.match(html, /#sky-backdrop\.clear-arrival/);
assert.equal(html, publicHtml);

console.log('PASS clear arrival persistence, HUD, and first-look sky seams');
