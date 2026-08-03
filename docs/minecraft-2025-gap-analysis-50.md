# Minecraft 2025 → Frontier Survival: 50-feature gap analysis

Date: 2026-08-03
Baseline audited: Frontier Survival v1.12.18, commit 9ad1918.

## Purpose and scope

This is an actionable competitor-gap document, not a claim that Minecraft and Frontier Survival have the same product scope. “Minecraft 2025” means the 2025-era package of:

- Vibrant Visuals: the official graphics refresh documented by Minecraft and Microsoft Learn.
- 2025 game-drop direction visible in Spring to Life, Chase the Skies, Tiny Takeover, and the later 2025 content direction: more environmental variation, mob/ecology personality, traversal, discovery, and multiplayer usability.

Status labels:

- **Missing** — no equivalent player-facing system was found in the v1.12.18 code path.
- **Weaker/partial** — Frontier has a related helper or simplified effect, but not the depth, fidelity, coverage, or presentation of the reference feature.
- **Candidate** — a concrete implementation target, not a claim of work already shipped.

The audit checked the current `js/` modules, `index.html`/`public/index.html`, smoke coverage, and the v1.12.18 browser runtime. Helpers that are not wired into a real player-facing branch are treated as partial, not complete.

## A. Graphics — 15 gaps

| # | 2025-era Minecraft capability | Frontier status | Actionable Frontier target |
|---:|---|---|---|
| 1 | Physically based material response using texture-set/PBR inputs | **Missing** — `js/atlas.js` is an atlas shader, not a PBR material pipeline | Add optional albedo/normal/roughness/metalness texture-set channels with a safe flat-material fallback |
| 2 | Deferred/multi-light rendering pipeline | **Missing** — renderer is forward Three.js | Establish a lightweight clustered/deferred-capable path only for supported hardware; retain forward fallback |
| 3 | Directional sun and moon lighting that sweeps across the world | **Weaker/partial** — `js/game.js` has time-based sun/ambient tuning | Add explicit moon direction, shadow angle, color temperature, and horizon-driven keyframes |
| 4 | Every block contributing coherent cast/receive shadows | **Weaker/partial** — shadow flags exist, but atlas terrain does not provide full reference-quality shadowing | Add shadow-compatible terrain material chunks and verify cascaded terrain shadows in Chromium |
| 5 | Soft contact shadows plus long readable cast shadows | **Missing** — no reliable contact-shadow pass | Add a low-cost contact-shadow buffer or screen-space approximation for player, foliage, and props |
| 6 | Volumetric fog with light shafts and depth-aware scattering | **Weaker/partial** — `js/underwater-fog.js` and atmospheric fog exist, but not volumetric world fog | Add height/depth fog volumes, sun shafts, rain shafts, and quality presets |
| 7 | Keyframed atmospheric sky controls across the day | **Weaker/partial** — `js/time.js`/`js/game.js` provide time and a sky dome | Make sky top/horizon/ground colors, haze, sun intensity, moon intensity, and exposure data-driven keyframes |
| 8 | Water reflecting the surrounding landscape and sky | **Weaker/partial** — water/coast palette helpers and readable water exist; no scene reflection | Add planar or probe-based water reflection with distance/quality fallback |
| 9 | Metallic blocks reflecting nearby light and environment | **Missing** — no metallic reflection material | Add roughness/metalness for copper, iron, gold, wet tools, and selected stations |
| 10 | Subsurface scattering/translucency in leaves and grass | **Missing** — foliage is opaque atlas geometry | Add a cheap back-light/transmission tint for leaves, grass, flowers, and thin tropical foliage |
| 11 | Infinite/distant cloud layers with depth and motion | **Missing** — sky dome is not a cloudscape | Add layered procedural clouds, horizon fade, cloud shadow option, and storm density control |
| 12 | Bloom and exposure response that changes with bright sun, caves, and emissive blocks | **Weaker/partial** — ACES/exposure exists, but no controlled bloom/exposure adaptation | Add restrained bloom, eye adaptation, torch/campfire glare, and cave-to-day transition tuning |
| 13 | Reflections and lighting tuned distinctly per biome | **Weaker/partial** — `js/biomes.js` supplies biome identity/temperature; visual grading is limited | Define biome LUT-style palettes for tropical, shore, ocean, forest, tundra, and desert |
| 14 | Visual/performance presets that expose quality tradeoffs to players | **Weaker/partial** — render distance and co-op pixel caps exist | Add Favor Visuals/Favor Performance presets for shadows, fog, reflections, clouds, particles, and DPR |
| 15 | Broad hardware compatibility with graceful visual fallback | **Weaker/partial** — browser renderer has practical caps but no graphics capability screen | Detect WebGL limits, show recommended preset, and prevent expensive effects from breaking low-end/TV devices |

