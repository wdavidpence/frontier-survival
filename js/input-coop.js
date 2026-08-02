import { GamepadSlotManager } from './input.js?v=240';
import {
  applyDualHotbarEdge,
  createDualHotbarState,
  cycleHotbarIndex,
  hotbarFromPadEdges,
} from './hotbar-cycle.js?v=240';

export const P1 = 'p1';
export const P2 = 'p2';

// Re-export pure hotbar helpers for callers/tests.
export {
  applyDualHotbarEdge,
  createDualHotbarState,
  cycleHotbarIndex,
  hotbarFromPadEdges,
};

/** Minimal deadzone helper – mirrors Input.pollGamepad logic. */
function applyDeadzone(value, dz) {
  if (Math.abs(value) < dz) return 0;
  return Math.sign(value) * (Math.abs(value) - dz) / (1 - dz);
}

/** Read a gamepad object into structured input axes/buttons. */
export function readGamepad(gp, deadzone = 0.15) {
  if (!gp) return null;
  const lx = applyDeadzone(gp.axes[0] || 0, deadzone);
  const ly = applyDeadzone(gp.axes[1] || 0, deadzone);
  const rx = applyDeadzone(gp.axes[4] || 0, deadzone);
  const ry = applyDeadzone(gp.axes[3] || 0, deadzone);
  return { lx, ly: -ly, rx, ry }; // invert Y so stick-up = forward
}

/**
 * CoopInputRouter — thin dual-player input router.
 *
 * Wraps two Input instances (or mocks) and routes gamepads per slot.
 * KBM is assigned to one player (default P1).
 */
export class CoopInputRouter {
  constructor(canvasEl, opts = {}) {
    this.kbmPlayer = opts.kbmPlayer || P1;
    /** @type {{[string]: number}} gamepad index per slot, -1 = none */
    this._gpSlot = { [P1]: -1, [P2]: -1 };
    /** Optional: real Input instances if available */
    this._inputs = { [P1]: null, [P2]: null };

    /** Shared GamepadSlotManager for auto-assignment of gamepads to slots. */
    this._slots = new GamepadSlotManager();

    /** Mock state for pure tests (no DOM). */
    this._mockKeys = { [P1]: new Set(), [P2]: new Set() };
    this._mockMove = { [P1]: { x: 0, z: 0 }, [P2]: { x: 0, z: 0 } };
    this._mockLook = { [P1]: { x: 0, y: 0 }, [P2]: { x: 0, y: 0 } };
    this._mockJump = { [P1]: false, [P2]: false };
    this._mockSprint = { [P1]: false, [P2]: false };
    this._mockCrouch = { [P1]: false, [P2]: false };
    this._mockPlace = { [P1]: false, [P2]: false };
    this._mockUse = { [P1]: false, [P2]: false };

    this.deadzone = opts.deadzone ?? 0.15;
    this.gpSensitivity = opts.gpSensitivity ?? 0.03;

    /** Per-player hotbar index state (pure helper; game wires held item). */
    this._hotbar = createDualHotbarState(opts.hotbarSize ?? 9);

    /** KBM Input instance (for the keyboard/mouse player). */
    this._kbmInput = null;

    /** Canvas element reference for potential binding. */
    this._canvasEl = canvasEl;
  }

  /** Poll gamepad state for all assigned slots. Call each frame. */
  poll() {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    if (!nav || !nav.getGamepads) return;

    const gamepads = nav.getGamepads();
    for (const slot of [P1, P2]) {
      const gpIdx = this._gpSlot[slot];
      if (gpIdx < 0) continue;
      const gp = gamepads[gpIdx];
      if (!gp) continue;

      const parsed = readGamepad(gp, this.deadzone);
      if (parsed) {
        this._mockMove[slot].x = parsed.lx;
        this._mockMove[slot].z = parsed.ly;

        // Accumulate look deltas from right stick.
        this._mockLook[slot].x -= parsed.rx * this.gpSensitivity;
        this._mockLook[slot].y += parsed.ry * this.gpSensitivity;
        const lim = Math.PI / 2 - 0.01;
        this._mockLook[slot].y = Math.max(-lim, Math.min(lim, this._mockLook[slot].y));
      }

      // Buttons: Cross(0)=jump, Circle(1)=use, L1(4)=place, R1(5)=sprint, R3(11)=crouch.
      const btn = (i) => gp.buttons[i] && gp.buttons[i].pressed;
      this._mockJump[slot] = btn(0);
      this._mockUse[slot] = btn(1);
      this._mockPlace[slot] = btn(4);
      this._mockSprint[slot] = btn(5);
      this._mockCrouch[slot] = btn(11);
    }

    // Also poll the KBM Input instance if present.
    if (this._kbmInput) {
      const kbSlot = this.kbmPlayer;
      // Mirror KBM state into mock for the KBM player.
      this._mockKeys[kbSlot] = new Set(this._kbmInput.keys);
      this._mockMove[kbSlot].x = this._kbmInput._vMoveX;
      this._mockMove[kbSlot].z = this._kbmInput._vMoveZ;
      this._mockLook[kbSlot].x = this._kbmInput.lookX;
      this._mockLook[kbSlot].y = this._kbmInput.lookY;
      this._mockJump[kbSlot] = this._kbmInput.wantsJump();
      this._mockSprint[kbSlot] = this._kbmInput.wantsSprint();
      this._mockCrouch[kbSlot] = this._kbmInput.wantsCrouch();
      // consumePlace/use handled below via the real Input.
    }
  }

