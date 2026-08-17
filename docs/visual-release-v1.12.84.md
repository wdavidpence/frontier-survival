# Frontier Survival v1.12.84 — landmark composition checkpoint

Date: 2026-08-17
Base: v1.12.83 / `be15ebc64df4f4e0348b98510346a45ff62c1b73`

## Accepted slice

The Iron Ravine destination keeps its existing 3x3 cobble base, ore spine, torch, interaction range, expedition phases, and save/co-op semantics. Fresh generated destinations that would land under 40 horizontal units from camp are projected along their existing direction to a deterministic 44-unit target and resolved through the existing safe-surface search. Saved/legacy destination coordinates are not forcibly relocated.

## Evidence buckets

- Static: one production file changed by the worker (`js/game.js`); release surfaces and smoke expectation updated separately; no deletes or broad rewrites.
- Automated: `node --check js/game.js`, `node --check js/main.js`, `git diff --check`, root/public HTML parity, 400 PASS smoke lines, executable relative-import audit `101 edges / 0 missing`.
- Runtime: exact candidate served from `/mnt/c/Users/wdavi/Projects/Frontier-Survival-v1284-release-20260817` on `http://127.0.0.1:9001/`; v1.12.84; Start reached `window.__FS.started === true`, title hidden, zero page-owned errors.
- Visual: fresh ordinary frame plus matched fixed seed 2 frame inspected. The previous foreground Iron Ravine occluder is removed from the sightline; forest horizon, water, shore, HUD, hotbar, and camp marker remain readable. No black/gray/opaque renderer artifacts.
- Mobile/co-op: not collected in this checkpoint.

## Rejected companion

The isolated deterministic fauna attention/pose artifact in `/mnt/c/Users/wdavi/Projects/Frontier-Survival-fauna-encounter-worker-20260817` passed static/smoke checks but remains review-required and unshipped because ordinary seed-18 frames did not show a readable animal. It is not included in v1.12.84.

## Decision

Accepted checkpoint; continue toward an ordinary-distance visible fauna encounter and richer forest/shore authoring. This is not AAA parity.