## B. Sound — 10 gaps

| # | 2025-era Minecraft capability | Frontier status | Actionable Frontier target |
|---:|---|---|---|
| 16 | Positional 3D audio with distance rolloff and stereo direction | **Weaker/partial** — `js/audio.js` has event sounds but not a full spatial mixer | Attach AudioNodes to player, fauna, water, weather, and structures with distance/occlusion rules |
| 17 | Layered biome ambience that changes while exploring | **Weaker/partial** — `ambientMix`/ambient hooks exist, but the layer library is small | Add tropical insects, reef wash, forest birds, shore surf, desert wind, tundra hush, and cave beds |
| 18 | Day/night soundscape transitions | **Weaker/partial** — time is available and ambient mixing exists | Create crossfaded dawn, day, dusk, midnight, and pre-dawn buses with deterministic tests |
| 19 | Weather-reactive ambience | **Weaker/partial** — weather survival exists; sound layering is limited | Add rain density, thunder distance, wind gusts, storm low-end, and shelter muffling |
| 20 | Material-specific footsteps and movement sounds | **Weaker/partial** — water/step events exist, but coverage is not Minecraft-scale | Map grass, sand, stone, wood, snow, metal, foliage, shallow water, and boat movement to surface audio |
| 21 | Underwater muffling, bubbles, breath, and pressure cues | **Weaker/partial** — breath and underwater fog exist; audio treatment is limited | Apply low-pass/reverb changes underwater, add bubbles, splash entry/exit, and breath urgency layers |
| 22 | Entity-specific audio identities and distance cues | **Weaker/partial** — fauna species exist, but sound identity coverage is limited | Give birds, predators, reef fauna, hostile wildlife, and domestics idle/call/alarm/hurt sounds |
| 23 | Context-aware music and exploration transitions | **Missing** — no full adaptive music director | Add exploration, danger, ocean, cave, storm, discovery, and victory states with non-abrupt crossfades |
| 24 | Rich combat, tool, block, and crafting feedback | **Weaker/partial** — `js/audio.js` has broad events, but action coverage is shallow | Add per-tool impact layers, armor hits, bow draw/release, ore break, crafting success/failure, and boat scrape |
| 25 | UI/game-state sound polish | **Weaker/partial** — UI audio exists, but menu/setup/HUD states lack a complete sound language | Add focus, select, invalid, save, achievement, warning, controller-connect, and popup close cues |

## C. Playability — 15 gaps

