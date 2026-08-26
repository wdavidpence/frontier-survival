# Frontier Survival v1.25.6 — asynchronous streaming and resource lifecycle

This checkpoint continues the AAA performance sprint from v1.25.5.

## Async world streaming

- Full and LOD chunk voxel generation uses the existing worker pool and `generateChunkAsync`.
- Main-thread stream work is split into enqueue, worker completion, and bounded commit phases.
- Ready chunks are committed nearest-first; stale completions are discarded safely.
- Worker-unavailable environments retain the deterministic synchronous fallback.
- Chunk edits are restored after async voxel data arrives.

## Resource lifecycle

- Added defensive, idempotent Three.js resource disposal helpers.
- World teardown terminates workers, clears pending/ready queues, and disposes chunk geometry.
- Shared atlas materials are deliberately preserved during chunk teardown.
- Animal visual trees dispose owned geometry/materials/textures on replacement.
- Repeated world replacement no longer leaves the old resource graph alive.

## Verification

- Syntax checks: passed
- Async worker contract: passed
- Resource disposal unit tests: passed, including shared-material preservation
- Smoke suite: 192 tests passed
- Cache audit: 141 relative import edges, 0 uncached
- HTML parity: `index.html` = `public/index.html`
- Desktop fixed seed `1884808540`: Start succeeds at original spawn, 7 workers active, queue settles to 0, zero runtime errors
- Settled Balanced CPU: median 7.2 ms, P95 11.4 ms, max 26.5 ms
- Settled Performance CPU: median 4.9 ms, P95 6.7 ms, max 7.8 ms
- Repeated `newGame()` GPU geometry count: 144 before replacement, 58 after replacement
- Mobile 390×844 Performance: Start succeeds, `isMobile=true`, 7 workers, queue/pending 0, CPU median 3.9 ms, P95 5.6 ms, zero errors

The preview candidate is ready for publication review. No claim is made that this alone reaches AAA parity; the next visual phase remains richer authored landmarks and atmosphere after the performance foundation is stable.
