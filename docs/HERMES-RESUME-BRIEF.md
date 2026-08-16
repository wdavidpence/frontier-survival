# Frontier Survival — v1.12.73 release checkpoint

Updated: 2026-08-16

## Result

Prepared v1.12.73: forest readability, usable inventory hotbar assignment, slower pacing, and corrected early-game material semantics on top of v1.12.71.

- Product commit: `1cc1882b221b320cd7a5f71c8c83f676e9a8dcab`
- Tag: `v1.12.73` (prepared; publication pending)
- Product commit is locally verified on `release/v1273-experience-20260816`; push/live verification remains pending.
- Live: https://wdavidpence.github.io/frontier-survival/
- Clean release worktree: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-sprint-v1272-forest`
- Canonical checkout remains broad dirty WIP and quarantined.

## Accepted slice

- `js/world.js` and `js/chunk-worker.js` mirror a bounded forest readability marker/clearing slice; the final marker uses warm sandstone/brick materials and avoids the rejected dark cobble mass.
- Inventory assignment now lets players click a crafted item outside slots 1–9, then click a hotbar slot to equip/swap it; ordinary selection and shift-splitting remain intact.
- Difficulty labels stay inside responsive menu buttons; the top-right guide is labeled `How to play`.
- New worlds use a 900-second day; legacy 420-second saved defaults migrate while explicit values remain intact.
- Bare-hand/non-axe wood harvesting is substantially slower, cloth uses Wheat plant fiber, and hide remains the animal-skin input for leather/clothing.
- Version/cache surfaces: v1.12.73, `main.js?v=435`, `main.js` → `game.js?v=429`, `game.js` → `time.js?v=223`, `items.js?v=245`, `crafting.js?v=411`.

## Evidence

### Static/automated

- `node --check` passed for all changed JavaScript files.
- `node tests/smoke.mjs`: exit 0, 170 tests passed.
- Reachable import audit: 59 files, 101 relative edges, zero missing cache queries/targets; orphan/type-only references excluded.
- `git diff --check`: passed.
- `cmp index.html public/index.html`: passed.

### Local runtime/visual

- Exact v1.12.73 candidate served from the release worktree.
- Fixed seed: `1884808540`.
- Start reached `started=true`, v1.12.73 title, 1280x720 canvas, zero page-owned errors, and `dayLength=900`.
- Field Note appeared, then expired to `display:none` with zero height; the blank message frame is fixed.
- Crafting panel visibly reports `3 Wheat (plant fiber) → 2 Cloth`.
- Fixed forest diagnostic shows a readable warm marker and clearer sightline without black/gray, sky, terrain, or HUD regression.

### Live runtime/visual

- Live publication and Pages verification are pending the authorized push of commit `1cc1882b221b320cd7a5f71c8c83f676e9a8dcab`.

### Mobile

- 390x844 mobile menu: no horizontal overflow; panel fits viewport; all difficulty labels fit inside buttons; zero page errors.

## Worker outcomes

- Antigrav v1.12.70 understory candidate: accepted in the prior release.
- Palm landmark candidates from Antigrav/Grok45: rejected; one had no artifact and the real diff was visually indistinguishable from ordinary forest.
- Antigrav ruin worker: no artifact; frontier judge implemented the bounded ruin fallback after worker escalation.
- MOA_OQ remains paused per user direction.

## Next bounded slice

The next highest-value gap is crafting-panel visual readability: add item icons/pictures while preserving the now-correct recipe semantics. Keep sync/worker parity, fixed-seed screenshots, live verification, and mobile evidence as release gates. Do not claim AAA parity.

This is an incremental verified checkpoint, not a claim of Minecraft/AAA parity.
