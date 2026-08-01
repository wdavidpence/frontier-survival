# Local split-screen co-op (P0)

Status: ACTIVE P0 — browser/PC + PS5 browser. No online netcode.

## Locked decisions (2026-07-31; refreshed orchestrator 2026-07-31 evening)

- Platform: HTML5 browser only (PC + PS5 browser mode)
- Mode: local split-screen, same tab, shared world
- P0 input matrix THIS MONTH (all three):
  1. PC: P1 keyboard+mouse + P2 Bluetooth gamepad
  2. PC: two Bluetooth gamepads
  3. PS5 browser: two DualSense controllers
- Competitive bar near-term primary: **Minecraft-breadth** (building/tools/stations/mining)
- Secondary feel: match Survivalcraft systems/feel closely (systems may mirror tightly)
- Original IP: no trademarked names/assets/code
- Publish: every ~20 judge turns any verified green incremental plateau
- Mint: aggressive scheduled buffer; auto-park after mint; depth caps 4+2+1
- Competitor deep-research deferred until workers recovered (card t_c7057b26 scheduled)

## Architecture v2 (design doc update 2026-07-31)

### Core model: PlayerView abstraction

The existing `Player` class (js/player.js) holds position, velocity, yaw/pitch, inventory slots, equipment, hotbar index, and survival state. For co-op we introduce a `PlayerView` wrapper that sits between the game loop and one or more Player instances:

```
Player (existing, unchanged):
  - position (THREE.Vector3), velocity, onGround
  - yaw, pitch
  - hotbarIndex, slots (inventory), equipment
  - breaking {x,y,z, progress}
  - message, messageT
  - pendingFallDamage
  - methods: heldStack(), eyePosition(), setLook(), lookDir(), notify()

PlayerView (new, js/player-view.js):
  - id: 'p1' | 'p2'
  - player: Player instance (one per view)
  - camera: THREE.PerspectiveCamera (unique per player)
  - inputDevice: 'kbm' | 'gamepad0' | 'gamepad1'
  - hudRect: {x, y, w, h} — CSS pixel rect for this player's HUD overlay
  - cameraRect: {x, y, w, h} — WebGL scissor rect for rendering
  - alive: boolean (tracks death state independently)
  - method: update(dt, world, inputRouter, survivalState) — delegates to player.update()
  - method: syncCamera(dt) — positions camera from player position + yaw/pitch
```

Key design choice: PlayerView owns the camera; Player owns the entity state. The game loop calls `playerView.update()` which reads from its input router and updates the Player, then syncs the camera.

### Input ownership & routing (js/input-coop.js)

```
InputRouter (new, js/input-coop.js):
  - slots: { p1: Input|GamepadInput, p2: GamepadInput|null }
  - p1Device: 'kbm' | 'gamepad0' — P1 can use either
  - p2Device: 'gamepad1' — P2 is always second pad

  For KBM (P1):
    - Uses existing js/input.js Input class
    - Pointer lock is per-player: P1 clicks canvas to lock; P2 has no pointer
    - Keyboard state is shared (both players read same key set) — P1 owns WASD, P2 has no keyboard
    - Mouse movement only affects P1 look

  For Gamepad (P1 pad0, P2 pad1):
    - Uses navigator.getGamepads() directly (no existing gamepad code yet)
    - Standard mapping: left stick = move, right stick = look, A/cross = interact, B/back = inventory
    - Each player has independent stick deadzones (0.15 default)

  InputRouter methods:
    - getP1Input() -> {moveX, moveY, lookX, lookY, breakHeld, placePressed, usePressed, eatPressed, inventoryPressed}
    - getP2Input() -> same shape
    - pollGamepads() -> reads current gamepad state each frame
```

Input mapping for co-op pads:

