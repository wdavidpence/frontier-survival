# Frontier Survival v1.12.46 — Visual Synthesis Release

## Scope

Second visual sprint synthesized from three isolated lanes on v1.12.45:

- Antigrav: naturalized terrain palettes, richer bark/log textures, lifted greedy face shading, and deterministic randomized plant yaw/offsets in `js/atlas.js` and `js/mesh-greedy.js`.
- Claude: safer camera far-plane coverage, continuous dawn/dusk lighting, stronger horizon haze, improved fog color, smoother night/day light transitions, and sun color/scale transitions in `js/game.js` and `js/sky-clouds.js`.
- Luna: authored in-world status ribbon, compass heading cue, field-note/prompt/milestone presentation, focus states, and responsive co-op/mobile HUD treatment in both HTML artifacts and `js/main.js`.
- Judge correction: raised the daytime greedy material ambient floor to preserve forest hue/detail without flattening night lighting.

## Evidence

- Baseline: v1.12.45, commit `787d7c20554bfb32c6f2332a28a2c2baf029fc3d`.
- `node tests/smoke.mjs`: exit 0, 365 tests passed.
- Changed JS syntax checks: pass.
- `git diff --check`: pass.
- `cmp index.html public/index.html`: pass.
- Relative static ES import audit: 109 edges, 0 missing cache-bust queries.
- Old v1.12.45/version-410 markers removed from release surfaces.
- Desktop candidate 1440x900: v1.12.46, `main.js?v=411`, Start true, title hidden, canvas/HUD/world present, zero page/runtime errors.
- Fresh mobile candidate 390x844: panel contained, document has no overflow, Start true, title hidden, 390x844 canvas.

## Visual acceptance

Accepted as a real player-visible checkpoint: terrain palette is less neon, plant distribution is less grid-repetitive, the horizon and dawn/dusk behavior are richer, forest terrain is more readable than v1.12.45, and the in-world HUD now communicates location/time/weather/heading with stronger hierarchy.

The remaining gap is explicit: the renderer is still stylized low-poly voxel art, tree trunks and canopy remain visually heavy in close forest frames, and this is not literal Minecraft AAA parity. The next roadmap gate is authored biome/landmark composition plus another measured forest/material pass, not another disconnected effect pack.
