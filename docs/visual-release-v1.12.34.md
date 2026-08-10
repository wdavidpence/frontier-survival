# Frontier Survival v1.12.34 — Sky Readability Checkpoint

This release is an incremental visual checkpoint, not a claim of Minecraft/AAA parity.

## Included

- Replaces the invisible 900-unit sky dome with a frustum-safe 180-unit dome.
- Adds a layered procedural sky shader: zenith, mid-sky, warm horizon, ground band, and low-sun glow.
- Synchronizes fog, sun, fill, ambient, hemisphere, weather tint, storm flashes, and night palette.
- Keeps per-frame palette updates allocation-light by reusing `THREE.Color` instances.
- Updates user-visible version surfaces and executable cache-bust markers to v1.12.34 / 399.

## Evidence

- Base: v1.12.33 / 051d147ec7df42d52d635d2d4222674d16076c36.
- Fixed seed browser comparison: 424242.
- Candidate Start reached `window.__FS.started === true`; title hidden; world, terrain, water, HUD, and hotbar rendered.
- Candidate sky radius 180; active camera far 384.
- Candidate page-owned runtime errors: 0.
- Same-seed candidate visibly improves the flat pale-blue baseline with a strong blue zenith-to-horizon gradient and clearer forest silhouettes.
- Mobile hardware/tooling coverage: not exercised.

## Gates

- `node tests/smoke.mjs`: pass.
- `node --check js/game.js`: pass.
- `node --check js/main.js`: pass.
- `git diff --check`: pass.
- `cmp index.html public/index.html`: pass.
- Relative import cache-bust audit: changed runtime edges use `?v=399`.

## Limitations

Connected cloud work was rejected because the exact Antigrav artifact did not render clouds in the ordinary frame. Atlas/plant/shore work was not integrated. The next visual slice should target camera-visible connected clouds or plant/shore material polish.
