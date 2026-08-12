import { isPrimaryBreakButton, combineBreakHeld, transitionBreakPointer } from './interaction-contract.js?v=4';

/** Keyboard + mouse input (Minecraft-style). Bulletproof for browser quirks.

 * INPUT PRIORITY (when both KBM and gamepad0 are active on the same player):
 *   Inputs MERGE / ACCUMULATE — no source is exclusive. Keyboard keys land in
 *   Input.keys; gamepad axes/buttons set the virtual-move/jump/sprint flags.
 *   The convenience accessors (wantsForward, wantsBack, etc.) use OR logic:
 *   either KBM keys OR gamepad virtual-move can satisfy the condition.
 *   Gamepad stick only overrides KBM when outside deadzone; otherwise keys still work.
 * SAFETY: Gamepad polling is guarded — zero connected gamepads causes no crash,
 * and pollGamepad() returns early when _gpConnected is false. */

/**
 * GamepadSlotManager — tracks connected gamepads with stable slot assignment.
 *
 * slot0 = first connected, slot1 = second connected by connection order.
 * On disconnect, the slot becomes free. A new pad takes the lowest available
 * slot. This prevents thrashing and survives mid-game disconnect/reconnect.
 */
export class GamepadSlotManager {
  constructor() {
    /** @type {{0: number|null, 1: number|null}} slot -> gamepad index, null = free */
    this.slots = { 0: null, 1: null };
    /** gamepad index -> slot, for reverse lookup */
    this._gpToSlot = new Map();
  }

  /** Called on gamepadconnected. Returns assigned slot (0|1) or -1 if full. */
  onConnect(gamepadIndex) {
    // Already tracked — return existing slot.
    if (this._gpToSlot.has(gamepadIndex)) {
      return this._gpToSlot.get(gamepadIndex);
    }
    // Find first free slot.
    for (const slot of [0, 1]) {
      if (this.slots[slot] === null) {
        this.slots[slot] = gamepadIndex;
        this._gpToSlot.set(gamepadIndex, slot);
        return slot;
      }
    }
    return -1; // No free slots
  }

  /** Called on gamepaddisconnected. Returns freed slot or -1 if not tracked. */
  onDisconnect(gamepadIndex) {
    const slot = this._gpToSlot.get(gamepadIndex);
    if (slot !== undefined) {
      this.slots[slot] = null;
      this._gpToSlot.delete(gamepadIndex);
      return slot;
    }
    return -1;
  }

  /** Get the gamepad index for a slot (0|1), or null if free. */
  getGamepad(slot) {
    return this.slots[slot];
  }

  /** Check if a slot has an active gamepad. */
  hasGamepad(slot) {
    return this.slots[slot] !== null;
  }

  /** Reset all slots. */
  reset() {
    this.slots[0] = null;
    this.slots[1] = null;
    this._gpToSlot.clear();
  }

  /** Get all connected gamepad indices. */
  getConnectedIndices() {
    return Object.values(this.slots).filter(v => v !== null);
  }
}

const CODE_FROM_KEY = {
  w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD',
  W: 'KeyW', A: 'KeyA', S: 'KeyS', D: 'KeyD',
  ' ': 'Space',
  shift: 'ShiftLeft',
  control: 'ControlLeft',
  ctrl: 'ControlLeft',
  c: 'KeyC', C: 'KeyC',
  e: 'KeyE', E: 'KeyE',
  f: 'KeyF', F: 'KeyF',
  r: 'KeyR', R: 'KeyR',
  q: 'KeyQ', Q: 'KeyQ',
  k: 'KeyK', K: 'KeyK',
  h: 'KeyH', H: 'KeyH',
  escape: 'Escape',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  '1': 'Digit1', '2': 'Digit2', '3': 'Digit3', '4': 'Digit4', '5': 'Digit5',
  '6': 'Digit6', '7': 'Digit7', '8': 'Digit8', '9': 'Digit9',
};

const GAME_CODES = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Space', 'ShiftLeft', 'ShiftRight',
  'ControlLeft', 'ControlRight', 'KeyC',
  'KeyE', 'KeyF', 'KeyR', 'KeyQ', 'KeyK', 'KeyH',
  'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
  'Digit6', 'Digit7', 'Digit8', 'Digit9',
  'Escape', 'F3',
]);