| Action | P1 (pad0) | P2 (pad1) |
|--------|-----------|-----------|
| Move | Left stick | Left stick |
| Look | Right stick | Right stick |
| Mine/Attack | R2/trig | R2/trig |
| Place | L2/trig | L2/trig |
| Interact (F) | A/cross | A/cross |
| Inventory (E) | B/back | B/back |
| Eat | Y/triangle | Y/triangle |
| Drop | X/square | X/square |
| Sprint | Left stick click | Left stick click |
| Pause | Start/Options | Start/Options |

### Dual camera rendering (js/viewport-split.js + game.js changes)

The existing `Game.render()` does a single `renderer.render(scene, camera)`. For split-screen:

```
ViewportSplit (new, js/viewport-split.js):
  - mode: 'left-right' | 'top-bottom' | 'single' (solo)
  - ratio: 0.5 (default half-half)

  method: getCameraRects(canvasW, canvasH) -> [{x,y,w,h}, {x,y,w,h}]
    - left-right: cam0 = [0, 0, W/2, H], cam1 = [W/2, 0, W/2, H]
    - top-bottom: cam0 = [0, 0, W, H/2], cam1 = [0, H/2, W, H/2]

  method: applyScissor(renderer, index) -> void
    - renderer.setScissorRect(cam0.x, cam0.y, cam0.w, cam0.h)
    - renderer.setScissorTest(true)

Game changes:
  - this.coopMode = false (default solo)
  - this.playerViews = [] (array of PlayerView, length 1 or 2)
  - this.viewport = new ViewportSplit()

  render():
    if (this.coopMode && this.playerViews.length === 2) {
      const rects = this.viewport.getCameraRects(canvasW, canvasH);
      // Render P1 view
      this.renderer.setScissorTest(true);
      this.renderer.setScissor(rects[0].x, rects[0].y, rects[0].w, rects[0].h);
      this.playerViews[0].syncCamera();
      this.renderer.render(this.scene, this.playerViews[0].camera);

      // Render P2 view
      this.renderer.setScissor(rects[1].x, rects[1].y, rects[1].w, rects[1].h);
      this.playerViews[1].syncCamera();
      this.renderer.render(this.scene, this.playerViews[1].camera);

      // Reset scissor for HUD
      this.renderer.setScissorTest(false);
    } else {
      // Existing single-camera render path (unchanged)
      this.renderer.render(this.scene, this.camera);
    }
```

Important: The shared `scene` contains all world geometry, animals, FX. Both cameras render the same scene from different positions. The HUD overlay (HTML DOM) is shared — both players see a combined HUD at the bottom center.

### Shared World (no changes to js/world.js)

The existing `World` class is already shared-state by design:
- Chunk mesh generation (js/world.js) — single world, both players see same blocks
- Raycasting (`world.raycast()`) — uses player position as origin, called per-player-view
- Block edits (`world.setBlock()`) — atomic, both players see changes immediately

No world module changes needed. The co-op loop calls `world.tick(dt)` once per frame (not per-player).

### Game loop structure

```
Game._tick(dt):
  // World tick (once, shared)
  this.time.tick(dt);
  this.world.tick(dt);
  this.fauna?.tick(dt, ...);

  // Per-player update (each reads its own input)
  for (const pv of this.playerViews) {
    const input = this.inputRouter.getForPlayer(pv.id);
    pv.update(dt, this.world, input, this.survivalForPlayer(pv.id));
  }

  // Camera sync (per player)
  for (const pv of this.playerViews) {
    pv.syncCamera();
  }

  // HUD update (shared, merged)
  this._updateHud();

render():
  // Dual-camera scissor render (see above)
```

### Pause rules

- Either player pressing pause triggers full freeze for both players
- Pause menu is shared (one overlay, not per-player)
- While paused: world tick stops, fauna stops, survival meters freeze
- P1's KBM pointer lock is released; P2 has no pointer to release
- Resume: P1 re-acquires pointer lock automatically

