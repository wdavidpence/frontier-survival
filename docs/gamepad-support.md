# Gamepad Support (DualSense, Xbox, Generic)

## Overview

Frontier Survival supports gamepad input via the Web Gamepad API. Tested with:
- **PS5 DualSense** (Chrome, Edge) — full support including triggers and haptics
- **Xbox Wireless Controller** (Chrome, Edge) — full support
- **Generic USB gamepads** (XInput-compatible) — full support

## Browser Support Matrix

| Browser | Gamepad API | DualSense Triggers | Haptics/Rumble |
|---------|-------------|-------------------|----------------|
| Chrome  | Full        | Yes (axes 2,5)    | Dual-rumble    |
| Edge    | Full        | Yes               | Dual-rumble    |
| Firefox | Full        | Yes               | Single rumble  |
| Safari (WebKit) | Partial | No (returns 0)   | Pulse only     |
| iOS Safari | Limited  | No                | No             |

**WebKit/Safari gaps:**
- `navigator.getGamepads()` exists but may return empty arrays for DualSense
- Triggers (L2/R2) report as 0.0 on axis[2]/axis[5]
- Haptic `pulse()` may throw — wrapped in try/catch
- Recommendation: show "Gamepad not detected on this browser" message

## Button Mapping (Standard Gamepad Layout)

| Button | DualSense | Xbox | Action |
|--------|-----------|------|--------|
| 0      | Cross (X) | A    | Jump   |
| 1      | Circle (O)| B    | Use    |
| 2      | Square (□)| X    | Drop   |
| 3      | Triangle (△)| Y  | Eat    |
| 4      | L1        | LB   | Place block |
| 5      | R1        | RB   | Sprint |
| 6      | L2 (press)| —    | —      |
| 7      | R2 (press)| —    | —      |
| 8      | Share     | View | Inventory |
| 9      | Options   | Menu | Pause/Menu |
| 10     | L3 (stick press) | Left stick | Crouch |
| 11     | R3 (stick press) | Right stick | Quick save |
| 12-15  | D-pad ↑←→↓ | D-pad | Movement (fallback) |

## Axis Mapping

| Axis | DualSense | Xbox | Action |
|------|-----------|------|--------|
| 0    | Left stick X | Left stick X | Left/Right movement |
| 1    | Left stick Y | Left stick Y | Forward/Backward movement |
| 2    | L2 trigger (0→1) | — | Forward boost when stick idle |
| 3    | Right stick Y | Right stick Y | Look up/down |
| 4    | Right stick X | Right stick X | Look left/right |
| 5    | R2 trigger (0→1) | — | Fine-tune look when stick idle |

## Configuration

Exposed on `input` instance:

```js
// Deadzone for analog sticks (0.0 = none, 1.0 = full)
input.deadzone = 0.15;

// Look sensitivity for right stick (radians per axis unit)
input.gpSensitivity = 0.03;

// Trigger rumble (if controller supports it)
input.rumble(200, 0.5); // duration ms, intensity 0-1
```

## Implementation Details

### Deadzone Handling

Both left and right sticks use a **deadzone with linear ramp**:
```js
if (Math.abs(value) < deadzone) value = 0;
else value = sign(value) * (abs(value) - deadzone) / (1 - deadzone);
```

This gives smooth response after the deadzone clears, avoiding sudden jumps.

### Gamepad Polling

`input.pollGamepad()` is called every frame from the game loop (`js/game.js:_loop`). It:
1. Reads all axes and buttons from the connected gamepad
2. Applies deadzone to both sticks
3. Maps left stick → virtual movement (`_vMoveX`, `_vMoveZ`)
4. Maps right stick → camera look (`lookX`, `lookY`)
5. Processes button presses for all game actions

### Connection Handling

- `gamepadconnected` event → stores index, sets `_gpConnected = true`
- `gamepaddisconnected` event → resets index, sets `_gpConnected = false`
- Disconnection is handled gracefully — game falls back to keyboard/mouse

### Haptic Feedback

Two APIs are attempted (in order):
1. **Vibration API** (`gamepad.vibrationActuator.playEffect()`) — Chrome/Edge
   - DualSense: `dual-rumble` mode (separate weak/strong motors)
   - Xbox/generic: `single-rumble` mode
2. **GamepadHapticActuator** (`gamepad.hapticActuators[0].pulse()`) — WebKit fallback

Both are wrapped in try/catch for Safari compatibility.

## Testing

### Local testing
1. Connect DualSense via USB or Bluetooth
2. Start local server: `python3 -m http.server 8765` (from repo root)
3. Open `http://localhost:8765` in Chrome/Edge
4. Press any button on controller to wake it up
5. Debug overlay shows `GP:0` when gamepad is connected

### Smoke tests
```bash
node tests/smoke.mjs  # All 98 tests pass (no gamepad-specific tests yet)
```

### Manual test checklist
- [ ] Left stick moves character in all directions
- [ ] Right stick rotates camera (pitch and yaw)
- [ ] Deadzone prevents drift when sticks are idle
- [ ] Cross/A button jumps
- [ ] Circle/B button uses objects
- [ ] Square/X button drops items
- [ ] Triangle/Y button eats food
- [ ] L1/RB places blocks
- [ ] R1/RB sprints (hold)
- [ ] L3 crouches
- [ ] R3 quick saves
- [ ] Share/View opens inventory
- [ ] Options/Menu pauses game
- [ ] D-pad moves character (fallback)
- [ ] Disconnecting controller doesn't crash game

## Known Issues

1. **WebKit/Safari**: DualSense triggers may not register; haptics unreliable
2. **Firefox**: Pointer lock with `unadjustedMovement` requires UA detection (handled in `requestLock()`)
3. **Multiple controllers**: Only first connected controller is used (`_gpIndex` stores first connection)
4. **Steam Input**: May remap buttons — test with Steam Big Picture mode off

## Future Improvements

- Per-axis deadzone configuration (UI slider)
- Button remapping UI
- Adaptive triggers support (DualSense-specific, axis 2/5 already read)
- Touchpad input on DualSense (not currently mapped)
- Force feedback for damage/recoil events
