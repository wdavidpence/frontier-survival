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
  applyDamage,
} from './survival.js';
import { BLOCK, getHardness, isSolid, getColor } from './blocks.js';
import {
  ITEM,
  propsOf,
  displayName,
  isPlaceable,
  placeBlockId,
  mineMultiplier,
  dropForBlock,
} from './items.js';
import {
  addItems,
  removeItems,
  countItems,
  consumeFromHotbar,
  HOTBAR_SIZE,
  hasIngredients,
  cloneSlots,
  createStarterInventory,
  emptySlots,
} from './inventory.js';
import { visibleRecipes, craftRecipe } from './crafting.js';
import { FaunaSystem, SPECIES } from './animals.js';
import { createBlockAtlas } from './atlas.js';
import { BreakFX } from './fx.js';
import {
  equipmentWarmth,
  equipItem,
  emptyEquipment,
  canSleep,
  applySleepRest,
  EQUIP_SLOTS,
} from './equipment.js';
import {
  serializeSave,
  writeSaveToStorage,
  readSaveFromStorage,
  clearSaveStorage,
} from './save.js';
import { getMode } from './modes.js';
import {
  readSettings,
  writeSettings,
  sensitivityFromSlider,
  sliderFromSensitivity,
  DEFAULT_SETTINGS,
} from './settings.js';
import {
  emptyAchievements,
  unlockAchievement,
  popAchievementToast,
  achievementTitle,
  achievementDesc,
} from './achievements.js';
import { tickSpoilage } from './spoilage.js';
import { spawnArrow, stepProjectile, hitAnimal } from './projectiles.js';

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
    const settingsRes = readSettings();
    this.settings = settingsRes.ok ? settingsRes.data : { ...DEFAULT_SETTINGS };
    this.mode = getMode(this.settings.mode).id;
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
    this.fauna = null;
    this._animalMeshes = new Map();
    this.input = new Input(canvas);
    this.input.sensitivity = this.settings.sensitivity ?? DEFAULT_SETTINGS.sensitivity;
    this._meleeCd = 0;
    this._lastHeat = 0;
    this.atlas = createBlockAtlas();
    this.fx = new BreakFX(this.scene, this.atlas);
    this.worldRadius = 5;

    this._breakSpeed = 1.6;
    this._stepAcc = 0;
    this._invNeedsPaint = true;
    this._autosaveAcc = 0;
    this._autosaveInterval = 40; // seconds
    this._lastSaveStatus = '';
    this._helpVisible = this.settings.helpVisible !== false;
    this._helpFadeAcc = 0;
    this._crossHitT = 0;
    this._deathHandled = false;
    this._lightPool = [];
    this._lightScanAcc = 0;
    this._projectiles = [];
    this._arrowMeshes = [];
    this._crops = new Map(); // "x,y,z" -> growth 0..1
    this._stats = { kills: 0, wolfKills: 0, arrowsFired: 0 };
    this._achievements = emptyAchievements();
    this._toastId = null;
    this._toastT = 0;
    this._debugOpen = false;
    this._fps = 0;
    this._fpsAcc = 0;
    this._fpsFrames = 0;
    this._wasInWater = false;
    this._rain = null;
    this._bowCd = 0;

    // Block selection outline
    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
    this._outline = new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({ color: 0xf0e0c0, transparent: true, opacity: 0.85 }),
    );
    this._outline.visible = false;
    this.scene.add(this._outline);

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('beforeunload', this._onBeforeUnload);

    this._bindInventoryUi();
    this._bindPauseUi();

    this._last = performance.now();
    this._raf = 0;
  }

  _onBeforeUnload = () => {
    if (this.started && this.player && !this.survival?.dead) {
      this.saveGame({ quiet: true });
    }
  };

  _bindInventoryUi() {
    const panel = document.getElementById('inventory-screen');
    const closeBtn = document.getElementById('btn-close-inv');
    closeBtn?.addEventListener('click', () => this.setInventoryOpen(false));
    document.getElementById('btn-save-game')?.addEventListener('click', () => {
      this.saveGame();
      this._paintInventory();
    });

    panel?.addEventListener('click', (e) => {
      const recipeBtn = e.target.closest('[data-recipe]');
      if (recipeBtn) {
        this._tryCraft(recipeBtn.getAttribute('data-recipe'));
        return;
      }
      const slotEl = e.target.closest('[data-slot]');
      if (slotEl) {
        const idx = Number(slotEl.getAttribute('data-slot'));
        if (idx >= 0 && idx < HOTBAR_SIZE) {
          this.player.hotbarIndex = idx;
          this._invNeedsPaint = true;
          this._paintInventory();
        }
      }
    });
  }

  _bindPauseUi() {
    document.getElementById('btn-resume')?.addEventListener('click', () => this.setPaused(false));
    document.getElementById('btn-pause-save')?.addEventListener('click', () => {
      this.saveGame();
    });
    const sens = document.getElementById('sens-slider');
    if (sens) {
      sens.value = String(sliderFromSensitivity(this.input.sensitivity));
      sens.addEventListener('input', () => {
        const v = sensitivityFromSlider(sens.value);
        this.input.sensitivity = v;
        this.settings.sensitivity = v;
        writeSettings(this.settings);
        const lab = document.getElementById('sens-label');
        if (lab) lab.textContent = String(sens.value);
      });
    }
  }

  modeDef() {
    return getMode(this.mode);
  }

  setMode(id) {
    const m = getMode(id);
    this.mode = m.id;
    this.settings.mode = m.id;
    writeSettings(this.settings);
  }

  setPaused(p) {
    if (!this.started || this.survival?.dead) return;
    this.paused = !!p;
    const panel = document.getElementById('pause-screen');
    if (this.paused) {
      this.setInventoryOpen(false);
      if (document.pointerLockElement) document.exitPointerLock();
      this.input.uiMode = true;
      this.input.breakHeld = false;
      panel?.classList.remove('hidden');
      const sens = document.getElementById('sens-slider');
      if (sens) {
        sens.value = String(sliderFromSensitivity(this.input.sensitivity));
        const lab = document.getElementById('sens-label');
        if (lab) lab.textContent = String(sens.value);
      }
      const modeEl = document.getElementById('pause-mode');
      if (modeEl) modeEl.textContent = this.modeDef().name;
    } else {
      panel?.classList.add('hidden');
      if (!this.player?.inventoryOpen) this.input.uiMode = false;
      this.audio.ui();
    }
  }

  start(seed = this.seed) {
    this.seed = seed;
    this._bootWorld({
      seed,
      freshPlayer: true,
      notify: 'Hunt wildlife · craft a spear · cook at campfires · watch wolves. E craft · F use · K save · Esc pause',
    });
  }

  /**
   * @param {object} opts
   * @param {number} opts.seed
   * @param {boolean} [opts.freshPlayer]
   * @param {object} [opts.saveData] parsed save
   * @param {string} [opts.notify]
   */
  _bootWorld({ seed, freshPlayer = true, saveData = null, notify = '' }) {
    this.seed = seed;
    if (this.world) {
      this.scene.remove(this.world.group);
      // dispose old meshes lightly
      for (const m of this.world.meshes.values()) {
        m.geometry?.dispose();
        m.material?.dispose?.();
      }
    }
    this.world = new World({
      seed,
      radiusChunks: this.worldRadius || 5,
      material: this.atlas.greedyMaterial || this.atlas.material,
    });
    if (saveData?.edits?.length) {
      this.world.applyEdits(saveData.edits, { replace: true });
    }
    this.scene.add(this.world.group);

    this._clearAnimalMeshes();
    this.fauna = new FaunaSystem(this.world, seed);
    if (saveData?.animals?.length) {
      this.fauna.importState(saveData.animals);
    }

    if (freshPlayer || !saveData) {
      const spawn = this.world.findSpawn();
      this.player = new Player(spawn, { starterRations: this.modeDef().starterRations });
      this.survival = { ...DEFAULT_SURVIVAL };
      this.time = new GameTime({ dayLengthSec: 420 });
      this._stats = { kills: 0, wolfKills: 0, arrowsFired: 0 };
      this._achievements = emptyAchievements();
      this._crops = new Map();
    } else {
      this.player = new Player({
        x: saveData.player.x,
        y: saveData.player.y,
        z: saveData.player.z,
      });
      this.player.yaw = saveData.player.yaw || 0;
      this.player.pitch = saveData.player.pitch || 0;
      this.input.lookX = this.player.yaw;
      this.input.lookY = this.player.pitch;
      this.player.hotbarIndex = saveData.player.hotbarIndex || 0;
      this.player.slots = cloneSlots(saveData.player.slots);
      this.player.equipment = saveData.player.equipment
        ? { ...emptyEquipment(), ...saveData.player.equipment }
        : emptyEquipment();
      this.survival = { ...DEFAULT_SURVIVAL, ...saveData.survival, dead: false, causeOfDeath: null };
      this.time = new GameTime({ dayLengthSec: saveData.time.dayLengthSec || 420 });
      this.time.elapsed = saveData.time.elapsed || 0;
      this.time.weather = saveData.time.weather || 'clear';
      this.time.weatherTimer = saveData.time.weatherTimer ?? 60;
      this.mode = saveData.mode || this.mode || 'survival';
      this._stats = { kills: 0, wolfKills: 0, arrowsFired: 0, ...(saveData.stats || {}) };
      this._achievements = emptyAchievements();
      if (saveData.achievements) {
        this._achievements.unlocked = { ...saveData.achievements };
      }
      this._crops = new Map(Array.isArray(saveData.crops) ? saveData.crops : []);
    }

    this.prevHealth = this.survival.health;
    this._deathHandled = false;
    // keep spawn safe from wolves/hares packed on face
    if (this.fauna && this.player) {
      this.fauna.clearNear(this.player.position.x, this.player.position.z, 16);
    }
    this.started = true;
    this.paused = false;
    this.setPaused(false);
    this.input.bind();
    this.setInventoryOpen(false);
    this._applyHelpVisibility();
    this._helpFadeAcc = 0;
    if (notify) {
      this.player.notify(notify, 7);
    } else if (freshPlayer) {
      this.player.notify(`${this.modeDef().name} mode. Hunt hares & deer. Craft a spear. Wolves hunt at night.`, 8);
    }
    if (!this._raf) this._loop();
    this.hud.hideTitle?.();
    this._invNeedsPaint = true;
    this._autosaveAcc = 0;
    this._syncAnimalMeshes();
    this._scanLights(true);
  }


  _unlock(id) {
    const res = unlockAchievement(this._achievements, id);
    if (res.changed) {
      this._achievements = { unlocked: res.unlocked, queue: res.queue };
      if (!this._toastId && res.queue.length) {
        const popped = popAchievementToast(this._achievements);
        this._achievements = popped.state;
        this._toastId = popped.id;
        this._toastT = 3.5;
        this.audio.toast?.() || this.audio.ui();
      }
    }
  }

  _surfaceName(blockId) {
    if (blockId === BLOCK.GRASS) return 'grass';
    if (blockId === BLOCK.SAND) return 'sand';
    if (blockId === BLOCK.STONE || blockId === BLOCK.COBBLE || blockId === BLOCK.COAL_ORE || blockId === BLOCK.IRON_ORE) return 'stone';
    if (blockId === BLOCK.LOG || blockId === BLOCK.PLANKS) return 'wood';
    if (blockId === BLOCK.SNOW || blockId === BLOCK.ICE) return 'snow';
    if (blockId === BLOCK.WATER) return 'water';
    return 'dirt';
  }

  _ensureRain() {
    if (this._rain) return;
    const geo = new THREE.BufferGeometry();
    const N = 900;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xaaccff,
      size: 0.08,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this._rain = new THREE.Points(geo, mat);
    this._rain.visible = false;
    this.scene.add(this._rain);
  }

  _tickWeatherFX(dt) {
    this._ensureRain();
    const w = this.time.weather;
    const show = w === 'rain' || w === 'snow';
    this._rain.visible = show && this.started && !this.survival.dead;
    if (!show) return;
    const pos = this._rain.geometry.attributes.position.array;
    const speed = w === 'snow' ? 4 : 14;
    const px = this.player.position.x;
    const py = this.player.position.y;
    const pz = this.player.position.z;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] -= speed * dt * (0.6 + (i % 7) * 0.05);
      if (pos[i + 1] < -2) {
        pos[i] = (Math.random() - 0.5) * 40;
        pos[i + 1] = 18 + Math.random() * 12;
        pos[i + 2] = (Math.random() - 0.5) * 40;
      }
    }
    this._rain.position.set(px, py, pz);
    this._rain.geometry.attributes.position.needsUpdate = true;
    this._rain.material.color.setHex(w === 'snow' ? 0xffffff : 0x88aadd);
    this._rain.material.size = w === 'snow' ? 0.12 : 0.07;
  }

  _tickCrops(dt) {
    if (!this._crops.size) return;
    const grow = [];
    for (const [key, g] of this._crops) {
      const ng = Math.min(1, g + dt / 90); // ~90s to mature
      if (ng >= 1) grow.push(key);
      else this._crops.set(key, ng);
    }
    for (const key of grow) {
      this._crops.delete(key);
      // already CROP block; ripe flagged by absence from map + name via progress complete
      // mark ripe by setting crop growth map value 1 then remove — harvest checks growth missing as ripe if block is crop older
      this._crops.set(key, 1);
    }
  }

  _cropKey(x, y, z) {
    return `${x|0},${y|0},${z|0}`;
  }

  _tickProjectiles(dt) {
    if (!this._projectiles.length) return;
    const next = [];
    for (let i = 0; i < this._projectiles.length; i++) {
      const p = this._projectiles[i];
      const { proj, hitPos } = stepProjectile(p, dt);
      let mesh = this._arrowMeshes[i];
      if (!mesh) {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.08, 0.55),
          new THREE.MeshBasicMaterial({ color: 0xc8b090 }),
        );
        this.scene.add(mesh);
        this._arrowMeshes[i] = mesh;
      }
      if (!proj) {
        this.scene.remove(mesh);
        continue;
      }
      // block collision
      const bid = this.world.getBlock(proj.x, proj.y, proj.z);
      if (bid !== BLOCK.AIR && bid !== BLOCK.WATER && bid !== BLOCK.BUSH && bid !== BLOCK.CROP && bid !== BLOCK.TORCH) {
        this.scene.remove(mesh);
        continue;
      }
      // animal hit
      let hit = false;
      if (this.fauna) {
        for (const a of this.fauna.living()) {
          if (hitAnimal(proj, a, 0.85)) {
            const res = this.fauna.damageAnimal(a, proj.damage);
            this.audio.hit();
            this._crossHitT = 0.25;
            if (res?.killed) {
              this._stats.kills = (this._stats.kills || 0) + 1;
              if (a.type === 'wolf') {
                this._stats.wolfKills = (this._stats.wolfKills || 0) + 1;
                this._unlock('first_wolf');
              }
              this._unlock('first_kill');
              if (res.meat > 0) this.player.slots = addItems(this.player.slots, ITEM.RAW_MEAT, res.meat).slots;
              if (res.hide > 0) this.player.slots = addItems(this.player.slots, ITEM.HIDE, res.hide).slots;
              const bits = [];
              if (res.meat) bits.push(`+${res.meat} meat`);
              if (res.hide) bits.push(`+${res.hide} hide`);
              this.player.notify(`${res.name} down (arrow). ${bits.join(', ')}`, 3);
              this._syncAnimalMeshes();
            } else if (res) {
              this.player.notify(`${res.name} hit (${Math.max(0, a.hp)|0} hp)`, 1.2);
            }
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        this.scene.remove(mesh);
        continue;
      }
      mesh.position.set(proj.x, proj.y, proj.z);
      mesh.lookAt(proj.x + proj.vx, proj.y + proj.vy, proj.z + proj.vz);
      next.push(proj);
    }
    // cleanup extra meshes
    while (this._arrowMeshes.length > next.length) {
      const m = this._arrowMeshes.pop();
      this.scene.remove(m);
    }
    this._projectiles = next;
  }

  _tryShootBow() {
    if (this._bowCd > 0) return false;
    const held = propsOf(this.player.heldId());
    if (held?.tool !== 'bow') return false;
    if (countItems(this.player.slots, ITEM.ARROW) <= 0) {
      this.player.notify('No arrows. Craft sticks + cobble.');
      return true;
    }
    const rem = removeItems(this.player.slots, ITEM.ARROW, 1);
    if (!rem.ok) return true;
    this.player.slots = rem.slots;
    const origin = this.player.eyePosition();
    const dir = this.player.lookDir();
    // spawn slightly forward
    origin.x += dir.x * 0.6;
    origin.y += dir.y * 0.6;
    origin.z += dir.z * 0.6;
    this._projectiles.push(spawnArrow(origin, dir, { damage: 15, speed: 32 }));
    this._bowCd = 0.55;
    this._stats.arrowsFired = (this._stats.arrowsFired || 0) + 1;
    this.audio.shoot?.() || this.audio.hit();
    return true;
  }

  captureState() {
    return {
      seed: this.seed,
      mode: this.mode,
      survival: this.survival,
      time: {
        elapsed: this.time.elapsed,
        weather: this.time.weather,
        weatherTimer: this.time.weatherTimer,
        dayLengthSec: this.time.dayLengthSec,
      },
      player: {
        x: this.player.position.x,
        y: this.player.position.y,
        z: this.player.position.z,
        yaw: this.player.yaw,
        pitch: this.player.pitch,
        hotbarIndex: this.player.hotbarIndex,
        slots: this.player.slots,
        equipment: this.player.equipment || emptyEquipment(),
      },
      edits: this.world.exportEdits(),
      animals: this.fauna ? this.fauna.exportState() : [],
      stats: this._stats || { kills: 0, wolfKills: 0, arrowsFired: 0 },
      achievements: this._achievements?.unlocked || {},
      crops: [...(this._crops || new Map()).entries()],
    };
  }

  saveGame({ quiet = false, allowDead = false } = {}) {
    if (!this.started || !this.player || !this.world) {
      return { ok: false, error: 'not started' };
    }
    if (this.survival.dead && !allowDead) {
      return { ok: false, error: 'dead' };
    }
    const json = serializeSave(this.captureState());
    const res = writeSaveToStorage(json);
    if (res.ok) {
      this._lastSaveStatus = `Saved ${new Date().toLocaleTimeString()}`;
      if (!quiet) this.player.notify('Game saved.', 2);
      this.audio.ui();
      this.hud.refreshContinue?.();
    } else if (!quiet) {
      this.player.notify(`Save failed: ${res.error}`);
    }
    return res;
  }

  loadGame() {
    const res = readSaveFromStorage();
    if (!res.ok) return res;
    this._bootWorld({
      seed: res.data.seed,
      freshPlayer: false,
      saveData: res.data,
      notify: 'Save loaded. Welcome back — check your fire before night.',
    });
    return { ok: true };
  }

  newGame() {
    clearSaveStorage();
    this.seed = (Math.random() * 1e6) | 0;
    // keep selected mode from settings / title UI
    this.mode = getMode(this.settings.mode).id;
    this.start(this.seed);
    this.hud.refreshContinue?.();
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
    // Always process pause / help keys
    if (this.started && this.input.consumePause()) {
      if (this.player?.inventoryOpen) this.setInventoryOpen(false);
      else if (!this.survival.dead) this.setPaused(!this.paused);
    }
    if (this.input.consumeHelp()) {
      this._helpVisible = !this._helpVisible;
      this.settings.helpVisible = this._helpVisible;
      writeSettings(this.settings);
      this._applyHelpVisibility();
    }
    if (!this.paused && this.started) this.update(dt);
    else if (this.started) this.render();
    else this.render();
  };

  _applyHelpVisibility() {
    const help = document.getElementById('help');
    if (!help) return;
    help.classList.toggle('hidden', !this._helpVisible);
    help.classList.toggle('faded', false);
  }

  setInventoryOpen(open) {
    if (!this.player) return;
    if (open) this.setPaused(false);
    this.player.inventoryOpen = open;
    this.input.uiMode = open || this.paused;
    const panel = document.getElementById('inventory-screen');
    if (open) {
      panel?.classList.remove('hidden');
      if (document.pointerLockElement) document.exitPointerLock();
      this.input.breakHeld = false;
      this._invNeedsPaint = true;
      this._paintInventory();
      this.audio.ui();
    } else {
      panel?.classList.add('hidden');
      // autosave when closing pack
      if (this.started && !this.survival.dead && !this.paused) this.saveGame({ quiet: true });
    }
  }

  _tryCraft(recipeId) {
    if (!this.player) return;
    const res = craftRecipe(this.player.slots, recipeId, { heat: this._lastHeat || 0 });
    if (!res.ok) {
      if (res.error === 'need campfire heat') {
        this.player.notify('Stand near a campfire to cook.');
      } else {
        this.player.notify(res.error === 'inventory full' ? 'Inventory full.' : 'Missing ingredients.');
      }
      this.audio.hurt();
      return;
    }
    this.player.slots = res.slots;
    this.audio.placeBlock();
    this.player.notify(`Crafted: ${recipeId.replace(/_/g, ' ')}`);
    if (recipeId === 'bow') this._unlock('first_bow');
    if (recipeId === 'smelt_iron') this._unlock('first_iron');
    if (recipeId === 'bread') this._unlock('first_bread');
    if (recipeId === 'cook_meat') this._unlock('first_cook');
    this._invNeedsPaint = true;
    this._paintInventory();
  }

  update(dt) {
    this.audio.resume();

    if (this.input.consumeInventory()) {
      this.setInventoryOpen(!this.player.inventoryOpen);
    }
    if (this.input.consumeQuickSave()) {
      this.saveGame();
    }

    // survival keeps ticking even in inventory (you're still cold/hungry)
    this.time.tick(dt);
    this._crossHitT = Math.max(0, this._crossHitT - dt);
    this._bowCd = Math.max(0, this._bowCd - dt);
    this._fpsFrames++;
    this._fpsAcc += dt;
    if (this._fpsAcc >= 0.5) {
      this._fps = this._fpsFrames / this._fpsAcc;
      this._fpsFrames = 0;
      this._fpsAcc = 0;
    }
    if (this.input.consumeDebug()) this._debugOpen = !this._debugOpen;

    // achievement toast timer
    if (this._toastT > 0) {
      this._toastT -= dt;
      if (this._toastT <= 0) {
        this._toastId = null;
        if (this._achievements.queue.length) {
          const popped = popAchievementToast(this._achievements);
          this._achievements = popped.state;
          this._toastId = popped.id;
          this._toastT = 3.2;
          this.audio.toast?.() || this.audio.ui();
        }
      }
    }

    const mode = this.modeDef();

    let move = { moved: false, sprinting: false, inWater: false };
    if (!this.player.inventoryOpen) {
      move = this.player.update(this.world, this.input, this.survival, dt);
      if (this.player.pendingFallDamage > 0) {
        const dmg = this.player.pendingFallDamage;
        this.player.pendingFallDamage = 0;
        this.survival = applyDamage(this.survival, dmg, 'fall');
        this.audio.hurt();
        this.player.notify(dmg > 20 ? 'Hard landing!' : 'Oof — rough landing.', 1.6);
      }
      if (move.inWater && !this._wasInWater) this.audio.splash?.() || this.audio.step('water');
      this._wasInWater = move.inWater;
      // drown when exhausted in water
      if (move.inWater && this.survival.stamina < 2) {
        this.survival = applyDamage(this.survival, 8 * dt, 'drowning');
      }
    } else {
      // still update message timer
      if (this.player.messageT > 0) this.player.messageT -= dt;
    }

    const heat = this.world.sampleHeat(
      this.player.position.x,
      this.player.position.y + 1,
      this.player.position.z,
      7,
    );
    this._lastHeat = heat;
    this.survival.warmthFromClothes = equipmentWarmth(this.player.equipment);

    // Ambient soundscape (wind/night/rain/fire/water + stingers)
    const feetBlock = this.world.getBlock(
      this.player.position.x,
      this.player.position.y - 0.2,
      this.player.position.z,
    );
    const nearWater =
      move.inWater ||
      feetBlock === BLOCK.WATER ||
      this.world.getBlock(this.player.position.x + 2, this.player.position.y, this.player.position.z) === BLOCK.WATER ||
      this.world.getBlock(this.player.position.x - 2, this.player.position.y, this.player.position.z) === BLOCK.WATER ||
      this.world.getBlock(this.player.position.x, this.player.position.y, this.player.position.z + 2) === BLOCK.WATER ||
      this.world.getBlock(this.player.position.x, this.player.position.y, this.player.position.z - 2) === BLOCK.WATER;
    this.audio.tickAmbient(dt, {
      isNight: this.time.isNight(),
      weather: this.time.weather,
      heat,
      nearWater,
      dayPhase: this.time.dayPhase,
      dead: this.survival.dead,
    });

    this.survival = tickSurvival(this.survival, {
      dt,
      dayPhase: this.time.dayPhase,
      weather: this.time.weather,
      blockHeat: heat,
      sprinting: move.sprinting,
      moving: move.moved,
      inWater: move.inWater,
      sleeping: false,
      hungerMult: mode.hungerMult,
      coldDamageMult: mode.coldDamageMult,
    });

    // meat spoilage
    {
      const sp = tickSpoilage(this.player.slots, dt);
      this.player.slots = sp.slots;
      if (sp.spoiled > 0) this.player.notify(`Some meat spoiled (${sp.spoiled}).`, 2.5);
    }

    // day 2 achievement
    if (this.time.dayNumber >= 2) this._unlock('first_night');

    // fauna
    this._meleeCd = Math.max(0, this._meleeCd - dt);
    if (this.fauna && !this.player.inventoryOpen) {
      const fa = this.fauna.tick(
        dt,
        {
          x: this.player.position.x,
          y: this.player.position.y,
          z: this.player.position.z,
        },
        this.time.isNight(),
        {
          senseMult: mode.predatorSenseMult,
          damageMult: mode.predatorDamageMult,
        },
      );
      if (fa.playerDamage > 0) {
        this.survival = applyDamage(this.survival, fa.playerDamage, 'wolf');
        this.audio.hurt();
        this.player.notify('A wolf mauls you!');
      }
      this._syncAnimalMeshes();
    }

    if (this.survival.health < this.prevHealth - 0.5) this.audio.hurt();
    this.prevHealth = this.survival.health;

    if (this.survival.dead) {
      this.setInventoryOpen(false);
      if (!this._deathSfxPlayed) {
        this.audio.death();
        this._deathSfxPlayed = true;
      }
      if (!this._deathHandled) {
        this._deathHandled = true;
        this._onDeath();
      }
      this.hud.showDeath?.(this.survival.causeOfDeath, {
        mode: this.mode,
        permadeath: mode.permadeath,
        dropped: mode.deathDrops,
        day: this.time.dayNumber,
        kills: this._stats?.kills || 0,
        wolfKills: this._stats?.wolfKills || 0,
      });
      this._updateHud();
      return;
    }
    this._deathSfxPlayed = false;
    this._deathHandled = false;

    if (!this.player.inventoryOpen) {
      if (move.moved && this.player.onGround) {
        this._stepAcc += dt * (move.sprinting ? 2.2 : 1.4);
        if (this._stepAcc > 0.45) {
          this._stepAcc = 0;
          const under = this.world.getBlock(
            this.player.position.x,
            this.player.position.y - 0.2,
            this.player.position.z,
          );
          this.audio.step(this._surfaceName(under));
        }
      }
      // bow shot steals LMB when holding bow
      if (this.input.breakHeld && propsOf(this.player.heldId())?.tool === 'bow') {
        this._tryShootBow();
        this.player.breaking = null;
        this.fx.hideCrack();
      } else {
        this._handleMining(dt);
      }
      this._handlePlace();
      this._handleEat();
      this._handleCookUse();
      this._handleDrop();
      this._updateOutlineAndPrompt();
      this._tickProjectiles(dt);
      this._tickCrops(dt);
      this._tickWeatherFX(dt);
    } else if (this._outline) {
      this._outline.visible = false;
    }

    // auto-fade help after a while
    if (this._helpVisible && this.input.locked) {
      this._helpFadeAcc += dt;
      if (this._helpFadeAcc > 45) {
        const help = document.getElementById('help');
        help?.classList.add('faded');
      }
    }

    // camera
    const eye = this.player.eyePosition();
    if (this.survival.sleep > 70) {
      eye.y += Math.sin(performance.now() / 200) * 0.02 * (this.survival.sleep / 100);
      eye.x += Math.sin(performance.now() / 330) * 0.015 * (this.survival.sleep / 100);
    }
    this.camera.position.copy(eye);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;

    this.world.flushDirty();
    this.fx.tick(dt);
    this._lightScanAcc += dt;
    if (this._lightScanAcc > 0.5) {
      this._lightScanAcc = 0;
      this._scanLights(false);
    }
    this._updateLighting();
    this._updateHud();
    if (this.player.inventoryOpen && this._invNeedsPaint) this._paintInventory();

    // periodic autosave
    this._autosaveAcc += dt;
    if (this._autosaveAcc >= this._autosaveInterval) {
      this._autosaveAcc = 0;
      this.saveGame({ quiet: true });
    }
  }

  _onDeath() {
    const mode = this.modeDef();
    if (mode.deathDrops && this.player) {
      this.player.slots = emptySlots();
      this.player.equipment = emptyEquipment();
      this.player.notify('Your pack spilled into the wild.', 4);
    }
    if (mode.permadeath) {
      clearSaveStorage();
      this.hud.refreshContinue?.();
    } else {
      // keep world edits on death; survival restored on respawn
      this.saveGame({ quiet: true, allowDead: true });
    }
  }

  _handleDrop() {
    if (!this.input.consumeDrop()) return;
    const held = this.player.heldStack();
    if (!held || held.id == null || held.count <= 0) {
      this.player.notify('Nothing to drop.');
      return;
    }
    const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
    if (!cons.ok) return;
    this.player.slots = cons.slots;
    this.audio.ui();
    this.player.notify(`Dropped 1 ${displayName(cons.id)}.`, 1.4);
  }

  _compassHeading() {
    // yaw 0 looks -Z (north-ish); map to N/E/S/W
    let deg = ((-this.player.yaw) * 180) / Math.PI;
    deg = ((deg % 360) + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(deg / 45) % 8;
    return dirs[idx];
  }

  _updateOutlineAndPrompt() {
    const origin = this.player.eyePosition();
    const dir = this.player.lookDir();
    const hit = this.world.raycast(origin, dir, 6);
    const prompt = document.getElementById('prompt');
    let text = '';

    if (hit && hit.id !== BLOCK.BEDROCK) {
      this._outline.visible = true;
      this._outline.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
      if (hit.id === BLOCK.BED) text = 'F — Sleep (if warm & fed)';
      else if (hit.id === BLOCK.CAMPFIRE) text = 'Hold meat · F cook near heat';
    } else {
      this._outline.visible = false;
    }

    const held = this.player.heldStack();
    const p = propsOf(held.id);
    if (!text && p?.equipSlot) text = `F — Equip ${p.name}`;
    if (!text && p?.cookable && (this._lastHeat || 0) >= 8) text = `F — Cook ${p.name}`;
    if (!text && p?.cookable) text = 'F — Cook (need campfire heat)';
    if (!text && p?.tool === 'bow') text = 'LMB — Shoot arrow';
    if (!text && p?.plantable) text = 'RMB on soil — Plant seeds';

    // animal under crosshair
    const range = p?.meleeRange || 3.6;
    const ah = this.fauna?.rayHit(origin, dir, range);
    if (ah) {
      const spec = SPECIES[ah.animal.type];
      text = `LMB — Attack ${spec?.name || 'animal'} (${Math.ceil(ah.animal.hp)} hp)`;
      this._outline.visible = false;
    }

    if (prompt) prompt.textContent = this.player.inventoryOpen ? '' : text;
  }

  /**
   * Place/update PointLights near player for torches & campfires.
   */
  _scanLights(force) {
    if (!this.world || !this.player) return;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const found = [];
    const R = 14;
    for (let y = py - 6; y <= py + 8; y++) {
      for (let z = pz - R; z <= pz + R; z++) {
        for (let x = px - R; x <= px + R; x++) {
          const id = this.world.getBlock(x, y, z);
          if (id === BLOCK.TORCH || id === BLOCK.CAMPFIRE) {
            found.push({ x, y, z, id });
          }
        }
      }
    }
    // sort by distance, keep nearest 8
    found.sort((a, b) => {
      const da = (a.x - px) ** 2 + (a.y - py) ** 2 + (a.z - pz) ** 2;
      const db = (b.x - px) ** 2 + (b.y - py) ** 2 + (b.z - pz) ** 2;
      return da - db;
    });
    const keep = found.slice(0, 8);
    while (this._lightPool.length < keep.length) {
      const L = new THREE.PointLight(0xffaa55, 1, 14, 2);
      this.scene.add(L);
      this._lightPool.push(L);
    }
    for (let i = 0; i < this._lightPool.length; i++) {
      const L = this._lightPool[i];
      if (i < keep.length) {
        const b = keep[i];
        L.visible = true;
        L.position.set(b.x + 0.5, b.y + 0.85, b.z + 0.5);
        const flick = 0.88 + Math.sin(performance.now() / 90 + i * 1.7) * 0.12
          + Math.sin(performance.now() / 37 + i) * 0.05;
        if (b.id === BLOCK.CAMPFIRE) {
          L.color.setHex(0xff8844);
          L.intensity = (this.time.isNight() ? 1.55 : 0.9) * flick;
          L.distance = 16;
        } else {
          L.color.setHex(0xffcc77);
          L.intensity = (this.time.isNight() ? 1.1 : 0.55) * flick;
          L.distance = 11;
        }
      } else {
        L.visible = false;
      }
    }
  }

  _handleMining(dt) {
    const origin = this.player.eyePosition();
    const dir = this.player.lookDir();

    // Melee animals on click-hold with cooldown
    if (this.input.breakHeld && this.fauna && this._meleeCd <= 0) {
      const heldP = propsOf(this.player.heldId());
      const reach = heldP?.meleeRange || 3.6;
      const ah = this.fauna.rayHit(origin, dir, reach);
      if (ah) {
        this.player.breaking = null;
        const held = heldP;
        const dmg = held?.melee || 4;
        const res = this.fauna.damageAnimal(ah.animal, dmg);
        this.audio.breakBlock();
        this._meleeCd = held?.tool === 'weapon' ? 0.42 : 0.35;
        this._crossHitT = 0.22;
        this.audio.hit?.();
        if (res?.killed) {
          this._stats.kills = (this._stats.kills || 0) + 1;
          if (ah.animal.type === 'wolf') {
            this._stats.wolfKills = (this._stats.wolfKills || 0) + 1;
            this._unlock('first_wolf');
          }
          this._unlock('first_kill');
          if (res.meat > 0) {
            const add = addItems(this.player.slots, ITEM.RAW_MEAT, res.meat);
            this.player.slots = add.slots;
          }
          if (res.hide > 0) {
            const addH = addItems(this.player.slots, ITEM.HIDE, res.hide);
            this.player.slots = addH.slots;
          }
          const bits = [];
          if (res.meat) bits.push(`+${res.meat} meat`);
          if (res.hide) bits.push(`+${res.hide} hide`);
          this.player.notify(
            `${res.name} down. ${bits.join(', ') || 'nothing'}. Craft clothes & cook!`,
            3.5,
          );
          this._syncAnimalMeshes();
        } else if (res) {
          this.player.notify(`${res.name} wounded (${Math.max(0, ah.animal.hp)|0} hp)`, 1.2);
        }
        this._target = null;
        return;
      }
    }

    const hit = this.world.raycast(origin, dir, 6);

    if (this.input.breakHeld && hit && hit.id !== BLOCK.BEDROCK) {
      const key = `${hit.x},${hit.y},${hit.z}`;
      if (!this.player.breaking || this.player.breaking.key !== key) {
        this.player.breaking = { key, x: hit.x, y: hit.y, z: hit.z, progress: 0 };
      }
      const hard = getHardness(hit.id);
      const mult = mineMultiplier(this.player.heldId(), hit.id);
      this.player.breaking.progress += (this._breakSpeed * mult * dt) / hard;
      this.fx.setCrack(hit, this.player.breaking.progress);
      if (this.player.breaking.progress >= 1) {
        let drop = dropForBlock(hit.id);
        let dropCount = 1;
        if (hit.id === BLOCK.LEAVES) {
          drop = Math.random() < 0.18 ? ITEM.STICK : (Math.random() < 0.08 ? ITEM.SEEDS : null);
        }
        if (hit.id === BLOCK.GRASS && Math.random() < 0.12) {
          // bonus seeds when ripping grass
          const bonus = addItems(this.player.slots, ITEM.SEEDS, 1);
          this.player.slots = bonus.slots;
        }
        if (hit.id === BLOCK.BUSH) {
          drop = ITEM.BERRIES;
          dropCount = 1 + (Math.random() < 0.4 ? 1 : 0);
          if (Math.random() < 0.35) {
            const s = addItems(this.player.slots, ITEM.SEEDS, 1);
            this.player.slots = s.slots;
          }
        }
        if (hit.id === BLOCK.CROP) {
          const key = this._cropKey(hit.x, hit.y, hit.z);
          const g = this._crops.get(key) ?? 1;
          this._crops.delete(key);
          if (g >= 1) {
            drop = ITEM.WHEAT;
            dropCount = 1 + (Math.random() < 0.5 ? 1 : 0);
            const s = addItems(this.player.slots, ITEM.SEEDS, 1 + (Math.random() < 0.4 ? 1 : 0));
            this.player.slots = s.slots;
          } else {
            drop = ITEM.SEEDS;
            dropCount = 1;
          }
        }
        if (hit.id === BLOCK.LOG) this._unlock('first_log');
        const col = getColor(hit.id, 'side');
        this.fx.burst(hit.x, hit.y, hit.z, col, 12);
        this.fx.hideCrack();
        this.world.setBlock(hit.x, hit.y, hit.z, BLOCK.AIR);
        this.audio.breakBlock();
        this.player.breaking = null;
        if (drop && drop !== BLOCK.AIR) {
          const res = addItems(this.player.slots, drop, dropCount);
          this.player.slots = res.slots;
          if (res.leftover > 0) {
            this.player.notify('Inventory full — drop lost.');
          } else {
            this.player.notify(`+${dropCount} ${displayName(drop)}`, 1.4);
          }
        }
      }
    } else if (!this.input.breakHeld) {
      this.player.breaking = null;
      this.fx.hideCrack();
    } else {
      this.fx.hideCrack();
    }

    this._target = hit;
  }

  _handlePlace() {
    if (!this.input.consumePlace()) return;
    const held = this.player.heldId();
    if (!isPlaceable(held)) {
      this.player.notify('Select a placeable block (E to craft).');
      return;
    }
    const origin = this.player.eyePosition();
    const dir = this.player.lookDir();
    const hit = this.world.raycast(origin, dir, 6);
    if (!hit) return;
    const px = hit.x + hit.nx;
    const py = hit.y + hit.ny;
    const pz = hit.z + hit.nz;
    const pp = this.player.position;
    if (
      px + 1 > pp.x - 0.3 && px < pp.x + 0.3 &&
      py + 1 > pp.y && py < pp.y + 1.7 &&
      pz + 1 > pp.z - 0.3 && pz < pp.z + 0.3
    ) return;

    // Plant seeds on dirt/grass/farmland
    const heldProps = propsOf(held);
    if (heldProps?.plantable) {
      const under = this.world.getBlock(hit.x, hit.y, hit.z);
      if (under !== BLOCK.DIRT && under !== BLOCK.GRASS && under !== BLOCK.FARMLAND) {
        this.player.notify('Plant seeds on dirt, grass, or farmland.');
        return;
      }
      const top = this.world.getBlock(hit.x, hit.y + 1, hit.z);
      if (top !== BLOCK.AIR) {
        this.player.notify('Need empty space above soil.');
        return;
      }
      const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
      if (!cons.ok) return;
      this.player.slots = cons.slots;
      if (under === BLOCK.GRASS || under === BLOCK.DIRT) {
        this.world.setBlock(hit.x, hit.y, hit.z, BLOCK.FARMLAND);
      }
      this.world.setBlock(hit.x, hit.y + 1, hit.z, BLOCK.CROP);
      this._crops.set(this._cropKey(hit.x, hit.y + 1, hit.z), 0);
      this.audio.placeBlock();
      this.player.notify('Seeds planted. Wait for wheat to ripen.', 2.5);
      this._unlock('first_farm');
      return;
    }

    const blockId = placeBlockId(held);
    const cur = this.world.getBlock(px, py, pz);
    if (cur !== BLOCK.AIR && cur !== BLOCK.WATER) return;

    const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
    if (!cons.ok) {
      this.player.notify('Nothing to place in this slot.');
      return;
    }
    this.player.slots = cons.slots;

    if (this.world.setBlock(px, py, pz, blockId)) {
      this.audio.placeBlock();
      if (blockId === BLOCK.CAMPFIRE) {
        this.player.notify('Campfire lit. Stay close — heat fights the cold.');
        this._scanLights(true);
        this._unlock('first_fire');
      }
      if (blockId === BLOCK.TORCH) {
        this.player.notify('Torch placed.');
        this._scanLights(true);
      }
      if (blockId === BLOCK.BED) this.player.notify('Bed placed. Look at it and press F at night to sleep.');
    } else {
      // refund
      const refund = addItems(this.player.slots, held, 1);
      this.player.slots = refund.slots;
    }
  }

  _handleEat() {
    if (!this.input.consumeEat()) return;
    const held = this.player.heldStack();
    const p = propsOf(held.id);
    if (p?.edible && held.count > 0) {
      const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
      if (!cons.ok) return;
      this.player.slots = cons.slots;
      this.survival = eatFood(this.survival, p.edible, p.edible > 20 ? 2 : 0);
      if (p.eatDamage) {
        this.survival = applyDamage(this.survival, p.eatDamage, 'food_poisoning');
        this.player.notify(`Ate ${p.name} — stomach turns. Cook meat next time!`, 3);
      } else {
        this.player.notify(`Ate ${p.name}.`);
      }
      this.audio.eat();
      return;
    }
    // prefer cooked meat anywhere
    if (countItems(this.player.slots, ITEM.COOKED_MEAT) > 0) {
      const rem = removeItems(this.player.slots, ITEM.COOKED_MEAT, 1);
      if (rem.ok) {
        this.player.slots = rem.slots;
        this.survival = eatFood(this.survival, 38, 2);
        this.audio.eat();
        this.player.notify('Ate cooked meat.');
        return;
      }
    }
    if (countItems(this.player.slots, ITEM.RATION) > 0) {
      const rem = removeItems(this.player.slots, ITEM.RATION, 1);
      if (rem.ok) {
        this.player.slots = rem.slots;
        this.survival = eatFood(this.survival, 28, 1);
        this.audio.eat();
        const left = countItems(this.player.slots, ITEM.RATION);
        this.player.notify(`Ate ration (${left} left).`);
        return;
      }
    }
    this.player.notify('No safe food. Hunt, cook at fire (E), or eat rations (R).');
  }

  /** F: cook meat / equip clothes / sleep on bed */
  _handleCookUse() {
    if (!this.input.consumeUse()) return;
    const origin = this.player.eyePosition();
    const dir = this.player.lookDir();
    const hit = this.world.raycast(origin, dir, 5);

    // Sleep on bed
    if (hit && hit.id === BLOCK.BED) {
      this._trySleep();
      return;
    }

    const held = this.player.heldStack();
    const p = propsOf(held.id);

    // Equip clothing
    if (p?.equipSlot && held.count > 0) {
      const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
      if (!cons.ok) return;
      let slots = cons.slots;
      const eq = equipItem(this.player.equipment, held.id);
      if (!eq.ok) {
        // refund
        this.player.slots = addItems(slots, held.id, 1).slots;
        this.player.notify('Cannot equip.');
        return;
      }
      if (eq.previousId != null) {
        slots = addItems(slots, eq.previousId, 1).slots;
      }
      this.player.equipment = eq.equipment;
      this.player.slots = slots;
      this.audio.equip?.() || this.audio.ui();
      const w = equipmentWarmth(eq.equipment);
      this.player.notify(`Equipped ${p.name}. Clothing warmth ${w}.`, 3);
      this._unlock('first_clothes');
      this._invNeedsPaint = true;
      return;
    }

    // Cook raw meat
    if (p?.cookable && held.count > 0) {
      if ((this._lastHeat || 0) < 8) {
        this.player.notify('Need campfire heat to cook. Place & stand close.');
        return;
      }
      const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
      if (!cons.ok) return;
      const add = addItems(cons.slots, p.cookable, 1);
      this.player.slots = add.slots;
      this.audio.eat();
      this.player.notify(`Cooked → ${displayName(p.cookable)}.`, 2.5);
      this._unlock('first_cook');
      return;
    }

    this.player.notify('F: equip clothes, cook meat at fire, or sleep on bed.');
  }

  _trySleep() {
    const check = canSleep(this.survival, {
      atBed: true,
      inWater: this.world.getBlock(
        this.player.position.x,
        this.player.position.y,
        this.player.position.z,
      ) === BLOCK.WATER,
      isNight: this.time.isNight(),
    });
    if (!check.ok) {
      this.player.notify(
        check.error === 'need a bed'
          ? 'Need a bed.'
          : check.error === 'not tired enough (wait for night)'
            ? 'Not tired enough — try at night or when exhausted.'
            : check.error === 'too cold — warm up first'
              ? 'Too cold to sleep. Fire or warmer clothes.'
              : check.error === 'too hungry'
                ? 'Too hungry to sleep. Eat first.'
                : `Cannot sleep: ${check.error}`,
        3.5,
      );
      return;
    }

    // Skip ~8 hours of game time
    const dayLen = this.time.dayLengthSec || 420;
    const skip = dayLen * (this.time.isNight() ? 0.42 : 0.28);
    this.time.elapsed += skip;
    this.survival = applySleepRest(this.survival, this.time.isNight() ? 8 : 5);
    this.audio.sleep?.() || this.audio.ui();
    this.player.notify('You rest. Fatigue fades. Dawn approaches…', 4);
    this._unlock('first_sleep');
    // Heal slight hunger check already in applySleepRest
  }

  _clearAnimalMeshes() {
    for (const mesh of this._animalMeshes.values()) {
      this.scene.remove(mesh);
      mesh.traverse?.((c) => {
        c.geometry?.dispose?.();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose?.());
          else c.material.dispose?.();
        }
      });
    }
    this._animalMeshes.clear();
  }

  _makeAnimalMesh(type) {
    const spec = SPECIES[type] || SPECIES.hare;
    const g = new THREE.Group();
    const col = new THREE.Color(spec.color[0], spec.color[1], spec.color[2]);
    const mat = new THREE.MeshLambertMaterial({ color: col });
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(spec.scale[0], spec.scale[1] * 0.55, spec.scale[2]),
      mat,
    );
    body.position.y = spec.scale[1] * 0.35;
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(spec.scale[0] * 0.55, spec.scale[1] * 0.4, spec.scale[0] * 0.55),
      mat,
    );
    head.position.set(0, spec.scale[1] * 0.7, spec.scale[2] * 0.35);
    g.add(body, head);
    if (type === 'wolf') {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.08), mat);
      ear.position.set(0.12, spec.scale[1] * 0.95, spec.scale[2] * 0.3);
      g.add(ear);
    }
    g.userData.type = type;
    return g;
  }

  _syncAnimalMeshes() {
    if (!this.fauna) return;
    const living = this.fauna.living();
    const seen = new Set();
    for (const a of living) {
      seen.add(a.id);
      let mesh = this._animalMeshes.get(a.id);
      if (!mesh) {
        mesh = this._makeAnimalMesh(a.type);
        this._animalMeshes.set(a.id, mesh);
        this.scene.add(mesh);
      }
      mesh.position.set(a.x, a.y, a.z);
      mesh.rotation.y = a.yaw || 0;
      // hurt flash
      const hurt = a.hp < a.maxHp * 0.5;
      mesh.traverse((c) => {
        if (c.isMesh && c.material?.color) {
          const spec = SPECIES[a.type];
          const base = spec?.color || [0.5, 0.5, 0.5];
          c.material.color.setRGB(
            hurt ? Math.min(1, base[0] + 0.25) : base[0],
            hurt ? base[1] * 0.7 : base[1],
            hurt ? base[2] * 0.7 : base[2],
          );
        }
      });
    }
    for (const [id, mesh] of this._animalMeshes) {
      if (!seen.has(id)) {
        this.scene.remove(mesh);
        this._animalMeshes.delete(id);
      }
    }
  }

  _paintInventory() {
    this._invNeedsPaint = false;
    if (!this.player) return;

    const bag = document.getElementById('inv-slots');
    if (bag) {
      bag.innerHTML = '';
      this.player.slots.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'inv-slot' + (i === this.player.hotbarIndex && i < HOTBAR_SIZE ? ' active' : '');
        el.dataset.slot = String(i);
        if (i < HOTBAR_SIZE) el.dataset.hot = String(i + 1);
        if (s.id != null && s.count > 0) {
          const p = propsOf(s.id);
          const col = p?.color || [0.5, 0.5, 0.5];
          el.style.background = `rgb(${(col[0]*255)|0},${(col[1]*255)|0},${(col[2]*255)|0})`;
          el.title = `${displayName(s.id)} x${s.count}`;
          el.innerHTML = `<span class="inv-count">${s.count}</span><span class="inv-name">${displayName(s.id)}</span>`;
        } else {
          el.classList.add('empty');
          el.title = i < HOTBAR_SIZE ? `Hotbar ${i + 1}` : 'Empty';
        }
        bag.appendChild(el);
      });
    }

    const recipesEl = document.getElementById('recipe-list');
    if (recipesEl) {
      recipesEl.innerHTML = '';
      for (const r of visibleRecipes()) {
        const has = hasIngredients(this.player.slots, r.ingredients);
        const heatOk = !r.requiresHeat || (this._lastHeat || 0) >= r.requiresHeat;
        const can = has && heatOk;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'recipe-btn' + (can ? ' can' : '');
        btn.dataset.recipe = r.id;
        btn.disabled = !can;
        let desc = r.desc || '';
        if (r.requiresHeat && !heatOk) desc += ' — stand by fire';
        btn.innerHTML = `<strong>${r.name}</strong><span>${desc}</span>`;
        recipesEl.appendChild(btn);
      }
    }

    const eqEl = document.getElementById('equip-slots');
    if (eqEl) {
      const w = equipmentWarmth(this.player.equipment);
      eqEl.innerHTML = `<div class="equip-warmth">Clothing warmth: <b>${w}</b> (F to equip held clothes)</div>`;
      for (const slot of EQUIP_SLOTS) {
        const id = this.player.equipment?.[slot];
        const row = document.createElement('div');
        row.className = 'equip-row';
        const name = id != null ? displayName(id) : '— empty —';
        const p = id != null ? propsOf(id) : null;
        row.innerHTML = `<span class="equip-slot-label">${slot}</span><span class="equip-item">${name}${p?.warmth ? ` (+${p.warmth})` : ''}</span>`;
        eqEl.appendChild(row);
      }
    }
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
    this.scene.fog.near = 45 + sunI * 25;
    this.scene.fog.far = 110 + sunI * 50;
    if (this.time.isNight()) {
      this.ambient.color.set(0x223355);
      this.sun.intensity = 0.08;
    } else {
      this.ambient.color.set(0x6688aa);
    }
    // Drive greedy shader lighting
    const mat = this.atlas?.greedyMaterial;
    if (mat?.uniforms) {
      mat.uniforms.sunIntensity.value = this.time.isNight() ? 0.15 : 0.55 + sunI * 0.7;
      mat.uniforms.ambientColor.value.set(
        this.time.isNight() ? 0.12 : 0.35,
        this.time.isNight() ? 0.14 : 0.4,
        this.time.isNight() ? 0.22 : 0.5,
      );
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

    // critical pulses
    const meters = document.getElementById('meters');
    if (meters) {
      meters.classList.toggle('crit-health', s.health < 28);
      meters.classList.toggle('crit-hunger', s.hunger < 18);
      meters.classList.toggle('crit-cold', s.bodyTemp < 34.2);
    }

    const status = document.getElementById('status-line');
    if (status && this.player) {
      const bits = [];
      bits.push(this.modeDef().name);
      bits.push(`Seed ${this.seed}`);
      bits.push(this._compassHeading());
      bits.push(`Day ${this.time.dayNumber}`);
      bits.push(this.time.isNight() ? 'Night' : 'Day');
      bits.push(this.time.weather);
      if (s._debug) bits.push(`Air ${s._debug.ambient.toFixed(0)}°C`);
      const cw = equipmentWarmth(this.player.equipment);
      if (cw > 0) bits.push(`Warmth +${cw}`);
      bits.push(`Food ${countItems(this.player.slots, ITEM.RATION)}`);
      const held = this.player.heldStack();
      if (held.id != null) bits.push(displayName(held.id));
      if (this.player.breaking) bits.push(`Mining ${Math.floor(this.player.breaking.progress * 100)}%`);
      if (this.fauna) bits.push(`Wildlife ${this.fauna.living().length}`);
      if (this._lastSaveStatus) bits.push(this._lastSaveStatus);
      status.textContent = bits.join(' · ');
    }

    const msg = document.getElementById('message');
    if (msg) {
      msg.textContent = this.player.messageT > 0 ? this.player.message : '';
    }

    document.querySelectorAll('.hotbar-slot').forEach((el, i) => {
      el.classList.toggle('active', i === this.player.hotbarIndex);
      const stack = this.player.slots[i];
      if (stack && stack.id != null && stack.count > 0) {
        const p = propsOf(stack.id);
        const col = p?.color || [0.5, 0.5, 0.5];
        el.style.background = `rgb(${(col[0]*255)|0},${(col[1]*255)|0},${(col[2]*255)|0})`;
        el.title = `${displayName(stack.id)} x${stack.count}`;
        el.dataset.block = displayName(stack.id);
        let countEl = el.querySelector('.hb-count');
        if (!countEl) {
          countEl = document.createElement('span');
          countEl.className = 'hb-count';
          el.appendChild(countEl);
        }
        countEl.textContent = String(stack.count);
        el.classList.remove('empty');
      } else {
        el.style.background = 'rgba(255,255,255,0.04)';
        el.title = 'Empty';
        el.dataset.block = '';
        const countEl = el.querySelector('.hb-count');
        if (countEl) countEl.textContent = '';
        el.classList.add('empty');
      }
    });

    const hurt = document.getElementById('hurt-vignette');
    if (hurt) {
      let a = 0;
      if (s.health < 40) a = Math.max(a, (40 - s.health) / 40 * 0.55);
      if (s.bodyTemp < 34) a = Math.max(a, (34 - s.bodyTemp) / 4 * 0.5);
      if (s.hunger < 20) a = Math.max(a, 0.2);
      hurt.style.opacity = String(a);
    }

    const cross = document.getElementById('crosshair');
    if (cross) {
      const animalAim = this._crossHitT > 0;
      const blockAim = !!(this._target && !this.player.inventoryOpen);
      cross.classList.toggle('hit', blockAim || animalAim);
      cross.classList.toggle('strike', animalAim);
    }

    setBar('bar-wet', s.wetness || 0, 100);
    const wetRow = document.getElementById('meter-wet');
    if (wetRow) wetRow.style.opacity = (s.wetness || 0) > 2 ? '1' : '0.35';

    const hbName = document.getElementById('hotbar-name');
    if (hbName && this.player) {
      const h = this.player.heldStack();
      hbName.textContent = h?.id != null ? displayName(h.id) : '';
    }

    const toast = document.getElementById('ach-toast');
    if (toast) {
      if (this._toastId && this._toastT > 0) {
        toast.classList.remove('hidden');
        toast.innerHTML = `<strong>${achievementTitle(this._toastId)}</strong><span>${achievementDesc(this._toastId)}</span>`;
      } else {
        toast.classList.add('hidden');
      }
    }

    const dbg = document.getElementById('debug-overlay');
    if (dbg) {
      if (this._debugOpen && this.player) {
        dbg.classList.remove('hidden');
        const ms = this.world.meshStats?.() || {};
        dbg.textContent = [
          `FPS ${this._fps.toFixed(0)}`,
          `pos ${this.player.position.x.toFixed(1)} ${this.player.position.y.toFixed(1)} ${this.player.position.z.toFixed(1)}`,
          `seed ${this.seed} mode ${this.mode}`,
          `day ${this.time.dayNumber} phase ${this.time.dayPhase.toFixed(2)} ${this.time.weather}`,
          `heat ${this._lastHeat|0} wet ${s.wetness|0}`,
          `mesh v=${ms.verts ?? '?'} t=${ms.tris ?? '?'}`,
          `kills ${this._stats?.kills || 0} arrows ${this._stats?.arrowsFired || 0}`,
          `crops ${this._crops?.size || 0} proj ${this._projectiles?.length || 0}`,
        ].join('\n');
      } else {
        dbg.classList.add('hidden');
      }
    }
  }

  _tempBar(bodyTemp) {
    return Math.max(0, Math.min(100, ((bodyTemp - 30) / 12) * 100));
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  respawn() {
    if (!this.world) return;
    const mode = this.modeDef();
    if (mode.permadeath) {
      // full new world
      this.hud.hideDeath?.();
      this.newGame();
      return;
    }
    const spawn = this.world.findSpawn();
    // keep inventory if not death-drop mode; death already cleared slots if needed
    const keepSlots = this.player?.slots;
    const keepEq = this.player?.equipment;
    this.player = new Player(spawn, { starterRations: 0 });
    if (keepSlots) this.player.slots = cloneSlots(keepSlots);
    if (keepEq) this.player.equipment = { ...emptyEquipment(), ...keepEq };
    // if inventory empty after death drops, give a single ration on survival modes
    if (countItems(this.player.slots, ITEM.RATION) === 0 && !mode.deathDrops) {
      this.player.slots = createStarterInventory(mode.starterRations);
    } else if (mode.deathDrops && countItems(this.player.slots, ITEM.RATION) === 0) {
      this.player.slots = createStarterInventory(1);
    }
    this.survival = { ...DEFAULT_SURVIVAL };
    this.prevHealth = 100;
    this._deathHandled = false;
    this.fauna?.clearNear(spawn.x, spawn.z, 14);
    this.hud.hideDeath?.();
    this.setInventoryOpen(false);
    this.player.notify(
      mode.deathDrops
        ? 'You wake with almost nothing. Rebuild your pack.'
        : 'You wake cold and hungry. Mine, craft, light a fire.',
    );
    this.saveGame({ quiet: true });
    this._scanLights(true);
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this.input.unbind();
  }
}