| # | 2025-era Minecraft capability | Frontier status | Actionable Frontier target |
|---:|---|---|---|
| 26 | Graphics-mode selection with visual/performance tradeoff | **Weaker/partial** — render distance is exposed, not a coherent graphics-mode choice | Add Favor Visuals/Favor Performance and an advanced expandable graphics panel |
| 27 | New-world creation preview and readable world settings | **Weaker/partial** — seed/mode controls exist; no visual preview | Add seed summary, biome/ocean preview strip, difficulty explanation, and estimated co-op performance |
| 28 | Gentle first-session onboarding/tutorial prompts | **Weaker/partial** — tooltips/help exist, but no structured first-day path | Add a skippable sequence: gather, water, shelter, fire, food, boat, first island |
| 29 | Controller auto-detection and clear assignment feedback | **Weaker/partial** — pad-slot code and prompts exist | Show controller 1/2 connection, battery/name if available, reassignment, and missing-controller recovery |
| 30 | Split-screen quality fallback and local multiplayer polish | **Weaker/partial** — split-screen and co-op HUD exist | Add co-op visual preset, shared pause rules, independent audio balance, and reconnect handling |
| 31 | Traversal beyond walking/swimming with a clear mount loop | **Weaker/partial** — Boat item/water boost exists, but no embodied boat entity/boarding loop | Add boat placement/boarding, steering, dismount safety, paddle/splash animation, and shoreline collision |
| 32 | Aerial/vertical traversal with a friendly mount | **Missing** — no happy-ghast-like aerial traversal | Add a late-game balloon/sky mount with tether, altitude limits, landing, and co-op passenger rules |
| 33 | World/player locator and readable wayfinding | **Weaker/partial** — map exploration, compass, and spawn markers exist | Add a polished locator bar for players, landmarks, structures, and distant islands |
| 34 | Discovery-oriented landmark navigation | **Weaker/partial** — distant landmarks exist but are not a full discovery system | Add named landmarks, discovery cards, compass bearings, map pins, and persistent journal entries |
| 35 | Ambient environmental variation that makes biomes feel alive | **Weaker/partial** — biome identity exists, with limited fauna/plant variety | Add biome-specific visual/audio events, seasonal-like variation, leaf litter, wildflowers, and falling leaves |
| 36 | Seed/world replayability communicated to players | **Weaker/partial** — v1.12.18 randomizes New World | Add seed history, “different from last world” indicator, favorite seed export, and world thumbnail |
| 37 | Accessible graphics and interface options | **Missing** — no complete accessibility settings | Add color-blind palettes, subtitle/caption mode, UI scale, high contrast, reduced motion, flash reduction, and remappable controls |
| 38 | Reliable TV/readability presentation at couch distance | **Weaker/partial** — v1.12.18 compact menu improves viewport fit | Add 10-foot UI mode, larger HUD preset, safe-area margins, split-screen readability scaling, and focus navigation |
| 39 | Multiplayer parity across visual modes | **Weaker/partial** — co-op is local browser split-screen, not a visual-mode-compatible network model | Keep gameplay deterministic while allowing each local player/view to select safe quality settings |
| 40 | Persistent world continuation across devices/players | **Weaker/partial** — local save/import exists | Add versioned world migration, conflict-safe export/import, co-op ownership rules, and optional hosted sync |

## D. Depth — 10 gaps

| # | 2025-era Minecraft capability | Frontier status | Actionable Frontier target |
|---:|---|---|---|
| 41 | Environmentally meaningful mob/biome variants | **Weaker/partial** — fauna species and variants exist, but variant behavior is limited | Add warm/cold/biome-specific visual variants, spawn ecology, behavior, drops, and audio identity |
| 42 | Small ambient nature details that make a biome feel inhabited | **Weaker/partial** — tropical fauna/reef plants exist; environmental micro-detail is limited | Add firefly-like night particles, leaf litter, flowers, seed pods, ambient insects, and wind-reactive plants |
| 43 | A richer baby-mob/personality layer | **Missing** — no broad baby-mob presentation/progression layer | Add baby variants with distinct scale, animation, calls, parent following, and safe interaction rules |
| 44 | A lifecycle-based aerial creature system | **Missing** — no dried/hatched/raised/flying creature loop | Add collectible egg/dried form, hydration/incubation, growth stages, harness, flight stamina, and care requirements |
| 45 | Spear/long-reach weapon role and mounted combat | **Missing** — bow/spear survival tools exist, but no full spear role or mounted combat | Add spear reach, throw/return, shield interaction, enemy counterplay, and mount-specific attacks |
| 46 | Aquatic mounts and hostile aquatic encounters | **Weaker/partial** — reef ecology and shark fauna exist; no mount/travel ecosystem | Add rideable nautilus-like aquatic mount, breath management, underwater predators, and ocean route risk/reward |
| 47 | Copper automation/sorting as a mid-game depth layer | **Weaker/partial** — logic, hopper, crafter, copper helpers exist in isolation | Integrate copper automation into a discoverable progression: storage, sorting, oxidation, power, and maintenance |
| 48 | Structures and challenge spaces that create authored discovery | **Weaker/partial** — mineshaft/trial helpers exist, but authored world structures are sparse | Add island ruins, sea caves, shipwrecks, temples, puzzle rooms, procedural loot tables, and landmark bosses |
| 49 | Collection/progression loops tied to exploration discoveries | **Weaker/partial** — achievements and map exploration exist | Add collection book, biome completion, fauna sightings, relic sets, landmark rewards, and replay goals |
| 50 | Creator/community content ecosystem | **Missing** — no add-on/resource-pack/marketplace-like content contract | Define a safe mod/content manifest for original packs: blocks, fauna, recipes, sounds, sky presets, and validation |