/**
 * Standard Gamepad button mapping (single source of truth).
 * Maps gamepad button index -> { action, label, ps5_label }.
 *
 * Standard layout (GT/Xbox): A=0, B=1, X=2, Y=3, LB=4, RB=5,
 *   Back/Share=8, Start/Options=9, LS=10, RS=11.
 *   D-pad: Up=12, Down=14, Left=13, Right=15.
 * PS5 DualSense: Cross=0, Circle=1, Square=2, Triangle=3,
 *   L1=4, R1=5, Share=8, Options=9, L3=10, R3=11.
 */
export const GAMEPAD_BUTTON_MAP = {
  0:   { action: 'jump',      label: 'A/Cross' },
  1:   { action: 'use',       label: 'B/Circle' },
  2:   { action: 'drop',      label: 'X/Square' },
  3:   { action: 'inventory', label: 'Y/Triangle' },
  4:   { action: 'hotbar_prev', label: 'LB/L1' },
  5:   { action: 'hotbar_next', label: 'RB/R1' },
  8:   { action: 'share',     label: 'Share' },
  9:   { action: 'pause',     label: 'Options/Start' },
  10:  { action: 'sprint',    label: 'L3/LS' },
  11:  { action: 'crouch',   label: 'R3/RS' },
  12:  { action: 'dpad_up',   label: 'D-pad Up' },
  13:  { action: 'dpad_left', label: 'D-pad Left' },
  14:  { action: 'dpad_down', label: 'D-pad Down' },
  15:  { action: 'dpad_right', label: 'D-pad Right' },
};

/**
 * Standard Gamepad axis mapping (single source of truth).
 * Maps gamepad axis index -> { name, description }.
 *
 * Standard layout (GT/Xbox/PS5):
 *   0=left stick X, 1=left stick Y, 2=right stick X,
 *   3=right stick Y. Triggers are buttons[6]=L2 and [7]=R2.
 */
export const GAMEPAD_AXIS_MAP = {
  0:   { name: 'left_stick_x', description: 'Left stick horizontal (L=-1, R=+1)' },
  1:   { name: 'left_stick_y', description: 'Left stick vertical (U=-1, D=+1)' },
  2:   { name: 'right_stick_x', description: 'Right stick horizontal (L=-1, R=+1)' },
  3:   { name: 'right_stick_y', description: 'Right stick vertical (U=-1, D=+1)' },
  4:   { name: 'l2_trigger', description: 'Non-standard extension axis; prefer button 6' },
  5:   { name: 'r2_trigger', description: 'Non-standard extension axis; prefer button 7' },
};

/** Trigger axes that also have a pressed button counterpart (buttons[6]=L2, [7]=R2). */
export const TRIGGER_BUTTON_MAP = {
  6: { axis: 2, action: 'l2_pressed', label: 'L2 pressed (button)' },
  7: { axis: 5, action: 'r2_pressed', label: 'R2 pressed (button)' },
};

function normalizeCode(e) {
  if (e.code && e.code !== 'Unidentified') return e.code;
  if (e.key && CODE_FROM_KEY[e.key] != null) return CODE_FROM_KEY[e.key];
  if (e.key && CODE_FROM_KEY[e.key.toLowerCase()] != null) return CODE_FROM_KEY[e.key.toLowerCase()];
  // keyCode legacy fallback
  const kc = e.keyCode || e.which;
  const map = {
    87: 'KeyW', 65: 'KeyA', 83: 'KeyS', 68: 'KeyD',
    38: 'ArrowUp', 40: 'ArrowDown', 37: 'ArrowLeft', 39: 'ArrowRight',
    32: 'Space', 16: 'ShiftLeft', 17: 'ControlLeft', 67: 'KeyC',
    69: 'KeyE', 70: 'KeyF', 82: 'KeyR', 81: 'KeyQ', 75: 'KeyK', 72: 'KeyH',
    27: 'Escape',
    49: 'Digit1', 50: 'Digit2', 51: 'Digit3', 52: 'Digit4', 53: 'Digit5',
    54: 'Digit6', 55: 'Digit7', 56: 'Digit8', 57: 'Digit9',
  };
  return map[kc] || '';
}

