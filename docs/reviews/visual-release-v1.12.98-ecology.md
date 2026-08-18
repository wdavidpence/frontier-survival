# Frontier Survival v1.12.98 — Ecology and Climate Checkpoint

Date: 2026-08-18
Base: v1.12.97 / commit 65ed32d
Scope: deterministic understory frequency and climate-correct snow only.

## Player-visible scope

- Reduced the deterministic mushroom threshold from `roll > 0.975` to `roll > 0.9875` in both synchronous `forestFloorDetail` and chunk-worker dressing paths, preserving roots, sticks, damp soil, biome gates, and authored understory behavior.
- Added `snowAllowed({ biome, altitude })` at the GameTime seam.
- Tropical, desert, shore, and ocean contexts reject snow.
- Tundra and genuinely high terrain (altitude >= 32) may snow.
- Legacy `GameTime.tick(dt)` remains valid and preserves the prior unconstrained weather behavior when no climate context is passed.
- `Game.update` now passes the current biome and player altitude to the weather tick.
- No fauna, inventory, save UI, held-item, or geography code was changed beyond required transitive cache-busts.

## Evidence buckets

### Static

- Changed product paths: `js/gen.js`, `js/chunk-worker.js`, `js/time.js`, `js/game.js`, `js/biomes.js`, `js/animals.js`, `js/world.js`, `js/main.js`, both HTML artifacts, and `tests/smoke.mjs`.
- Transitive cache-bust chain updated:
  - gen `287 -> 288`
  - biomes `247 -> 248`
  - world `422 -> 423`
  - worker `283 -> 284`
  - time `224 -> 225`
  - animals `251 -> 252`
  - game `447 -> 448`
  - entry `459 -> 460`
- Root/public HTML are byte-identical.
- All touched JavaScript files pass `node --check`.
- `git diff --check` passes.
- Import audit: 124 relative import edges, zero missing cache-bust markers, zero stale old edges.

### Automated

- `node tests/smoke.mjs`: exit 0.
- PASS assertion lines: 412.
- New deterministic contracts cover:
  - mirrored mushroom threshold and approximately half-rate sampling;
  - tropical/desert/shore/ocean snow rejection;
  - tundra/highland snow allowance;
  - Game climate-context wiring.
- Existing exact forest-floor sample contract was updated from `mushroom` to `roots` because the intentional threshold reduction changes that deterministic sample.

### Runtime

Exact candidate served locally at:
`http://127.0.0.1:18910/?review=ecology-retry&seed=1884808540`

- Start action reached the real handler; the bridge timed out after 5 seconds while generation continued.
- Authoritative probe:
  - `started: true`
  - seed: `1884808540`
  - title hidden: `true`
  - canvas: `1280x720`
  - player: approximately `(33.5, 30.0001, 8.5)` on land
  - initial weather: `clear`
  - page-owned runtime errors: `[]`

### Visual

- Fixed-seed screenshot: `/tmp/frontier-ecology-retry-fixed.png`
- Archipelago water, separate islands, steep tropical relief, HUD, hotbar, and crosshair remain intact.
- No black/gray occlusion, missing terrain, or geography regression was visible.
- Ordinary first frame does not prove mushroom frequency or snow gating visually; those are backed by pure/source/runtime contracts.

## Decision

Accepted as a complete local v1.12.98 ecology/climate checkpoint pending commit, push, and live Pages verification. Aquatic encounter readability remains an open later slice; the already-working Reef Shark ordinary-distance notice was preserved.
