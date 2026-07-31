# PS5 Browser QA Checklist — Frontier Survival

BACKLOG_ID: FS-84b840632b
PILLAR: multiplayer_future
PRIORITY: 5

## Setup

- PS5 console, firmware 8.00 or later (Chromium-based browser)
- Two DualSense controllers, fully charged and paired via Bluetooth or USB
- TV connected to PS5 (1080p minimum; 4K preferred)
- Stable internet connection (Wi-Fi or Ethernet)
- GitHub Pages URL: https://wdavidpence.github.io/frontier-survival/
- Local server (if testing on LAN): http://<PS5_IP>:8767/

## Pre-Test Checklist

- [ ] PS5 browser updated to latest version
- [ ] Both DualSense controllers paired and responsive in system settings
- [ ] Browser cache cleared before first test (Settings → System Settings → System Software → Browser → Clear Cache)
- [ ] TV set to Game Mode (reduces input lag for responsive testing)

---

## Test 1: Boot — Open GH Pages URL

- [ ] Navigate to https://wdavidpence.github.io/frontier-survival/ in PS5 browser
- [ ] Page loads without blank screen or infinite spinner
- [ ] Title screen renders (logo, Start button visible)
- [ ] No JavaScript errors in browser console (access via Settings → System Settings → System Software → Developer Tools if available)
- [ ] Page does not crash or reload unexpectedly

**Known PS5 browser limits:**
- WebGL 1.0 supported; WebGL 2.0 may be partial — check if terrain renders correctly
- No WebRTC support (future multiplayer will not work on PS5 browser)
- Limited service worker / PWA install support
- Tab suspension after ~10 minutes of inactivity — game state may be lost on resume

---

## Test 2: Start Game

- [ ] Click or press Enter/Space on the Start button
- [ ] Title overlay disappears; game canvas appears
- [ ] HUD renders: health bar, hunger meter, body temp, status line
- [ ] Hotbar (9 slots) visible at bottom of screen
- [ ] World generates — terrain, sky, lighting present

**Known PS5 browser limits:**
- Canvas rendering may be slower on older PS5 firmware — expect lower FPS than desktop
- No hardware cursor visible; all interaction is controller-driven

---

## Test 3: DualSense Controller — Player 1 (Primary)

- [ ] Left stick moves character forward/backward/strafe
- [ ] Right stick (or D-pad) controls camera look direction
- [ ] R2 / Trigger mines/breaks blocks (mapped to left mouse button)
- [ ] L2 / Trigger places blocks (mapped to right mouse button)
- [ ] Square / X jumps
- [ ] Triangle / Y opens inventory (E key equivalent)
- [ ] Circle / B eats ration from hotbar (R key equivalent)
- [ ] Cross / A confirms in menus
- [ ] Share button opens browser menu (expected behavior — do not map to game action)
- [ ] Touchpad accessible via browser menu (no direct game mapping required)

**Known PS5 browser limits:**
- DualSense haptic feedback and adaptive triggers are NOT available in the browser — only button/axis input works
- Gyroscope motion controls may not be exposed to web pages on PS5 — camera look via stick only
- Controller vibration is browser-dependent; do not rely on it

---

## Test 4: DualSense Controller — Player 2 (Split-Screen / Co-op) — v1.10+ mappings

Title: choose **Local Co-op** then Start.

### Recognition
- [ ] Second DualSense paired; if browser only exposes one pad, right-half `#coop-pad-prompt` shows
- [ ] When two pads visible: pad0→P1 (or KBM P1), pad1→P2 body on **right** viewport

### P2 controls (Standard Gamepad / DualSense)
- [ ] Left stick — move
- [ ] Right stick — look
- [ ] **R2** (or Square) — mine / break
- [ ] **L1** — place block
- [ ] **Share** — P2 inventory ("P2 Pack and Craft"); does not uiMode-lock P1
- [ ] **Options** — pause full sim (both players)
- [ ] **Circle** — use (bed sleep request when looking at bed)
- [ ] **Cross** — jump
- [ ] D-pad left/right — cycle P2 hotbar

### Shared rules
- [ ] Dual HUD: left P1 meters/hotbar, right P2
- [ ] Friendly fire off by default
- [ ] Fauna can aggro nearest of P1/P2
- [ ] One player down: other continues; both down: death overlay
- [ ] Coop sleep: both living players within ~4.5m of each other at bed

## Test 5: TV-Safe Display

