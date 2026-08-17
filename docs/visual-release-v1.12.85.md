# Frontier Survival v1.12.85 — ordinary fauna encounter checkpoint

Date: 2026-08-17
Base: v1.12.84 / `b7dc0d1670c3da941686a9782c64ee287cc2023d`

## Accepted slice

The existing deterministic starter-fauna search now uses a 10–16 world-unit forward/right cone rather than an 18–28m ring. The existing ground, water, air, occupied-cell, world-radius, normal simulation, and mesh-sync paths remain unchanged. This makes one passive hare encounter readable during ordinary fresh-world traversal without adding a HUD-only cue or instrumented animal.

## Evidence buckets

- Static: `js/animals.js` starter offset/radius constants and the focused deterministic smoke expectation changed; no renderer, worldgen, save format, or HTML layout rewrite.
- Automated: `node --check js/animals.js`, `node --check js/main.js`, `git diff --check`, root/public parity, 400 PASS smoke lines, executable import audit `101 edges / 0 missing`.
- Runtime: exact candidate served from `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1285-release-20260817` at `http://127.0.0.1:9013/`; Start reached `window.__FS.started === true`, seed 2, title hidden, zero page-owned runtime errors.
- Visual: fresh fixed-seed-2 screenshot `/mnt/c/Users/wdavi/Projects/Frontier-Survival-sprint-20260817/frontier-v1285-plusx-seed2.png` independently inspected. A passive hare is visibly readable at ordinary distance in the forward forest lane; water/shore, Iron Ravine cue, HUD, hotbar, camp marker, and renderer remain intact with no black/gray/opaque occlusion.
- Mobile/co-op: not collected in this checkpoint.

## Worker disposition

Two supervised fauna worker attempts were preserved as no-artifact/review-only attempts after broad discovery without a patch. The final six-line placement correction was applied by the frontier orchestrator in a fresh release worktree after independent source and browser diagnosis. No worker WIP or dirty canonical checkout is included.

## Decision

Accepted checkpoint; publish v1.12.85. Continue next toward richer visible animal behavior (browse/flee/approach feedback) and authored forest/shore staging. This remains an incremental checkpoint, not AAA parity.
