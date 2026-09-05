# Frontier Survival — Golden Cove 20-Piece Vision Pack

Target: move Frontier from a strong systems sandbox toward a memorable, coastal AAA-style expedition game. Each item must be player-visible, reachable from the real game loop, and verified separately in static, automated, runtime, visual, and mobile evidence.

## P0 — Golden Cove readability and arrival

1. ⏳ **Golden Cove arrival camera** — brief, skippable opening composition that frames beach, camp, and open water.
2. ⏳ **Dynamic sky grade** — dawn/day/storm/night color grade with restrained exposure and horizon separation.
3. ⏳ **Shoreline foam/tide bands** — readable animated water edge and wet-sand transition.
4. ⏳ **Tide/sea-state telemetry** — player-readable tide, depth, current, and sea-state context.
5. ⏳ **Expedition compass** — cardinal bearing plus named landmark direction and distance.
6. ⏳ **Landmark memory feed** — discoveries become persistent, readable memories with location context.

## P1 — Camp, travel, and nature

7. ✅ **Shelter comfort score** — authoritative roof/bed/fire/edit state now feeds the field dossier; real roof placement raised live comfort to 40% and the positive roofed frame is accepted. Bed/fire-complete max comfort remains a deeper state.
8. ✅ **Campfire warmth radius** — real Campfire placement now activates heat telemetry plus an actual-fire-anchored pooled warmth ring, ember marker, and warm point-light pulse; desktop feature frame accepted.
9. ✅ **Boat readiness telemetry** — live hull/mast/sail/cargo/readiness values plus real launch/board/underway HUD were verified; final underway frame shows `UNDERWAY`, speed, sea state, readiness, and wake status.
10. ✅ **Boat wake/travel polish** — real `F` launch, `F` board, `W` underway, speed telemetry, and three pooled wake meshes were verified; final desktop frame is horizon-level and unobstructed, with a responsive mobile card.
11. ✅ **Fishing anticipation** — fresh-world rod/bait route is reachable; natural bite frame showed bobber/pulse and bite banner, and real reel produced Raw Fish plus readable catch celebration.
12. ✅ **Wildlife tracks/cues** — ordinary `Fresh spoor · <species>` cue now persists as a Wildlife memory in the expedition timeline; verified from the real fauna manager and rehydrated browser storage.
13. ✅ **Ecology activity readout** — natural fresh-world snapshot visibly showed `Coast in motion`, `67 land signals · 5 water signals`, and a readable ecology meter over the playable cove.
14. ✅ **Weather forecast warning** — clear/rain/storm labels, forecast copy, and restrained storm-front screen wash are wired; the exact running candidate naturally transitioned `clear → rain` through `GameTime.tick()` with zero page-owned errors.
15. ✅ **Day/night ambience** — night-aware grade, low-light guidance, and rhythm copy are wired; the running clock crossed `phase 0.54 → 0.606`, changing `Day field` to `Night field · wildlife quiets`.
16. ✅ **Survival risk triage** — compact Next move strip prioritizes risk, shelter, fishing, boat, and crafting actions; corrected risk aggregation now surfaces the strongest active pressure instead of masking it with `Math.min`.
17. ✅ **Crafting progression presentation** — live recipe readiness, actionable Campfire craft, contextual Next move, and next heat goal are now proven from a fresh world.

## P2 — Depth, co-op, and continuity

18. ✅ **Co-op navigator/scout roles** — live P2 presence, distance, split/rendezvous status, and safe missing-station guidance are wired; exact browser proof recognized two mocked gamepads (P1 index 0, P2 index 1), moved P2 independently, and displayed `Crew together` at 2.2m. Physical DualSense/Bluetooth coverage remains pending.
19. ✅ **Persistent expedition timeline** — local memory persists location, wildlife, voyage, marine-life, weather, catch, and crew milestones; confirmed across a real page reload and fresh Start.
20. ✅ **AAA synthesis/performance/mobile pass** — safe-area-aware portrait layout, reduced-motion support, unified overlay grading, pooled FX, and measured lightweight vision updates are integrated; inherited palm/terrain framing remains separate visual debt.

