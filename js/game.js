import * as THREE from 'three';
import { World } from './world.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { GameTime } from './time.js';
import { AudioBus } from './audio.js';
import {
  DEFAULT_SURVIVAL,
  tickSurvival,
  eatFood,
} from './survival.js';
import { BLOCK, BLOCK_PROPS, HOTBAR_DEFAULT, getHardness, getDrop, isSolid } from './blocks.js';

export class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} hud DOM refs
   */
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.hud = hud;
    this.audio = new AudioBus();
    this.time = new GameTime({ dayLengthSec: 420 });
    this.survival = { ...DEFAULT_SURVIVAL };
    this.prevHealth = this.survival.health;
    this.paused = false;
    this.started = false;
    this.mode = 'survival';
    this.seed = (Math.random() * 1e6) | 0;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87b5ff);
    this.scene.fog = new THREE.Fog(0x87b5ff, 40, 120);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 200);

    this.ambient = new THREE.AmbientLight(0x6688aa, 0.35);
    this.sun = new THREE.DirectionalLight(0xfff2d9, 1.1);
    this.sun.position.set(40, 80, 20);
    this.scene.add(this.ambient, this.sun);

    this.hemi = new THREE.HemisphereLight(0x9ec9ff, 0x3a2a15, 0.35);
    this.scene.add(this.hemi);

    this.world = null;
    this.player = null;
    this.input = new Input(canvas);

    this._breakSpeed = 1.8;
    this._stepAcc = 0;
    this._hintShown = false;

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this._last = performance.now();
    this._raf = 0;
  }

  start(seed = this.seed) {
    this.seed = seed;
    if (this.world) {
      this.scene.remove(this.world.group);
    }
    this.world = new World({ seed, radiusChunks: 3 });
    this.scene.add(this.world.group);
    const spawn = this.world.findSpawn();
    this.player = new Player(spawn);
    this.survival = { ...DEFAULT_SURVIVAL };
    this.prevHealth = 100;
    this.time = new GameTime({ dayLengthSec: 420 });
    this.started = true;
    this.paused = false;
    this.input.bind();
    this.player.notify('Click to lock mouse. Survive the night — cold kills.', 6);
    this._loop();
    this.hud.hideTitle?.();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  _loop = () => {
    this._raf = requestAnimationFrame(this._loop);
    const now = performance.now();
    let dt = (now - this._last) / 1000;
    this._last = now;
    dt = Math.min(0.05, dt);
    if (!this.paused && this.started) this.update(dt);
    this.render();
  };

  update(dt) {
    this.audio.resume();
    this.time.tick(dt);

    const move = this.player.update(this.world, this.input, this.survival, dt);

    const heat = this.world.sampleHeat(
      this.player.position.x,
      this.player.position.y + 1,
      this.player.position.z,
      7,
    );

    this.survival = tickSurvival(this.survival, {
      dt,
      dayPhase: this.time.dayPhase,
      weather: this.time.weather,
      blockHeat: heat,
      sprinting: move.sprinting,
      moving: move.moved,
      inWater: move.inWater,
      sleeping: false,
      hungerMult: this.mode === 'harmless' ? 0.15 : 1,
    });

    if (this.survival.health < this.prevHealth - 0.5) this.audio.hurt();
    this.prevHealth = this.survival.health;

    if (this.survival.dead) {
      this.hud.showDeath?.(this.survival.causeOfDeath);
      return;
    }

    // footsteps
    if (move.moved && this.player.onGround) {
      this._stepAcc += dt * (move.sprinting ? 2.2 : 1.4);
      if (this._stepAcc > 0.45) {
        this._stepAcc = 0;
        this.audio.step();
      }
    }

    this._handleMining(dt);
    this._handlePlace();
    this._handleEat();

    // camera
    const eye = this.player.eyePosition();
    // exhaustion sway
    if (this.survival.sleep > 70) {
      eye.y += Math.sin(performance.now() / 200) * 0.02 * (this.survival.sleep / 100);
      eye.x += Math.sin(performance.now() / 330) * 0.015 * (this.survival.sleep / 100);
    }
    this.camera.position.copy(eye);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;

    this.world.flushDirty();
    this._updateLighting();
    this._updateHud();
  }

  _handleMining(dt) {
    const origin = this.player.eyePosition();
    const dir = this.player.lookDir();
    const hit = this.world.raycast(origin, dir, 6);

    if (this.input.breakHeld && hit && hit.id !== BLOCK.BEDROCK) {
      const key = `${hit.x},${hit.y},${hit.z}`;
      if (!this.player.breaking || this.player.breaking.key !== key) {
        this.player.breaking = { key, x: hit.x, y: hit.y, z: hit.z, progress: 0 };
      }
      const hard = getHardness(hit.id);
      this.player.breaking.progress += (this._breakSpeed * dt) / hard;
      if (this.player.breaking.progress >= 1) {
        const drop = getDrop(hit.id);
        this.world.setBlock(hit.x, hit.y, hit.z, BLOCK.AIR);
        this.audio.breakBlock();
        this.player.breaking = null;
        // auto-add food chance from leaves later; give log -> notify
        if (drop === BLOCK.LOG) this.player.notify('Wood gathered. Craft planks later (E coming soon).');
        if (drop && drop !== BLOCK.AIR && HOTBAR_DEFAULT.includes(drop)) {
          // ensure hotbar has it
        }
      }
    } else {
      this.player.breaking = null;
    }

    this._target = hit;
  }

  _handlePlace() {
    if (!this.input.consumePlace()) return;
    const origin = this.player.eyePosition();
    const dir = this.player.lookDir();
    const hit = this.world.raycast(origin, dir, 6);
    if (!hit) return;
    const px = hit.x + hit.nx;
    const py = hit.y + hit.ny;
    const pz = hit.z + hit.nz;
    // don't place inside player
    const pp = this.player.position;
    if (
      px + 1 > pp.x - 0.3 && px < pp.x + 0.3 &&
      py + 1 > pp.y && py < pp.y + 1.7 &&
      pz + 1 > pp.z - 0.3 && pz < pp.z + 0.3
    ) return;

    const id = HOTBAR_DEFAULT[this.player.hotbarIndex] ?? BLOCK.DIRT;
    if (!isSolid(id) && id !== BLOCK.TORCH && id !== BLOCK.CAMPFIRE) {
      // allow torch/campfire
    }
    const cur = this.world.getBlock(px, py, pz);
    if (cur !== BLOCK.AIR && cur !== BLOCK.WATER) return;
    if (this.world.setBlock(px, py, pz, id)) {
      this.audio.placeBlock();
      if (id === BLOCK.CAMPFIRE) this.player.notify('Campfire lit. Stay close — heat fights the cold.');
      if (id === BLOCK.TORCH) this.player.notify('Torch placed. Weak heat, good light later.');
    }
  }

  _handleEat() {
    if (!this.input.consumeEat()) return;
    if (this.player.inventoryFood <= 0) {
      this.player.notify('No rations left. Hunt or find food (coming).');
      return;
    }
    this.player.inventoryFood -= 1;
    this.survival = eatFood(this.survival, 30, 1);
    this.audio.eat();
    this.player.notify(`Ate ration (${this.player.inventoryFood} left).`);
  }

  _updateLighting() {
    const sunI = this.time.sunIntensity();
    this.sun.intensity = 0.25 + sunI * 1.0;
    this.ambient.intensity = 0.12 + sunI * 0.35;
    this.hemi.intensity = 0.15 + sunI * 0.3;
    const sky = this.time.skyColor();
    const color = new THREE.Color(sky.r, sky.g, sky.b);
    this.scene.background = color;
    this.scene.fog.color.copy(color);
    this.scene.fog.near = 35 + sunI * 20;
    this.scene.fog.far = 90 + sunI * 40;
    // night moonish ambient blue
    if (this.time.isNight()) {
      this.ambient.color.set(0x223355);
      this.sun.intensity = 0.08;
    } else {
      this.ambient.color.set(0x6688aa);
    }
  }

  _updateHud() {
    const s = this.survival;
    const setBar = (id, value, max = 100) => {
      const el = document.getElementById(id);
      if (el) el.style.width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
    };
    setBar('bar-health', s.health, s.maxHealth);
    setBar('bar-hunger', s.hunger, s.maxHunger);
    setBar('bar-stamina', s.stamina, s.maxStamina);
    setBar('bar-temp', this._tempBar(s.bodyTemp), 100);
    setBar('bar-sleep', s.sleep, 100);

    const tempLabel = document.getElementById('temp-label');
    if (tempLabel) tempLabel.textContent = `${s.bodyTemp.toFixed(1)}°C`;

    const status = document.getElementById('status-line');
    if (status) {
      const bits = [];
      bits.push(`Day ${this.time.dayNumber}`);
      bits.push(this.time.isNight() ? 'Night' : 'Day');
      bits.push(this.time.weather);
      if (s._debug) bits.push(`Air ${s._debug.ambient.toFixed(0)}°C`);
      bits.push(`Rations ${this.player.inventoryFood}`);
      if (this.player.breaking) bits.push(`Mining ${Math.floor(this.player.breaking.progress * 100)}%`);
      status.textContent = bits.join(' · ');
    }

    const msg = document.getElementById('message');
    if (msg) {
      msg.textContent = this.player.messageT > 0 ? this.player.message : '';
    }

    // hotbar
    document.querySelectorAll('.hotbar-slot').forEach((el, i) => {
      el.classList.toggle('active', i === this.player.hotbarIndex);
      const id = HOTBAR_DEFAULT[i];
      const p = BLOCK_PROPS[id];
      el.title = p?.name || '';
      el.dataset.block = p?.name || '';
      const col = p?.color || [0.5, 0.5, 0.5];
      el.style.background = `rgb(${col[0]*255|0},${col[1]*255|0},${col[2]*255|0})`;
    });

    // vignette cold/hurt
    const hurt = document.getElementById('hurt-vignette');
    if (hurt) {
      let a = 0;
      if (s.health < 40) a = Math.max(a, (40 - s.health) / 40 * 0.55);
      if (s.bodyTemp < 34) a = Math.max(a, (34 - s.bodyTemp) / 4 * 0.5);
      if (s.hunger < 20) a = Math.max(a, 0.2);
      hurt.style.opacity = String(a);
    }

    const cross = document.getElementById('crosshair');
    if (cross && this._target) cross.classList.add('hit');
    else if (cross) cross.classList.remove('hit');
  }

  _tempBar(bodyTemp) {
    // map 30..42 °C to 0..100 bar centered at 37
    return Math.max(0, Math.min(100, ((bodyTemp - 30) / 12) * 100));
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  respawn() {
    if (!this.world) return;
    const spawn = this.world.findSpawn();
    this.player = new Player(spawn);
    this.survival = { ...DEFAULT_SURVIVAL };
    this.prevHealth = 100;
    this.hud.hideDeath?.();
    this.player.notify('You wake cold and hungry. Try again.');
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this.input.unbind();
  }
}
