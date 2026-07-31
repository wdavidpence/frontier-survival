/**
 * PadInputAdapter — Input-shaped facade driven by one Gamepad (P2 DualSense).
 * Compatible with Player.update(world, input, survival, dt).
 */
import { readGamepad } from './input-coop.js?v=208';

export class PadInputAdapter {
  constructor() {
    this.lookX = 0;
    this.lookY = 0;
    this._fwd = 0;
    this._str = 0;
    this._jump = false;
    this._sprint = false;
    this._crouch = false;
    this._slotQ = -1;
    this._scroll = 0;
    this._prevDpadL = false;
    this._prevDpadR = false;
    this.breakHeld = false;
    this.placePressed = false;
    this._prevPlace = false;
    this.inventoryPressed = false;
    this._prevInv = false;
    this.pausePressed = false;
    this._prevPause = false;
    this.uiMode = false;
  }

  /**
   * @param {Gamepad|null} gp
   * @param {number} dt
   * @param {{ deadzone?: number, sensitivity?: number }} [opts]
   */
  poll(gp, dt, opts = {}) {
    const dz = opts.deadzone ?? 0.15;
    const sens = opts.sensitivity ?? 0.03;
    this._slotQ = -1;
    this._scroll = 0;
    this.placePressed = false;
    this.inventoryPressed = false;
    this.pausePressed = false;
    if (!gp) {
      this._fwd = 0;
      this._str = 0;
      this._jump = false;
      this._sprint = false;
      this._crouch = false;
      this.breakHeld = false;
      return;
    }
    const st = readGamepad(gp, dz);
    if (st) {
      this._str = st.lx;
      this._fwd = st.ly;
      this.lookX -= st.rx * sens * 60 * dt;
      this.lookY -= st.ry * sens * 60 * dt;
      const lim = Math.PI / 2 - 0.05;
      this.lookY = Math.max(-lim, Math.min(lim, this.lookY));
    }
    const pressed = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const value = (i) => (gp.buttons[i] ? gp.buttons[i].value || (pressed(i) ? 1 : 0) : 0);
    this._jump = pressed(0); // Cross/A
    this._sprint = pressed(5) || value(7) > 0.4; // R1/R2
    this._crouch = pressed(10); // L3
    // R2 mine/break (also Square as alt mine)
    this.breakHeld = value(7) > 0.35 || pressed(2);
    // L1 place edge
    const placeNow = pressed(4);
    if (placeNow && !this._prevPlace) this.placePressed = true;
    this._prevPlace = placeNow;
    // Share / View (button 8) toggles P2 inventory
    const invNow = pressed(8);
    if (invNow && !this._prevInv) this.inventoryPressed = true;
    this._prevInv = invNow;
    // Options / Menu (button 9) pause — freezes full sim for both players
    const pauseNow = pressed(9);
    if (pauseNow && !this._prevPause) this.pausePressed = true;
    this._prevPause = pauseNow;
    // D-pad left/right edge → hotbar
    const dL = pressed(14);
    const dR = pressed(15);
    if (dL && !this._prevDpadL) this._scroll = -1;
    if (dR && !this._prevDpadR) this._scroll = 1;
    this._prevDpadL = dL;
    this._prevDpadR = dR;
  }

  wantsForward() {
    return this._fwd > 0.25;
  }
  wantsBack() {
    return this._fwd < -0.25;
  }
  wantsLeft() {
    return this._str < -0.25;
  }
  wantsRight() {
    return this._str > 0.25;
  }
  wantsJump() {
    return this._jump;
  }
  wantsSprint() {
    return this._sprint;
  }
  wantsCrouch() {
    return this._crouch;
  }
  consumeSlot() {
    const v = this._slotQ;
    this._slotQ = -1;
    return v;
  }
  consumeHotbarScroll() {
    const v = this._scroll;
    this._scroll = 0;
    return v;
  }

  consumePlace() {
    const v = this.placePressed;
    this.placePressed = false;
    return v;
  }

  consumeInventory() {
    const v = this.inventoryPressed;
    this.inventoryPressed = false;
    return v;
  }

  consumePause() {
    const v = this.pausePressed;
    this.pausePressed = false;
    return v;
  }
}

/** Pick nth connected gamepad (0-based among non-null pads). */
export function getConnectedPad(n = 0) {
  try {
    const pads = navigator.getGamepads?.() || [];
    let found = 0;
    for (let i = 0; i < pads.length; i++) {
      if (!pads[i]) continue;
      if (found === n) return pads[i];
      found++;
    }
  } catch (_) {}
  return null;
}
