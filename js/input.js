/** Keyboard + mouse input (Minecraft-style). Bulletproof for browser quirks. */

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
    this._vCrouch = false;
    /** Gamepad state */
    this._gpIndex = -1;
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

  setCaptureEnabled(on) {
    this.captureEnabled = !!on;
    if (on) this.softLook = true;
  }

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
          try { this.el.requestPointerLock(); } catch (_) { /* */ }
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
    this.el.addEventListener('mousedown', this._onMouseDown);
    this.el.addEventListener('mouseup', this._onMouseUp);
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
    this.el.removeEventListener('mousedown', this._onMouseDown);
    this.el.removeEventListener('mouseup', this._onMouseUp);
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
    this._bound = false;
    this.captureEnabled = false;
    this.softLook = false;
  }

  _playing() {
    return this.captureEnabled && !this.uiMode;
  }

  _onBlur = () => {
    this.keys.clear();
    this.breakHeld = false;
    this._heldLmb = false;
  };

  _onVisibility = () => {
    if (document.hidden) {
      this.keys.clear();
      this.breakHeld = false;
      this._heldLmb = false;
    }
  };

  _onGpConnect = (e) => {
    this._gpIndex = e.gamepad.index;
    this._gpConnected = true;
  };

  _onGpDisconnect = () => {
    this._gpIndex = -1;
    this._gpConnected = false;
  };

  /** Poll gamepad state — call from game loop each frame */
  pollGamepad() {
    if (!navigator.getGamepads || !this._gpConnected) return;
    const gamepads = navigator.getGamepads();
    const gp = gamepads[this._gpIndex];
    if (!gp) return;

    // DualSense / standard gamepad layout:
    //   axis[0] = left stick X (left=-1, right=+1)
    //   axis[1] = left stick Y (up=-1, down=+1)
    //   axis[2] = left trigger (L2), range 0..1
    //   axis[3] = right stick Y (up=-1, down=+1)
    //   axis[4] = right stick X (left=-1, right=+1)
    //   axis[5] = right trigger (R2), range 0..1
    //   buttons[0] = Cross (A)
    //   buttons[1] = Circle (B)
    //   buttons[2] = Square (X)
    //   buttons[3] = Triangle (Y)
    //   buttons[4] = L1, [5] = R1
    //   buttons[6] = L2 (pressed), [7] = R2 (pressed)
    //   buttons[8] = Share, [9] = Options
    //   buttons[10] = Left stick press (L3), [11] = Right stick press (R3)
    //   buttons[12..15] = D-pad

    const dz = this.deadzone;
    const sens = this.gpSensitivity;

    // Left stick → movement (inverted Y for forward/back)
    let lx = gp.axes[0] || 0;
    let ly = gp.axes[1] || 0;

    // Apply deadzone to left stick
    if (Math.abs(lx) < dz) lx = 0;
    else lx = Math.sign(lx) * (Math.abs(lx) - dz) / (1 - dz);

    if (Math.abs(ly) < dz) ly = 0;
    else ly = Math.sign(ly) * (Math.abs(ly) - dz) / (1 - dz);

    // Update virtual move from gamepad
    this._vMoveX = lx;
    this._vMoveZ = -ly; // inverted: stick up (-1) → forward

    // Right stick → look (inverted X for screen-right = look right)
    let rx = gp.axes[4] || 0;
    let ry = gp.axes[3] || 0;

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

    // Buttons: Cross (0) = jump, Circle (1) = use, Square (2) = drop
    // Triangle (3) = eat, L1 (4) = place, R1 (5) = sprint
    // Left stick press (10) = crouch, Right stick press (11) = quick save
    // D-pad up (12) = forward, down (14) = back, left (13) = left, right (15) = right
    // Share (8) = inventory, Options (9) = pause

    const btn = (i) => gp.buttons[i] && gp.buttons[i].pressed;
    const absBtn = (i) => gp.buttons[i] && gp.buttons[i].value;

    // Jump on Cross press
    if (btn(0)) this._vJump = true;

    // Use on Circle press
    if (btn(1)) this.usePressed = true;

    // Drop on Square press
    if (btn(2)) this.dropPressed = true;

    // Eat on Triangle press
    if (btn(3)) this.eatPressed = true;

    // Place on L1 press
    if (btn(4)) this.placePressed = true;

    // Sprint on R1 press
    if (btn(5)) this.keys.add('ShiftLeft');

    // Crouch on R3 press
    if (btn(11)) this.keys.add('KeyC');

    // Quick save on L3 press
    if (btn(10)) this.quickSavePressed = true;

    // Inventory on Share
    if (btn(8)) this.inventoryPressed = true;

    // Pause on Options
    if (btn(9)) this.pausePressed = true;

    // D-pad movement fallback
    if (btn(12)) this.keys.add('KeyW'); // up → forward
    if (btn(14)) this.keys.add('KeyS'); // down → back
    if (btn(13)) this.keys.add('KeyA'); // left → left
    if (btn(15)) this.keys.add('KeyD'); // right → right

    // Triggers: L2 (axis[2]) can boost sprint, R2 (axis[5]) for fine look
    // L2 as additional forward boost when left stick is small
    const l2 = absBtn(2) || 0;
    if (l2 > 0.1 && Math.abs(lx) < 0.3) {
      this.keys.add('KeyW');
    }

    // R2 fine-tune look (smaller multiplier)
    const r2 = absBtn(5) || 0;
    if (r2 > 0.1 && Math.abs(rx) < 0.3) {
      this.lookX -= r2 * sens * 0.5;
    }

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
    this.softLook = true;
    if (!this.locked) this.requestLock();
    if (e.button === 0) {
      this.breakHeld = true;
      this._heldLmb = true;
    }
    if (e.button === 2) {
      e.preventDefault();
      this.placePressed = true;
    }
    this._lastClientX = e.clientX;
    this._lastClientY = e.clientY;
  };

  _onMouseUp = (e) => {
    if (e.button === 0) {
      this.breakHeld = false;
      this._heldLmb = false;
    }
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
    return this.keys.has('KeyW') || this.keys.has('ArrowUp') || this._vMoveZ < -0.3;
  }
  wantsBack() {
    return this.keys.has('KeyS') || this.keys.has('ArrowDown') || this._vMoveZ > 0.3;
  }
  wantsLeft() {
    return this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this._vMoveX < -0.3;
  }
  wantsRight() {
    return this.keys.has('KeyD') || this.keys.has('ArrowRight') || this._vMoveX > 0.3;
  }
  wantsJump() {
    return this.keys.has('Space') || this._vJump;
  }
  wantsSprint() {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
  }
  wantsCrouch() {
    return this.keys.has('ControlLeft') || this.keys.has('ControlRight') || this.keys.has('KeyC') || this._vCrouch;
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
