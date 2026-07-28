/**
 * Procedural SFX + ambient layers (Web Audio).
 * No external audio files — original synth.
 */

/** Pure ambient mix targets for tests / tuning */
export function ambientMix({
  isNight = false,
  weather = 'clear',
  heat = 0,
  nearWater = false,
  dayPhase = 0.25,
  dead = false,
} = {}) {
  if (dead) {
    return { master: 0, wind: 0, night: 0, rain: 0, fire: 0, water: 0, birds: 0, howl: 0 };
  }
  const sun = Math.max(0, Math.cos((dayPhase - 0.25) * Math.PI * 2));
  const wind = isNight ? 0.22 : 0.14 + sun * 0.06;
  const night = isNight ? 0.28 : Math.max(0, 0.08 - sun * 0.08);
  const rain = weather === 'rain' ? 0.35 : weather === 'snow' ? 0.12 : 0;
  const fire = heat > 6 ? Math.min(0.4, 0.08 + heat * 0.012) : 0;
  const water = nearWater ? 0.18 : 0;
  const birds = !isNight && weather === 'clear' ? 0.55 : 0;
  const howl = isNight ? 0.4 : 0;
  return {
    master: 1,
    wind,
    night,
    rain,
    fire,
    water,
    birds,
    howl,
  };
}

