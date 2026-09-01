import assert from 'node:assert/strict';
import { HARBOR_CHOICES, createHarborChoiceState, cycleHarborChoice, harborChoiceSummary } from '../js/harbor-choice.js';

const fresh = createHarborChoiceState();
assert.equal(fresh.version, 1);
assert.equal(fresh.choice, null);
assert.equal(HARBOR_CHOICES.length, 2);
assert.match(harborChoiceSummary(fresh), /Choose a harbor plan/i);

const first = cycleHarborChoice(fresh);
assert.equal(first.choice.id, 'lookout');
assert.equal(first.state.choice, 'lookout');
assert.match(harborChoiceSummary(first.state), /Lookout Plan/);

const second = cycleHarborChoice(first.state);
assert.equal(second.choice.id, 'landing');
assert.equal(second.state.choice, 'landing');
assert.equal(createHarborChoiceState({ choice: 'invalid' }).choice, null);
console.log('PASS harbor choice state is durable and player-cycleable');
