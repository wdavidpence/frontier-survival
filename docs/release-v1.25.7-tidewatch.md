# Frontier Survival v1.25.7 — authored Tidewatch arrival landmark

This checkpoint advances the AAA visual program after v1.25.6 async streaming/resource lifecycle work.

## Player-visible slice

- Adds a restrained authored Tidewatch arch at the forward cove sightline.
- Two low-poly stone uprights and lintel create a readable silhouette without changing voxel collision or destination interaction.
- Warm beacon and additive halo create a destination cue that remains legible through existing atmospheric haze.
- Flag cloth, beacon intensity, and halo opacity animate continuously with low-cost updates.
- The serialized Iron Ravine destination remains the real gameplay marker at its original coordinates; the visual cove signal is separate and non-interactive.
- Placement scans deterministic forward terrain from the spawn yaw so ordinary fresh-world frames do not hide the signal behind the starting hillside.

## Verification

- Base: v1.25.6 commit `d6bf08b`
- Syntax checks: passed
- Smoke: 192 tests passed
- Cache audit: 142 executable relative import edges, 0 uncached
- Root/public HTML parity: passed
- Fixed seed `1884808540`: original spawn preserved at `(26.5, 18.0001, 15.5)`
- Desktop candidate: Tidewatch visible center-right in ordinary first-person frame; no occlusion, flooding, HUD overlap, or dark-scene regression
- Desktop settled CPU: median 6.7 ms, P95 9.1 ms, max 13.6 ms; 7 workers; queue/pending 0; 0 errors
- Mobile 390×844 Performance: Tidewatch readable, HUD/hotbar unobstructed, 7 workers, queue/pending 0, CPU median 4.0 ms, P95 6.3 ms, 0 errors

This is a coherent visual checkpoint, not a claim of literal AAA parity. The next visual wall is a richer authored regional landmark/forest threshold after observing this arrival cue in live play.
