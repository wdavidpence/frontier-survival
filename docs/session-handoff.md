# Session Handoff

**Project:** Frontier Survival  
**Path:** `/mnt/c/Users/wdavi/Projects/SurvivalCraftMobile`

## Live
- Repo: https://github.com/wdavidpence/frontier-survival  
- Pages: https://wdavidpence.github.io/frontier-survival/  

## Local
Serve repo root → http://127.0.0.1:8765/  
LAN (after Windows portproxy): http://192.168.68.116:8765/  
Tests: `node tests/smoke.mjs` (80)

## Latest
**v1.7** — black-canvas harden: opaque WebGL clear, post-boot resize/camera/render, brighter night terrain, bleed HUD wired, version bump.  
Prior v1.6: biomes, taming, logic blocks, bleed UI shell.

## Black canvas notes
If canvas is black but HUD shows: hard refresh, click **New world** (bad continue save), ensure WebGL enabled. Body CSS is near-black; clear color must be opaque sky blue.

## Kanban
Board `frontier-survival`. Routing: docs/kanban-routing.md  
Workers: qwen27s (strongest shared), local35 (local 35b-mtp), qwen35 (shared 35b).
