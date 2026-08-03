# Frontier Survival v1.12.17 — visual/lighting release

Baseline: v1.12.16, commit 98e0bb6.

Shipped visual slice:

- Added a camera-following gradient sky dome with warm horizon and cool upper-sky colors.
- Enlarged the dome to cover the complete camera frustum; the initial 180-unit version produced pale edge arcs and was corrected to 900 units before release.
- Enabled high-performance WebGL preference and PCF soft shadow support.
- Enabled cast/receive shadow flags on streamed chunk meshes.
- Increased daytime sun, ambient, hemisphere, and atlas fill lighting to reduce black tree silhouettes while preserving night lighting behavior.
- Added a spawn-clearance test around candidate surfaces so fresh sessions avoid starting inside nearby logs/leaves.
- Kept terrain generation, custom atlas geometry, and distant landmark geometry unchanged to avoid the prior gray-occlusion regression.
- Bumped visible version surfaces to v1.12.17 and entry cache-bust to `main.js?v=270`.

Verification:

- Exact smoke command passes, including the canonical version/HTML regression assertions.
- `node --check js/game.js` and `node --check js/world.js` pass.
- `git diff --check` passes.
- `index.html` and `public/index.html` are byte-identical.
- Local Chromium Start passes with `window.__FS.started === true` and zero page runtime errors.
- Fresh local in-world screenshot passes: clean sky, readable terrain/horizon/HUD, no side-arc artifact, no gray occluding field.

Known limitation: the underlying voxel palette and vegetation geometry remain stylized and darker than a Minecraft-2025 target; this release improves the lighting/atmosphere layer without attempting a risky terrain-shader rewrite.
