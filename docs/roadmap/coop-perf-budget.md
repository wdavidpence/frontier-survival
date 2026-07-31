# Coop performance budget (local split-screen)

Status: ACTIVE guidance for dual-viewport mode  
Related: `docs/roadmap/splitscreen.md`, settings `renderDistance`, `game.coopMode`

## Target

| Platform | Dual 1080p-class | Notes |
|----------|------------------|--------|
| Mid laptop (integrated) | ≥30 fps | Prefer 30 locked over unstable 45 |
| Desktop GPU | ≥45–60 fps | May keep higher RD |
| PS5 browser | ≥30 fps | Console preset + dual cam |

## Defaults when `playMode === 'coop'`

| Knob | Solo default | Coop default | Rationale |
|------|--------------|--------------|-----------|
| Effective render distance | settings 2–10 (typ 5) | max(2, settings−2) | Second full scene pass |
| Pixel ratio cap | min(dpr, 2) | min(dpr, 1.5) | Fill-rate |
| Chunk radius | = RD | = effective RD | Fewer meshes |
| Fauna density | full | unchanged for now | Prefer RD first |
| Shadows | off (already) | off | — |

## Hard caps (do not exceed without profiling)

- Simultaneous dynamic lights near players: ≤8
- Living fauna in tick range: prefer existing system limits
- Dual scissor: exactly 2 `renderer.render` calls/frame when coop
- No third camera / reflection passes in coop MVP

## Acceptance checks

1. Solo RD=5 still feels dense forests.
2. Coop RD effective ≤ solo−2 unless user forces high slider (slider stays; effective applies).
3. `node tests/smoke.mjs` green after any budget code change.
4. Browser coop boot: terrain + dual HUD + no console errors.

## Non-goals (later)

- Dynamic resolution scaling
- Foveated / half-res P2
- Async chunk worker priority per player

## Implementation hooks

- `Game._applyRenderDistance()` — apply coop RD bias + camera2.far
- `Game.start` / constructor pixel ratio when `coopMode`
- Settings UI may later show “Co-op quality” preset