export class Input {
  constructor(domElement) {
    this.el = domElement;
    /** @type {Set<string>} */
    this.keys = new Set();
    this.lookX = 0;
    this.lookY = 0;
    this.locked = false;
    /** Soft look active after Click-to-play even without pointer lock */
    this.softLook = false;
    this.breakHeld = false;
    /** Tracks whether the gamepad (vs. mouse) currently owns breakHeld=true */
    this._breakFromGamepad = false;
    this.placePressed = false;
    this.usePressed = false;
    this.eatPressed = false;
    this.inventoryPressed = false;
    this.quickSavePressed = false;
    this.dropPressed = false;
    this.pausePressed = false;
    this.helpPressed = false;
    this.debugPressed = false;
    this.slot = -1;
    this.hotbarScroll = 0;
    this.sensitivity = 0.0022;
    this._bound = false;
    this.uiMode = false;
    this.captureEnabled = false;
    this._lastClientX = null;
    this._lastClientY = null;
    this._heldLmb = false;
    /** Virtual buttons from on-screen pad */
    this._vMoveX = 0;
    this._vMoveZ = 0;
    this._vJump = false;
    this._gpJumpHeld = false;
    this._gpUseHeld = false;
    this._vCrouch = false;
    /** Gamepad state — dual gamepad support via shared GamepadSlotManager */
    this._slots = null; // Shared GamepadSlotManager (set by caller or auto-created)
    this._mySlot = 0; // This Input controls slot 0 (primary player)
    this._gpIndex = -1; // Current gamepad index for slot 0 (back compat)
    this._gpConnected = false;
    /** Gamepad deadzone (0-1, default 0.15) */
    this.deadzone = 0.15;
    /** Gamepad look sensitivity (multiplier on right-stick delta) */
    this.gpSensitivity = 0.03;
    /** Gamepad vibration/rumble handle */
    this._gpVibrate = null;
  }

  clearTransient({ keepMove = false } = {}) {
    if (!keepMove) {
      this.keys.clear();
      this._vMoveX = 0;
      this._vMoveZ = 0;
      this._vJump = false;
      this._vCrouch = false;
    }
    this.breakHeld = false;
    this._heldLmb = false;
    this._breakFromGamepad = false;
    this.placePressed = false;
    this.usePressed = false;
    this.eatPressed = false;
    this.inventoryPressed = false;
    this.quickSavePressed = false;
    this.dropPressed = false;
    this.pausePressed = false;
    this.helpPressed = false;
    this.debugPressed = false;
    this.hotbarScroll = 0;
    this.slot = -1;
  }

  releaseBreak() {
    this._heldLmb = false;
    this.breakHeld = combineBreakHeld(this._heldLmb, this._breakFromGamepad);
  }

  setCaptureEnabled(on) {
    this.captureEnabled = !!on;
    if (on) this.softLook = true;
  }

  /** P1-only pointer lock (coop P2 uses pad look — never call this for P2). */
  requestLock() {
    if (this.uiMode) return Promise.resolve(false);
    this.softLook = true;
    if (document.pointerLockElement === this.el) {
      this.locked = true;
      return Promise.resolve(true);
    }
    const finish = () => {
      this.locked = document.pointerLockElement === this.el;
      if (this.el) this.el.style.cursor = this.locked ? 'none' : 'crosshair';
      return this.locked;
    };
    // Firefox rejects { unadjustedMovement: true } — skip option there.
    const _isFirefox = /firefox\//i.test(navigator.userAgent);
    try {
      const opts = _isFirefox ? undefined : { unadjustedMovement: true };
      const ret = this.el.requestPointerLock && this.el.requestPointerLock(opts);
      if (ret && typeof ret.then === 'function') {
        return ret.then(finish).catch(() => {
          // Non-Firefox browsers may still reject unadjustedMovement — bare retry.
          try { this.el.requestPointerLock().catch(() => {}); } catch (_) { /* */ }
          return finish();
        });
      }
      return Promise.resolve(finish());
    } catch (_) {
      try { this.el.requestPointerLock(); } catch (__){ /* */ }
      return Promise.resolve(finish());
    }
  }