  /** Get movement + look for a slot. Returns {moveX, moveZ, lookX, lookY}. */
  getMoveLook(slot) {
    const move = this._mockMove[slot] || { x: 0, z: 0 };
    const look = this._mockLook[slot] || { x: 0, y: 0 };
    return { moveX: move.x, moveZ: move.z, lookX: look.x, lookY: look.y };
  }

  /** Assign a gamepad index (>=0) to a player slot. Uses slot manager for auto-assignment.
   * Pass gpIndex < 0 to clear a specific slot (backward compatible). */
  setPlayerGamepad(slot, gpIndex) {
    if (gpIndex >= 0) {
      // Use slot manager to determine which slot this pad should go to.
      const assignedSlot = this._slots.onConnect(gpIndex);
      // Map slot number to player key: 0->P1, 1->P2.
      const targetSlot = assignedSlot === 0 ? P1 : (assignedSlot === 1 ? P2 : null);
      if (targetSlot) {
        this._gpSlot[targetSlot] = gpIndex;
      }
    } else {
      // Negative: clear the specified slot directly (backward compatible).
      if (slot === P1 || slot === P2) {
        const currentGp = this._gpSlot[slot];
        if (currentGp >= 0) {
          // Also remove from slot manager so the physical index is freed.
          this._slots.onDisconnect(currentGp);
        }
        this._gpSlot[slot] = -1;
      }
    }
  }

  /** Remove a gamepad from a player slot (called on disconnect). */
  removePlayerGamepad(gpIndex) {
    this._slots.onDisconnect(gpIndex);
    // Clear whichever player had this pad.
    for (const slot of [P1, P2]) {
      if (this._gpSlot[slot] === gpIndex) {
        this._gpSlot[slot] = -1;
      }
    }
  }

