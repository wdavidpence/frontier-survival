# local35 MC pure module verify (2026-07-31)

Judge-assisted verify after local35 slow lane. Commands run on judge host.

## Files present

- `js/building-shapes.js` — stair/slab/door/fence
- `js/tool-tiers.js` — wood/stone/iron tiers
- `js/smelting.js` — fuel + SMELT_RECIPES
- `js/ore-drops.js` — ore drop catalog
- `js/station-catalog.js` — station tags
- `js/mine-tier.js` — harvest/speed helpers
- `js/roof-shapes.js` — ramp/roof pure shapes
- `js/hotbar-cycle.js` — dual hotbar edge cycle

## Smoke

```
node tests/smoke.mjs
```

Expected: all PASS including building-shapes, tool-tiers, smelting, and new pure modules (see suite count at end of run).

## Imports in smoke

`tests/smoke.mjs` imports building-shapes, tool-tiers, smelting, ore-drops, station-catalog, mine-tier, roof-shapes, hotbar-cycle.

## Notes

- Crafting already lists stairs_wood, slab_wood, door, fence (wire acceptance met).
- Add-only policy: no feature removal.
- Follow-up: furnace UI tick, mine path wire, game.js hotbar edge wire for pads.