```
Game._handlePause():
  if (this.inputRouter.anyPaused()) {
    this.paused = !this.paused;
    if (this.paused) {
      this.input.releasePointerLock?.(); // P1 only
    } else {
      this.canvas.requestPointerLock?.(); // P1 re-lock
    }
  }
```

### Death rules

- One player dead ≠ session end; the dead player's camera shows a static "spectate" view
- Both players dead → game over (permadeath clears save, survival mode offers respawn)
- Friendly fire: default OFF (P1 cannot damage P2's player model, and vice versa)
- Dead player can spectate world; alive player continues

```
PlayerView methods:
  - die(cause) -> this.alive = false; this.player.survival.dead = true
  - isAlive() -> this.alive

Game._tick death handling:
  const alivePlayers = this.playerViews.filter(pv => pv.isAlive());
  if (alivePlayers.length === 0) {
    // Both dead -> game over
    this._onAllDead();
  } else if (alivePlayers.length === 1) {
    // One dead -> spectate mode for dead player
    this._onPlayerDead(alivePlayers[0]); // the surviving one
  }
```

### Save schema v2 (js/save.js changes)

Current save format stores a single `player` object. Co-op extends this:

```
Save payload (v2):
  v: SAVE_VERSION (increment to 2)
  savedAt: Date.now()
  seed: number
  mode: 'survival' | 'hardcore' | 'creative' | 'competitive'
  time: { elapsed, weather, weatherTimer, dayLengthSec }

  // NEW: players array (backward compat: solo saves have length 1)
  players: [
    {
      id: 'p1' | 'p2',
      pos: { x, y, z },
      look: { yaw, pitch },
      inv: [{ id, count, age?, dur? }],  // inventory slots (cloneSlots format)
      equip: { head, chest, feet },       // equipment
      survival: {                          // survival meters (same shape as current)
        health, maxHealth, hunger, maxHunger,
        stamina, maxStamina, bodyTemp, sleep, wetness, dead, causeOfDeath
      },
      hotbarIndex: number
    }
  ]

  // Existing fields (unchanged)
  edits: [[x,y,z,id], ...]
  animals: [...]
  chests: { "x,y,z": [{ id, count, age?, dur? }, ...] }
```

Backward compatibility:
- Loading v1 save (single player): wraps in `players: [{ ...existingPlayer, id: 'p1' }]`
- Solo mode always reads `players[0]`; ignores rest
- Co-op load: restores all players in `players` array

### PS5 browser / DualSense notes

- PS5 browser (Chromium-based) supports gamepad API but with limitations:
  - Only one DualSense may be connected at a time in browser (OS-level limitation)
  - Second controller requires USB dongle or PS Remote Play workaround
  - DualSense rumble/vibration may not work in browser (no haptic API)

- Safe margins: ~5% padding on all sides for TV overscan
  - HUD text must be >= 18px font size
  - Button labels visible at 3m viewing distance

- Full UI navigation without mouse:
  - All menu items must be reachable via gamepad D-pad / stick
  - Focus ring visible on all interactive elements

- Test checklist (docs/playtest-ps5-browser.md):
  - [ ] Boot screen shows Solo | Local Co-op options
  - [ ] Co-op starts two viewports (L/R split)
  - [ ] Both players can move independently
  - [ ] World edits visible to both simultaneously
  - [ ] Inventories are separate and correct
  - [ ] Save/load works with two players
  - [ ] Pause freezes both, resume works
  - [ ] One death doesn't end session
  - [ ] HUD readable at TV distance
  - [ ] No input conflicts between players

### Perf targets (PS5 browser / dual render)

- Dual 1080p-class at >=30fps target
- Co-op preset: reduce chunk render radius from 5 to 4, entity cap at 20, shadows off
- Shared scene means geometry is rendered twice (once per camera) — expect ~1.8x draw call cost vs solo
- Consider frustum culling per-camera (Three.js does this automatically)

## Modules summary

| Module | Role |
|--------|------|
| `js/player-view.js` | PlayerView data + helpers (camera, alive state, update delegation) |
| `js/input-coop.js` | dual pad + KBM slot router, gamepad polling |
| `js/viewport-split.js` | L/R (and optional T/B) scissor rect calculation |
| `js/coop-state.js` | clone/serialize two players for save, death/spectate logic |
| `js/game.js` | scissor dual render, mode flag, coop-aware loop (modified) |
| `js/save.js` | v2 save schema with players array (modified) |
| Title screen | Solo \| Local Co-op option selector |

## Acceptance (ship coop MVP)

1. Title screen offers "Local Co-op" option alongside Solo
2. Co-op mode starts two viewports (L/R split)
3. P1 KBM moves/looks/mines/places; P2 pad1 independent movement/look
4. Shared world edits visible both sides in real-time
5. Separate inventories + survival meters per player
6. Either player can pause; full freeze for both
7. One death = spectate mode; both dead = game over
8. Save/load restores both players with full state
9. `node tests/smoke.mjs` PASS (no new failures)
10. No console errors on boot path in co-op mode

## Card order (implementation sequence)

1. design doc v2 (this) + pure modules: player-view.js, input-coop.js, viewport-split.js
2. title option + dual camera: game.js render path, ViewportSplit integration
3. input slots + HUD: gamepad polling, per-player input routing, merged HUD
4. save v2 + pause + death: players array schema, pause freeze, spectate mode
5. fauna multi-target + perf preset: per-player animal targeting, co-op render distance
6. polish pack: TV safe margins, DualSense notes, PS5 browser testing

## Known constraints & risks

- **Gamepad API**: `navigator.getGamepads()` returns an array; slot index = connection order. No standard mapping on all browsers — must implement custom deadzone/threshold logic.
- **Pointer lock**: Only one element can have pointer lock at a time. P1 owns it; P2 has no look input (pad-only).
- **DOM HUD**: Single DOM overlay for both players. Need to merge survival meters, hotbar, and messages into a single bottom-center HUD that doesn't obscure either camera view.
- **Three.js scissor**: `renderer.setScissorTest(true)` + `setScissor(x, y, w, h)` is well-supported in Chrome/Chromium (PS5 browser).
- **Save migration**: v1 -> v2 must handle existing saves gracefully. Solo players should never notice the change.
- **PS5 browser gamepad**: May only see one controller. Document this limitation; design for two but test with one.

## PS5 dual DualSense acceptance (browser)

Derived from `docs/playtest-ps5-browser.md` + live v1.10+ coop.

### Boot
- [ ] Open GH Pages URL in PS5 browser; title shows Solo | Local Co-op
- [ ] Select **Local Co-op**, Start; dual viewports + P1/P2 tags
- [ ] If only one pad: `#coop-pad-prompt` visible on right half (large TV text)

### Two DualSense (if OS exposes both to browser)
- [ ] Pad0 or KBM drives **left** (P1); pad1 drives **right** (P2 body)
- [ ] P2: left stick move, right stick look, R2 mine, L1 place, Share inv, Options pause, Circle use/sleep
- [ ] P1 Esc/Options pauses **both**; resume re-locks P1 pointer only
- [ ] Friendly fire off: swinging/arrows do not kill partner
- [ ] Fauna can target either player (nearest)
- [ ] One player death: partner keeps playing; Respawn restores downed player
- [ ] Both dead: death overlay; Respawn/new as solo path
- [ ] Bed sleep: both living players within ~4.5m; night skips; both fatigue restore
- [ ] Save/Continue restores player2 pose + survival2 when playMode coop

### Perf
- [ ] Coop effective RD = slider−2; aim ≥30 fps dual 1080p-class (see coop-perf-budget.md)
- [ ] No console spam / freezes on 10+ min session

### Known limits
- Some PS5 browser builds may only expose **one** gamepad to the page — document result
- No DualSense haptics/adaptive triggers in browser
- Tab suspend may drop WebGL context after idle