  /** Bind browser gamepad events for auto-assignment. Call once after construction. */
  bindGamepadEvents() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const onConnect = (e) => this.setPlayerGamepad(null, e.gamepad.index);
    const onDisconnect = (e) => {
      if (e && e.gamepad) this.removePlayerGamepad(e.gamepad.index);
    };
    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);
    this._gpListeners = { onConnect, onDisconnect };

    // Scan already-connected gamepads (e.g., connected before page load).
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        this.setPlayerGamepad(null, i);
      }
    }
  }

  /** Get the gamepad index assigned to a player slot (-1 if none). */
  getPlayerGamepad(slot) {
    return this._gpSlot[slot];
  }

  /** Check if the player wants to jump. */
  wantsJump(slot) {
    const keys = this._mockKeys[slot];
    if (keys && keys.has('Space')) return true;
    const move = this._mockMove[slot];
    if (this._mockJump[slot]) return true;
    // Also check KBM Input if present.
    if (slot === this.kbmPlayer && this._kbmInput) {
      return this._kbmInput.wantsJump();
    }
    return false;
  }

  /** Check if the player wants to sprint. */
  wantsSprint(slot) {
    const keys = this._mockKeys[slot];
    if (keys && (keys.has('ShiftLeft') || keys.has('ShiftRight'))) return true;
    if (this._mockSprint[slot]) return true;
    if (slot === this.kbmPlayer && this._kbmInput) {
      return this._kbmInput.wantsSprint();
    }
    return false;
  }

  /** Check if the player wants to crouch. */
  wantsCrouch(slot) {
    const keys = this._mockKeys[slot];
    if (keys && (keys.has('ControlLeft') || keys.has('KeyC'))) return true;
    if (this._mockCrouch[slot]) return true;
    if (slot === this.kbmPlayer && this._kbmInput) {
      return this._kbmInput.wantsCrouch();
    }
    return false;
  }

  /** Consume the place action for a player (returns true if pressed this frame). */
  consumePlace(slot) {
    const v = this._mockPlace[slot];
    this._mockPlace[slot] = false;
    if (slot === this.kbmPlayer && this._kbmInput) {
      return v || this._kbmInput.consumePlace();
    }
    return v;
  }

  /** Consume the use action for a player (returns true if pressed this frame). */
  consumeUse(slot) {
    const v = this._mockUse[slot];
    this._mockUse[slot] = false;
    if (slot === this.kbmPlayer && this._kbmInput) {
      return v || this._kbmInput.consumeUse();
    }
    return v;
  }

  /** Return current mapping: {p1: gpIndex, p2: gpIndex, kbmPlayer}. */
  getMapping() {
    return { ...this._gpSlot, kbmPlayer: this.kbmPlayer };
  }

  /** Unbind all event listeners and reset state. */
  unbind() {
    if (this._kbmInput) {
      this._kbmInput.unbind();
      this._kbmInput = null;
    }
    this._gpSlot[P1] = -1;
    this._gpSlot[P2] = -1;
    this._slots.reset();
    if (this._gpListeners) {
      const { onConnect, onDisconnect } = this._gpListeners;
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
      this._gpListeners = null;
    }
    for (const slot of [P1, P2]) {
      this._mockKeys[slot] = new Set();
      this._mockMove[slot] = { x: 0, z: 0 };
      this._mockLook[slot] = { x: 0, y: 0 };
      this._mockJump[slot] = false;
      this._mockSprint[slot] = false;
      this._mockCrouch[slot] = false;
      this._mockPlace[slot] = false;
      this._mockUse[slot] = false;
    }
  }

  /** Bind a real Input instance as the KBM source for the KBM player.

   * PRIORITY (when both KBM and gamepad0 are present):
   *   Inputs MERGE / ACCUMULATE. KBM keys (WASD, Space, Shift...) land in
   *   Input.keys; gamepad axes/buttons override the virtual-move/jump/sprint
   *   flags. The Input.wantsForward() etc. use OR logic, so both sources
   *   contribute simultaneously. Gamepad stick overrides KBM movement only when
   *   the axis is outside deadzone; otherwise KBM keys still drive movement.
   * SAFETY: No crash when zero gamepads are connected — poll() returns early,
   * and setSlotManager handles null slots gracefully. */
  setKbmInput(input) {
    this._kbmInput = input;
    // Share the GamepadSlotManager so P1 can also receive gamepad0.
    input.setSlotManager(this._slots, 0);
  }

  /** Set mock key state for a player (for pure tests). */
  setMockKeys(slot, keys) {
    this._mockKeys[slot] = new Set(keys);
  }

  /** Set mock movement for a player (for pure tests). */
  setMockMove(slot, x, z) {
    this._mockMove[slot].x = x ?? 0;
    this._mockMove[slot].z = z ?? 0;
  }

  /** Set mock look deltas for a player (for pure tests). */
  setMockLook(slot, x, y) {
    this._mockLook[slot].x = x ?? 0;
    this._mockLook[slot].y = y ?? 0;
  }

  /** Set mock jump state for a player (for pure tests). */
  setMockJump(slot, v) {
    this._mockJump[slot] = !!v;
  }

  /** Set mock sprint state for a player (for pure tests). */
  setMockSprint(slot, v) {
    this._mockSprint[slot] = !!v;
  }

  /** Set mock crouch state for a player (for pure tests). */
  setMockCrouch(slot, v) {
    this._mockCrouch[slot] = !!v;
  }

  /** Set mock place state for a player (for pure tests). */
  setMockPlace(slot, v) {
    this._mockPlace[slot] = !!v;
  }

  /** Set mock use state for a player (for pure tests). */
  setMockUse(slot, v) {
    this._mockUse[slot] = !!v;
  }

  /** Current hotbar index for slot ('p1'|'p2'). */
  getHotbarIndex(slot) {
    const key = slot === P2 ? 'p2' : 'p1';
    return this._hotbar[key] | 0;
  }

  /** Set hotbar index directly (clamped via cycle 0). */
  setHotbarIndex(slot, index) {
    const key = slot === P2 ? 'p2' : 'p1';
    const n = this._hotbar.size;
    let i = index | 0;
    i = ((i % n) + n) % n;
    this._hotbar[key] = i;
    return i;
  }

  /**
   * Apply edge-triggered pad hotbar cycle (D-pad / shoulders).
   * Call only on button-down edges from the input layer.
   * @param {'p1'|'p2'} slot
   * @param {{ left?: boolean, right?: boolean, up?: boolean, down?: boolean, lb?: boolean, rb?: boolean }} edges
   */
  cycleHotbar(slot, edges = {}) {
    applyDualHotbarEdge(this._hotbar, slot === P2 ? 'p2' : 'p1', edges);
    return this.getHotbarIndex(slot);
  }
}