## Highest-value implementation order

### P0 — make the world look and sound alive

1. PBR-lite material response with fallback.
2. Water reflection and readable shore transition.
3. Volumetric/height fog and sun shafts.
4. Infinite cloud layers and cloud shadows.
5. Biome ambience, footsteps, weather audio, and underwater muffling.
6. Biome micro-detail: leaf litter, flowers, falling leaves, insects, and wind response.

### P1 — make exploration generate stories

7. Boat entity/boarding/steering rather than only a held-item water boost.
8. Island landmarks, ruins, shipwrecks, sea caves, and discovery journal.
9. Locator bar and landmark compass integration.
10. Warm/cold fauna variants and ambient behavior.
11. Adaptive exploration/danger/ocean music.

### P2 — make the TV/co-op product feel finished

12. Controller connection assignment/reconnect UX.
13. 10-foot UI/readability preset and safe-area handling.
14. Independent co-op graphics/audio budgets.
15. Accessibility settings and subtitles.
16. Save migration, world sharing, and conflict-safe co-op continuation.

## Sources and research notes

Primary official references retrieved or checked:

1. Minecraft — Vibrant Visuals overview: https://www.minecraft.net/en-us/article/minecraft-vibrant-visuals
2. Minecraft — Vibrant Visuals update/compatibility page: https://www.minecraft.net/en-us/vibrant-visuals-update
3. Microsoft Learn — Vibrant Visuals technical introduction, last updated 2025-06-10: https://learn.microsoft.com/en-us/minecraft/creator/documents/vibrantvisuals/introvibrantvisuals?view=minecraft-bedrock-stable
4. Minecraft official articles hub: https://www.minecraft.net/en-us/articles
5. Minecraft Live hub: https://www.minecraft.net/en-us/live

The official technical page explicitly documents: PBR, deferred lighting, multiple illumination sources, physically modeled light/shadow response, sun/moon intensity and color, bloom activation, exposure sensitivity, shadow angle, atmosphere controls, and keyframed JSON day/night syntax. The official consumer page explicitly documents: directional lighting, volumetric fog, moving shadows, infinite clouds, reflective water, light through windows, metallic-surface reflections, subsurface scattering in leaves/grass, compatible-device graphics modes, Favor Visuals/Favor Performance presets, and Vibrant Visuals options.

The 2025 gameplay/depth comparisons use the official 2025 game-drop direction (Spring to Life, Chase the Skies, Tiny Takeover, and the later 2025 content direction) as the reference set. Exact individual Minecraft article URLs for every game drop were not reliably retrievable from the current web environment; those entries are intentionally framed as “2025-era direction” rather than quoted patch-note claims. Future implementation work should re-check the final official changelogs before committing to a specific feature spec.

## Evidence boundary

This document does not claim Frontier lacks every named concept at the source level. Several helper modules already exist (`boat-entity.js`, `boat-chest.js`, `lighting-palette.js`, `visual-polish.js`, `bird-flocks.js`, automation helpers, and fauna helpers). They are marked partial where the player-facing integration, visual fidelity, or systemic depth is materially below the reference. The next audit should update each row after an integrated feature is browser-verified, not merely after a helper file is added.
