/** Keyboard + mouse pointer-lock input */
export class Input {
  constructor(domElement) {
    this.el = domElement;
    this.keys = new Set();
    this.lookX = 0;
    this.lookY = 0;
    this.locked = false;
    this.breakHeld = false;
    this.placePressed = false;
    this.usePressed = false;
    this.eatPressed = false;
    this.slot = -1;
    this.sensitivity = 0.0022;
    this._bound = false;
  }

  bind() {
    if (this._bound) return;
    this._bound = true;
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('pointerlockchange', this._onLockChange);
    this.el.addEventListener('click', this._onClick);
    this.el.addEventListener('mousedown', this._onMouseDown);
    this.el.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('blur', this._onBlur);
  }

  unbind() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('pointerlockchange', this._onLockChange);
    this.el.removeEventListener('click', this._onClick);
    this.el.removeEventListener('mousedown', this._onMouseDown);
    this.el.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('blur', this._onBlur);
    this._bound = false;
  }

  _onBlur = () => {
    this.keys.clear();
    this.breakHeld = false;
  };

  _onKeyDown = (e) => {
    if (e.repeat) return;
    this.keys.add(e.code);
    if (e.code.startsWith('Digit')) {
      const n = Number(e.code.replace('Digit', ''));
      if (n >= 1 && n <= 9) this.slot = n - 1;
    }
    if (e.code === 'KeyF') this.usePressed = true;
    if (e.code === 'KeyR') this.eatPressed = true;
    if (e.code === 'Escape' && this.locked) {
      // pointer lock exits itself
    }
  };

  _onKeyUp = (e) => {
    this.keys.delete(e.code);
  };

  _onClick = () => {
    if (!this.locked) this.el.requestPointerLock();
  };

  _onLockChange = () => {
    this.locked = document.pointerLockElement === this.el;
  };

  _onMouseDown = (e) => {
    if (!this.locked) return;
    if (e.button === 0) this.breakHeld = true;
    if (e.button === 2) {
      e.preventDefault();
      this.placePressed = true;
    }
  };

  _onMouseUp = (e) => {
    if (e.button === 0) this.breakHeld = false;
  };

  _onMouseMove = (e) => {
    if (!this.locked) return;
    this.lookX += e.movementX * this.sensitivity;
    this.lookY += e.movementY * this.sensitivity;
    const lim = Math.PI / 2 - 0.01;
    this.lookY = Math.max(-lim, Math.min(lim, this.lookY));
  };

  wantsForward() { return this.keys.has('KeyW') || this.keys.has('ArrowUp'); }
  wantsBack() { return this.keys.has('KeyS') || this.keys.has('ArrowDown'); }
  wantsLeft() { return this.keys.has('KeyA') || this.keys.has('ArrowLeft'); }
  wantsRight() { return this.keys.has('KeyD') || this.keys.has('ArrowRight'); }
  wantsJump() { return this.keys.has('Space'); }
  wantsSprint() { return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'); }

  consumePlace() {
    const v = this.placePressed;
    this.placePressed = false;
    return v;
  }

  consumeUse() {
    const v = this.usePressed;
    this.usePressed = false;
    return v;
  }

  consumeEat() {
    const v = this.eatPressed;
    this.eatPressed = false;
    return v;
  }

  consumeSlot() {
    const v = this.slot;
    this.slot = -1;
    return v;
  }
}
