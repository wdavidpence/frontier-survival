# Frontier Survival v1.12.16 — 20-bug fix sprint

Baseline: published v1.12.15, commit 8718de7.
Scope: version integrity, start-screen usability, terrain/worker generation, co-op survival, controller input, audio, and optional barrel module.

## Fixed bugs

1. Start-screen tag stayed hard-coded at v1.12.14.
2. Boot console message stayed hard-coded at v1.12.14.
3. HTML title/version badge were not advanced with the bug-fix release.
4. Tall/narrow title panels could place Start below the viewport with no scroll path.
5. Tropical subsurface blocks were incorrectly sand in synchronous generation.
6. Tropical subsurface blocks were incorrectly sand in worker generation.
7. Negative chunk X coordinates could select a negative worker-array index.
8. Worker responses had no request identity; concurrent success responses could resolve the wrong chunk promise.
9. Worker errors had no request identity; concurrent failures could reject the wrong chunk promise.
10. Worker assignment hashed only X, causing all Z slices in a column to serialize on one worker.
11. P1 standard gamepad right-stick X read axis 4 instead of axis 2.
12. Co-op gamepad right-stick X read axis 4 instead of axis 2.
13. P1 gamepad polling could throw or read invalid axes from malformed gamepad objects.
14. Co-op gamepad polling could throw or read invalid axes from malformed gamepad objects.
15. P1 movement could remain latched after a pad disconnect.
16. P2 movement could remain latched after a pad disconnect or missing navigator gamepad API.
17. L2 sprint assist read button 2 instead of the standard button 6.
18. P2 survival sampled P1 campfire heat, making distance from fire irrelevant for P2.
19. The optional barrel module imported utils without a cache-bust query.
20. The optional barrel module crashed when loaded alone because BaseComponent was an undeclared global; its primary visual now also mirrors persisted loot/open state.
21. Water entry could play both splash and fallback step audio because optional chaining was combined with `||`.
22. Invalid controller deadzones could divide by zero or produce unstable values.
23. World worker count assumed navigator.hardwareConcurrency existed.

Items 1–20 are the requested bug count; items 21–23 are additional fixes found during the same pass.

## Evidence

- `node tests/smoke.mjs` — exit 0; full suite passes.
- `node --check js/game.js` — pass.
- `node --check js/world.js` — pass.
- `node --check js/chunk-worker.js` — pass.
- `node --check js/input.js` — pass.
- `node --check js/input-coop.js` — pass.
- `node --check js/barrel.js` — pass.
- `git diff --check` — pass.
- `cmp -s index.html public/index.html` — pass.

## Release gate remaining

Run a fresh local Chromium boot and in-world screenshot, then commit/push only this clean worktree and verify the live Pages HTML, changed modules, Start state, console, and in-world frame.
