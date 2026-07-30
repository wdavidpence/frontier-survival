# Frontier Survival — 20 Polishes (v1.5)

Research basis (SurvivalCraft public design pillars — systems only, no IP):
nature-as-antagonist, clothing/shelter, food seriousness, dangerous fauna,
caves/ores, weather pressure, building (doors/glass/bricks), injury realism,
desert/tundra climate variation, and QoL feedback loops.

Status: ⏳ pending · 🟢 in progress · ✅ done

| # | Item | Status |
|---|------|--------|
| 1 | Wooden door block — place, F toggle open/close (collision when shut) | ✅ |
| 2 | Glass pane/block — smelt sand at heat; transparent build | ✅ |
| 3 | Clay surface pockets + clay item drop | ✅ |
| 4 | Brick smelt + brick block for sturdy builds | ✅ |
| 5 | Bear predator (tanky, high damage, meat/hide) | ✅ |
| 6 | Cave worm tunnels in deep stone gen | ✅ |
| 7 | Rain slowly extinguishes unroofed campfires | ✅ |
| 8 | Storm lightning flash + thunder SFX | ✅ |
| 9 | Desert/sand heatstroke pressure on hot clear days | ✅ |
| 10 | Bleed injury from predator bites until bandage/salve | ✅ |
| 11 | Bandage craft (cloth) stops bleed | ✅ |
| 12 | Wooden sword craft (melee polish) | ✅ |
| 13 | Drink fresh water (F on water) — stamina/thirst relief, wetness cost | ✅ |
| 14 | Death marker: show death coords + temporary world beacon | ✅ |
| 15 | Crosshair block/entity name label | ✅ |
| 16 | Footpath wear: repeated steps turn grass → dirt | ✅ |
| 17 | Furnace block — dedicated heat station (fuel + smelt bonus) | ✅ |
| 18 | Shift-click inventory: split stack in half | ✅ |
| 19 | Sleep fade overlay + calmer night skip | ✅ |
| 20 | Feed berries to prey to calm briefly; docs/tests/v1.5 publish | ✅ |

## Critical Bugfix
- **_tickCampfires**: Fixed campfire fuel tick not decrementing properly, causing fires to burn indefinitely without consuming logs.

## Constraints
- Original code/art/audio only; SurvivalCraft-inspired systems, not assets.
- Keep pure logic testable in `tests/smoke.mjs`.
- Sync root `index.html` and `public/index.html`.
- Preserve saves: additive fields with defaults.
- No destructive git (no reset/clean/checkout of tracked work).
- Hermes orchestrates; OpenCode implements code.

## Verification
- `node tests/smoke.mjs` all pass (target ≥45).
- Module syntax extract + compile for changed JS.
- Local serve + browser smoke when possible.
- Commit + push `main` → GitHub Pages live.
