# Chicken WIP review (judge)

Date: 2026-07-30
Scope: uncommitted `js/animals.js` chicken SPECIES + feed path

## Verdict
Accept with small judge fixes applied.

## What was good
- SPECIES.chicken passive stats (hp/speed/flee/meat range/count) are coherent with hare/deer.
- FaunaSystem iterates `Object.values(SPECIES)`, so chicken auto-spawns without a separate registry.
- Meat drops use meatMin/meatMax path already used by other species.

## Gaps found (fixed by judge)
1. `feedItem: 'seed'` did not match ITEM/feed maps (`seeds` / ITEM.SEEDS=116).
2. `_FEED_ID` lacked `seeds: 116` so canFeed/tryFeed failed for numeric SEEDS.
3. game.js prompt feedMap lacked seeds.

## Remaining non-blockers
- No dedicated chicken mesh/animation (uses generic color/scale box path like other animals).
- No egg-laying behavior yet (out of card scope).
- No smoke coverage existed; added chicken SPECIES feed regression.

## Smoke
`node tests/smoke.mjs` must pass after fixes.
