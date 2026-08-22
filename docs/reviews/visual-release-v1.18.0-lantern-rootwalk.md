# Frontier Survival v1.18.0 — Lantern Rootwalk checkpoint

## Release scope

This release advances the published v1.17.9 tropical survival slice into a more authored coastal expedition:

- open tropical/offshore geography and shore composition;
- Mangrove Lantern Rootwalk approach beacon and bridge dressing;
- wet wood/support presentation and localized lantern contact lighting;
- warm localized water reflection response;
- lantern inspection milestone, audio feedback, fish-bait reward, and save persistence;
- authored mangrove ecology and feedback: fireflies, moths, frogs, crabs, mudskippers, dragonflies, and egret;
- preserved survival, fishing, boat, save/load, and co-op contracts.

## Provenance

- Base: latest `origin/main` v1.17.9 (`86441cd`)
- Product source: reviewed isolated candidate `8458d31`
- Release worktree: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1.18.0-release-20260822`
- Release version: v1.18.0
- Entry cache-bust: `main.js?v=640`

## Evidence buckets

### Static

- Clean worktree created from latest origin/main; canonical dirty checkout untouched.
- Reviewed product/test files applied without stale candidate documentation.
- `index.html` and `public/index.html` synchronized.
- Version surfaces updated to v1.18.0.

### Automated

- `node tests/smoke.mjs`: 417 PASS lines, exit 0.
- Touched JavaScript syntax checks passed.
- `git diff --check`: passed.
- Executable relative-import audit: 125 edges, 0 missing cache-busts, 0 missing targets.

### Runtime

- Exact candidate served over HTTP.
- Start reached `window.__FS.started === true` and hid the title screen.
- Fixed seed `1884808540` booted successfully.
- Lantern interaction reached the real production path.
- Lantern milestone and fish-bait reward persisted through save state.
- Repeat interaction did not duplicate the reward.
- Browser console/page-owned errors: zero.

### Visual

The fixed-seed desktop comparison opens the published frame's large foreground wall into a broader tropical/offshore composition with a clearer island horizon. The release remains an incremental checkpoint, not AAA parity: water tiling, harsh voxel silhouettes, dense objective text, and ordinary-route Rootwalk reveal remain open visual gaps.

## Decision

Checkpoint approved for publication as v1.18.0, with the next visual gate focused on water depth/shore response, a cleaner ordinary Rootwalk route reveal, and compact expedition HUD presentation.
