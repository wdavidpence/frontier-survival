import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');
const rootHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const publicHtml = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

assert.match(game, /from ['"]\.\/expedition-journal\.js\?v=\d+['"];/, 'game must load the persistent Discovery Log');
assert.match(game, /_journalState\s*=\s*createJournalState/, 'Game owns serializable journal state');
assert.match(game, /journal:\s*this\._journalState/, 'save capture persists journal discoveries');
assert.match(game, /_discoverJournalEntry\(['"]tidewatch_wreck['"]/, 'expedition reaches the Tidewatch Wreck journal transition');
assert.match(game, /from ['"]\.\/tidewatch-wreck\.js\?v=\d+['"];/, 'game loads the authored wreck prop');
assert.match(game, /_buildTidewatchWreckVisual\s*\(/, 'wreck prop has a lifecycle builder');
assert.match(game, /First voyage · Tidewatch Wreck/, 'fresh worlds expose an actionable expedition lead');
assert.match(game, /Shared crew log/, 'co-op shares the same expedition journal cue');
assert.match(game, /audio\.discovery\?\.\(\)/, 'a new discovery triggers the authored audio stinger');
assert.match(rootHtml, /id="discovery-log"/, 'Discovery Log HUD card exists');
assert.equal(rootHtml, publicHtml, 'root/public HTML remain byte-identical');
console.log('PASS expedition discovery integration seams');
