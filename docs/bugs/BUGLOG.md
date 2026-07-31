# BUGLOG — Frontier Survival

> Permanent living bug list. P0/P1 become Kanban cards within one orchestrator tick.
> Format: `YYYY-MM-DD | P0-P3 | area | summary | repro | status | card?`

## Open
2026-07-31 | P2 | boot | prior blank Start exception not reproduced on :8767 | Start→hotbar; console 0 | watch | —

2026-07-30 | P1 | input | Mouse look X felt inverted for player | look left/right swapped | fixed-v1.8.6 | —
2026-07-30 | P0 | render | WASD keys updated HUD but world frozen | loop update without render | fixed-v1.8.3 | —
2026-07-30 | P0 | worldgen | No trees in forest | hash2 never >0.5 for tree rolls | fixed-v1.8.4 | —
2026-07-30 | P1 | survival | Early hypothermia/starvation too fast | die in minutes on new world | fixed-v1.8.4 grace | —
2026-07-30 | P2 | input | Pointer lock often fails after Start | gesture expired after worldgen | mitigated softLook+click-to-play | —
2026-07-30 | P2 | gen | hash2 change alters all seeds | expected with int hash fix | accepted | —
2026-07-30 | P2 | ui | Death overlay easy to miss as "controls broken" | die then no move | open | mint
2026-07-30 | P3 | animals | Fauna density/balance untested at scale | play 30m | open | mint
2026-07-30 | P3 | perf | No automated FPS budget | large radius | open | mint

## Process

1. Anyone (player, orchestrator, worker) appends a line under Open.  
2. Orchestrator mints P0/P1 as `BUG:` kanban cards assigned qwen27s/local35.  
3. On fix: move line to Fixed with version; complete card.  
4. Never delete history — strike through or move sections.

## Fixed

(see Open entries marked fixed-v*)

## BUG-2026-07-30-terrain-see-through — FIXED v1.8.6
- **Severity:** P0
- **Symptom:** Dirt/stone side faces looked transparent / world see-through; tops looked solid.
- **Root causes:** (1) greedy FrontSide + inverted winding hid side faces; (2) unused atlas tiles alpha=0 punched holes via discard; (3) historical transparent:true sorting.
- **Fix:** DoubleSide opaque materials; fill atlas unused tiles opaque; water alpha raised; force gl_FragColor.a=1; abs(N·L) lighting so backfaces lit.
- **Verify:** smoke PASS; hard-refresh live with ?v=187

