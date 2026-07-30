# Frontier Survival — v1.6 Improvement Plan

Research basis: SurvivalCraft design pillars (systems only, no IP) — multi-biome world depth, animal husbandry, advanced travel, logic/electricity lite, and player quality-of-life features that push from "survive the first night" to "build a thriving homestead."

Status: ⏳ pending · 🟡 in progress · ✅ done

| # | Item | Status |
|---|------|--------|
| 1 | Multi-biome world gen (forest, desert, tundra, taiga) with biome-specific flora/fauna/ores | ⏳ |
| 2 | Animal breeding — feed two adults to spawn offspring (cows, sheep) | ⏳ |
| 3 | Placeable boats — RMB on water surface places boat mesh; WASD sails, Esc exits | ⏳ |
| 4 | Logic/electricity lite — lever, button, redstone-wire (signal propagation), piston door | ⏳ |
| 5 | Map item — crafted paper map renders explored chunks as mini-map overlay (E to open) | ⏳ |
| 6 | Compass item — crafted needle points to spawn; HUD toggle or handheld use | ⏳ |
| 7 | Farming/crops — till soil with hoe, plant seeds (wheat), water with bucket, harvest | ⏳ |
| 8 | Saddle + rideable animals — craft saddle, mount tamed cows/horses for travel | ⏳ |
| 9 | Tool tier progression — stone/iron tools with hardness gates + faster mining speed | ⏳ |
| 10 | Explosives/TNT — craft, fuse (campfire), remote detonation with pressure plate | ⏳ |
| 11 | Building blocks: fences, walls, ladders — craft from wood/stone, place/climb | ⏳ |
| 12 | Water bucket + lava bucket — collect/flow water, create obsidian/cobble | ⏳ |
| 13 | Fire spread system — unroofed wooden structures catch fire from lightning/arson, self-extinguish | ⏳ |
| 14 | Spoilage refinement — ice box (ice + wood) slows meat spoilage; cooked food lasts longer | ⏳ |
| 15 | More predator variety — spider (nocturnal), wolf pack (hunt in groups at night) | ⏳ |
| 16 | Weather depth — snow accumulates on ground in cold biomes; drought in deserts affects crops | ⏳ |
| 17 | Inventory QoL — auto-sort, stack-merge across slots, quick-craft common recipes | ⏳ |
| 18 | Adventure structures — abandoned camp, shipwreck, ruined tower (loot chests inside) | ⏳ |
| 19 | Difficulty mode UI — in-game menu to select Harmless/Survival/Challenging/Cruel | ⏳ |
| 20 | Save/load slots — title screen slot select, world seed display, export/import JSON | ⏳ |

## Critical Dependencies
- Biome gen (#1) blocks biome-specific weather (#16) and adventure structures (#18).
- Logic/electricity (#4) requires new block properties (signal strength, power state).
- Farming (#7) depends on hoe tool + water bucket (#9 partially, #12).
- Placeable boats (#3) builds on existing boat item from v1.3.

## Constraints
- Original code/art/audio only; SurvivalCraft-inspired systems, not assets.
- Keep pure logic testable in `tests/smoke.mjs`.
- Sync root `index.html` and `public/index.html`.
- Preserve saves: additive fields with defaults.
- No destructive git (no reset/clean/checkout of tracked work).
- Hermes orchestrates; OpenCode implements code.

## Verification
- `node tests/smoke.mjs` all pass (target ≥50).
- Module syntax extract + compile for changed JS.
- Local serve + browser smoke when possible.
- Commit + push `main` → GitHub Pages live.
