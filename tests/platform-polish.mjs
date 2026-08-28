import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const atlas = readFileSync(join(ROOT, 'js/atlas.js'), 'utf8');
const game = readFileSync(join(ROOT, 'js/game.js'), 'utf8');

function attributeTag(source, id) {
  const marker = `id="${id}"`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing ${id}`);
  const open = source.lastIndexOf('<', start);
  const close = source.indexOf('>', start);
  assert.ok(open >= 0 && close > start, `malformed ${id}`);
  return source.slice(open, close + 1);
}

test('portrait title screen owns a scrollable launch surface', () => {
  const mobileStart = html.indexOf('@media (max-width: 620px)');
  assert.ok(mobileStart >= 0, 'missing portrait media block');
  const mobileCss = html.slice(mobileStart, html.indexOf('</style>', mobileStart));
  assert.match(mobileCss, /#title-screen\s*\{[^}]*overflow-y:\s*auto/);
  assert.match(html, /class="title-actions"/);
  assert.match(html, /#title-screen \.title-actions\s*\{[\s\S]*position:\s*sticky/);
});

test('launch and settings controls expose accessible names', () => {
  for (const id of ['seed-input', 'title-sens-slider', 'title-rd-slider', 'sens-slider', 'quality-select', 'rd-slider']) {
    const tag = attributeTag(html, id);
    assert.match(tag, /aria-label|aria-labelledby/ , `${id} lacks an accessible name`);
  }
  assert.ok(html.includes('<label for="seed-input">'), 'seed label missing');
  assert.ok(html.includes('<label for="quality-select" class="sr-only">'), 'quality label missing');
});

test('co-op controller prompt has separated status semantics', () => {
  const tag = attributeTag(html, 'coop-pad-prompt');
  assert.match(tag, /role="status"/);
  assert.match(tag, /aria-atomic="true"/);
  const promptCss = html.slice(html.indexOf('#coop-pad-prompt'), html.indexOf('</style>'));
  assert.match(promptCss, /#coop-pad-prompt\s+strong\s*\{[^}]*display:\s*block/);
});

test('atlas readback canvas opts into frequent pixel reads', () => {
  assert.ok(atlas.includes("canvas.getContext('2d', { willReadFrequently: true })"));
});

test('expedition HUD exposes live route progress', () => {
  assert.ok(html.includes('data-destination-progress'), 'destination progress meter missing');
  assert.ok(html.includes('data-destination-progress-label'), 'destination progress label missing');
  assert.match(game, /data-destination-progress/);
  assert.match(game, /style\.width\s*=\s*`\$\{.*progress/);
});

test('coastal crossing exposes pooled marine life and wake feedback', () => {
  assert.match(game, /this\._marineSighting/);
  assert.match(game, /this\._updateMarineSighting\(/);
  assert.match(game, /Marine life/);
  assert.match(game, /this\._boatWake/);
  assert.match(game, /this\._updateBoatWake\(/);
  assert.match(game, /new THREE\.RingGeometry/);
});