export class AudioBus {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.master = null;
    this._ambStarted = false;
    this._layers = {};
    this._birdTimer = 0;
    this._howlTimer = 0;
    this._crackleTimer = 0;
    this._lastMix = ambientMix();
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.28;
    this.master.connect(this.ctx.destination);
  }

  resume() {
    this.ensure();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    this._ensureAmbient();
  }

  _ensureAmbient() {
    if (!this.ctx || this._ambStarted) return;
    this._ambStarted = true;

    // Wind: filtered noise
    this._layers.wind = this._makeNoisePad({
      type: 'wind',
      filterFreq: 400,
      filterQ: 0.7,
      gain: 0.0001,
      lfoRate: 0.07,
      lfoDepth: 0.35,
    });

    // Night drone
    this._layers.night = this._makeDrone({
      freqs: [55, 82.5, 110],
      type: 'sine',
      gain: 0.0001,
    });

    // Rain
    this._layers.rain = this._makeNoisePad({
      type: 'rain',
      filterFreq: 1800,
      filterQ: 0.5,
      gain: 0.0001,
      lfoRate: 0.2,
      lfoDepth: 0.15,
    });

    // Fire bed
    this._layers.fire = this._makeNoisePad({
      type: 'fire',
      filterFreq: 900,
      filterQ: 1.2,
      gain: 0.0001,
      lfoRate: 0.9,
      lfoDepth: 0.5,
    });

    // Water
    this._layers.water = this._makeNoisePad({
      type: 'water',
      filterFreq: 1200,
      filterQ: 0.8,
      gain: 0.0001,
      lfoRate: 0.15,
      lfoDepth: 0.25,
    });
  }

  _noiseBuffer(seconds = 2) {
    const rate = this.ctx.sampleRate;
    const len = rate * seconds;
    const buf = this.ctx.createBuffer(1, len, rate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  _makeNoisePad({ filterFreq, filterQ, gain, lfoRate, lfoDepth }) {
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(2.5);
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = lfoRate;
    const lfoG = this.ctx.createGain();
    lfoG.gain.value = gain * lfoDepth;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start();
    lfo.start();
    return { gain: g, filter, src, baseGain: gain };
  }

  _makeDrone({ freqs, type, gain }) {
    const g = this.ctx.createGain();
    g.gain.value = gain;
    const oscs = [];
    for (const f of freqs) {
      const o = this.ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const og = this.ctx.createGain();
      og.gain.value = 1 / freqs.length;
      o.connect(og);
      og.connect(g);
      o.start();
      oscs.push(o);
    }
    // slow pulse
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoG = this.ctx.createGain();
    lfoG.gain.value = gain * 0.4;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    lfo.start();
    g.connect(this.master);
    return { gain: g, oscs, baseGain: gain };
  }

  _setLayerGain(layer, target, t) {
    if (!layer?.gain) return;
    const now = this.ctx.currentTime;
    const g = layer.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(Math.max(0.0001, target), now + t);
  }

  /**
   * Call each frame from game loop.
   * @param {number} dt
   * @param {object} env
   */
  tickAmbient(dt, env = {}) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    this._ensureAmbient();

    const mix = ambientMix(env);
    this._lastMix = mix;
    const ramp = 0.8;

    this._setLayerGain(this._layers.wind, mix.wind * 0.045, ramp);
    this._setLayerGain(this._layers.night, mix.night * 0.035, ramp);
    this._setLayerGain(this._layers.rain, mix.rain * 0.05, ramp);
    this._setLayerGain(this._layers.fire, mix.fire * 0.04, ramp);
    this._setLayerGain(this._layers.water, mix.water * 0.035, ramp);

    // Fire crackle pops
    if (mix.fire > 0.05) {
      this._crackleTimer -= dt;
      if (this._crackleTimer <= 0) {
        this._crackleTimer = 0.15 + Math.random() * 0.45;
        this.beep(200 + Math.random() * 400, 0.03, 'sawtooth', 0.03 * mix.fire * 4);
        if (Math.random() < 0.35) this.beep(80 + Math.random() * 40, 0.05, 'triangle', 0.025);
      }
    }

    // Daytime birds
    if (mix.birds > 0) {
      this._birdTimer -= dt;
      if (this._birdTimer <= 0) {
        this._birdTimer = 4 + Math.random() * 10;
        this._birdPhrase();
      }
    } else {
      this._birdTimer = Math.min(this._birdTimer, 2);
    }

    // Night howl (rare)
    if (mix.howl > 0) {
      this._howlTimer -= dt;
      if (this._howlTimer <= 0) {
        this._howlTimer = 18 + Math.random() * 35;
        if (Math.random() < mix.howl) this._wolfHowl();
      }
    }
  }

  _birdPhrase() {
    if (!this.ctx) return;
    const base = 1200 + Math.random() * 800;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        this.beep(base + i * 80 + Math.random() * 60, 0.06, 'sine', 0.04);
      }, i * 90);
    }
  }

  _wolfHowl() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, t);
    o.frequency.linearRampToValueAtTime(320, t + 0.8);
    o.frequency.linearRampToValueAtTime(140, t + 1.8);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 600;
    o.connect(f);
    f.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + 2.3);
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
  placeBlock() {
    this.beep(320, 0.05, 'sine', 0.15);
    this.beep(420, 0.03, 'sine', 0.08);
  }
  hurt() {
    this.beep(90, 0.2, 'sawtooth', 0.2);
  }
  eat() {
    this.beep(400, 0.06, 'sine', 0.12);
    this.beep(300, 0.08, 'sine', 0.1);
  }
  step() {
    this.beep(60 + Math.random() * 20, 0.03, 'triangle', 0.05);
  }
  ui() {
    this.beep(660, 0.04, 'sine', 0.08);
  }
  hit() {
    this.beep(200, 0.04, 'square', 0.12);
    this.beep(140, 0.06, 'triangle', 0.1);
  }
  death() {
    this.beep(100, 0.4, 'sawtooth', 0.25);
    this.beep(60, 0.6, 'triangle', 0.2);
  }
  sleep() {
    this.beep(220, 0.15, 'sine', 0.08);
    this.beep(165, 0.25, 'sine', 0.06);
    this.beep(110, 0.4, 'triangle', 0.05);
  }
  equip() {
    this.beep(480, 0.05, 'triangle', 0.1);
    this.beep(640, 0.06, 'sine', 0.08);
  }
}
