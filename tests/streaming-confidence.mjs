import assert from 'node:assert/strict';
import { streamingConfidenceFromStats, streamingConfidenceHudLabel } from '../js/streaming-confidence.js';

assert.equal(streamingConfidenceFromStats({ count: 10 }).id, 'warming');
assert.equal(streamingConfidenceFromStats(null).id, 'warming');
assert.equal(streamingConfidenceFromStats({ count: 60, median: 14, p95: 20, max: 22 }, { meshCount: 40 }).id, 'steady');
assert.equal(streamingConfidenceFromStats({ count: 60, median: 18, p95: 28, max: 32 }).id, 'playable');
assert.equal(streamingConfidenceFromStats({ count: 60, median: 20, p95: 40, max: 80 }).id, 'hitching');
assert.match(streamingConfidenceHudLabel({ id: 'steady' }), /Streaming · steady/);
assert.match(streamingConfidenceHudLabel({ id: 'unknown' }), /warming/);
console.log('PASS streaming confidence classifies warmup, hitching, and steady frames');