  /** On-screen pad API */
  setVirtualMove(x, z) {
    this._vMoveX = Math.max(-1, Math.min(1, x || 0));
    this._vMoveZ = Math.max(-1, Math.min(1, z || 0));
  }
  setVirtualJump(v) { this._vJump = !!v; }
  setVirtualCrouch(v) { this._vCrouch = !!v; }
  nudgeLook(dx, dy) {
    // Screen-right drag should look right (negated yaw vs Three YXZ)
    this.lookX -= dx * this.sensitivity * 2.5;
    this.lookY += dy * this.sensitivity * 2.5;
    const lim = Math.PI / 2 - 0.01;
    this.lookY = Math.max(-lim, Math.min(lim, this.lookY));
  }

  bind() {
    if (this._bound) return;
    this._bound = true;
    // Capture phase on window — wins over focused buttons
    window.addEventListener('keydown', this._onKeyDown, true);
    window.addEventListener('keyup', this._onKeyUp, true);
    document.addEventListener('keydown', this._onKeyDown, true);
    document.addEventListener('keyup', this._onKeyUp, true);
    document.addEventListener('pointerlockchange', this._onLockChange);
    document.addEventListener('pointerlockerror', this._onLockError);
    document.addEventListener('click', this._onDocClick, true);
    this.el.addEventListener('click', this._onClick);
    // Pointer events are the canonical path in Chromium/WebKit. Capture primary
    // button on pointerdown for in-world play and release on pointerup,
    // pointercancel, or window mouseup without duplicate listeners.
    this.el.addEventListener('pointerdown', this._onPointerDown);
    this.el.addEventListener('pointerup', this._onPointerUp);
    this.el.addEventListener('pointercancel', this._onPointerCancel);
    window.addEventListener('mouseup', this._onMouseUp);
    this.el.addEventListener('mouseleave', this._onMouseLeave);
    this.el.addEventListener('wheel', this._onWheel, { passive: false });
    document.addEventListener('mousemove', this._onMouseMove, true);
    window.addEventListener('blur', this._onBlur);
    document.addEventListener('visibilitychange', this._onVisibility);
    // Gamepad API — connect/disconnect listeners (WebKit/Safari may not support)
    if (navigator.getGamepads) {
      window.addEventListener('gamepadconnected', this._onGpConnect);
      window.addEventListener('gamepaddisconnected', this._onGpDisconnect);
    }
  }

  unbind() {
    window.removeEventListener('keydown', this._onKeyDown, true);
    window.removeEventListener('keyup', this._onKeyUp, true);
    document.removeEventListener('keydown', this._onKeyDown, true);
    document.removeEventListener('keyup', this._onKeyUp, true);
    document.removeEventListener('pointerlockchange', this._onLockChange);
    document.removeEventListener('pointerlockerror', this._onLockError);
    document.removeEventListener('click', this._onDocClick, true);
    this.el.removeEventListener('click', this._onClick);
    this.el.removeEventListener('pointerdown', this._onPointerDown);
    this.el.removeEventListener('pointerup', this._onPointerUp);
    this.el.removeEventListener('pointercancel', this._onPointerCancel);
    window.removeEventListener('mouseup', this._onMouseUp);
    this.el.removeEventListener('mouseleave', this._onMouseLeave);
    this.el.removeEventListener('wheel', this._onWheel);
    document.removeEventListener('mousemove', this._onMouseMove, true);
    window.removeEventListener('blur', this._onBlur);
    document.removeEventListener('visibilitychange', this._onVisibility);
    if (navigator.getGamepads) {
      window.removeEventListener('gamepadconnected', this._onGpConnect);
      window.removeEventListener('gamepaddisconnected', this._onGpDisconnect);
    }
    this._gpIndex = -1;
    this._gpConnected = false;
    this._heldLmb = false;
    this._breakFromGamepad = false;
    this.breakHeld = false;
    this._bound = false;
    this.captureEnabled = false;
    this.softLook = false;
  }

  _playing() {
    return this.captureEnabled && !this.uiMode;
  }

