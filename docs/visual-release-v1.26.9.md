# Frontier Survival v1.26.9 — leaning palm checkpoint

Date: 2026-08-31
Base: v1.26.8 / `e6f2dc7`
Candidate: `/mnt/c/Users/wdavi/Projects/Frontier-Survival-release-v1.26.9-20260831`
Status: local gates green; publish when remote/live proof lands

## Player-visible slice

- Fresh Cane Garden Bay palms use a dedicated `PALM_TRUNK` cell with slim light-bark poles and a broader authored lean.
- Palm fronds keep a brighter atlas/vertex tint and a readable central rib.
- Nearby animal meshes add small species markings and a faint ground contact blob.
- Destination HUD is suppressed; shelter HUD drops so the cove frame stays readable.

This is an incremental visual checkpoint, not a final Minecraft-class release.

## Static

- `node tests/smoke.mjs` exit 0
- Changed JS `node --check` PASS
- `git diff --check` PASS
- Root/public HTML parity PASS
- Comment-stripped executable relative imports: 160 edges, 0 unbusted
- Version surfaces: title/badge/tag `v1.26.9`, boot `v1.26.9`, entry `main.js?v=853`

## Local runtime

- Exact artifact: `http://127.0.0.1:8891/?fresh=v1269-local`
- Title `Frontier Survival v1.26.9`, entry `./js/main.js?v=853`
- Start → `started=true`, title hidden, HUD/hotbar/canvas present
- Page-owned errors: none
- Ordinary fresh-world frame: light leaning palms, sand, water, sky, v1.26.9 badge
