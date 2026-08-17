import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  iconKindForItem,
  iconSvgForItem,
  iconDataUriForItem,
} from '../js/item-icons.js';

const cases = [
  ['log', 7, 'Spruce Log'],
  ['tool', 102, 'Wood Pick'],
  ['ore', 93, 'Iron Ore'],
  ['block', 3, 'Cobblestone'],
  ['food', 101, 'Dried Ration'],
  ['map', 146, 'Map'],
  ['clothing', 111, 'Wool Coat'],
  ['plant', 116, 'Seeds'],
  ['container', 144, 'Water Bucket'],
  ['generic', 9999, 'Mysterious Trinket'],
];

for (const [expected, id, name] of cases) {
  assert.equal(iconKindForItem(id, name), expected, `kind for ${name}`);
}

const svg = iconSvgForItem(102, 'Wood Pick', '#b87333');
assert.equal(svg.startsWith('<svg'), true);
assert.match(svg, /viewBox="0 0 64 64"/);
assert.match(svg, /<linearGradient/);
assert.match(svg, /<filter[^>]*id="shadow"/);
assert.match(svg, /filter="url\(#shadow\)"/);
assert.doesNotMatch(svg, /<script\b|javascript:|on[a-z]+=/i);
assert.doesNotMatch(svg, />[^<]*[A-Za-z][^<]*</, 'icons do not render word labels');
assert.match(svg, /<path\b|<rect\b|<ellipse\b|<polygon\b/);

const repeatedA = iconSvgForItem(146, 'Map', '#6aa4d8');
const repeatedB = iconSvgForItem(146, 'Map', '#6aa4d8');
assert.equal(repeatedA, repeatedB, 'same inputs produce deterministic output');
assert.notEqual(repeatedA, iconSvgForItem(146, 'Map', '#d88a4b'), 'palette affects output');

const uri = iconDataUriForItem(111, 'Wool Coat', '#7aa0d8');
assert.equal(uri.startsWith('data:image/svg+xml'), true);
const encoded = uri.slice(uri.indexOf(',') + 1);
const decoded = decodeURIComponent(encoded);
assert.equal(decoded, iconSvgForItem(111, 'Wool Coat', '#7aa0d8'));

for (const color of [undefined, null, '', 'not-a-color', '#abc', '#abcdef', 'rgb(1, 2, 3)', ['#fff'], { bad: true }, '"/><script>alert(1)</script>']) {
  const out = iconSvgForItem(999, '<unknown>', color);
  assert.equal(out.startsWith('<svg'), true);
  assert.doesNotMatch(out, /<script\b|javascript:|on[a-z]+=/i, `unsafe color ${String(color)}`);
  assert.doesNotMatch(out, /<unknown>/, 'untrusted names never become markup');
}
assert.equal(iconKindForItem(999, '<script>alert(1)</script>'), 'generic');
assert.match(iconSvgForItem(null, null), /viewBox="0 0 64 64"/);

const source = fs.readFileSync(new URL('../js/item-icons.js', import.meta.url), 'utf8');
for (const forbidden of ['Math.random', 'document', 'window', 'Three', 'three', 'import ', '<script']) {
  assert.equal(source.includes(forbidden), false, `source purity: no ${forbidden}`);
}

console.log('item-icons: all tests passed');
