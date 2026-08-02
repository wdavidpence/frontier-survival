import assert from 'assert';
import { clonePlayer, cloneSurvivalState, serializeCoopGameState } from '../js/coop-state.js';

// Test clonePlayer shallow copy
const p = { slots: [{id:1,count:2},{id:null,count:0}] };
const cp = clonePlayer(p);
assert.deepStrictEqual(cp.slots, p.slots); // same content
assert.notStrictEqual(cp.slots, p.slots); // but different array reference

// Test cloneSurvivalState defaults
const s = { health:80, hunger:70 };
const cs = cloneSurvivalState(s);
assert.strictEqual(cs.health, 80);
assert.strictEqual(cs.hunger, 70);
assert.strictEqual(cs.maxHealth, 100); // default from DEFAULT_SURVIVAL
// Ensure missing keys use defaults
const ss = cloneSurvivalState({});
assert.strictEqual(ss.health, 100);

// Test serializeCoopGameState structure
const game = { player1:{slots:[{id:2,count:5}]}, player2:{slots:[{}]}, world:{seed:123} };
const ser = serializeCoopGameState(game);
assert.deepStrictEqual(ser, {player1:{...game.player1},player2:{...game.player2},world:{...game.world}});

console.log('smoke-coop-state tests passed');
