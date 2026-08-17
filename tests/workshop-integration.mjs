import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const game = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
const save = fs.readFileSync(path.join(root, 'js/save.js'), 'utf8');
const furnaceUi = fs.readFileSync(path.join(root, 'js/furnace-ui.js'), 'utf8');
const stations = fs.readFileSync(path.join(root, 'js/workshop-stations.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const publicHtml = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const literalImport = (file, specifier) =>
  new RegExp(`from ['"]\\./${specifier}\\?v=\\d+['"]`).test(file);

 test('game imports persistent workshop adapter and furnace UI with literal cache-busted paths', () => {
  assert.equal(literalImport(game, 'workshop-stations.js'), true);
  assert.equal(literalImport(game, 'furnace-ui.js'), true);
  assert.match(game, /createWorkshopState/);
  assert.match(game, /deserializeWorkshopState/);
});

test('game owns serializable workshop state and restores legacy saves safely', () => {
  assert.match(game, /this\._workshopState\s*=\s*createWorkshopState\(\)/);
  assert.match(game, /saveData\.workshop/);
  assert.match(game, /serializeWorkshopState\(this\._workshopState\)/);
  assert.match(game, /deserializeWorkshopState\(saveData\.workshop/);
  assert.doesNotMatch(game, /this\._furnaces\s*=\s*new Map/);
});

test('persistent furnace ticking delegates through the station adapter and existing furnace authority', () => {
  assert.match(game, /_tickFurnaces\(dt\)/);
  assert.match(game, /tickFurnaceStation\(/);
  assert.match(game, /_workshopState\??\.stations/);
  assert.match(stations, /from ['"]\.\/furnace-tick\.js\?v=232['"]/);
  assert.match(stations, /tickFurnace\(/);
  assert.match(game, /BLOCK\.FURNACE/);
});

test('real P1 and P2 use paths open one shared furnace station', () => {
  assert.match(game, /hit\.id === BLOCK\.FURNACE[\s\S]{0,500}_openFurnace/);
  assert.match(game, /this\.input2\.consumeUse\?\.\(\)[\s\S]{0,500}hit\.id === BLOCK\.FURNACE[\s\S]{0,500}_openFurnace/);
  assert.match(game, /owner = ['"]p1['"]/);
  assert.match(game, /getOrCreateFurnaceStation/);
  assert.match(game, /stationId/);
});

test('furnace UI buttons use atomic inventory insertion and safe output transfer', () => {
  assert.match(game, /bindFurnaceUi\(/);
  assert.match(game, /insertStationInput\(/);
  assert.match(game, /insertStationFuel\(/);
  assert.match(game, /takeStationOutput\(/);
  assert.match(game, /addItems\(/);
  assert.match(game, /if \(!add\.ok\)[\s\S]{0,160}return/);
  assert.match(game, /_unlock\('first_iron'\)/);
  assert.match(game, /_closeFurnace\(/);
  assert.match(game, /uiMode\s*=\s*false/);
  assert.match(furnaceUi, /data-furnace-slot/);
});

test('workshop HUD markup exists identically in root and public HTML without changing furnace controls', () => {
  assert.equal(html, publicHtml);
  assert.match(html, /id="workshop-hud"/);
  assert.match(html, /data-workshop-status/);
  assert.match(html, /data-furnace-action="input"/);
  assert.match(html, /data-furnace-action="fuel"/);
  assert.match(html, /data-furnace-action="output"/);
  assert.match(html, /id="btn-close-furnace"/);
  assert.match(html, /id="btn-close-furnace"[^>]*data-furnace-action="close"/);
});

test('save build and parse carry optional workshop state without changing SAVE_VERSION', () => {
  assert.match(save, /workshop:\s*state\.workshop/);
  assert.match(save, /data\.workshop\s*=/);
  assert.match(save, /data\.v !== 1 && data\.v !== 2/);
  assert.match(save, /export const SAVE_VERSION = 2/);
});

console.log('workshop integration tests passed');
