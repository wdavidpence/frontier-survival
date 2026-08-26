import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const world = readFileSync(new URL('../js/world.js', import.meta.url), 'utf8');

assert.match(world, /updateStreaming\(players/);
assert.match(world, /_canUseChunkWorkers\(\)/);
assert.match(world, /_enqueueStreamChunkJob\(/);
assert.match(world, /generateChunkAsync\(cx, cz\)/);
assert.match(world, /if \(!this\._workerReady \|\| this\._workerPool\.length === 0\)/);
assert.match(world, /return Promise\.resolve\(this\._generateChunkSync\(cx, cz\)\)/);
assert.match(world, /this\._streamPending\.has\(k\)/);
assert.match(world, /_drainStreamReady\(desired, plan, budget\)/);
assert.match(world, /_restoreChunkEdits\(item\.cx, item\.cz\)/);
assert.doesNotMatch(
  world,
  /while \(this\._streamQueue\.length && generated < budget\) \{[\s\S]*?const want = desired\.get\(k\);\s*if \(!want\) continue;\s*this\._materializeChunk\(want\.cx, want\.cz, want\.tier, plan\);/,
);
console.log('PASS world-async-stream contract');
