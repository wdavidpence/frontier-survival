# Frontier Survival v1.25.8 — forest threshold and fair wildlife threats

This release advances the Minecraft-inspired quality roadmap from v1.25.7.

## Player-facing visual upgrade

- Added a deterministic forest-threshold scene along the forward cove route: low-poly stone shelf, mossy root arch, freshwater glint, and hanging vine.
- The module is visual-only, bounded to 8 renderable children, and does not alter collision or voxel edits.
- Water/glint/vine accents animate in Balanced/Visual modes; Performance mode keeps the geometry but disables its animation.
- Tidewatch remains visible and unchanged.

## Wildlife threat upgrade

- Wolves remain the first hostile threat; no zombies, pirates, or human-against-human combat were added.
- Wolves now have readable idle → alert → chase → attack phases, attack wind-up, slower bite cooldown, starter safe ring, one-wolf early engagement cap, leash/disengage, and re-engagement cooldown.
- Existing provoke/off policies, combat routing, drops, save compatibility, non-taming rule, and nearest-player co-op targeting remain preserved.
- Wild dogs are intentionally deferred until the wolf behavior is observed in live play.

## Verification

- Base: v1.25.7 `fe53742`
- Focused wolf tests: 9 passed
- Focused forest-threshold tests: 7 passed
- Full smoke: 192 passed
- Cache audit: 143 executable relative import edges, 0 uncached
- Root/public HTML parity: passed
- Fixed seed `1884808540`: original spawn preserved at `(26.5,18.0001,15.5)`
- Desktop ordinary frame: Tidewatch and tropical cove remain readable; forest route geometry is non-occluding and materially improves the mid-ground composition
- Settled Balanced CPU: median 7.25 ms, P95 9.9 ms, max 13.7 ms; 7 workers; queue/pending 0
- Mobile 390×844 Performance: Start succeeds, `isMobile=true`, forest module has 8 children with animation disabled, 7 workers, queue/pending 0, CPU median 4.0 ms, P95 6.0 ms, zero runtime errors

This remains a coherent incremental visual/gameplay checkpoint, not a claim of literal AAA parity. The next decision is whether wolf encounters feel fair in normal play before introducing the lower-threat wild-dog variant.
