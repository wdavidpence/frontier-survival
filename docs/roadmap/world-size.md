# World Size & Ocean Biome

**Status:** Notes only — no code changes.  
**Last updated:** 2026-07-31

---

## Chunk system

| Parameter | Value | File / Line |
|-----------|-------|-------------|
| `CHUNK_SIZE` | 16 blocks | `js/chunk-worker.js:131` |
| `WORLD_HEIGHT` | 48 blocks (y=0..47) | `js/chunk-worker.js:132` |
| `SEA_LEVEL` | 16 (y=16) | `js/chunk-worker.js:133` |
| Chunk data size | 16 × 48 × 16 = **12,288 bytes** (Uint8Array) | `js/chunk-worker.js:138` |
| Generation thread | Web Worker (`chunk-worker.js`) | `js/chunk-worker.js:293` |
| World boundary | **None** — infinite procedural generation on demand | `js/chunk-worker.js:144` |

Chunk coordinates use `(cx, cz)` with `baseX = cx * 16`, `baseZ = cz * 16`. Each chunk is generated independently from a shared seed.

---

## WORLD_SCALE

- **Current value:** `0.5` (`js/chunk-worker.js:44`)
- **Purpose:** Scales noise frequency in terrain generation. Lower values spread features over larger distances (bigger biomes, wider mountains). Higher values make terrain more detailed but smaller-scale.
- **Used in:** `heightAt()` (lines 45-63) and `biomeAt()` (lines 66-80).
  - Height noise: `x * 0.03 * WORLD_SCALE` → at 0.5 this is `x * 0.015`
  - Coast noise: `x * 0.01 * WORLD_SCALE` → at 0.5 this is `x * 0.005`
  - Dryness noise: `x * 0.015 * WORLD_SCALE` → at 0.5 this is `x * 0.0075`
- **Effect of doubling to 1.0:** Biomes would be ~half as wide, terrain more "busy" at smaller scale.
- **Effect of halving to 0.25:** Biomes would be ~twice as wide, more expansive flat regions.

---

## Cost of 8× world area

The game has no hard world boundary — chunks generate infinitely. "World size" in practice means **how many chunks a player can reach before performance degrades**.

### Memory cost per chunk
- Block data: 12,288 bytes (Uint8Array)
- Plus JS object overhead in the World cache (block arrays, biome data, tree references)
- Estimated ~20–40 KB per chunk in live memory

### Chunk count math
| World radius (chunks) | Total chunks | Est. memory (20 KB/chunk) |
|-----------------------|-------------|---------------------------|
| 16 (current ~playable) | 256 | ~5 MB |
| 32 (4× area) | 1,024 | ~20 MB |
| 45 (8× area) | ~2,025 | ~40 MB |
| 64 (16× area) | 4,096 | ~82 MB |

### Performance considerations
1. **Generation:** Each chunk takes ~5–20 ms on main thread (worker handles it, but postMessage + rendering still costs).
2. **Rendering:** More chunks = more draw calls for trees, blocks, entities. The canvas renderer is the bottleneck.
3. **Entity count:** Trees scale with chunk area (forest biome ~4% chance per block). 8× area = ~8× more trees in range.
4. **Save size:** Each chunk stored in save file = 12 KB raw + compression overhead.
5. **Garbage collection:** More live chunks = more GC pressure during generation of new chunks.

### Practical recommendation
- **8× area (radius ~45)** is feasible on mid-range browsers if:
  - Chunk unload distance stays bounded (don't cache everything)
  - Tree density is capped per-chunk or uses LOD
  - Save compression is used (LZ-based)

---

## Ocean biome

### Definition (`js/chunk-worker.js:70`)
```js
if (h < 16 - 1) return 'ocean';
```
Any column where surface height is **below y=15** is classified as ocean.

### Block composition
- Surface (y=h): `BLOCK.SAND` (line 160) — even for ocean
- y=h+1 through SEA_LEVEL: `BLOCK.WATER` (line 158)
- Below bedrock (y=0): `BLOCK.BEDROCK`

### Depth profile
- Ocean starts at coast noise threshold 0.44 (`js/chunk-worker.js:52`)
- Depth scales quadratically: `depth = (0.44 - coast) / 0.44`, then `y -= depth * depth * 26`
- Maximum ocean depth: ~26 blocks below sea level (at coast=0)

### Tropical islands
- At coast noise < 0.38, island peaks can rise above ocean (`js/chunk-worker.js:56-61`)
- If peak > 0.7 noise, island surface = `Math.max(y, peak)` where peak ranges from 17 to ~45
- These become `tropical` biome if they reach the right height/coast range

### Biome classification summary (`biomeAt()`)
| Condition | Biome |
|-----------|-------|
| h < 15 | ocean |
| h >= 15, h <= 23, coast < 0.4, isle > 0.7 | tropical (island in ocean) |
| h < 20 | shore |
| h > 30, dryness < 0.35 | tundra |
| dryness > 0.65 | desert |
| else | forest (default) |

### Notable gaps / edge cases
1. **Ocean has no sand floor** — surface block is SAND but it's underwater (y=h < 15). The sand is buried under water blocks.
2. **No deep-ocean variant** — all ocean uses same biome label regardless of depth (1 block below sea level vs 26).
3. **No coral/sea floor variation** — ocean biome is flat stone/sand with water column.
4. **Tropical islands are rare** — requires both low coast noise AND high isle noise simultaneously.

---

## Related files

- `js/chunk-worker.js` — chunk generation, noise, biome classification
- `js/biomes.js` — biome rendering / color lookup (if separate from worker)
- `js/gen.js` — main-thread noise helpers (worker duplicates these)
- `js/game.js` — World class, chunk caching, player movement bounds
