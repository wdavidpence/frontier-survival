import * as THREE from 'three';
import { World } from './world.js?v=181';
import { Player } from './player.js?v=181';
import { Input } from './input.js?v=181';
import { GameTime } from './time.js?v=181';
import { AudioBus } from './audio.js?v=181';
import {
  DEFAULT_SURVIVAL,
  tickSurvival,
  eatFood,
  applyDamage,
} from './survival.js?v=181';
import { BLOCK, getHardness, isSolid, isTransparent, getColor, BLOCK_PROPS } from './blocks.js?v=181';
import {
  ITEM,
  propsOf,
  displayName,
  isPlaceable,
  placeBlockId,
  mineMultiplier,
  dropForBlock,
} from './items.js?v=181';
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
  splitStack,
} from './inventory.js?v=181';
import { visibleRecipes, craftRecipe } from './crafting.js?v=181';
import { FaunaSystem, SPECIES, canFeed, tryFeed } from './animals.js?v=181';
import { createBlockAtlas } from './atlas.js?v=181';
import { BreakFX } from './fx.js?v=181';
import {
  equipmentWarmth,
  equipmentArmor,
  mitigatePhysicalDamage,
  equipItem,
  emptyEquipment,
  canSleep,
  applySleepRest,
  EQUIP_SLOTS,
} from './equipment.js?v=181';
import { hasRoofAbove, wetnessGainRate, exposureColdMult } from './exposure.js?v=181';
import {
  serializeSave,
  writeSaveToStorage,
  readSaveFromStorage,
  clearSaveStorage,
} from './save.js?v=181';
import { getMode } from './modes.js?v=181';
import {
  readSettings,
  writeSettings,
  sensitivityFromSlider,
  sliderFromSensitivity,
  DEFAULT_SETTINGS,
} from './settings.js?v=181';
import {
  emptyAchievements,
  unlockAchievement,
  popAchievementToast,
  achievementTitle,
  achievementDesc,
} from './achievements.js?v=181';
import { tickSpoilage } from './spoilage.js?v=181';
import { spawnArrow, stepProjectile, hitAnimal } from './projectiles.js?v=181';
import { wearTool, durabilityRatio } from './durability.js?v=181';
import { applyBleed, tickBleed, stopBleed, isBleeding } from './bleed.js?v=181';
import { tickLogic, COMPONENT } from './logic.js?v=181';
import { biomeAt, BIOME, ambientTempOffset } from './biomes.js?v=181';
import {
  chestKey,
  getChestSlots,
  setChestSlots,
  exportChests,
  importChests,
  depositOne,
  withdrawOne,
  emptyChestSlots,
  CHEST_SIZE,
} from './chests.js?v=181';

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
    this.renderer.setClearColor(0x87b5ff, 1);
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
    this._chests = new Map();
    this._chestOpenKey = null;
    this._recipeFilter = '';
    this._fishCd = 0;
    this._campFuel = new Map(); // "x,y,z" -> fuel 0..100
    this._lastWeather = 'clear';
    this._roofed = false;
    this._drinkCd = 0;
    this._deathBeacon = null;
    this._deathBeaconT = 0;
    this._pathWear = new Map();
    this._stormFlashT = 0;
    this._lightningAcc = 0;
    this._sleepFadeT = 0;
    this._lastBiome = null; // biome notification tracker
    this._ignorePauseT = 0;
    this._poweredLamps = new Set();
    this._logicAcc = 0;
    this._biomeNotifyAcc = 0; // accumulator for periodic biome name display

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
    document.getElementById('btn-export-save')?.addEventListener('click', () => this.exportSaveFile());
    document.getElementById('btn-import-save')?.addEventListener('click', () => {
      document.getElementById('import-save-file')?.click();
    });
    document.getElementById('import-save-file')?.addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      if (f) this.importSaveFile(f);
      e.target.value = '';
    });
    document.getElementById('recipe-filter')?.addEventListener('input', (e) => {
      this._recipeFilter = e.target.value || '';
      this._invNeedsPaint = true;
      this._paintInventory();
    });
    document.getElementById('btn-close-chest')?.addEventListener('click', () => this._closeChest());
    document.getElementById('btn-chest-deposit')?.addEventListener('click', () => {
      if (!this._chestOpenKey || !this.player) return;
      const slots = getChestSlots(this._chests, this._chestOpenKey);
      const res = depositOne(this.player.slots, this.player.hotbarIndex, slots);
      if (!res.ok) {
        this.player.notify(res.error === 'chest full' ? 'Chest full.' : 'Nothing in selected slot.');
        return;
      }
      this.player.slots = res.playerSlots;
      setChestSlots(this._chests, this._chestOpenKey, res.chestSlots);
      this._paintChest();
      this.audio.ui();
    });
    document.getElementById('chest-screen')?.addEventListener('click', (e) => {
      const c = e.target.closest('[data-chest]');
      if (!c || !this._chestOpenKey) return;
      const idx = Number(c.getAttribute('data-chest'));
      const slots = getChestSlots(this._chests, this._chestOpenKey);
      const res = withdrawOne(this.player.slots, slots, idx);
      if (!res.ok) {
        this.player.notify(res.error === 'inventory full' ? 'Inventory full.' : 'Empty.');
        return;
      }
      this.player.slots = res.playerSlots;
      setChestSlots(this._chests, this._chestOpenKey, res.chestSlots);
      this._paintChest();
      this.audio.ui();
    });
    // deposit: click inv slot while chest open — also on inventory
    panel?.addEventListener('click', (e) => {
      if (this._chestOpenKey) {
        const slotEl = e.target.closest('[data-slot]');
        if (slotEl) {
          const idx = Number(slotEl.getAttribute('data-slot'));
          const slots = getChestSlots(this._chests, this._chestOpenKey);
          const res = depositOne(this.player.slots, idx, slots);
          if (!res.ok) {
            this.player.notify(res.error === 'chest full' ? 'Chest full.' : 'Nothing.');
            return;
          }
          this.player.slots = res.playerSlots;
          setChestSlots(this._chests, this._chestOpenKey, res.chestSlots);
          this._paintChest();
          this._paintInventory();
          this.audio.ui();
          return;
        }
      }
      const recipeBtn = e.target.closest('[data-recipe]');
      if (recipeBtn) {
        this._tryCraft(recipeBtn.getAttribute('data-recipe'));
        return;
      }
      const slotEl = e.target.closest('[data-slot]');
      if (slotEl) {
        const idx = Number(slotEl.getAttribute('data-slot'));
        if (e.shiftKey && idx >= 0 && idx < this.player.slots.length) {
          const res = splitStack(this.player.slots, idx);
          if (!res.ok) {
            this.player.notify(res.error === "no space" ? "No inventory space to split." : "Cannot split.");
            return;
          }
          this.player.slots = res.slots;
          this._invNeedsPaint = true;
          this._paintInventory();
          this.audio.ui();
          return;
        }
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
      this.input.setCaptureEnabled?.(false);
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
      this.input.setCaptureEnabled?.(true);
      this.audio.ui();
      this.canvas?.focus?.();
      this.input.requestLock?.();
    }
    this._updateClickToPlay?.();
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
      this._chests = importChests(saveData.chests || []);
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
    this.input.setCaptureEnabled?.(true);
    this.setInventoryOpen(false);
    this.input.clearTransient?.({ keepMove: false });
    this.input.uiMode = false;
    this.paused = false;
    this._ignorePauseT = 2.5;
    this.canvas?.focus?.();
    this.input.requestLock?.();
    this._updateClickToPlay?.();
    this._applyHelpVisibility();
    this._helpFadeAcc = 0;
    if (notify) {
      this.player.notify(notify, 7);
      this.player.notify('Click game if look fails · WASD move · Esc pause', 5);
    } else if (freshPlayer) {
      this.player.notify(`${this.modeDef().name} mode. Hunt hares & deer. Craft a spear. Wolves hunt at night.`, 8);
    }
    if (!this._raf) this._loop();
    this.hud.hideTitle?.();
    document.getElementById("sleep-fade")?.classList.remove("on");
    const _sf=document.getElementById("sleep-fade"); if(_sf) _sf.style.opacity="0";
    this.resize();
    if (this.player) {
      const eye = this.player.eyePosition();
      this.camera.position.copy(eye);
      this.camera.rotation.order = "YXZ";
      this.camera.rotation.y = this.player.yaw;
      this.camera.rotation.x = this.player.pitch;
    }
    this._updateLighting();
    this.render();
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

  _tickCampfires(dt, baseHeat) {
    if (!this.world || !this.player) return baseHeat;
    let best = baseHeat || 0;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const R = 12;
    for (let z = pz - R; z <= pz + R; z++) {
      for (let x = px - R; x <= px + R; x++) {
        for (let y = Math.max(1, py - 4); y <= Math.min(46, py + 4); y++) {
          if (this.world.getBlock(x, y, z) !== BLOCK.CAMPFIRE) continue;
          const k = `${x},${y},${z}`;
          let fuel = this._campFuel.has(k) ? this._campFuel.get(k) : 50;
          const roofed = hasRoofAbove((xx,yy,zz)=>this.world.getBlock(xx,yy,zz), x, y, z, isSolid, isTransparent);
          const storm = this.time.weather === 'rain' || this.time.weather === 'snow';
          fuel -= (storm && !roofed ? 8 : 1.2) * dt;
          if (fuel <= 0) {
            this.world.setBlock(x, y, z, BLOCK.AIR);
            this._campFuel.delete(k);
            this.player.notify('A campfire died out.', 2.5);
            this._scanLights(true);
            continue;
          }
          this._campFuel.set(k, fuel);
          best = Math.max(best, (fuel / 50) * 18);
        }
      }
    }
    return best;
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
              if (res.egg > 0) this.player.slots = addItems(this.player.slots, ITEM.EGG, res.egg).slots;
              if (res.feather > 0) this.player.slots = addItems(this.player.slots, ITEM.FEATHER, res.feather).slots;
              const bits = [];
              if (res.meat) bits.push(`+${res.meat} meat`);
              if (res.hide) bits.push(`+${res.hide} hide`);
              if (res.egg) bits.push(`+${res.egg} egg`);
              if (res.feather) bits.push(`+${res.feather} feather`);
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


  _tryFish() {
    if (this._fishCd > 0) {
      this.player.notify('Wait to cast again…');
      return;
    }
    const p = this.player.position;
    let near = false;
    for (let dx = -2; dx <= 2 && !near; dx++) {
      for (let dz = -2; dz <= 2 && !near; dz++) {
        if (this.world.getBlock(p.x + dx, p.y, p.z + dz) === BLOCK.WATER) near = true;
        if (this.world.getBlock(p.x + dx, p.y - 1, p.z + dz) === BLOCK.WATER) near = true;
      }
    }
    if (!near) {
      this.player.notify('Stand next to water to fish.');
      return;
    }
    this._fishCd = 2.2;
    const w = wearTool(this.player.slots, this.player.hotbarIndex, 1);
    this.player.slots = w.slots;
    if (w.broken) this.player.notify('Fishing rod snapped!');
    if (Math.random() < 0.55) {
      const add = addItems(this.player.slots, ITEM.RAW_FISH, 1);
      this.player.slots = add.slots;
      this.audio.splash?.() || this.audio.eat();
      this.player.notify('Caught a fish! Cook it at a fire.', 3);
      this._unlock('first_fish');
    } else {
      this.audio.ui();
      this.player.notify('Nothing bites…', 1.5);
    }
  }

  _openChest(key) {
    this._chestOpenKey = key;
    if (!this._chests.has(key)) this._chests.set(key, emptyChestSlots());
    this.setInventoryOpen(false);
    const panel = document.getElementById('chest-screen');
    panel?.classList.remove('hidden');
    this.input.uiMode = true;
    if (document.pointerLockElement) document.exitPointerLock();
    this._paintChest();
    this.audio.ui();
  }

  _closeChest() {
    if (!this._chestOpenKey) return;
    this._chestOpenKey = null;
    document.getElementById('chest-screen')?.classList.add('hidden');
    if (!this.player?.inventoryOpen && !this.paused) this.input.uiMode = false;
    this.saveGame({ quiet: true });
  }

  _paintChest() {
    const bag = document.getElementById('chest-slots');
    if (!bag || !this._chestOpenKey) return;
    const slots = getChestSlots(this._chests, this._chestOpenKey);
    bag.innerHTML = '';
    slots.forEach((s, i) => {
      const el = document.createElement('div');
      el.className = 'inv-slot';
      el.dataset.chest = String(i);
      if (s.id != null && s.count > 0) {
        const pr = propsOf(s.id);
        const col = pr?.color || [0.5, 0.5, 0.5];
        el.style.background = `rgb(${(col[0]*255)|0},${(col[1]*255)|0},${(col[2]*255)|0})`;
        el.innerHTML = `<span class="inv-count">${s.count}</span><span class="inv-name">${displayName(s.id)}</span>`;
      } else el.classList.add('empty');
      bag.appendChild(el);
    });
  }

  exportSaveFile() {
    if (!this.started || !this.player) {
      this.player?.notify?.('Nothing to export.');
      return;
    }
    const json = serializeSave(this.captureState());
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `frontier-survival-seed-${this.seed}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    this.player.notify('Save exported.', 2);
    this.audio.ui();
  }

  importSaveFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      import('./save.js').then(({ parseSavePayload, writeSaveToStorage }) => {
        const parsed = parseSavePayload(String(reader.result || ''));
        if (!parsed.ok) {
          alert('Invalid save: ' + parsed.error);
          return;
        }
        writeSaveToStorage(JSON.stringify(parsed.data));
        this.loadGame();
        this.player?.notify('Save imported.', 3);
      });
    };
    reader.readAsText(file);
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
      chests: exportChests(this._chests),
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
    // Drop Esc leftovers from confirm() dialogs right after boot
    if (this._ignorePauseT > 0) {
      this._ignorePauseT -= dt;
      this.input.pausePressed = false;
    }
    // Always process pause / help keys
    if (this.started && this._ignorePauseT <= 0 && this.input.consumePause()) {
      if (this.player?.inventoryOpen) this.setInventoryOpen(false);
      else if (!this.survival.dead) this.setPaused(!this.paused);
    }
    if (this.input.consumeHelp()) {
      this._helpVisible = !this._helpVisible;
      this.settings.helpVisible = this._helpVisible;
      writeSettings(this.settings);
      this._applyHelpVisibility();
    }
    // Heal stuck control state: pause flag without pause UI, or uiMode without inventory
    if (this.started && !this.survival?.dead) {
      const pauseEl = document.getElementById('pause-screen');
      const pauseUi = pauseEl && !pauseEl.classList.contains('hidden');
      if (this.paused && !pauseUi) {
        this.paused = false;
        this.input.uiMode = !!(this.player?.inventoryOpen);
        this.input.setCaptureEnabled?.(true);
      }
      if (!this.paused && !this.player?.inventoryOpen && this.input.uiMode) {
        this.input.uiMode = false;
        this.input.setCaptureEnabled?.(true);
      }
      // Keep capture on while playing
      if (!this.paused && !this.player?.inventoryOpen) {
        this.input.setCaptureEnabled?.(true);
      }
    }
    this._updateClickToPlay?.();
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
    if (open) {
      this.setPaused(false);
      this._closeChest();
    }
    this.player.inventoryOpen = open;
    this.input.uiMode = open || this.paused;
    this.input.setCaptureEnabled?.(!(open || this.paused) && this.started);
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
      if (this.started && !this.paused) {
        this.input.setCaptureEnabled?.(true);
        this.canvas?.focus?.();
      }
    }
    this._updateClickToPlay?.();
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
    if (recipeId === 'boat') this._unlock('first_boat');
    if (recipeId === 'shield') this._unlock('first_shield');
    if (recipeId === 'leather_vest') this._unlock('first_armor');
    if (recipeId === 'snare') this._unlock('first_snare');
    if (recipeId === 'chest') this._unlock('first_chest');
    if (recipeId === 'cook_meat') this._unlock('first_cook');
    this._invNeedsPaint = true;
    this._paintInventory();
  }

  update(dt) {
    this.audio.resume();

    if (this.input.consumeInventory()) {
      if (this._chestOpenKey) this._closeChest();
      else this.setInventoryOpen(!this.player.inventoryOpen);
    }
    if (this.input.consumeQuickSave()) {
      this.saveGame();
    }

    // survival keeps ticking even in inventory (you're still cold/hungry)
    this.time.tick(dt);
    this._crossHitT = Math.max(0, this._crossHitT - dt);
    this._bowCd = Math.max(0, this._bowCd - dt);
    this._fishCd = Math.max(0, this._fishCd - dt);
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

    let heat = this.world.sampleHeat(
      this.player.position.x,
      this.player.position.y + 1,
      this.player.position.z,
      7,
    );
    // campfire fuel decay nearby
    heat = this._tickCampfires(dt, heat);
    this._lastHeat = heat;
    this.survival.warmthFromClothes = equipmentWarmth(this.player.equipment);

    // roof + rain drench (SC wetness)
    this._roofed = hasRoofAbove(
      (x, y, z) => this.world.getBlock(x, y, z),
      this.player.position.x,
      this.player.position.y,
      this.player.position.z,
      isSolid,
      isTransparent,
    );
    const wGain = wetnessGainRate({
      inWater: move.inWater,
      weather: this.time.weather,
      roofed: this._roofed,
    });
    // storm warning
    if (this.time.weather !== this._lastWeather) {
      if (this.time.weather === 'rain') {
        this.player.notify(
          this._roofed
            ? 'Rain falls — you stay dry under cover.'
            : 'Storm! Seek a roof or fire — wet cold kills.',
          4,
        );
      } else if (this.time.weather === 'snow') {
        this.player.notify('Snow is falling. Shelter and clothes matter.', 3.5);
      }
      this._lastWeather = this.time.weather;
    }

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
      biome: this._lastBiome,
    });

    const expMult = exposureColdMult({
      weather: this.time.weather,
      roofed: this._roofed,
      wetness: this.survival.wetness || 0,
      isNight: this.time.isNight(),
    });

    const feetId = this.world.getBlock(
      Math.floor(this.player.position.x),
      Math.floor(this.player.position.y - 0.2),
      Math.floor(this.player.position.z),
    );
    const desertHeat = feetId === BLOCK.SAND && this.time.weather === 'clear' && !this.time.isNight();

    // Compute current biome + temperature offset
    const px = Math.floor(this.player.position.x);
    const pz = Math.floor(this.player.position.z);
    const currentBiome = biomeAt(px, pz, this.seed);
    const tempOffset = ambientTempOffset(currentBiome);

    // Notify on biome change
    if (currentBiome !== this._lastBiome) {
      const labels = { shore: 'Shore', forest: 'Forest', desert: 'Desert', tundra: 'Tundra' };
      this.player.notify(`Entered ${labels[currentBiome] || currentBiome}`, 4);
      if (currentBiome === 'desert' || currentBiome === BIOME.DESERT) this._unlock('first_desert');
      this._lastBiome = currentBiome;
    }

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
      coldDamageMult: mode.coldDamageMult * expMult,
      wetnessGain: move.inWater ? 0 : wGain,
      desertHeat,
      ambientTempOffset: tempOffset,
    });

    // bleed DPS
    this.survival = tickBleed(this.survival, dt);

    // meat spoilage
    {
      let spoilMult = 1;
      // ice box nearby slows spoilage (SC cold storage pressure)
      if (this.player && this.world) {
        const px = Math.floor(this.player.position.x);
        const py = Math.floor(this.player.position.y);
        const pz = Math.floor(this.player.position.z);
        outer: for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
              if (this.world.getBlock(px + dx, py + dy, pz + dz) === BLOCK.ICE_BOX) {
                spoilMult = 0.35;
                break outer;
              }
            }
          }
        }
      }
      const sp = tickSpoilage(this.player.slots, dt, undefined, spoilMult);
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
          senseMult: mode.predatorSenseMult * (move.crouching ? 0.55 : 1),
          damageMult: mode.predatorDamageMult,
        },
      );
      if (fa.playerDamage > 0) {
        let dmg = fa.playerDamage;
        const held = propsOf(this.player.heldId());
        if (held?.tool === 'shield') {
          dmg *= 0.35;
          const w = wearTool(this.player.slots, this.player.hotbarIndex, 2);
          this.player.slots = w.slots;
          if (w.broken) this.player.notify('Your shield shattered!');
          else this.player.notify('Shield blocks the bite!');
        } else {
          this.player.notify('A predator mauls you!');
          const bleedAmt = 12 + ((Math.random() * 7) | 0);
          this.survival = applyBleed(this.survival, bleedAmt);
        }
        dmg = mitigatePhysicalDamage(dmg, equipmentArmor(this.player.equipment));
        this.survival = applyDamage(this.survival, dmg, 'wolf');
        this.audio.hurt();
      }
      this.fauna.tickRespawn(dt, {
        x: this.player.position.x,
        z: this.player.position.z,
      });
      this.fauna.applySnares(dt);
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
          // path wear on grass -> dirt
          if (under === BLOCK.GRASS) {
            const fx = Math.floor(this.player.position.x);
            const fz = Math.floor(this.player.position.z);
            const key = `${fx},${fz}`;
            const count = (this._pathWear.get(key) || 0) + 1;
            this._pathWear.set(key, count);
            if (count >= 8) {
              this.world.setBlock(fx, Math.floor(this.player.position.y - 0.2), fz, BLOCK.DIRT);
              this._pathWear.delete(key);
            }
          }
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
      this._tickLogicPower(dt);
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

    // lightning flash during storms
    if (this.time.weather === 'rain' || this.time.weather === 'snow') {
      this._lightningAcc += dt;
      const threshold = 8 + Math.random() * 15;
      if (this._lightningAcc > threshold) {
        this._stormFlashT = 0.2;
        this.audio.thunder?.();
        this._lightningAcc = 0;
      }
    } else {
      this._lightningAcc = Math.max(0, this._lightningAcc - dt * 2);
    }

    // death beacon decay
    if (this._deathBeaconT > 0) {
      this._deathBeaconT -= dt;
      if (this._deathBeaconT <= 0) {
        if (this._deathBeacon) {
          this.scene.remove(this._deathBeacon);
          this._deathBeacon.geometry?.dispose();
          this._deathBeacon.material?.dispose?.();
        }
        this._deathBeacon = null;
      }
    }

    // drink cooldown decay
    this._drinkCd = Math.max(0, this._drinkCd - dt);

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

    // death beacon: thin yellow box at death position
    if (this.player && this.world) {
      const px = Math.floor(this.player.position.x);
      const py = Math.floor(this.player.position.y - 1);
      const pz = Math.floor(this.player.position.z);
      this.player.notify(`You died at ${px}, ${py}, ${pz}.`, 6);
      const beaconGeo = new THREE.BoxGeometry(0.85, 0.12, 0.85);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.85 });
      this._deathBeacon = new THREE.Mesh(beaconGeo, beaconMat);
      this._deathBeacon.position.set(px + 0.5, py + 1, pz + 0.5);
      this.scene.add(this._deathBeacon);
      this._deathBeaconT = 120;
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
      const bname = BLOCK_PROPS[hit.id]?.name || '';
      if (hit.id === BLOCK.BED) text = `F — Sleep (if warm & fed) [${bname}]`;
      else if (hit.id === BLOCK.CAMPFIRE) text = `Hold meat · F cook near heat [${bname}]`;
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
    if (!text && p?.tool === 'rod') text = 'F near water — Fish';
    if (!text && p?.tool === 'shield') text = 'Hold to block wolf bites';
    if (!text && held?.id === ITEM.FERTILIZER) text = 'F on crop — Fertilize';
    if (hit && hit.id === BLOCK.CHEST) {
      const cn = BLOCK_PROPS[hit.id]?.name || '';
      text = `F — Open chest [${cn}]`;
    }

    // animal under crosshair
    const range = p?.meleeRange || 3.6;
    const ah = this.fauna?.rayHit(origin, dir, range);
    if (ah) {
        const spec = SPECIES[ah.animal.type];
        if (ah.animal.tamed) {
            text = `${spec?.name || 'animal'} — tamed (${Math.ceil(ah.animal.hp)} hp)`;
        } else {
            text = `LMB — Attack ${spec?.name || 'animal'} (${Math.ceil(ah.animal.hp)} hp)`;
            // Show feed hint when holding the right item
            if (spec && spec.feedItem) {
                const feedMap = { berries: ITEM.BERRIES, raw_meat: ITEM.RAW_MEAT };
                const needed = feedMap[spec.feedItem];
                if (needed && held?.id === needed) {
                    const feedHint = ah.animal._tame > 0 ? ` (${Math.round(ah.animal._tame)}%)` : '';
                    text += ` · [F] Feed${feedHint}`;
                } else if (needed) {
                    text += ` · [F] Feed`;
                }
            }
        }
        this._outline.visible = false;
    }

    if (prompt) prompt.textContent = this.player.inventoryOpen ? '' : text;
  }

  /**
   * Place/update PointLights near player for torches & campfires.
   */

  /** SC-lite electricity: generators power adjacent wires/lamps */
  _tickLogicPower(dt) {
    this._logicAcc = (this._logicAcc || 0) + dt;
    if (this._logicAcc < 0.25 || !this.world || !this.player) return;
    this._logicAcc = 0;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const R = 14;
    const nodes = new Map();
    const edges = [];
    const key = (x, y, z) => `${x},${y},${z}`;
    for (let z = pz - R; z <= pz + R; z++) {
      for (let y = Math.max(1, py - 6); y <= Math.min(46, py + 6); y++) {
        for (let x = px - R; x <= px + R; x++) {
          const id = this.world.getBlock(x, y, z);
          let type = null;
          if (id === BLOCK.GENERATOR) type = COMPONENT.SOURCE;
          else if (id === BLOCK.WIRE) type = COMPONENT.WIRE;
          else if (id === BLOCK.LAMP) type = COMPONENT.LAMP;
          if (!type) continue;
          const k = key(x, y, z);
          nodes.set(k, { id: k, type });
        }
      }
    }
    const dirs = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    for (const k of nodes.keys()) {
      const [x, y, z] = k.split(',').map(Number);
      for (const [dx, dy, dz] of dirs) {
        const k2 = key(x + dx, y + dy, z + dz);
        if (nodes.has(k2)) edges.push([k, k2]);
      }
    }
    const powered = tickLogic(nodes, edges);
    const next = new Set();
    for (const id of powered) {
      const n = nodes.get(id);
      if (n && n.type === COMPONENT.LAMP) next.add(id);
    }
    let changed = next.size !== this._poweredLamps.size;
    if (!changed) {
      for (const k of next) if (!this._poweredLamps.has(k)) { changed = true; break; }
    }
    this._poweredLamps = next;
    if (next.size) this._unlock('first_power');
    if (changed) this._scanLights(true);
  }

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
          if (id === BLOCK.TORCH || id === BLOCK.CAMPFIRE || id === BLOCK.GENERATOR) {
            found.push({ x, y, z, id });
          } else if (id === BLOCK.LAMP) {
            const k = `${x},${y},${z}`;
            if (this._poweredLamps && this._poweredLamps.has(k)) found.push({ x, y, z, id });
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
        } else if (b.id === BLOCK.LAMP) {
          L.color.setHex(0xffeecc);
          L.intensity = (this.time.isNight() ? 1.3 : 0.65) * flick;
          L.distance = 13;
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
          if (res.egg > 0) this.player.slots = addItems(this.player.slots, ITEM.EGG, res.egg).slots;
          if (res.feather > 0) this.player.slots = addItems(this.player.slots, ITEM.FEATHER, res.feather).slots;
          const bits = [];
          if (res.meat) bits.push(`+${res.meat} meat`);
          if (res.hide) bits.push(`+${res.hide} hide`);
          if (res.egg) bits.push(`+${res.egg} egg`);
          if (res.feather) bits.push(`+${res.feather} feather`);
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
          const r = Math.random();
          if (r < 0.06) drop = ITEM.APPLE;
          else if (r < 0.24) drop = ITEM.STICK;
          else if (r < 0.32) drop = ITEM.SEEDS;
          else drop = null;
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
            if (Math.random() < 0.22) {
              drop = ITEM.PUMPKIN;
              dropCount = 1;
            } else {
              drop = ITEM.WHEAT;
              dropCount = 1 + (Math.random() < 0.5 ? 1 : 0);
            }
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
        {
          const w = wearTool(this.player.slots, this.player.hotbarIndex, 1);
          this.player.slots = w.slots;
          if (w.broken) this.player.notify('Tool broke!');
        }
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
        this.player.notify('Campfire lit. Feed sticks/coal/charcoal (F) or it dies out.');
        this._scanLights(true);
        this._unlock('first_fire');
        this._campFuel.set(`${px|0},${py|0},${pz|0}`, 80);
      }
      if (blockId === BLOCK.DOOR_CLOSED || blockId === BLOCK.DOOR_OPEN) {
        this._unlock('first_door');
      }
      if (blockId === BLOCK.GENERATOR) {
        this.player.notify('Generator placed. Connect with wire to lamps.');
        this._scanLights(true);
      }
      if (blockId === BLOCK.TORCH) {
        this.player.notify('Torch placed.');
        this._scanLights(true);
      }
      if (blockId === BLOCK.LAMP) {
        this.player.notify('Lamp placed. Needs wire to power it.');
        this._scanLights(true);
      }
      if (blockId === BLOCK.BED) this.player.notify('Bed placed. Look at it and press F at night to sleep.');
      if (blockId === BLOCK.CHEST) {
        this.player.notify('Chest placed. Look and press F to open.');
        this._unlock('first_chest');
        const k = chestKey(px, py, pz);
        if (!this._chests.has(k)) this._chests.set(k, emptyChestSlots());
      }
      if (blockId === BLOCK.LADDER) this.player.notify('Ladder placed. Walk into it to climb.');
      if (blockId === BLOCK.SNARE) {
        this.player.notify('Snare set. Wildlife may wander in.');
        this._unlock('first_snare');
      }
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

    // Bandage: stop bleeding + heal
    if (p?.bandage && held.count > 0) {
      const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
      if (!cons.ok) return;
      this.player.slots = cons.slots;
      this.survival = stopBleed(this.survival, 100);
      this.survival = {
        ...this.survival,
        health: Math.min(this.survival.maxHealth, this.survival.health + 8),
      };
      this.audio.eat();
      this.player.notify('Applied bandage. Bleeding stopped. +8 health.', 2.5);
      return;
    }

    if (p?.heal && held.count > 0) {
      const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
      if (!cons.ok) return;
      this.player.slots = cons.slots;
      let bleedStop = p.name === 'Healing Salve' ? 40 : 0;
      if (bleedStop > 0) this.survival = stopBleed(this.survival, bleedStop);
      this.survival = {
        ...this.survival,
        health: Math.min(this.survival.maxHealth, this.survival.health + p.heal),
      };
      this.audio.eat();
      if (bleedStop > 0) {
        this.player.notify(`Applied ${p.name}. Bleeding reduced. +${p.heal} health.`, 2.5);
      } else {
        this.player.notify(`Applied ${p.name}. +${p.heal} health.`, 2.5);
      }
      return;
    }
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

  /** F: cook meat / equip clothes / sleep on bed / chest / fish / fertilize */
  _handleCookUse() {
    if (!this.input.consumeUse()) return;
    const origin = this.player.eyePosition();
    const dir = this.player.lookDir();
    const hit = this.world.raycast(origin, dir, 5);

    // Open chest
    if (hit && hit.id === BLOCK.CHEST) {
      this._openChest(chestKey(hit.x, hit.y, hit.z));
      return;
    }


    // Bucket fill / empty
    const heldB = this.player.heldStack();
    if (heldB.id === ITEM.BUCKET && hit && hit.id === BLOCK.WATER) {
      const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
      if (cons.ok) {
        const add = addItems(cons.slots, ITEM.WATER_BUCKET, 1);
        this.player.slots = add.slots;
        this.audio.splash?.() || this.audio.ui();
        this.player.notify('Filled bucket with water.', 2);
        this._unlock('first_bucket');
        return;
      }
    }
    if (heldB.id === ITEM.WATER_BUCKET && hit) {
      const tx = hit.x + (hit.nx || 0);
      const ty = hit.y + (hit.ny || 0);
      const tz = hit.z + (hit.nz || 0);
      const at = this.world.getBlock(tx, ty, tz);
      if (at === BLOCK.AIR || at === BLOCK.WATER) {
        const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
        if (cons.ok) {
          this.world.setBlock(tx, ty, tz, BLOCK.WATER);
          const add = addItems(cons.slots, ITEM.BUCKET, 1);
          this.player.slots = add.slots;
          this.audio.splash?.() || this.audio.placeBlock();
          this.player.notify('Emptied water bucket.', 2);
          return;
        }
      }
    }

    // Toggle door
    if (hit && (hit.id === BLOCK.DOOR_CLOSED || hit.id === BLOCK.DOOR_OPEN)) {
      const next = hit.id === BLOCK.DOOR_CLOSED ? BLOCK.DOOR_OPEN : BLOCK.DOOR_CLOSED;
      this.world.setBlock(hit.x, hit.y, hit.z, next);
      this.audio.placeBlock();
      this.player.notify(next === BLOCK.DOOR_CLOSED ? 'Door closed.' : 'Door opened.');
      this._scanLights(true);
      return;
    }

    // Drink water
    if (hit && hit.id === BLOCK.WATER && this._drinkCd <= 0) {
      this.survival = {
        ...this.survival,
        stamina: Math.min(this.survival.maxStamina, this.survival.stamina + 25),
        wetness: (this.survival.wetness || 0) + 15,
        hunger: Math.min(this.survival.maxHunger, this.survival.hunger + 3),
      };
      this._drinkCd = 2;
      this.audio.splash?.() || this.audio.eat();
      this.player.notify('Drank water. +25 stamina.', 2);
      return;
    }

    // Feed animal (canFeed/tryFeed) — after held0 defined below
    const ah = this.fauna?.rayHit(origin, dir, 5);
    if (ah && !ah.animal.tamed) {
        const feedSpec = this.fauna.getSpec(ah.animal.type);
        if (feedSpec && feedSpec.feedItem) {
            const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
            if (cons.ok && canFeed(ah.animal, cons.id)) {
                this.player.slots = cons.slots;
                const result = tryFeed(ah.animal, cons.id);
                if (result.fed) {
                    if (result.tamed) this._unlock('first_tame');
                    const msg = result.tamed
                        ? `${feedSpec.name} is now tamed!`
                        : `${feedSpec.name}: ${Math.round(result.tameProgress)}% tamed`;
                    this.audio.eat();
                    this.player.notify(msg, 3);
                    return;
                }
            } else if (cons.ok) {
                // refund — wrong item for this animal
                this.player.slots = addItems(this.player.slots, cons.id, 1).slots;
            }
        }
    }

    // Fertilizer on crop
    const held0 = this.player.heldStack();
    if (hit && hit.id === BLOCK.CROP && held0.id === ITEM.FERTILIZER) {
      const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
      if (!cons.ok) return;
      this.player.slots = cons.slots;
      const key = this._cropKey(hit.x, hit.y, hit.z);
      const g = Math.min(1, (this._crops.get(key) || 0) + 0.45);
      this._crops.set(key, g);
      this.audio.placeBlock();
      this.player.notify(g >= 1 ? 'Crop fully fertilized!' : 'Crop grows faster.', 2);
      return;
    }

    // Fishing
    if (propsOf(held0.id)?.tool === 'rod') {
      this._tryFish();
      return;
    }

    // Sleep on bed
    if (hit && hit.id === BLOCK.BED) {
      this._trySleep();
      return;
    }

    const held = this.player.heldStack();
    const p = propsOf(held.id);

    // Feed campfire fuel
    if (hit && hit.id === BLOCK.CAMPFIRE) {
      const fuelIds = new Set([ITEM.STICK, ITEM.COAL, ITEM.CHARCOAL, BLOCK.LOG]);
      if (held.id != null && fuelIds.has(held.id)) {
        const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
        if (cons.ok) {
          this.player.slots = cons.slots;
          const k = `${hit.x|0},${hit.y|0},${hit.z|0}`;
          let f = this._campFuel.get(k) ?? 40;
          f += held.id === BLOCK.LOG ? 45 : held.id === ITEM.STICK ? 12 : 28;
          this._campFuel.set(k, Math.min(120, f));
          this.audio.placeBlock();
          this.player.notify('You feed the fire.', 1.8);
          this._scanLights(true);
          return;
        }
      }
    }

    // Feed furnace fuel (same as campfire)
    if (hit && hit.id === BLOCK.FURNACE) {
      const fuelIds = new Set([ITEM.STICK, ITEM.COAL, ITEM.CHARCOAL, BLOCK.LOG]);
      if (held.id != null && fuelIds.has(held.id)) {
        const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
        if (cons.ok) {
          this.player.slots = cons.slots;
          const k = `${hit.x|0},${hit.y|0},${hit.z|0}`;
          let f = this._campFuel.get(k) ?? 40;
          f += held.id === BLOCK.LOG ? 50 : held.id === ITEM.STICK ? 14 : 32;
          this._campFuel.set(k, Math.min(150, f));
          this.audio.placeBlock();
          this.player.notify('You fed the furnace.', 1.8);
          return;
        }
      }
    }

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
      if (held.id === ITEM.LEATHER_VEST) this._unlock('first_armor');
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
    const roofed = hasRoofAbove(
      (x, y, z) => this.world.getBlock(x, y, z),
      this.player.position.x,
      this.player.position.y,
      this.player.position.z,
      isSolid,
      isTransparent,
    );
    const check = canSleep(this.survival, {
      atBed: true,
      inWater: this.world.getBlock(
        this.player.position.x,
        this.player.position.y,
        this.player.position.z,
      ) === BLOCK.WATER,
      isNight: this.time.isNight(),
      stormNoRoof:
        (this.time.weather === 'rain' || this.time.weather === 'snow') && !roofed,
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
                : check.error === 'storm — need a roof over the bed'
                  ? 'Storm overhead — build a roof over the bed first.'
                : `Cannot sleep: ${check.error}`,
        3.5,
      );
      return;
    }

    // Skip ~8 hours of game time
    const dayLen = this.time.dayLengthSec || 420;
    const skip = dayLen * (this.time.isNight() ? 0.42 : 0.28);

    // sleep fade overlay
    const fadeEl = document.getElementById('sleep-fade');
    if (fadeEl) {
      fadeEl.style.opacity = '0.85';
      this._sleepFadeT = 1;
    }

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
          const dr = durabilityRatio(s);
          el.title = `${displayName(s.id)} x${s.count}` + (dr < 1 ? ` · ${Math.ceil(dr*100)}%` : '');
          el.innerHTML = `<span class="inv-count">${s.count}</span><span class="inv-name">${displayName(s.id)}</span>` +
            (dr < 1 ? `<span class="dur-bar" style="width:${Math.ceil(dr*100)}%"></span>` : '');
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
      const filter = (this._recipeFilter || '').toLowerCase().trim();
      for (const r of visibleRecipes()) {
        if (filter && !(`${r.name} ${r.desc || ''} ${r.id}`.toLowerCase().includes(filter))) continue;
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
    // storm lightning flash boost
    if (this._stormFlashT > 0) {
      this.ambient.intensity += this._stormFlashT * 8;
      this.scene.background.setHex(0xccddff);
      this._stormFlashT -= 1 / 60;
    }
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
      const held = this.player ? propsOf(this.player.heldId()) : null;
      // held torch slight night vision
      if (held && this.player.heldId() === BLOCK.TORCH) {
        this.ambient.intensity = Math.max(this.ambient.intensity, 0.28);
        this.sun.intensity = 0.16;
      }
    } else {
      this.ambient.color.set(0x6688aa);
    }
    // Drive greedy shader lighting
    const mat = this.atlas?.greedyMaterial;
    if (mat?.uniforms) {
      mat.uniforms.sunIntensity.value = this.time.isNight()
        ? 0.32
        : 0.55 + sunI * 0.7;
      mat.uniforms.ambientColor.value.set(
        this.time.isNight() ? 0.18 : 0.35,
        this.time.isNight() ? 0.2 : 0.4,
        this.time.isNight() ? 0.28 : 0.5,
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
    setBar('bar-bleed', s.bleed || 0, 100);

    const tempLabel = document.getElementById('temp-label');
    if (tempLabel) tempLabel.textContent = `${s.bodyTemp.toFixed(1)}°C`;

    // critical pulses
    const meters = document.getElementById('meters');
    if (meters) {
      meters.classList.toggle('crit-health', s.health < 28);
      meters.classList.toggle('crit-hunger', s.hunger < 18);
      meters.classList.toggle('crit-cold', s.bodyTemp < 34.2);
      meters.classList.toggle('crit-bleed', (s.bleed || 0) > 20);
    }
    const bleedTag = document.getElementById('bleed-tag');
    if (bleedTag) bleedTag.classList.toggle('on', (s.bleed || 0) > 1);

    const status = document.getElementById('status-line');
    if (status && this.player) {
      const bits = [];
      bits.push(this.modeDef().name);
      bits.push(`Seed ${this.seed}`);
      bits.push(this._compassHeading());
      try {
        const b = biomeAt(this.player.position.x, this.player.position.z, this.seed);
        if (b) bits.push(String(b));
      } catch (_) {}
      if (this.player.heldId() === ITEM.COMPASS || this.player.heldId() === ITEM.MAP) {
        bits.push(`xyz ${this.player.position.x.toFixed(0)},${this.player.position.y.toFixed(0)},${this.player.position.z.toFixed(0)}`);
        if (this.player.heldId() === ITEM.MAP) bits.push(`chunk ${Math.floor(this.player.position.x/16)},${Math.floor(this.player.position.z/16)}`);
      }
      if (this._roofed) bits.push('Sheltered');
      const arm = equipmentArmor(this.player.equipment);
      if (arm > 0) bits.push(`Armor ${arm}`);
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
        const dr = durabilityRatio(stack);
        el.title = `${displayName(stack.id)} x${stack.count}` + (dr < 1 ? ` · ${Math.ceil(dr*100)}%` : '');
        el.dataset.block = displayName(stack.id);
        el.style.setProperty('--dur', String(dr));
        el.classList.toggle('damaged', dr < 0.35);
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
