# Frontier Survival v1.25.5 — measurable quality and performance foundation

This sprint executes Phase 0/1 of the AAA quality-performance roadmap on v1.25.4.

## Player-facing

- Pause screen now exposes **Graphics quality**: Performance, Balanced, Visual.
- Graphics policy controls DPR, shadow-map cost, world render cap, proxy stream radius, cloud/particle budgets, and water glitter policy.
- Performance mode disables shadow-map rendering, caps the proxy ring to 3 chunks, budgets one chunk of stream work per frame, and updates fauna presentation every other frame while leaving simulation active.

## Measurement

- `window.__FS.performance` reports bounded rolling RAF timing and separate CPU timing, plus quality, DPR, mesh count, and worker count.
- CPU timing is the authoritative game-work signal in throttled/background browser harnesses; raw RAF interval is retained separately.
- The first post-Start bootstrap delta is excluded so world creation cannot masquerade as a frame.

## Verification

- v1.25.4 baseline: `573302f`
- Smoke: 192 tests passed
- 139 executable relative import edges, 0 uncached
- HTML parity: `index.html` = `public/index.html`
- Fresh seed `1884808540`: Start succeeds, title hides, 0 runtime errors
- Balanced settled sample: CPU median 6.1 ms, P95 8.1 ms, max 10.6 ms; stream queue empty
- Performance sample: CPU median 17.6 ms, P95 44.3 ms; 55 draw calls, 81 world meshes, 0 errors

The browser harness throttles RAF scheduling, so this release does not claim raw browser FPS from RAF interval alone. The next sprint is true asynchronous worker meshing/resource disposal to remove the remaining CPU spikes.
