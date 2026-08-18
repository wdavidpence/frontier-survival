import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SAVE_VERSION, buildSavePayload, parseSavePayload } from '../js/save.js?v=222';
import {
  createPressureState,
  deserializePressureState,
  triggerPressure,
  securePressure,
  getPressureHudSummary,
} from '../js/expedition-pressure.js?v=1';

const game = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');
const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const rootHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const publicHtml = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

function has(text, pattern, message) {
  assert.match(text, pattern, message);
}

// The production game imports the accepted pressure contract with a literal cache bust.
has(game, /from ['"]\.\/expedition-pressure\.js\?v=\d+['"];?/, 'game imports pressure with a literal cache bust');
has(game, /_pressureState\s*=\s*createPressureState\(/, 'Game owns fresh pressure state');
has(game, /_pressureState\s*=\s*deserializePressureState\(saveData\.pressure\)/, 'loads deserialize saved pressure with legacy fallback');
has(game, /pressure:\s*this\._pressureState/, 'captureState includes pressure');
has(save, /pressure:\s*state\.pressure/, 'save payload persists optional pressure');
has(save, /data\.pressure\s*==\s*null/, 'legacy saves receive a safe pressure default');
assert.equal(SAVE_VERSION, 2, 'pressure integration does not bump SAVE_VERSION');

// Arrival snapshots the real clock/weather once; repeated triggers preserve the first snapshot.
const arrivalMatch = game.match(/if \(nearLandmark && state\.phase === 'en_route'\) \{([\s\S]*?)\n    \}/);
assert.ok(arrivalMatch, 'real landmark arrival branch exists');
const arrivalBlock = arrivalMatch[1];
has(arrivalBlock, /this\._destinationState\s*=\s*arriveDestination\(state\);/, 'arrival advances the destination');
has(arrivalBlock, /this\._pressureState\s*=\s*triggerPressure\(this\._pressureState,\s*\{\s*isNight:\s*this\.time\.isNight\(\),\s*weather:\s*this\.time\.weather,\s*\}\);/, 'arrival triggers pressure with the real environment');
const fresh = createPressureState();
const threatened = triggerPressure(fresh, { isNight: true, weather: 'rain' });
assert.equal(threatened.phase, 'threatened');
assert.deepEqual(threatened.environment, { dayNight: 'night', weather: 'rain' });
assert.deepEqual(triggerPressure(threatened, { isNight: false, weather: 'clear' }).environment, threatened.environment, 'pressure preserves first snapshot');
assert.deepEqual(deserializePressureState(null), fresh, 'legacy pressure defaults safely');

// Both controller paths call the same real landmark handler and pressure remains atomic.
has(game, /_handleDestinationUse\(hit,\s*'p1'\)/, 'P1 uses shared destination handler');
has(game, /_handleDestinationUse\(hit,\s*'p2'\)/, 'P2 uses shared destination handler');
has(game, /_handleDestinationUse\s*\(hit,\s*owner\s*=\s*'p1'\)/, 'handler has shared owner seam');
const activeMatch = game.match(/if \(nearLandmark && state\.phase === 'active'\) \{([\s\S]*?)\n    \}\n\n    if \(campfire/);
assert.ok(activeMatch, 'real landmark active-use branch exists');
const activeBlock = activeMatch[1];
has(activeBlock, /this\._pressureState\?\.phase === 'threatened'/, 'active landmark use checks threatened pressure');
has(activeBlock, /countItems\(pl\.slots, BLOCK\.TORCH\)/, 'active use checks Torch inventory');
has(activeBlock, /countItems\(pl\.slots, ITEM\.RATION\)/, 'active use checks Ration inventory');
const missingBranchMatch = activeBlock.match(/if \(missing\.length > 0\) \{([\s\S]*?)return true;/);
assert.ok(missingBranchMatch, 'missing-supply refusal branch exists');
const missingBranch = missingBranchMatch[1];
has(missingBranch, /pl\.notify\(/, 'missing supplies notify clearly');
assert.doesNotMatch(missingBranch, /removeItems|pl\.slots\s*=|this\._destinationState\s*=/, 'missing supplies consume nothing and keep destination active');
has(activeBlock, /let stagedSlots = cloneSlots\(pl\.slots\);/, 'pressure consumption stages inventory atomically');
has(activeBlock, /removeItems\(stagedSlots, BLOCK\.TORCH, 1\)/, 'successful pressure use consumes exactly one Torch');
has(activeBlock, /removeItems\(stagedSlots, ITEM\.RATION, 1\)/, 'successful pressure use consumes exactly one Ration');
has(activeBlock, /const secured = securePressure\(this\._pressureState, \{ torch: 1, ration: 1 \}\);/, 'successful pressure use secures shared pressure');
has(activeBlock, /pl\.slots = rationRemoved\.slots;/, 'successful pressure use commits staged inventory');
has(activeBlock, /this\._destinationState = resolveDestination\(state\);/, 'successful pressure use resolves destination');
assert.throws(() => securePressure(threatened, { torch: 1 }), /ration/i, 'missing ration refuses pressure preparation');
const secured = securePressure(threatened, { torch: 1, ration: 1 });
assert.equal(secured.state.phase, 'secured');
assert.deepEqual(secured.consumed, ['torch', 'ration']);

// HUD remains compact and the two shipped HTML artifacts stay byte-identical.
assert.equal(rootHtml, publicHtml, 'root/public HTML remain byte-identical');
has(rootHtml, /id="destination-hud"/, 'destination HUD remains present');
has(rootHtml, /data-destination-status/, 'destination HUD status target remains present');
has(game, /_updateDestinationHud\s*\(/, 'game updates destination HUD');
has(game, /getPressureHudSummary\(/, 'HUD renders pressure status and environment context');
assert.match(getPressureHudSummary(threatened), /Night Stalkers.*Threatened.*night.*rain/i, 'threatened HUD includes phase and environment');

// Save/load keeps pressure optional and does not reject v1.12.75 payloads.
const payload = buildSavePayload({
  seed: 12,
  time: { elapsed: 0, weather: 'clear', weatherTimer: 60, dayLengthSec: 900 },
  player: { x: 0, y: 20, z: 0, yaw: 0, pitch: 0, slots: [], equipment: {} },
  survival: {},
  edits: [],
  pressure: secured.state,
});
const parsed = parseSavePayload(payload);
assert.equal(parsed.ok, true);
assert.equal(parsed.data.pressure.phase, 'secured');
assert.match(getPressureHudSummary(secured.state), /Night Stalkers.*Secured/i, 'secured HUD exposes secured phase');
const legacyPayload = { ...payload };
delete legacyPayload.pressure;
const legacyParsed = parseSavePayload(legacyPayload);
assert.equal(legacyParsed.ok, true);
assert.equal(legacyParsed.data.pressure, null);

console.log('PASS expedition pressure integration seams');
