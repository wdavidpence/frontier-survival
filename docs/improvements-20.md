# Frontier Survival — 20 Polishes (v1.1)

Status: ⏳ queue · 🟢 in progress · ✅ done

| # | Item | Status |
|---|------|--------|
| 1 | Difficulty modes on title (Harmless / Survival / Challenging / Cruel) | ✅ |
| 2 | Mode multipliers (hunger, cold, predators, death rules) | ✅ |
| 3 | Wooden spear + craft recipe (melee range/damage) | ✅ |
| 4 | Stone axe + craft recipe | ✅ |
| 5 | Q drops one item from selected hotbar slot | ✅ |
| 6 | Mouse-wheel hotbar scroll | ✅ |
| 7 | Contextual look-at prompt (F sleep / cook / equip) | ✅ |
| 8 | Block target wireframe outline | ✅ |
| 9 | Fall damage | ✅ |
| 10 | Status line: seed, compass heading, mode | ✅ |
| 11 | Critical meter pulse (low HP / hunger / cold) | ✅ |
| 12 | Dynamic PointLights for torches & campfires | ✅ |
| 13 | Leaf stick drop polish + slightly better feedback | ✅ |
| 14 | Death drops on Challenging; Cruel permadeath wipe | ✅ |
| 15 | Pause overlay on Esc (resume / sensitivity) | ✅ |
| 16 | Mouse sensitivity slider (persisted) | ✅ |
| 17 | Crosshair hit flash on animal melee | ✅ |
| 18 | Settings persistence (mode + sensitivity) | ✅ |
| 19 | Help panel toggle (H) + auto-fade after start | ✅ |
| 20 | Version 1.1 badge, README/handoff, smoke tests | ✅ |

## Execution notes
- Hermes sole SWE (no OpenCode) per session-handoff.
- Pure logic in `js/modes.js`, `js/settings.js`, survival fall helper.
- Root `index.html` + `public/index.html` synced (script path differs).
- Tests: 36 passing (`node tests/smoke.mjs`).

## Session log
- 2026-07-29: plan authored; all 20 implemented, tested, publishing.
