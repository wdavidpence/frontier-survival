# Session Handoff

**Project:** Frontier Survival  
**Live:** https://wdavidpence.github.io/frontier-survival/

## Latest
**v1.8.1** — controls fix: Minecraft-style capture
- Click-to-play overlay until pointer lock
- Document-level key capture + preventDefault for WASD/Ctrl
- setCaptureEnabled session flag (WASD works without lock)
- Mouse look via pointer lock; LMB-drag fallback
- Module cache-bust `?v=181` on imports
- Heal stuck paused/uiMode each frame

## Prior
v1.8 content (bucket, electricity, ice box, map, walls)  
v1.7 black canvas / v1.7.1 Esc-pause freeze

## Play tip
Hard refresh. Start/New world. If mouse free, click **Click to play**.
WASD move, mouse look, Space jump, Ctrl/C crouch, Esc pause.

## Tests
`node tests/smoke.mjs` → 83