  _onBlur = () => {
    this.keys.clear();
    this._heldLmb = false;
    this.breakHeld = combineBreakHeld(this._heldLmb, this._breakFromGamepad);
  };

  _onVisibility = () => {
    if (document.hidden) {
      this.keys.clear();
      this._heldLmb = false;
      this.breakHeld = combineBreakHeld(this._heldLmb, this._breakFromGamepad);
    }
  };

  _onGpConnect = (e) => {
    const gpIndex = e.gamepad.index;
    // Use slot manager if available, otherwise fall back to legacy single-pad.
    if (this._slots) {
      const slot = this._slots.onConnect(gpIndex);
      // If this pad took our slot, update our tracking.
      if (slot === this._mySlot) {
        this._gpIndex = gpIndex;
        this._gpConnected = true;
      }
    } else {
      // Legacy: first pad connected goes to slot 0 (this player).
      if (this._gpIndex === -1) {
        this._gpIndex = gpIndex;
        this._gpConnected = true;
      }
    }
  };

  _onGpDisconnect = (e) => {
    if (!e || !e.gamepad) {
      // Fallback: unknown disconnect — clear our state.
      this._gpIndex = -1;
      this._gpConnected = false;
      this._breakFromGamepad = false;
      this.breakHeld = combineBreakHeld(this._heldLmb, this._breakFromGamepad);
      return;
    }
    const gpIndex = e.gamepad.index;
    if (this._slots) {
      this._slots.onDisconnect(gpIndex);
      // If our gamepad disconnected, clear tracking.
      if (gpIndex === this._gpIndex) {
        this._gpIndex = -1;
        this._gpConnected = false;
        this._breakFromGamepad = false;
        this.breakHeld = combineBreakHeld(this._heldLmb, this._breakFromGamepad);
      }
    } else {
      // Legacy: if our pad disconnected, clear.
      if (gpIndex === this._gpIndex) {
        this._gpIndex = -1;
        this._gpConnected = false;
        this._breakFromGamepad = false;
        this.breakHeld = combineBreakHeld(this._heldLmb, this._breakFromGamepad);
      }
    }
  };

  /** Set the shared GamepadSlotManager and this Input's slot (0 or 1). */
  setSlotManager(manager, slot = 0) {
    this._slots = manager;
    this._mySlot = slot;
    // Pick up existing gamepad in our slot.
    this._refreshGamepadFromSlot();
  }

  /** Refresh _gpIndex/_gpConnected from the slot manager's current state. */
  _refreshGamepadFromSlot() {
    if (!this._slots) return;
    const gpIndex = this._slots.getGamepad(this._mySlot);
    if (gpIndex !== null) {
      this._gpIndex = gpIndex;
      this._gpConnected = true;
    } else {
      this._gpIndex = -1;
      this._gpConnected = false;
    }
  }

