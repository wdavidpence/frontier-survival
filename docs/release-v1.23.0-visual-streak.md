# Frontier Survival v1.23.0 — Visual Streak

## Scope

Visual-only release checkpoint. This release does not add new creatures, plants, items, recipes, or gameplay products.

- Readable tropical terrain and canopy shadows.
- Controlled grass, palm, leaf, spruce, and sequoia palettes.
- Warm layered sky and horizon treatment.
- Wet sand, damp soil, and sea-level wet-rock response.
- Open-channel fresh-arrival camera composition with distant island silhouettes.
- Wider FOV and calmer first-frame pitch.
- Glass HUD/status/destination treatment and portrait HUD hierarchy.
- Root/public HTML parity and full transitive cache-busting.

## Verification

- `node tests/smoke.mjs`: 439 assertions passed.
- Changed-module syntax checks passed.
- `git diff --check`: passed.
- `cmp index.html public/index.html`: passed.
- Executable relative import audit: 137 edges, 0 missing cache-busts.
- Local desktop Start: `window.__FS.started === true`, title hidden, zero page errors.
- Local portrait Start at 390x844: started, no document overflow, zero page errors.

## Honest remaining gap

The first-person salvage chest remains visually prominent in the arrival frame. The next visual sprint should reduce that foreground obstruction and continue improving broad island-horizon composition without adding gameplay breadth.