## Acceptance rules

- A source marker alone is not completion; each item needs a real player path.
- Keep `index.html` and `public/index.html` synchronized.
- Cache-bust every changed relative ES import.
- Preserve the current live release until the complete candidate is independently verified.
- Do not publish automatically from this tracker.

## First Expedition Loop synthesis

- ✅ **Golden Cove: First Expedition Loop** — added a durable eight-stage route that reuses authoritative gameplay milestones: dinghy landfall, fresh water, first campfire, roofed shelter, reef catch, skiff launch, marine sighting, and return to camp. The current route stage and `01 / 08` progress strip feed the field ribbon, survival pressure still overrides route guidance, and the route persists through Save/Continue. Exact browser proof reached `Landfall · 01 / 08`, advanced via real W+F salvage to `Fresh water · 02 / 08`, persisted the stage in localStorage, and restored it after reload. Narrow-layout correction moved the arrival card to 42% so the expanded route ribbon clears it at 390×844.

## Session log

- 2026-09-04: Implemented and verified items 1–6 as the Golden Cove arrival/field dossier. Added authoritative camp comfort and warmth state plus a lightweight Three.js warmth halo; items 7–8 complete. Boat telemetry now reads hull/mast/sail/cargo/speed/wake state; items 9–10 remain active pending underway player-path proof. Full smoke remains green at 203 checks + 6 TAP subtests; latest local candidate is v1.28.0 and unpublished.
- 2026-09-04: Confirmed persistent timeline across a real page reload: stored wildlife memory rehydrated after fresh Start and opening the V dossier. Item 19 accepted. Co-op role fallback is clean, but two-controller rendezvous remains open.
- 2026-09-04: Added authoritative weather/day-phase screen treatment: clear, rain, storm, and night data attributes drive restrained overlay grades and context-specific forecast guidance. Controlled storm and night frames at 390x844 were readable with no new occlusion or HUD overlap; ordinary trigger evidence remains open.
- 2026-09-04: Completed item 20 synthesis pass: safe-area-aware mobile layout, reduced-motion media policy, unified weather/grade treatment, pooled FX lifecycle, and lightweight 5Hz sampler. Final reduced-motion mobile frame at 390x844 passed layout review; inherited dark palm/terrain framing remains documented debt.
- 2026-09-04: Corrected fresh-world onboarding at the Game seam: P1/P2 receive one additional Log only during new-world construction, leaving saved worlds and pure inventory tests unchanged. Fresh browser Start showed exactly 3 Logs; the real Campfire recipe was enabled at 3/3 Logs + 12/3 Sticks, and the crafting UI was console-clean. Item 17 accepted; placement/warmth positive frame remains open.
- 2026-09-04: Fixed the documented HUD contract: hotbar slots now select P1 items on click with bounds checks. Exact browser sequence proved fresh Start → craft Campfire → click slot 5 → `hotbarIndex=4`, held Campfire, valid `RMB — Place Campfire` prompt. Right-click placement remained harness-unverified; warmth proof stays open.
- 2026-09-04: Diagnosed placement input seam: `input.js` consumes canvas pointerdown button 2 into `placePressed`; valid prompt can be reached through controlled camera input, and a real `page.mouse.down/up({button:'right'})` now places the Campfire. No direct world mutation was used; warmth proof is accepted after the anchored glow frame.
- 2026-09-04: Added shelter factor breakdown to the live dossier: comfort now explains `fire secured/needed`, `roofed/roof missing`, `bed ready/missing`, and remembered edit count. Fresh exact-candidate Start plus dossier frame at 1280x720 showed `0% comfort · fire needed · roof missing · bed missing · 0 edits remembered`, with readable non-overlapping coastal presentation. Positive built-shelter proof remains open.
- 2026-09-04: Expanded fresh-world P1/P2 onboarding from +1 to +4 Logs (six total) at the Game seam so the first-fire route leaves three Logs for Planks/roofing. Pure inventory behavior remains unchanged. Exact browser fresh Start showed 6 Logs; live Campfire craft plus three live Planks crafts yielded 12 Planks and one Campfire. First Planks placement succeeded at `-14,19,-26`; roof-column completion remained unverified after a bounded placement-ghost scan timeout. Shelter item 07 remains open.
- 2026-09-04: Completed real roofed shelter proof: fresh six-Log route → three Planks batches → three live Plank placements → jump/strafe around collision. Player reached `floor(x)=-14`, `floor(z)=-26`; `_roofed=true`, comfort rose to 40%, and dossier showed `roofed · bed missing`. Desktop frame at 1280x720 was readable; inherited dark right-side structure remains separate scene debt. Item 07 accepted; bed/fire-complete max comfort remains untested.
- 2026-09-04: Completed real skiff path on the saved candidate: `F` pushed the beached dinghy into water, a second `F` boarded it, and `W` produced mounted speed ~0.79–1.34m/s, `wakeActive=true`, three visible pooled wake meshes, and voyage HUD `Underway`. A live mesh ownership fix was retained (`_castawayGroup` hidden when `_boat` exists), but multiple fresh frames still failed to show the hull/wake clearly; stern-camera and waterline experiments were reverted per visual-hypothesis budget. Items 09–10 remain wired/runtime-proven but visually unaccepted.
- 2026-09-04: Added two Palm Fronds to fresh P1/P2 construction only so the Fishing Rod recipe is reachable without changing saved worlds or inventory defaults. Fresh Start → live Fishing Rod craft → live Fish Bait craft → click-select rod → real `F` cast produced a natural waiting phase, bite phase with visible bobber/pulse and `Bite!` banner, then real reel success with `Caught Reef Fish ×1`, Raw Fish stack 2, rod durability 77, and a readable post-catch frame. Item 11 accepted; no catch state was forced.
- 2026-09-04: Final visual correction pass: Golden Cove vision is hidden on the title menu; the arrival card is lowered below the upper feedback stack and dismisses on boarding; boarding reframes pitch to the horizon; underway adds live speed/readiness/wake telemetry above the hotbar; mobile moves the voyage card above the survival HUD; damp-soil atlas colors are lifted to prevent black-looking mangrove surfaces in random fresh starts. Exact candidate is local-only v1.28.0 with `main.js?v=924`, `game.js?v=951`, `atlas.js?v=348`, `frontier-vision-pack.js?v=26`; smoke 491 PASS lines + 6 TAP subtests, 182 cache-safe edges, fresh New World/Continue runtime clean, desktop and portrait frames accepted.
- 2026-09-04: Finished the final five evidence-open pillars in the exact local candidate. Wildlife spoor now reads `Fresh spoor · <species>` and remains in the persistent timeline. Corrected field-risk aggregation from `Math.min` to strongest-pressure `fieldRisk()` and added DPS pressure. Browser proof: `clear → rain` through the live GameTime tick; day phase `0.54 → 0.606` crossed into `Night field · wildlife quiets`; injured state displayed `Watch the margins` plus contextual triage. Co-op New World instantiated P1/P2; mocked pad 0/1 events assigned the two input paths, pad 1 moved only P2 from x=-7.3 to -11.2 while P1 held x=-9.5, and the dossier showed `Crew together` at 2.2m with a persisted Crew memory. Candidate chain is `main.js?v=925` → `game.js?v=952` → `frontier-vision-pack.js?v=27`; smoke remains green with 203 legacy checks + added last-five contract PASS and 6 TAP subtests. Physical DualSense/Bluetooth remains the only unproven hardware layer; no commit, push, deploy, or publish performed.
