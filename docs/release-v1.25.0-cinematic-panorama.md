# Frontier Survival v1.25.0 — Cinematic Island Panorama

## Scope

Visual-only panorama release. No new creatures, plants, items, recipes, or gameplay products.

- Fresh arrival camera now opens at yaw `0.92`, pitch `0.0` toward the authored channel.
- The golden starter-sand foreground becomes a thinner cinematic lip instead of filling the lower half of the frame.
- Open water and distant island silhouettes occupy the middle/upper composition.
- Existing sea-level cove spawn, boat, HUD, and saved-world camera behavior remain intact.
- Portrait layout retains the compact mobile HUD and hides the secondary destination card to avoid truncation.

## Verification

- Antigrav panorama artifact independently inspected and accepted by screenshot.
- `node tests/smoke.mjs`: 439 assertions passed.
- Changed-module syntax checks passed.
- `git diff --check`: passed.
- `cmp index.html public/index.html`: passed.
- Executable relative import audit: 137 edges, 0 missing cache-busts.
- Local desktop Start: started, title hidden, zero page errors.
- Local portrait Start: started, no document overflow, zero page errors.

## Minecraft comparison report: visible gaps Frontier still has

These are presentation/product gaps, not a request to add them in this release:

1. **Terrain silhouette continuity** — Minecraft has more natural large-form terrain transitions; Frontier still has stronger stepped voxel terraces and occasional hard shoreline walls.
2. **Atmospheric distance layering** — Minecraft provides more convincing multi-band haze and distant land separation; Frontier's islands are visible but still stylized and flatter in depth.
3. **Material micro-variation** — Minecraft has richer block-face variation and ambient occlusion; Frontier's atlas is improved but still repeats more visibly.
4. **Water volume/readability** — Minecraft's water has stronger depth, refraction, underwater falloff, and shoreline interaction; Frontier has readable bluewater and tidal materials but less physical depth response.
5. **Lighting/contact response** — Minecraft has more consistent soft contact shading across terrain and props; Frontier's lighting is cleaner than before but still has a harsher voxel edge.
6. **Foreground composition** — Minecraft naturally frames vistas through terrain without one authored object dominating the camera; Frontier's next visual gap is softening the remaining left shoreline wall.
7. **Environmental motion density** — Minecraft uses broad ambient motion and particles to make large spaces feel alive; Frontier has selected effects but not the same systemic environmental density.

## Honest limitation

This is a strong cinematic checkpoint, not literal AAA/Minecraft parity. The remaining highest-value visual target is a softer left shoreline wall and more layered distant haze without adding gameplay breadth.
