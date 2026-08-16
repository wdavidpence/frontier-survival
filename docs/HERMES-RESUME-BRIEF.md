# Frontier Survival — v1.12.71 release checkpoint

Updated: 2026-08-16

## Result

Prepared v1.12.71: high-contrast tropical ruin landmark on top of v1.12.70.

- Product base: v1.12.70 tag / `ab059a9`
- Candidate worktree: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-aaa-release-v1271-ruin-20260816`
- Canonical checkout remains broad dirty WIP and quarantined.
- Live remains v1.12.70 until this candidate passes push and propagation gates.

## Candidate slice

- `js/world.js` and `js/chunk-worker.js` mirror a sparse tropical ruin predicate at normalized world coordinates `x % 32 === 22`, `z % 32 === 26`.
- The ruin is a bounded 3x3 footprint with two COBBLE side pillars, BRICKS bands, a raised lintel, and an open center doorway.
- Normal tree rolls, existing v1.12.70 fan understory, collision, and drops remain otherwise unchanged.
- Version/cache surfaces are v1.12.71, `main.js?v=433`, `game.js` → `world.js?v=416`, and `world.js` → `chunk-worker.js?v=281`.

## Evidence

### Static/automated

- `node --check js/game.js`, `js/world.js`, `js/main.js`, `js/chunk-worker.js`: passed.
- `node tests/smoke.mjs`: exit 0, 391 PASS lines.
- Smoke contract verifies the ruin predicate/material/helper in both generators.
- `git diff --check`: passed.
- `cmp index.html public/index.html`: passed.

### Local runtime/visual

- Exact candidate served from the named release worktree.
- Fixed seed: `1884808540`.
- Start reached `started=true`, title hidden, 1280x720 canvas, zero page-owned errors.
- Opening frame shows distinct gray/red ruin silhouettes in the midground without new darkness, terrain occlusion, sky loss, or HUD overlap.
- Controlled face-to-target probe at the deterministic starter-route coordinate confirmed actual COBBLE/BRICKS blocks and zero runtime errors.

### Mobile

- Mobile/portrait evidence remains pending; no mobile claim is made.

## Worker outcomes

- Antigrav palm candidate: no artifact; rejected as no progress.
- Grok45 palm candidate: real parity diff, but visually indistinguishable from ordinary forest; rejected and preserved.
- Antigrav ruin worker: no artifact; frontier judge implemented the same bounded hypothesis after worker escalation.

## Release decision

If final local diff/version review remains green, commit and push v1.12.71, tag it, verify live Pages HTML/version, run live Start/runtime, and inspect the live fixed-seed frame. If the live frame loses the ruin or introduces occlusion, do not publish and return to the v1.12.70 checkpoint.

This is an incremental verified checkpoint, not a claim of Minecraft/AAA parity.