  /** Poll gamepad state — call from game loop each frame */
  pollGamepad() {
    this._vJump = false;
    this._vSprint = false;
    this._vCrouch = false;
    if (!navigator.getGamepads || !this._gpConnected) {
      this._vMoveX = 0;
      this._vMoveZ = 0;
      this._gpJumpHeld = false;
      this._gpUseHeld = false;
      // Mouse and gamepad are independent owners of the public held state.
      this._breakFromGamepad = false;
      this.breakHeld = combineBreakHeld(this._heldLmb, this._breakFromGamepad);
      return;
    }
    const gamepads = navigator.getGamepads();
    const gp = gamepads[this._gpIndex];
    if (!gp) {
      // A disconnected pad must not leave its last movement latched forever.
      this._vMoveX = 0;
      this._vMoveZ = 0;
      this.usePressed = false;
      this.placePressed = false;
      this._gpJumpHeld = false;
      this._gpUseHeld = false;
      // Mouse and gamepad are independent owners of the public held state.
      this._breakFromGamepad = false;
      this.breakHeld = combineBreakHeld(this._heldLmb, this._breakFromGamepad);
      return;
    }

    // Gamepad state — see GAMEPAD_BUTTON_MAP and GAMEPAD_AXIS_MAP for mappings.

    const dz = this.deadzone;
    const sens = this.gpSensitivity;

    // Left stick → movement (inverted Y for forward/back)
    const axes = gp.axes || [];
    let lx = axes[0] || 0;
    let ly = axes[1] || 0;

    // Apply deadzone to left stick
    if (Math.abs(lx) < dz) lx = 0;
    else lx = Math.sign(lx) * (Math.abs(lx) - dz) / (1 - dz);

    if (Math.abs(ly) < dz) ly = 0;
    else ly = Math.sign(ly) * (Math.abs(ly) - dz) / (1 - dz);

    // Update virtual move from gamepad
    this._vMoveX = lx;
    this._vMoveZ = ly; // standard convention: stick up (-1) → forward

    // Right stick → look (inverted X for screen-right = look right)
    let rx = axes[2] || 0;
    let ry = axes[3] || 0;

    // Apply deadzone to right stick
    if (Math.abs(rx) < dz) rx = 0;
    else rx = Math.sign(rx) * (Math.abs(rx) - dz) / (1 - dz);

    if (Math.abs(ry) < dz) ry = 0;
    else ry = Math.sign(ry) * (Math.abs(ry) - dz) / (1 - dz);

    // Apply sensitivity to look
    this.lookX -= rx * sens;
    this.lookY += ry * sens;

    // Clamp pitch
    const lim = Math.PI / 2 - 0.01;
    this.lookY = Math.max(-lim, Math.min(lim, this.lookY));

    // Dispatch buttons via GAMEPAD_BUTTON_MAP (single source of truth).
    const btn = (i) => gp.buttons[i] && gp.buttons[i].pressed;
    const absBtn = (i) => gp.buttons[i] && gp.buttons[i].value;

    // Action dispatch table — maps action names to setters.
    const actionMap = {
      jump:       () => { if (!this._gpJumpHeld) this._vJump = true; },
      use:        () => this.usePressed = true,
      drop:       () => this.dropPressed = true,
      eat:        () => this.eatPressed = true,
      place:      () => this.placePressed = true,
      sprint:     () => { this._vSprint = true; this.keys.add('ShiftLeft'); },
      crouch:     () => { this._vCrouch = true; this.keys.add('KeyC'); },
      hotbar_prev: () => this.hotbarScroll -= 1,
      hotbar_next: () => this.hotbarScroll += 1,
      quick_save: () => this.quickSavePressed = true,
      inventory:  () => this.inventoryPressed = true,
      pause:      () => this.pausePressed = true,
    };

    // D-pad key overrides (d-pad adds keyboard codes instead of action flags).
    const dpadKeys = { dpad_up: 'KeyW', dpad_down: 'KeyS', dpad_left: 'KeyA', dpad_right: 'KeyD' };

    for (const [idx, mapping] of Object.entries(GAMEPAD_BUTTON_MAP)) {
      if (!btn(Number(idx))) continue;
      const action = mapping.action;
      // D-pad maps to keyboard codes for movement.
      if (dpadKeys[action]) {
        this.keys.add(dpadKeys[action]);
      } else if (actionMap[action]) {
        actionMap[action]();
      }
    }

    const l2Value = absBtn(6) || 0;
    const r2Value = absBtn(7) || 0;
    if (l2Value > 0.1 && !this._gpUseHeld) this.placePressed = true;
    this._gpUseHeld = l2Value > 0.1;
    const r2Held = r2Value > 0.1;
    this._breakFromGamepad = r2Held;
    this.breakHeld = combineBreakHeld(this._heldLmb, this._breakFromGamepad);
    this._gpJumpHeld = !!btn(0);

    // Haptic feedback: if game just started or took damage, rumble briefly
    if (this._gpVibrate && gp.hapticActuators && gp.hapticActuators[0]) {
      // Keep vibration handle for future use
    }

    // Vibration API (Xbox/PS5 controllers support this)
    if (gp.vibrationActuator && gp.gamepadType === 'Standard gamepad') {
      // Store for potential rumble calls from game code
    }
  }

