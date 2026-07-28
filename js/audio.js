/** Lightweight procedural SFX via Web Audio */
export class AudioBus {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.master = null;
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.25;
    this.master.connect(this.ctx.destination);
  }

  resume() {
    this.ensure();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  beep(freq, dur = 0.08, type = 'square', gain = 0.2) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur);
  }

  breakBlock() {
    this.beep(110, 0.05, 'triangle', 0.22);
    this.beep(70, 0.09, 'square', 0.1);
    this.beep(180 + Math.random() * 40, 0.03, 'sawtooth', 0.06);
  }
  placeBlock() { this.beep(320, 0.05, 'sine', 0.15); this.beep(420, 0.03, 'sine', 0.08); }
  hurt() { this.beep(90, 0.2, 'sawtooth', 0.2); }
  eat() { this.beep(400, 0.06, 'sine', 0.12); this.beep(300, 0.08, 'sine', 0.1); }
  step() { this.beep(60 + Math.random() * 20, 0.03, 'triangle', 0.05); }
  ui() { this.beep(660, 0.04, 'sine', 0.08); }
  hit() { this.beep(200, 0.04, 'square', 0.12); this.beep(140, 0.06, 'triangle', 0.1); }
  death() { this.beep(100, 0.4, 'sawtooth', 0.25); this.beep(60, 0.6, 'triangle', 0.2); }
}
