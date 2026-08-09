# Frontier Survival — AAA Quality Recovery Plan

Status: active orchestrator plan
Baseline: local v1.12.29, commit 6fc795b (not pushed)
Live baseline: v1.12.28 remains unchanged until an explicit publish request and full live gate

## Goal

Make Frontier Survival a genuinely playable, beautiful, original browser survival game with a reliable early-game loop:

1. start a world;
2. understand the controls;
3. mine trees, dirt, stone, and resources;
4. craft and equip useful tools;
5. build, explore, survive, and hear/see satisfying feedback;
6. return to a world that remains readable, varied, and fun.

The target is Minecraft/SurvivalCraft-class clarity and systemic richness, not a superficial shader imitation.

## Recovery order

### Phase 0 — Release integrity
- keep the canonical dirty checkout quarantined;
- use clean isolated worktrees rooted at the latest verified local checkpoint;
- preserve root/public HTML parity and all transitive ES-module cache busts;
- require smoke, syntax, diff, browser Start, console, and screenshot evidence for every checkpoint.

### Phase 1 — P0 playability
- reproduce and fix mining/tree/dirt block breaking;
- restore obvious Pack & Craft reachability;
- make the first tool progression understandable and verifiable;
- verify place/build actions, inventory ownership, save/load, and controller paths;
- add deterministic regression coverage for each recovered contract.

### Phase 2 — Player-visible quality
- improve lighting/contact readability without black or gray occlusion;
- replace cube-stamped small flora with readable 3D silhouettes (mushrooms first);
- improve terrain composition, landmarks, water/coast readability, and fauna/action feedback;
- add sound cues for mining, placing, crafting, damage, pickup, and UI transitions.

### Phase 3 — Depth and retention
- deepen tool tiers, resource distribution, building readability, and crafting stations;
- make ecology, weather, day/night, ocean travel, and co-op interactions legible and rewarding;
- polish tutorial flow, feedback, accessibility, mobile/TV layouts, and performance.

## Lane policy

- Luna and Antigrav may run disjoint implementation lanes in parallel.
- Claude gets one bounded lane at a time for multi-file visual/gameplay integration.
- Ornith is reserved for one small directed pure-module/test/data task at a time with a 1200-second cap; it is a helper, not the owner of a hot-file architecture change.
- Workers do not commit, push, deploy, or decide acceptance.
- The orchestrator reviews exact diffs, runs checks independently, browser-tests the exact worktree, and accepts/rejects from screenshots and authoritative runtime state.

## Current cards

- P0 mining/tree/dirt recovery — Luna — active
- P0 Pack & Craft/tool progression recovery — Antigrav — active
- P1 mushroom 3D silhouette — Claude — active

The historic blocked/scheduled backlog is quarantined. It will not be mass-retried. Old cards may be archived in a separate board-maintenance pass after this recovery program has a clean replacement inventory; history will not be erased.

## Evidence gate per slice

Static: exact worktree, allowed files, diff scope, cache-bust and parity.
Automated: node --check, node tests/smoke.mjs, git diff --check, focused regression.
Runtime: fresh HTTP candidate, Start, authoritative started/title/world/player state, interaction state, zero console errors.
Visual: ordinary in-world screenshot, useful target scale, readable terrain/HUD, no black/gray/washed-out artifacts.
Mobile/TV: responsive and controller evidence when the slice touches those surfaces.

A worker summary, green smoke result, or spawned process is never sufficient by itself.

## Release vocabulary

- worker artifact: unreviewed diff in an isolated lane;
- candidate: artifact passing static/automated checks;
- local checkpoint: candidate passing exact browser/runtime and screenshot judgment;
- published release: explicit commit/push plus independent live HTML/asset/browser proof;
- final goal: not yet met until the core loop is fun, usable, and visually coherent across several accepted checkpoints.
