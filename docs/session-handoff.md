# Session Handoff

## Latest **v1.8.2**
Controls overhaul after confirmed v1.8.1 still broken for player:

Root causes found in live troubleshooting:
1. Player can die of hypothermia quickly (rain/night ~28s) — movement zeroed while dead; feels like "controls broken"
2. Pointer-lock often fails after Start click (gesture expired) — no mouse look
3. Browsers cache old ES modules

Fixes:
- Dual key mapping (code + key + keyCode)
- Soft mouse-look without pointer lock after click-to-play
- On-screen WASD pad + drag-to-look (bottom corners)
- Live ctrl-debug strip (DEAD/PAUSED/LOCK/keys)
- 3-minute spawn cold protection
- Starter torches + sticks
- Module cache bust ?v=182

## Play
https://wdavidpence.github.io/frontier-survival/
Hard refresh. Badge **v1.8.2**. Use on-screen W/A/S/D if keyboard fails.
