import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSavePayload, parseSavePayload, SAVE_VERSION } from '../js/save.js?v=221';
import {
  ITEM as DEST_ITEM,
  IRON_RAVINE,
  createDestinationState,
  prepareDestination,
  activateDestination,
  arriveDestination,
  resolveDestination,
  returnDestination,
  claimDestinationReward,
} from '../js/expedition-destination.js?v=1';

const game = readFileSync(new URL('../js/game.js', import.meta.url), 'utf8');
const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const rootHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const publicHtml = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

function has(text, pattern, message) {
  assert.match(text, pattern, message);
}

// Import/cache-bust seam and serializable ownership.
has(game, /from ['"]\.\/expedition-destination\.js\?v=\d+['"];/, 'game imports the accepted destination with a literal cache bust');
has(game, /_destinationState\s*=\s*createDestinationState/, 'Game owns destination state');
has(game, /destination:\s*this\._destinationState/, 'captureState includes destination state');
has(save, /destination:\s*state\.destination/, 'save payload persists destination state');
has(save, /data\.destination\s*==\s*null/, 'legacy saves receive a safe destination default');
assert.equal(SAVE_VERSION, 2, 'destination integration does not bump SAVE_VERSION');

// Fresh-world placement uses the real sparse edit path and a safe nearby surface.
has(game, /_ensureDestinationLandmark\s*\(/, 'fresh/load boot ensures the landmark');
has(game, /world\.updateStreaming\([\s\S]*?\);\s*if \(this\.started && !this\._destinationLandmarkPlaced\) \{\s*this\._ensureDestinationLandmark\(\);\s*\}/, 'started update loop retries landmark stamping after streamed world data is available');
has(game, /placeDestination\(/, 'landmark placement is deterministic from seed/camp');
has(game, /from ['"]\.\/gen\.js\?v=285['"];?/, 'landmark surface fallback imports deterministic heightAt');
has(game, /heightAt\(x,\s*z,\s*this\.seed\)/, 'all-air destination columns use the seeded heightAt fallback');
has(game, /world\.setBlock\([^;]+recordEdit/s, 'landmark stamping uses World.setBlock edits');
has(game, /world\.exportEdits\(\)/, 'landmark edits flow through save capture');
has(game, /BLOCK\.(IRON_ORE|COAL_ORE|COBBLE|STONE)/, 'landmark uses existing block IDs');

// HUD is a compact, separate status cue and both artifacts remain byte-identical.
assert.equal(rootHtml, publicHtml, 'root/public HTML remain byte-identical');
has(rootHtml, /id="destination-hud"/, 'destination HUD exists');
has(rootHtml, /data-destination-status/, 'destination HUD has a status target');
has(game, /_updateDestinationHud\s*\(/, 'game updates destination HUD');
has(game, /getDestinationHudSummary\(/, 'HUD renders accepted destination summary');

// P1 and P2 use paths call one shared destination handler.
has(game, /_handleDestinationUse\(hit,\s*'p1'\)/, 'P1 F/use path advances shared destination');
has(game, /_handleDestinationUse\(hit,\s*'p2'\)/, 'P2 use path advances shared destination');
has(game, /_handleDestinationUse\s*\(hit,\s*owner\s*=\s*'p1'\)/, 'destination handler has shared owner seam');
has(game, /IRON_RAVINE\.requiredCapability|DEST_ITEM\.IRON_PICK/, 'capability gate is tied to Iron Pick');
has(game, /DEST_ITEM\.MAP\)\s*return ITEM\.MAP/, 'Map reward maps to the existing Map item');
assert.doesNotMatch(game, /DEST_ITEM\.COPPER_ORE|copper_ore/, 'unsupported copper ore reward mapping is absent');
has(game, /distance|Math\.hypot/, 'destination interaction checks range');
has(game, /let slots = cloneSlots\(pl\.slots\)/, 'reward claim stages inventory changes atomically');
has(game, /id == null \|\| !added\.ok/, 'full inventory leaves reward state unclaimed');

// The pure transition graph is exercised as the integration contract.
const camp = { x: 0, y: 20, z: 0 };
const fresh = createDestinationState({ seed: 12, campPosition: camp });
assert.equal(fresh.phase, 'unprepared');
assert.throws(() => activateDestination(prepareDestination(fresh), []), /capability|iron pick/i);
const completed = returnDestination(resolveDestination(arriveDestination(activateDestination(prepareDestination(fresh), [DEST_ITEM.IRON_PICK]))));
const claimed = claimDestinationReward(completed);
assert.equal(claimed.state.phase, 'claimed');
assert.deepEqual(claimed.rewards, IRON_RAVINE.rewardTable);
assert.equal(claimed.rewards[0].id, DEST_ITEM.MAP, 'Iron Ravine grants the Map capability');
assert.equal(claimed.rewards[1].id, DEST_ITEM.TORCH, 'Iron Ravine preserves the torch reward');
assert.deepEqual(claimDestinationReward(claimed.state).rewards, [], 'repeated claim cannot duplicate reward');

// Save/load seam preserves the destination and remains safe for legacy payloads.
const payload = buildSavePayload({
  seed: 12,
  time: { elapsed: 0, weather: 'clear', weatherTimer: 60, dayLengthSec: 900 },
  player: { x: 0, y: 20, z: 0, yaw: 0, pitch: 0, slots: [], equipment: {} },
  survival: {},
  edits: [[1, 20, 1, 18]],
  destination: claimed.state,
});
const parsed = parseSavePayload(payload);
assert.equal(parsed.ok, true);
assert.equal(parsed.data.destination.phase, 'claimed');
const legacy = parseSavePayload({ ...payload, destination: undefined });
assert.equal(legacy.ok, true);
assert.equal(legacy.data.destination, null, 'legacy payload defaults without crashing');

console.log('PASS expedition integration seams');
