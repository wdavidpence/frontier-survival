# World Generation Verification for v1.11.0

## Tree Chance (Forest)
The `world.js` module sets a tree chance of **0.04** when the biome is forest (`BIOME.FOREST`). This matches the specification for half prior density.

## Ocean Biome Constant
In `biomes.js`, the `BIOME.OCEAN` constant is defined as `'ocean'`. The world generation uses this value in the biome lookup.

No other files were modified.
