# Gamepad Support — DualSense & Standard Controllers

## Overview

Frontier Survival supports any "Standard gamepad" layout via the Web Gamepad API. The canonical mapping table lives in `js/input.js`:

- `GAMEPAD_BUTTON_MAP` — button index → game action
- `GAMEPAD_AXIS_MAP` — axis index → name + description
- `TRIGGER_BUTTON_MAP` — trigger pressed-button index → axis reference

## Button Mapping Reference

| Index | Action       | Xbox/PC Label | PS5 DualSense |
|------:|-------------|---------------|----------------|
| 0     | jump        | A             | Cross          |
| 1     | use         | B             | Circle         |
| 2     | drop        | X             | Square         |
| 3     | eat         | Y             | Triangle       |
| 4     | place       | LB            | L1             |
| 5     | sprint      | RB            | R1             |
| 6     | L2 pressed  | LT (button)   | L2 (button)    |
| 7     | R2 pressed  | RT (button)   | R2 (button)    |
| 8     | inventory   | Back/View     | Share          |
| 9     | pause       | Start/Menu    | Options        |
| 10    | quick_save  | LS click      | L3             |
| 11    | crouch      | RS click      | R3             |
| 12    | dpad up     | D-pad Up      | D-pad Up       |
| 13    | dpad left   | D-pad Left    | D-pad Left     |
| 14    | dpad down   | D-pad Down    | D-pad Down     |
| 15    | dpad right  | D-pad Right   | D-pad Right    |

## Axis Mapping Reference

| Index | Name             | Range      | Purpose                    |
|------:|-----------------|------------|----------------------------|
| 0     | left_stick_x    | -1 .. +1   | Movement horizontal        |
| 1     | left_stick_y    | -1 .. +1   | Movement vertical          |
| 2     | l2_trigger      | 0 .. 1     | Left trigger gradual       |
| 3     | right_stick_y   | -1 .. +1   | Camera look vertical       |
| 4     | right_stick_x   | -1 .. +1   | Camera look horizontal     |
| 5     | r2_trigger      | 0 .. 1     | Right trigger gradual      |

## PS5 DualSense Browser Quirks

### Chromium/Chrome (109+)
- Reports `id: "Wireless Controller"` or `"DualSense Wireless Controller"`.
- `gamepadType` = `"Standard gamepad"`.
- Dual-rumble vibration via `vibrationActuator.playEffect('dual-rumble', ...)` works in Chrome 109+.
- Triggers (L2/R2) report as both axes (indices 2, 5) AND buttons (indices 6, 7).
- **Quirk:** First press after connection may return stale button state — poll twice before trusting.
- **Quirk:** `hapticActuators` array exists but may be empty even when `vibrationActuator` works.

### Firefox
- Reports `id: "PS5 Controller"`.
- `gamepadType` = `"Standard gamepad"`.
- Vibration API (`vibrationActuator`) is **not supported** — rumble silently fails.
- Triggers report as axes only (no button counterpart for L2/R2 pressed).
- **Quirk:** `navigator.getGamepads()` may return null for disconnected indices — always check `gp !== null`.

### Safari (WebKit)
- Gamepad API support is **experimental** — may not fire `gamepadconnected`/`gamepaddisconnected`.
- Reports `id: "PS5 Controller"` or generic `"Gamepad"`.
- Vibration API is **not supported**.
- `hapticActuators` may exist with a `.pulse()` method but often throws — wrapped in try/catch.
- **Quirk:** Polling `navigator.getGamepads()` every frame is the only reliable detection method on Safari.

### Edge Cases
- Some browsers report triggers as -1..+1 instead of 0..1. Our code reads `absBtn(i).value` which is always 0..1 per spec, but axis values should be clamped.
- Connection order is not guaranteed to match physical controller number — `GamepadSlotManager` handles stable slot assignment.
- Multiple identical controllers report the same `.id` — use `.index` to distinguish.

## Vibration/Rumble API

The `Input.rumble(duration, intensity)` method handles three actuator types:
1. **dual-rumble** (DualSense) — separate weak/strong magnitudes
2. **single-rumble** (Xbox, generic) — single magnitude
3. **hapticActuators[].pulse()** (Safari/WebKit legacy) — wrapped in try/catch

## Testing Without Hardware

- Chrome DevTools → Sensors tab can mock gamepad input.
- `tests/smoke.mjs` asserts mapping table structure without requiring a physical controller.
