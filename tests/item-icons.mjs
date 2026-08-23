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
assert.match(svg, /data-ground-shadow="hard"/);
assert.match(svg, /data-material-pass="forged-edge"/);
const foodSvg = iconSvgForItem(101, 'Dried Ration', '#b87333');
assert.match(foodSvg, /data-ground-shadow="soft"/);
assert.match(foodSvg, /data-material-pass="food-gloss"/);
const containerSvg = iconSvgForItem(144, 'Water Bucket', '#6aa4d8');
assert.match(containerSvg, /data-ground-shadow="grounded"/);
assert.match(containerSvg, /data-material-pass="container-rim"/);
const rarityCases = [
  [57, 'Diamond Ore', 'legendary'],
  [119, 'Iron Ingot', 'rare'],
  [22, 'Chest', 'uncommon'],
  [101, 'Dried Ration', 'common'],
];
for (const [id, name, rarity] of rarityCases) {
  const raritySvg = iconSvgForItem(id, name, '#6aa4d8');
  assert.match(raritySvg, new RegExp(`data-rarity="${rarity}"`), `rarity for ${name}`);
  if (rarity === 'common') assert.doesNotMatch(raritySvg, /data-rarity-accent=/);
  else assert.match(raritySvg, new RegExp(`data-rarity-accent="${rarity}"`));
}
const textureCases = [
  [102, 'Wood Pick', 'tool-wrap'],
  [119, 'Iron Ingot', 'ore-inclusions'],
  [57, 'Diamond Ore', 'gem-facets'],
  [22, 'Chest', 'container-bands'],
  [32, 'Furnace', 'furnace-vents'],
  [116, 'Seeds', 'leaf-veins'],
  [111, 'Wool Coat', 'cloth-stitch'],
  [101, 'Dried Ration', 'food-detail'],
];
for (const [id, name, texture] of textureCases) {
  assert.match(iconSvgForItem(id, name, '#6aa4d8'), new RegExp(`data-item-texture="${texture}"`), `texture for ${name}`);
}
const variantCases = [
  [101, 'Dried Ration', 'ration-bowl'],
  [14, 'Torch', 'torch-flame'],
  [100, 'Stick', 'stick'],
  [115, 'Berries', 'berry-cluster'],
  [145, 'Full Water Bucket', 'full-water-bucket'],
  [146, 'Marked Map', 'marked-map'],
  [125, 'Anchored Boat', 'anchored-boat'],
  [125, 'Patched Boat', 'patched-boat'],
  [160, 'Reef Caught Fish', 'reef-caught-fish'],
  [163, 'Cooked Reef Crab', 'cooked-reef-crab'],
  [159, 'Reef Bait', 'reef-bait-pouch'],
  [148, 'Fresh Coconut', 'fresh-coconut'],
  [14, 'Signal Torch', 'signal-torch'],
  [101, 'Packed Ration', 'packed-ration'],
  [161, 'Dried Tropical Fish', 'dried-tropical-fish'],
  [112, 'Trail Boots', 'trail-boots'],
  [146, 'Weathered Map', 'weathered-map'],
  [158, 'Lush Palm Frond', 'lush-palm-frond'],
  [159, 'Tied Fish Bait', 'tied-fish-bait'],
  [160, 'Striped Reef Fish', 'striped-reef-fish'],
  [148, 'Weathered Coconut', 'weathered-coconut'],
  [131, 'Loaded Compass', 'loaded-compass'],
  [132, 'Braced Shield', 'braced-shield'],
  [126, 'Cast Fishing Rod', 'cast-fishing-rod'],
  [145, 'Water Bucket', 'handled-bucket'],
  [131, 'Compass', 'compass-dial'],
  [132, 'Shield', 'shield-crest'],
  [125, 'Boat', 'boat-hull'],
  [126, 'Fishing Rod', 'fishing-rod'],
  [146, 'Map', 'map-scroll'],
  [147, 'Ice Box', 'ice-box'],
  [999, 'Supply Crate', 'supply-crate'],
  [999, 'Generator', 'generator-housing'],
  [999, 'Wire', 'wire-coil'],
  [34, 'Lamp', 'lamp-glow'],
  [31, 'Bricks', 'brick-stack'],
  [37, 'Cobble Wall', 'cobble-wall'],
  [102, 'Open Chest', 'open-chest'],
  [32, 'Lit Furnace', 'lit-furnace'],
  [35, 'Powered Generator', 'powered-generator'],
  [36, 'Open Ice Box', 'open-ice-box'],
  [102, 'Wood Pick', 'hero-pickaxe'],
  [103, 'Stone Axe', 'hero-axe'],
  [104, 'Iron Sword', 'hero-blade'],
  [57, 'Diamond', 'diamond-gem'],
  [93, 'Iron Ore', 'faceted-ore'],
  [150, 'Chest', 'hero-chest'],
  [151, 'Furnace', 'hero-furnace'],
  [205, 'Raw Fish', 'fish-fillet'],
  [158, 'Bread', 'bread-loaf'],
  [100, 'Raw Meat', 'meat-cut'],
  [214, 'Apple', 'fruit'],
  [116, 'Seeds', 'seedling'],
  [123, 'Wool Coat', 'tailored-clothing'],
  [107, 'Cooked Meat', 'cooked-meat'],
  [128, 'Cooked Fish', 'cooked-fish'],
  [161, 'Cooked Tropical Fish', 'tropical-fish'],
  [162, 'Raw Crab', 'crab-claw'],
  [112, 'Fur Boots', 'fur-boots'],
  [136, 'Leather Vest', 'leather-vest'],
  [158, 'Palm Frond', 'palm-frond'],
  [117, 'Wheat', 'wheat-sheaf'],
  [999, 'Mushroom', 'mushroom-cap'],
  [110, 'Fur Hat', 'fur-hat'],
  [134, 'Egg', 'egg'],
  [138, 'Pumpkin Soup', 'pumpkin-soup'],
  [128, 'Fresh Cooked Fish', 'fresh-cooked-fish'],
  [138, 'Warm Soup', 'warm-soup'],
  [112, 'Worn Fur Boots', 'worn-fur-boots'],
  [136, 'Equipped Leather Vest', 'equipped-leather-vest'],
  [133, 'Healing Salve', 'salve-jar'],
  [142, 'Bandage', 'bandage-roll'],
  [135, 'Feather', 'feather'],
  [108, 'Hide', 'hide-pelt'],
  [109, 'Cloth', 'folded-cloth'],
];
for (const [id, name, variant] of variantCases) {
  assert.match(iconSvgForItem(id, name, '#6aa4d8'), new RegExp(`data-item-variant="${variant}"`), `variant for ${name}`);
}
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