- [ ] All HUD elements (health, hunger, temp, status) are visible within the safe area
- [ ] No critical UI is clipped by TV overscan (test on multiple TVs if possible)
- [ ] Text is legible at normal viewing distance (~8–10 feet on 55" TV)
- [ ] Hotbar items are distinguishable at a glance (color contrast adequate)
- [ ] Status line text wraps or truncates gracefully on narrow screens

**TV-safe margin guidelines:**
- Keep all interactive elements at least 36px from screen edge (1080p safe area)
- Status text should not exceed 90% of screen width
- Hotbar should be centered and no more than 600px wide

---

## Test 6: Controls — Movement & Interaction

- [ ] WASD-equivalent (left stick) movement is smooth and responsive
- [ ] Sprint (hold L3 / click left stick) drains stamina visibly
- [ ] Jump height is consistent; no clipping through blocks
- [ ] Block breaking (R2) shows progress bar and completes
- [ ] Block placing (L2) respects placement rules (solid surface, no player overlap)
- [ ] Inventory opens/closes without freezing the game

**Known PS5 browser limits:**
- Pointer lock (mouse look) is not available — camera must use stick or D-pad
- Keyboard fallback keys may work if PS5 browser supports on-screen keyboard, but controller is the primary input method

---

## Test 7: Crafting & Inventory

- [ ] Press Triangle/Y to open inventory
- [ ] Craft panel shows all available recipes (27 slots)
- [ ] Crafting consumes correct ingredients from inventory
- [ ] Crafted items appear in hotbar or inventory
- [ ] Closing inventory returns to gameplay without freeze

**Known PS5 browser limits:**
- On-screen keyboard is limited — text input (e.g., world name) may be difficult; prefer controller navigation
- No copy/paste support in PS5 browser

---

## Test 8: Survival Systems

- [ ] Hunger meter decreases over time; eating restores it
- [ ] Body temperature responds to environment (cold at night, near campfire recovers)
- [ ] Health decreases when hunger is zero or health reaches zero triggers death screen
- [ ] Day/night cycle visible with corresponding temperature changes
- [ ] Weather (rain/snow) affects visibility and body temp

**Known PS5 browser limits:**
- Performance may drop during heavy weather effects (rain, snow) on older PS5 firmware
- No background audio processing — ambient sounds may stop if browser suspends tab

---

## Test 9: Performance & Stability

- [ ] Game runs at a playable frame rate (target: 30 FPS minimum on PS5)
- [ ] No memory leaks after 15+ minutes of continuous play
- [ ] No crashes when loading into a new world
- [ ] No crashes when breaking/placing 50+ blocks in succession
- [ ] Tab does not get suspended during active gameplay

**Known PS5 browser limits:**
- Memory limit is approximately 2–4 GB for web pages on PS5 — large worlds may cause slowdown
- WebGL context loss can occur if the console goes into rest mode; game will not recover automatically
- Long sessions (>30 minutes) may accumulate memory pressure — recommend periodic browser restart

---

## Test 10: Audio (if applicable)

- [ ] Ambient sounds play at reasonable volume
- [ ] No audio distortion or crackling during gameplay
- [ ] Audio does not cause browser tab suspension

**Known PS5 browser limits:**
- Audio context may be suspended when the console enters rest mode
- No spatial audio support in PS5 browser

---

## Pass/Fail Summary Table

| # | Test                        | Expected Result                                    | Pass | Fail | Notes                          |
|---|-----------------------------|----------------------------------------------------|------|------|--------------------------------|
| 1 | Boot — Open GH Pages        | Title screen loads, no JS errors                   | [ ]  | [ ]  |                                |
| 2 | Start Game                  | Canvas + HUD visible, world generates              | [ ]  | [ ]  |                                |
| 3 | DualSense P1 Controls       | All mapped buttons work, movement + look functional| [ ]  | [ ]  |                                |
| 4 | DualSense P2 (Co-op)        | Second player joins, no input conflict             | [ ]  | [ ]  | Skip if co-op not yet shipped  |
| 5 | TV-Safe Display             | All UI within safe area, text legible              | [ ]  | [ ]  |                                |
| 6 | Movement & Interaction      | Break/place/jump/sprint all functional             | [ ]  | [ ]  |                                |
| 7 | Crafting & Inventory        | Open, craft, close without freeze                  | [ ]  | [ ]  |                                |
| 8 | Survival Systems            | Hunger, temp, health, day/night cycle work         | [ ]  | [ ]  |                                |
| 9 | Performance & Stability     | 30+ FPS, no crashes in 15 min                      | [ ]  | [ ]  |                                |
| 10| Audio                       | Sounds play, no distortion                         | [ ]  | [ ]  | Skip if audio not yet shipped  |

---

## Known PS5 Browser Limitations (Summary)

1. **No WebRTC** — real-time multiplayer/co-op over the network is not possible in PS5 browser
2. **No pointer lock** — mouse-look camera must use stick or D-pad instead
3. **Limited gamepad API** — only 2 controllers supported; no haptic/adaptive trigger feedback
4. **Tab suspension** — browser suspends inactive tabs after ~10 minutes; game state lost on resume
5. **WebGL 2.0 partial** — some advanced shaders may fall back or render incorrectly
6. **Memory cap ~2–4 GB** — large worlds or long sessions may cause slowdown
7. **No service worker / PWA install** — cannot add to home screen or play offline
8. **No copy/paste** — text input must use on-screen keyboard (limited)
9. **No spatial audio** — all audio is stereo, no 3D positioning in browser
10. **Rest mode kills WebGL** — console rest mode destroys WebGL context; game will not recover

---

## Notes for QA Testers

- Always test on at least two different TVs if possible (overscan varies by model)
- Record frame rate manually if no in-game FPS counter exists (use PS5 built-in overlay: press PS button → Game Base → Create → Share Link Settings → FPS Counter)
- If the game crashes, note what you were doing immediately before (mining? crafting? entering a cave?)
- Test both warm and cold boot of the browser (close all tabs vs. fresh restart)
- If a test fails, note whether it is a **blocker** (cannot play at all) or **cosmetic** (UI issue, performance only)
- Document any controller mapping that feels unintuitive — PS5 players expect SC-style layouts

---

## Related Documents

- `docs/playtest.md` — general playtest log
- `docs/session-handoff.md` — session brief and board state
- `docs/roadmap/MASTER_PLAN.md` — feature roadmap