  /** Trigger controller vibration (if supported) */
  rumble(duration = 200, intensity = 0.5) {
    if (!navigator.getGamepads || !this._gpConnected) return;
    const gamepads = navigator.getGamepads();
    const gp = gamepads[this._gpIndex];
    if (!gp || !gp.vibrationActuator) return;

    // DualSense supports dual rumble via effect actuator
    if (gp.vibrationActuator.type === 'dual-rumble') {
      gp.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: duration,
        weakMagnitude: intensity * 0.5,
        strongMagnitude: intensity,
      });
    } else if (gp.vibrationActuator.type === 'trigger' || gp.vibrationActuator.length === 1) {
      // Single rumble actuator (Xbox, generic)
      gp.vibrationActuator.playEffect('single-rumble', {
        startDelay: 0,
        duration: duration,
        magnitude: intensity,
      });
    }

    // Also try the older GamepadHapticActuator API for Safari/WebKit
    if (gp.hapticActuators && gp.hapticActuators[0]) {
      try {
        gp.hapticActuators[0].pulse(intensity, duration);
      } catch (_) { /* WebKit may not support pulse */ }
    }
  }

  _onKeyDown = (e) => {
    const code = normalizeCode(e);
    if (!code) return;

    // Always record while capture is on (even during short uiMode glitches for movement keys)
    if (this.captureEnabled || !this.uiMode) {
      this.keys.add(code);
    }

    if (this._playing() && GAME_CODES.has(code)) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (e.repeat) return;

    if (code.startsWith('Digit') && !this.uiMode) {
      const n = Number(code.replace('Digit', ''));
      if (n >= 1 && n <= 9) this.slot = n - 1;
    }
    if (code === 'KeyF' && !this.uiMode) this.usePressed = true;
    if (code === 'KeyR' && !this.uiMode) this.eatPressed = true;
    if (code === 'KeyE') this.inventoryPressed = true;
    if (code === 'KeyK' && !this.uiMode) this.quickSavePressed = true;
    if (code === 'KeyQ' && !this.uiMode) this.dropPressed = true;
    if (code === 'KeyH') this.helpPressed = true;
    if (code === 'Escape') this.pausePressed = true;
    if (code === 'F3') {
      e.preventDefault();
      this.debugPressed = true;
    }
  };

  _onKeyUp = (e) => {
    const code = normalizeCode(e);
    if (code) this.keys.delete(code);
  };

  _onDocClick = (e) => {
    if (!this.captureEnabled || this.uiMode) return;
    const t = e.target;
    if (t && t.closest && t.closest('.overlay:not(.hidden), #touch-pad, #click-to-play, button, input, select, textarea, a, .inv-panel')) {
      return;
    }
    this.softLook = true;
    if (!this.locked) this.requestLock();
  };

  _onClick = () => {
    if (this.uiMode) return;
    this.softLook = true;
    if (!this.locked) this.requestLock();
  };

  _onLockChange = () => {
    this.locked = document.pointerLockElement === this.el;
    if (this.el) this.el.style.cursor = this.locked ? 'none' : 'crosshair';
  };

  _onLockError = () => {
    this.locked = false;
    // keep softLook so mouse still works
    this.softLook = true;
  };

  _onMouseDown = (e) => {
    if (this.uiMode || !this.captureEnabled) return;
    const t = e?.target;
    if (t && t.closest && t.closest('.overlay:not(.hidden), #touch-pad, #click-to-play, button, input, select, textarea, a, .inv-panel')) {
      return;
    }
    this.softLook = true;
    if (!this.locked) this.requestLock();
    if (isPrimaryBreakButton(e)) {
      this._heldLmb = transitionBreakPointer(this._heldLmb, e, 'down');
      this.breakHeld = combineBreakHeld(this._heldLmb, this._breakFromGamepad);
    }
    if (e.button === 2) {
      e.preventDefault();
      this.placePressed = true;
    }
    this._lastClientX = e.clientX;
    this._lastClientY = e.clientY;
  };

  _onMouseUp = (e) => {
    if (!e || e.type === 'pointercancel' || isPrimaryBreakButton(e)) {
      this._heldLmb = transitionBreakPointer(this._heldLmb, e, e?.type === 'pointercancel' ? 'cancel' : 'up');
      this.breakHeld = combineBreakHeld(this._heldLmb, this._breakFromGamepad);
    }
  };

  _onPointerDown = (e) => {
    // PointerEvent is used by modern browsers even when the device is a
    // mouse. Route it through the same state machine as mousedown; assignment
    // is idempotent when both compatibility events fire.
    this._onMouseDown(e);
  };

  _onPointerUp = (e) => {
    this._onMouseUp(e);
  };

  _onPointerCancel = () => {
    this._heldLmb = transitionBreakPointer(this._heldLmb, null, 'cancel');
    this.breakHeld = combineBreakHeld(this._heldLmb, this._breakFromGamepad);
  };

  _onMouseLeave = () => {
    this._lastClientX = null;
    this._lastClientY = null;
  };

  _onWheel = (e) => {
    if (this.uiMode || !this.captureEnabled) return;
    e.preventDefault();
    if (e.deltaY > 0) this.hotbarScroll += 1;
    else if (e.deltaY < 0) this.hotbarScroll -= 1;
  };

  _onMouseMove = (e) => {
    if (this.uiMode || !this.captureEnabled) return;
    // Allow look when: pointer locked OR softLook (after click-to-play) OR LMB held
    if (!this.locked && !this.softLook && !this._heldLmb) return;

    let dx = e.movementX;
    let dy = e.movementY;
    // Fallback when movementX is 0/undefined without pointer lock
    if ((!dx && !dy) || (dx == null)) {
      if (this._lastClientX != null) {
        dx = e.clientX - this._lastClientX;
        dy = e.clientY - this._lastClientY;
      } else {
        dx = 0;
        dy = 0;
      }
    }
    this._lastClientX = e.clientX;
    this._lastClientY = e.clientY;
    if (!dx && !dy) return;

    // Without pointer lock, require softLook (don't spin camera when just moving OS cursor over page)
    if (!this.locked && !this.softLook) return;

    // Mouse right → look right (Three.js YXZ yaw is opposite of screen X)
    this.lookX -= dx * this.sensitivity;
    this.lookY += dy * this.sensitivity;
    const lim = Math.PI / 2 - 0.01;
    this.lookY = Math.max(-lim, Math.min(lim, this.lookY));
  };

  wantsForward() {
    return (this.controllerOnly ? false : this.keys.has('KeyW') || this.keys.has('ArrowUp')) || this._vMoveZ < -0.3;
  }
  wantsBack() {
    return (this.controllerOnly ? false : this.keys.has('KeyS') || this.keys.has('ArrowDown')) || this._vMoveZ > 0.3;
  }
  wantsLeft() {
    return (this.controllerOnly ? false : this.keys.has('KeyA') || this.keys.has('ArrowLeft')) || this._vMoveX < -0.3;
  }
  wantsRight() {
    return (this.controllerOnly ? false : this.keys.has('KeyD') || this.keys.has('ArrowRight')) || this._vMoveX > 0.3;
  }
  wantsJump() {
    return (this.controllerOnly ? false : this.keys.has('Space')) || this._vJump;
  }
  wantsSprint() {
    return this._vSprint || (!this.controllerOnly && (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')));
  }
  wantsCrouch() {
    return this._vCrouch || (!this.controllerOnly && (this.keys.has('ControlLeft') || this.keys.has('ControlRight') || this.keys.has('KeyC')));
  }

  consumePlace() { const v = this.placePressed; this.placePressed = false; return v; }
  consumeUse() { const v = this.usePressed; this.usePressed = false; return v; }
  consumeEat() { const v = this.eatPressed; this.eatPressed = false; return v; }
  consumeInventory() { const v = this.inventoryPressed; this.inventoryPressed = false; return v; }
  consumeQuickSave() { const v = this.quickSavePressed; this.quickSavePressed = false; return v; }
  consumeDrop() { const v = this.dropPressed; this.dropPressed = false; return v; }
  consumePause() { const v = this.pausePressed; this.pausePressed = false; return v; }
  consumeHelp() { const v = this.helpPressed; this.helpPressed = false; return v; }
  consumeDebug() { const v = this.debugPressed; this.debugPressed = false; return v; }
  consumeHotbarScroll() { const v = this.hotbarScroll; this.hotbarScroll = 0; return v; }
  consumeSlot() { const v = this.slot; this.slot = -1; return v; }
}
