# Visual Release Handoff — v1.12.40

## Scope

Incremental visual checkpoint from the three-lane Antigrav / Claude / Luna sprint.
Only the Claude plantlife slice was accepted and synthesized. Rejected lane experiments remain isolated and are not part of this release:

- Luna `js/game.js`: fixed-seed frame was too close to baseline after two bounded passes.
- Antigrav `js/atlas.js`: texture/water changes were not clearly attributable in the ordinary fixed-seed opening frame.

## Accepted player-visible change

`js/world.js` now renders existing bush, root, and stick-pile plant blocks as deterministic, bounded procedural blade/arch/twig silhouettes instead of cube-like greedy-mesh clutter. The geometry is clamped to its host voxel, capped per chunk, and preserves block data, collision, streaming, and drops.

## Evidence buckets

### Static

- Exact candidate workspace: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-aaa-release-20260811`
- Baseline: `origin/main` at `38def2585c9d8c9212296b5559a922ffc3e1cef7`
- Changed product files: `js/world.js`, plus release version/cache-bust surfaces.
- Root/public HTML kept byte-identical.

### Automated

- `node tests/smoke.mjs` exited 0; harness reported 365 passing assertions across its suites.
- `node --check js/world.js`, `js/game.js`, and `js/main.js` passed.
- `git diff --check` passed.
- `world.js` importer cache-bust advanced to `?v=289`; entry script advanced to `main.js?v=405`.

### Runtime / visual

- Exact candidate served from an ephemeral local HTTP server and exercised in headless Chromium.
- Fixed seed: `424242`.
- Start reached `window.__FS.started === true`; title overlay hidden; canvas 1440x900; HUD meters and hotbar present.
- Ordinary opening screenshot: `/tmp/fs-release-v1240-fixed.png`.
- The frame shows a clear, non-regressive understory improvement: the dense brown cube/branch clutter is replaced by cleaner green procedural silhouettes. HUD, horizon, water edge, and terrain remain visible.
- The probe also reported two 404 resource responses; these were not page exceptions and are retained as a follow-up investigation item rather than silently called zero-error.

## Remaining visual gap

This is an incremental checkpoint, not Minecraft/AAA parity. The fixed-seed frame still has overly dark forest shadows, over-bright sand, blocky cloud geometry, and limited water/material response. The next bounded slice should target readable lighting/material balance or water/shore polish, with fixed-seed ordinary-frame proof before acceptance.
