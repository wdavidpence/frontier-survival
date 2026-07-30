/** Day/night clock. dayPhase in [0,1): 0 dawn, 0.25 noon, 0.5 dusk, 0.75 midnight */
export class GameTime {
  /**
   * @param {object} opts
   * @param {number} opts.dayLengthSec real seconds per full day
   */
  constructor({ dayLengthSec = 480 } = {}) {
    this.dayLengthSec = dayLengthSec;
    this.elapsed = dayLengthSec * 0.2; // start morning
    this.weather = 'clear';
    this.weatherTimer = 0;
  }

  get dayPhase() {
    return (this.elapsed / this.dayLengthSec) % 1;
  }

  get dayNumber() {
    return Math.floor(this.elapsed / this.dayLengthSec) + 1;
  }

  isNight() {
    const p = this.dayPhase;
    return p > 0.55 && p < 0.95;
  }

  tick(dt) {
    this.elapsed += dt;
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      const r = Math.random();
      if (r < 0.7) this.weather = 'clear';
      else if (r < 0.9) this.weather = 'rain';
      else this.weather = 'snow';
      this.weatherTimer = 60 + Math.random() * 120;
    }
  }

  /** Sun direction-ish intensity 0..1 */
  sunIntensity() {
    const p = this.dayPhase;
    // daylight 0.05..0.55 roughly
    const ang = (p - 0.05) / 0.5;
    if (p < 0.05 || p > 0.55) return 0.05 + (p > 0.9 || p < 0.05 ? 0.02 : 0);
    return Math.max(0.08, Math.sin(ang * Math.PI));
  }

  skyColor() {
    const s = this.sunIntensity();
    if (this.isNight()) return { r: 0.05, g: 0.06, b: 0.12 };
    if (s < 0.25) return { r: 0.55, g: 0.35, b: 0.25 }; // dawn/dusk
    if (this.weather === 'rain') return { r: 0.35, g: 0.4, b: 0.45 };
    if (this.weather === 'snow') return { r: 0.55, g: 0.6, b: 0.65 };
    return { r: 0.45 + s * 0.2, g: 0.65 + s * 0.15, b: 0.95 };
  }

  fogColor() {
    return this.skyColor();
  }
}
