# Restore note — v1.12.10

Date: 2026-08-02T11:40:34

User reported v1.13.x start screen degraded and game would not start.
Restored product surfaces (`index.html`, `public/`, `js/`, `tests/`) from git commit `9e29f82` (v1.12.9).

Small additive fixes on top of that base for green smoke/publish:
- `invLerp` export on `js/coop-proximity.js` (smoke expected it)
- `BLOCK.STAIRS_WOOD` / `BLOCK.SLAB_WOOD` ids+props (smoke shapeType mapping)
- Version markers v1.12.10, entry cache `main.js?v=241`

Prior tip before restore was recorded in `docs/reviews/pre-restore-1.13.4-HEAD.txt` for later salvage of pure modules if desired.
