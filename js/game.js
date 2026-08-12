import * as THREE from 'three';
import { World } from './world.js?v=410';
import { Player } from './player.js?v=238';
import { Input } from './input.js?v=411';
import { GameTime } from './time.js?v=221';
import { AudioBus } from './audio.js?v=220';
import {
  DEFAULT_SURVIVAL,
  tickSurvival,
  eatFood,
  drinkWater,
  applyDamage,
} from './survival.js?v=243';
import { BLOCK, getHardness, isSolid, isTransparent, getColor, BLOCK_PROPS } from './blocks.js?v=287';
import {
  ITEM,
  propsOf,
  displayName,
  isPlaceable,
  placeBlockId,
  mineMultiplier,
  dropForBlock,
} from './items.js?v=244';
import { resolveBlockDrop } from './mine-tier.js?v=220';
import {
  createFurnaceState,
  insertFuel,
  insertInput,
  tickFurnace,
  takeOutput,
} from './furnace-tick.js?v=232';
import { isFuel, canSmelt } from './smelting.js?v=220';
import { slabHalfFromPitch, slabHalfMeta } from './slab-place.js?v=220';
import { stairFacingFromYaw, stairFacingMeta } from './stair-place.js?v=220';
import { advanceCropGrowth } from './crop-growth.js?v=220';
import { toggleDoor } from './door-hinge.js?v=220';
import { bedFacingFromYaw, bedFacingMeta } from './bed-facing.js?v=220';
import { horizDistance, compassNeedleAngle } from './compass-bearing.js?v=220';
import { maceSmashDamage } from './mace-smash.js?v=220';
import { raycastVoxel } from './interaction-contract.js?v=2';
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
} from './inventory.js?v=220';
import { visibleRecipes, craftRecipe, RECIPE_CATEGORIES, RECIPE_TIERS } from './crafting.js?v=409';
import { FaunaSystem, SPECIES, canFeed, tryFeed } from './animals.js?v=245';
import { animalPartLayout, animalLimbPose } from './animal-visuals.js?v=244';
import { createBlockAtlas } from './atlas.js?v=296';
import { BreakFX, WeatherFX } from './fx.js?v=245';
import { underwaterFogStyle } from './underwater-fog.js?v=244';
import { terrainVisibilityPlan, fogForSun } from './terrain-visibility.js?v=285';
import { VoxelCloudLayer, SunDisc, StarField } from './sky-clouds.js?v=10';
import {
  equipmentWarmth,
  equipmentArmor,
  mitigatePhysicalDamage,
  equipItem,
  emptyEquipment,
  canSleep,
  applySleepRest,
  EQUIP_SLOTS,
} from './equipment.js?v=220';
import { hasRoofAbove, wetnessGainRate, exposureColdMult } from './exposure.js?v=220';
import {
  serializeSave,
  writeSaveToStorage,
  readSaveFromStorage,
  clearSaveStorage,
} from './save.js?v=220';
import { getMode } from './modes.js?v=243';
import {
  readSettings,
  writeSettings,
  sensitivityFromSlider,
  sliderFromSensitivity,
  DEFAULT_SETTINGS,
} from './settings.js?v=220';
import {
  emptyAchievements,
  unlockAchievement,
  popAchievementToast,
  achievementTitle,
  achievementDesc,
} from './achievements.js?v=220';
import { tickSpoilage } from './spoilage.js?v=220';
import { spawnArrow, stepProjectile, hitAnimal } from './projectiles.js?v=220';
import { wearTool, durabilityRatio } from './durability.js?v=220';
import { applyBleed, tickBleed, stopBleed, isBleeding } from './bleed.js?v=220';
import { tickLogic, COMPONENT } from './logic.js?v=220';
import { biomeAt, BIOME, ambientTempOffset } from './biomes.js?v=245';
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
} from './chests.js?v=220';
import { checkTooltip, show as showTooltip } from './tooltips.js?v=220';
import { splitViewport } from './viewport-split.js?v=220';
import { readGamepad } from './input-coop.js?v=261';
import { PadInputAdapter, getConnectedPad } from './pad-input.js?v=220';
import { wouldPartnerNearForSleep, effectiveCoopRenderDistance, isBothPlayersDown } from './coop-proximity.js?v=220';
import { palmLeafDrop } from './palm-drops.js?v=1';

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
    /** Local split-screen: when true, dual viewports/input path is active (MVP wires flag first). */
    this.coopMode = this.settings.playMode === 'coop';
    /** Which player owns open inventory UI: p1 | p2 */
    this._invOwner = 'p1';
    this.seed = (Math.random() * 1e6) | 0;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x87b5ff, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Keep the starter island readable: ACES rolls back the sunlit sand
    // highlights while a small exposure lift preserves dark tree silhouettes.
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;

    this.scene = new THREE.Scene();
    this.skyDome = new THREE.Mesh(
      // Keep the dome inside camera.far so the layered shader actually renders.
      new THREE.SphereGeometry(180, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          topColor: { value: new THREE.Color(0x2966b0) },
          midColor: { value: new THREE.Color(0x72bce8) },
          horizonColor: { value: new THREE.Color(0xffca92) },
          groundColor: { value: new THREE.Color(0x657681) },
          sunGlowColor: { value: new THREE.Color(0xffd7a2) },
          sunGlowStrength: { value: 0.22 },
          sunDir: { value: new THREE.Vector3(0.4, 0.8, 0.4).normalize() },
        },
        vertexShader: 'varying vec3 vLocal; void main(){ vLocal=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 topColor; uniform vec3 midColor; uniform vec3 horizonColor; uniform vec3 groundColor; uniform vec3 sunGlowColor; uniform float sunGlowStrength; uniform vec3 sunDir; varying vec3 vLocal; void main(){ vec3 dir=normalize(vLocal); float h=dir.y; float above=smoothstep(-0.08,0.38,h); vec3 sky=mix(horizonColor,midColor,above); sky=mix(sky,topColor,smoothstep(0.30,0.92,h)); float horizHaze=pow(max(0.0,1.0-abs(h)*3.2),2.0)*0.30; sky=mix(sky,horizonColor,clamp(horizHaze,0.0,1.0)); float sd=dot(dir,sunDir); float halo=pow(max(0.0,sd),4.0)*sunGlowStrength*3.8; float corona=pow(max(0.0,sd),28.0)*sunGlowStrength*4.8; sky=mix(sky,sunGlowColor,clamp(halo,0.0,0.84)); sky+=sunGlowColor*corona; sky=mix(groundColor,sky,smoothstep(-0.38,0.02,h)); gl_FragColor=vec4(sky,1.0); }',
      }),
    );
    this.skyDome.renderOrder = -100;
    this.scene.add(this.skyDome);
    this.scene.background = new THREE.Color(0x87b5ff);
    this.scene.fog = new THREE.Fog(0x87b5ff, 40, 120);
    // Reused palette colors keep the per-frame sky transition allocation-free.
    this._skyPalette = {
      top: new THREE.Color(),
      mid: new THREE.Color(),
      horizon: new THREE.Color(),
      ground: new THREE.Color(),
      glow: new THREE.Color(),
      fog: new THREE.Color(),
      warm: new THREE.Color(),
      weather: new THREE.Color(),
      nightTop: new THREE.Color(0x10264f),
      nightMid: new THREE.Color(0x294d78),
      nightHorizon: new THREE.Color(0x40506f),
      nightGround: new THREE.Color(0x263142),
      flash: new THREE.Color(0xd8e8ff),
    };

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 200);
    /** P2 camera for local split-screen (active when coopMode). */
    this.camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 200);
    this._p2Yaw = 0;
    this._p2Pitch = 0;
    this._p2Offset = new THREE.Vector3(1.6, 0, 0);
    this._tmpRight = new THREE.Vector3();
    this._tmpFwd = new THREE.Vector3();

    // Apply render distance from settings
    this._applyRenderDistance();

    this.ambient = new THREE.AmbientLight(0x7895b4, 0.58);
    this.sun = new THREE.DirectionalLight(0xffe4bd, 1.0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 180;
    this.sun.shadow.camera.left = -72;
    this.sun.shadow.camera.right = 72;
    this.sun.shadow.camera.top = 72;
    this.sun.shadow.camera.bottom = -72;
    this.sun.position.set(32, 72, 24);
    // A restrained cool fill keeps the sun-facing contact edges legible without
    // flattening the warm key light or making shadowed terrain read as black.
    this.fill = new THREE.DirectionalLight(0x9fc8df, 0.22);
    this.fill.position.set(-28, 24, -20);
    this.scene.add(this.ambient, this.sun, this.fill);

    this.hemi = new THREE.HemisphereLight(0xa9d4ff, 0x4d3825, 0.58);
    this.scene.add(this.hemi);

    this.clouds = new VoxelCloudLayer(this.scene);
    this.sunDisc = new SunDisc(this.scene);
    this.starField = new StarField(this.scene);

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
    // Outer streaming ring; overwritten by _applyRenderDistance via visibility plan.
    this.worldRadius = this._visPlan?.proxyChunks || 5;

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
    this._cameraInWater = false;
    this.weatherFx = null;
    this._bowCd = 0;
    this._chests = new Map();
    this._chestOpenKey = null;
    this._recipeFilter = '';
    this._fishCd = 0;
    this._campFuel = new Map(); // "x,y,z" -> fuel 0..100
    this._furnaces = new Map(); // "x,y,z" -> furnace-tick state
    /** Slab half meta "x,y,z" -> 0 bottom / 1 top (additive until mesh uses it). */
    this._slabHalf = new Map();
    /** Stair facing meta "x,y,z" -> 0..3 (additive until mesh uses it). */
    this._stairFace = new Map();
    /** Bed facing meta "x,y,z" -> 0..3 */
    this._bedFace = new Map();
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
    this._spawnProtectT = 0;
    this._spawnPos = null; // {x, y, z} — tracked for starter_map_marker
    this._poweredLamps = new Set();
    this._logicAcc = 0;
    this._biomeNotifyAcc = 0; // accumulator for periodic biome name display
    this._tooltipQueue = []; // pending tooltip ids to show
    this._tooltipShownAcc = 0; // cooldown between tooltips (min 8s)
    this._firstLogSeen = false;
    this._firstFireSeen = false;
    this._firstCookSeen = false;
    this._firstNightSeen = false;
    this._firstKillSeen = false;
    this._firstClothesSeen = false;
    this._firstSleepSeen = false;
    this._firstFarmSeen = false;
    this._firstDoorSeen = false;
    this._firstPowerSeen = false;
    this._firstChestSeen = false;
    this._firstSnareSeen = false;
    this._firstTameSeen = false;
    this._firstBowSeen = false;
    this._firstIronSeen = false;
    this._firstDesertSeen = false;
    this._firstBucketSeen = false;

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
    closeBtn?.addEventListener('click', () => this.setInventoryOpen(false, this._invOwner || 'p1'));
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
        const pl = this._bagPlayer?.() || this.player;
        const idx = Number(slotEl.getAttribute('data-slot'));
        if (e.shiftKey && idx >= 0 && idx < pl.slots.length) {
          const res = splitStack(pl.slots, idx);
          if (!res.ok) {
            pl.notify(res.error === "no space" ? "No inventory space to split." : "Cannot split.");
            return;
          }
          pl.slots = res.slots;
          this._invNeedsPaint = true;
          this._paintInventory();
          this.audio.ui();
          return;
        }
        if (idx >= 0 && idx < HOTBAR_SIZE) {
          pl.hotbarIndex = idx;
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
    const rd = document.getElementById('rd-slider');
    if (rd) {
      rd.value = String(this.settings.renderDistance ?? 5);
      rd.addEventListener('input', () => {
        const v = Number(rd.value);
        this.settings.renderDistance = v;
        writeSettings(this.settings);
        const lab = document.getElementById('rd-label');
        if (lab) lab.textContent = String(rd.value);
        this._applyRenderDistance();
      });
    }
  }

  _applyRenderDistance() {
    // See docs/roadmap/coop-perf-budget.md — dual pass needs lower effective RD
    let rd = this.settings.renderDistance ?? 5;
    if (this.coopMode) rd = effectiveCoopRenderDistance(rd);
    const plan = terrainVisibilityPlan(rd);
    this._visPlan = plan;
    if (this.scene.fog) {
      this.scene.fog.near = plan.fogNear;
      this.scene.fog.far = plan.fogFar;
    }
    // Camera far plane must clear the proxy ring + a little sky.
    if (this.camera) {
      this.camera.far = Math.max(plan.cameraFar, 200);
      this.camera.updateProjectionMatrix();
    }
    if (this.camera2) {
      this.camera2.far = Math.max(plan.cameraFar, 200);
      this.camera2.updateProjectionMatrix();
    }
    // worldRadius is the outer (proxy) streaming ring in chunks.
    this.worldRadius = plan.proxyChunks;
    if (this.world) {
      if (this.world._requestChunks) {
        this.world._requestChunks();
      }
    }
  }

  /** Latest terrain visibility plan (streaming + fog). */
  _terrainVisibilityPlan() {
    let rd = this.settings.renderDistance ?? DEFAULT_SETTINGS.renderDistance ?? 8;
    if (this.coopMode) rd = effectiveCoopRenderDistance(rd);
    return this._visPlan || terrainVisibilityPlan(rd);
  }

  _applyCoopPerfBudget() {
    if (!this.renderer) return;
    const dpr = window.devicePixelRatio || 1;
    if (this.coopMode) {
      this.renderer.setPixelRatio(Math.min(dpr, 1.5));
    } else {
      this.renderer.setPixelRatio(Math.min(dpr, 2));
    }
    this._applyRenderDistance();
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
      this.setInventoryOpen(false, 'p1');
      if (this.player2?.inventoryOpen) this.setInventoryOpen(false, 'p2');
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
    this.coopMode = this.settings.playMode === 'coop';
    this.input.controllerOnly = this.coopMode;
    if (this.coopMode) {
      this._p2Yaw = this.input?.lookX || 0;
      this._p2Pitch = this.input?.lookY || 0;
    }
    this._applyCoopHudMode();
    this._applyCoopPerfBudget();
    this._bootWorld({
      seed,
      freshPlayer: true,
      notify: this.coopMode
        ? 'Local Co-op: two DualSense controllers · P1 left / P2 right.'
        : 'Hunt wildlife · craft a spear · cook at campfires · watch wolves. E craft · F use · K save · Esc pause',
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
      // Bootstrap/full-detail radius — outer proxy ring streams in over frames.
      radiusChunks: this._terrainVisibilityPlan().fullChunks || this.worldRadius || 5,
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
      this._spawnPos = { x: spawn.x, y: spawn.y, z: spawn.z };
      this.player = new Player(spawn, { starterRations: this.modeDef().starterRations });
      // Fresh spawns face the island interior so the first playable frame
      // presents terrain and forest rather than an empty water horizon.
      this.player.yaw = Math.PI;
      this.input.lookX = this.player.yaw;
      this.survival = { ...DEFAULT_SURVIVAL };
      this.time = new GameTime({ dayLengthSec: 420 });
      this._stats = { kills: 0, wolfKills: 0, arrowsFired: 0 };
      this._achievements = emptyAchievements();
      this._crops = new Map();
      this._spawnCoopP2(spawn);
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
      if (saveData.playMode === 'coop') {
        this.coopMode = true;
        this.settings.playMode = 'coop';
      }
      if (saveData.player2 && typeof saveData.player2.x === 'number') {
        this.player2 = new Player({
          x: saveData.player2.x,
          y: saveData.player2.y,
          z: saveData.player2.z,
        });
        this.player2.yaw = saveData.player2.yaw || 0;
        this.player2.pitch = saveData.player2.pitch || 0;
        this.player2.hotbarIndex = saveData.player2.hotbarIndex || 0;
        this.player2.slots = cloneSlots(saveData.player2.slots || []);
        this.player2.equipment = saveData.player2.equipment
          ? { ...emptyEquipment(), ...saveData.player2.equipment }
          : emptyEquipment();
        this.input2 = new PadInputAdapter();
        this.input2.lookX = this.player2.yaw;
        this.input2.lookY = this.player2.pitch;
        this.survival2 = {
          ...DEFAULT_SURVIVAL,
          ...(saveData.survival2 || {}),
          dead: false,
          causeOfDeath: null,
        };
      }

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
      // restore starter spawn pin (fallback to world spawn for older saves)
      if (saveData.spawnPos && Number.isFinite(saveData.spawnPos.x)) {
        this._spawnPos = {
          x: saveData.spawnPos.x,
          y: saveData.spawnPos.y,
          z: saveData.spawnPos.z,
        };
      } else {
        const spawn = this.world.findSpawn();
        this._spawnPos = { x: spawn.x, y: spawn.y, z: spawn.z };
      }
    }

    if (this.coopMode && !this.player2 && this.player) {
      this._spawnCoopP2({
        x: this.player.position.x,
        y: this.player.position.y,
        z: this.player.position.z,
      });
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
    this._spawnProtectT = 1800; // 30 min early-game grace (food/cold/sleep)
    this._graceEndedNotified = false;
    this.canvas?.focus?.();
    this.input.requestLock?.();
    this._updateClickToPlay?.();
    this._applyHelpVisibility();
    this._helpFadeAcc = 0;
    if (notify) {
      this.player.notify(notify, 7);
      this.player.notify('Click game if look fails · WASD move · Esc pause', 5);
      this.player.notify('Early days are forgiving — gather food, wood, and shelter.', 8);
    } else if (freshPlayer) {
      this.player.notify(`${this.modeDef().name} mode. ${this.modeDef().hostilePolicy === 'off' ? 'Peaceful wildlife.' : this.modeDef().hostilePolicy === 'provoke' ? 'Predators only fight if provoked.' : 'Stay cautious near predators at night.'} Drink at water (F).`, 8);
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
    this._updateWaterVisuals();
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

    // Wire achievement unlocks to tooltip flags
    switch (id) {
      case 'first_log': this._firstLogSeen = true; break;
      case 'first_fire': this._firstFireSeen = true; break;
      case 'first_cook': this._firstCookSeen = true; break;
      case 'first_night': this._firstNightSeen = true; break;
      case 'first_kill': this._firstKillSeen = true; break;
      case 'first_clothes': this._firstClothesSeen = true; break;
      case 'first_sleep': this._firstSleepSeen = true; break;
      case 'first_farm': this._firstFarmSeen = true; break;
      case 'first_door': this._firstDoorSeen = true; break;
      case 'first_power': this._firstPowerSeen = true; break;
      case 'first_chest': this._firstChestSeen = true; break;
      case 'first_snare': this._firstSnareSeen = true; break;
      case 'first_tame': this._firstTameSeen = true; break;
      case 'first_bow': this._firstBowSeen = true; break;
      case 'first_iron': this._firstIronSeen = true; break;
      case 'first_desert': this._firstDesertSeen = true; break;
      case 'first_bucket': this._firstBucketSeen = true; break;
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
    if (this.weatherFx) return;
    this.weatherFx = new WeatherFX(this.scene);
  }

  _tickWeatherFX(dt) {
    this._ensureRain();
    const active = this.started && !this.survival.dead;
    const pos = this.player ? this.player.position : null;
    this.weatherFx.tick(dt, this.time.weather, pos, active);
  }

  _tickCrops(dt) {
    if (!this._crops.size) return;
    const grow = [];
    for (const [key, g] of this._crops) {
      const ng = advanceCropGrowth(g, dt);
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

  /** Advance furnace-tick SM for nearby furnaces (additive; does not remove campfire heat). */
  _tickFurnaces(dt) {
    if (!this._furnaces || this._furnaces.size === 0) return;
    const step = Math.max(0, Number(dt) || 0) * 12; // ~12 cook units / second
    for (const [, st] of this._furnaces) {
      const mult = st.speedMult != null ? st.speedMult : 1;
      tickFurnace(st, step, mult);
    }
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
      // coop teammate: absorb arrow if friendly fire off
      if (this.coopMode && !this._friendlyFireOn() && this.player2) {
        const who = proj.ownerId === 'p2' ? 'p2' : 'p1';
        const other = who === 'p1' ? this.player2 : this.player;
        if (other) {
          const cx = other.position.x;
          const cy = other.position.y + 0.9;
          const cz = other.position.z;
          const dx = proj.x - cx, dy = proj.y - cy, dz = proj.z - cz;
          if (dx * dx + dy * dy + dz * dz < 0.7 * 0.7) {
            this.scene.remove(mesh);
            continue;
          }
        }
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

  _tryShootBow(who = 'p1') {
    who = who === 'p2' ? 'p2' : 'p1';
    const cdKey = who === 'p2' ? '_bowCd2' : '_bowCd';
    if ((this[cdKey] || 0) > 0) return false;
    const pl = who === 'p2' ? this.player2 : this.player;
    if (!pl) return false;
    const held = propsOf(pl.heldId());
    if (held?.tool !== 'bow') return false;
    if (countItems(pl.slots, ITEM.ARROW) <= 0) {
      pl.notify('No arrows. Craft sticks + cobble.');
      return true;
    }
    const rem = removeItems(pl.slots, ITEM.ARROW, 1);
    if (!rem.ok) return true;
    pl.slots = rem.slots;
    const origin = pl.eyePosition();
    const dir = pl.lookDir();
    origin.x += dir.x * 0.6;
    origin.y += dir.y * 0.6;
    origin.z += dir.z * 0.6;
    this._projectiles.push(spawnArrow(origin, dir, { damage: 15, speed: 32, ownerId: who }));
    this[cdKey] = 0.55;
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
      import('./save.js?v=220').then(({ parseSavePayload, writeSaveToStorage }) => {
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
    const packLive = (pl) =>
      pl
        ? {
            x: pl.position.x,
            y: pl.position.y,
            z: pl.position.z,
            yaw: pl.yaw,
            pitch: pl.pitch,
            hotbarIndex: pl.hotbarIndex,
            slots: pl.slots,
            equipment: pl.equipment || emptyEquipment(),
          }
        : null;
    return {
      seed: this.seed,
      mode: this.mode,
      playMode: this.coopMode ? 'coop' : 'solo',
      survival: this.survival,
      survival2: this.survival2 || null,
      spawnPos: this._spawnPos ? { ...this._spawnPos } : null,
      time: {
        elapsed: this.time.elapsed,
        weather: this.time.weather,
        weatherTimer: this.time.weatherTimer,
        dayLengthSec: this.time.dayLengthSec,
      },
      player: packLive(this.player),
      player2: packLive(this.player2),
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
    this.coopMode = this.settings.playMode === 'coop';
    this.start(this.seed);
    this.hud.refreshContinue?.();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    if (this.coopMode && this.camera2) {
      const [a, b] = splitViewport(w, h, 'lr');
      this.camera.aspect = Math.max(0.1, a.w / Math.max(1, a.h));
      this.camera.updateProjectionMatrix();
      this.camera2.aspect = Math.max(0.1, b.w / Math.max(1, b.h));
      this.camera2.updateProjectionMatrix();
    } else {
      this.camera.aspect = w / Math.max(1, h);
      this.camera.updateProjectionMatrix();
    }
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
    if (this.started && this._ignorePauseT <= 0) {
      const p1Pause = this.input.consumePause();
      const p2Pause = this.coopMode && this.input2?.consumePause?.();
      if (p1Pause || p2Pause) {
        if (this.player?.inventoryOpen) this.setInventoryOpen(false, 'p1');
        else if (this.player2?.inventoryOpen) this.setInventoryOpen(false, 'p2');
        else if (!this.survival.dead) this.setPaused(!this.paused);
      }
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
    // Poll gamepad every frame (DualSense, Xbox, generic)
    this.input.pollGamepad?.();
    if (!this.paused && this.started) this.update(dt);
    // ALWAYS paint the canvas — update() does not render. Missing this freezes the world
    // while DOM HUD (key debug) still updates — looks exactly like "WASD broken".
    this.render();
  };

  _applyHelpVisibility() {
    const help = document.getElementById('help');
    if (!help) return;
    help.classList.toggle('hidden', !this._helpVisible);
    help.classList.toggle('faded', false);
  }


  /** Active bag for inventory UI (P1 or P2). */

  _friendlyFireOn() {
    return this.settings?.friendlyFire === true;
  }

  /** Sphere hit-test other coop player. Returns 'p1'|'p2'|null */
  _rayHitTeammate(origin, dir, maxDist = 3.5, fromId = 'p1') {
    if (!this.coopMode || this._friendlyFireOn()) return null;
    const targets = [];
    if (fromId !== 'p1' && this.player) {
      targets.push({ id: 'p1', p: this.player });
    }
    if (fromId !== 'p2' && this.player2) {
      targets.push({ id: 'p2', p: this.player2 });
    }
    let best = null;
    let bestD = maxDist;
    const o = origin;
    const d = dir.clone ? dir.clone().normalize() : dir;
    const dx = d.x, dy = d.y, dz = d.z;
    for (const t of targets) {
      const eye = t.p.eyePosition();
      // body center approx
      const cx = t.p.position.x;
      const cy = t.p.position.y + 0.9;
      const cz = t.p.position.z;
      const vx = cx - o.x, vy = cy - o.y, vz = cz - o.z;
      const tAlong = vx * dx + vy * dy + vz * dz;
      if (tAlong < 0 || tAlong > bestD) continue;
      const px = o.x + dx * tAlong - cx;
      const py = o.y + dy * tAlong - cy;
      const pz = o.z + dz * tAlong - cz;
      const rad = 0.55;
      if (px * px + py * py + pz * pz <= rad * rad) {
        bestD = tAlong;
        best = t.id;
      }
    }
    return best;
  }

  _updateCoopPadPrompt() {
    const el = document.getElementById('coop-pad-prompt');
    if (!el) return;
    if (!this.coopMode || !this.started) {
      el.classList.remove('show');
      return;
    }
    // Need a dedicated P2 pad: if P1 owns a pad, require second; else require any pad for P2
    let p2Pad = null;
    try {
      p2Pad = getConnectedPad(this.input?._gpConnected ? 1 : 0);
    } catch (_) {}
    // Update prompt text with assignment status when assignments change or P2 is missing
    if (this._coopRouter) {
      const status = this._coopRouter.getPadStatus();
      el.textContent = status;
    } else if (p2Pad) {
      el.textContent = 'P2 pad connected';
    }
    el.classList.toggle('show', !p2Pad);
  }

  _bagPlayer() {
    if (this._invOwner === 'p2' && this.player2) return this.player2;
    return this.player;
  }

  _bagSurvival() {
    if (this._invOwner === 'p2' && this.survival2) return this.survival2;
    return this.survival;
  }

  setInventoryOpen(open, who = 'p1') {
    who = who === 'p2' ? 'p2' : 'p1';
    if (who === 'p1' && !this.player) return;
    if (who === 'p2' && !this.player2) return;

    if (open) {
      this.setPaused(false);
      this._closeChest();
      if (this.player) this.player.inventoryOpen = who === 'p1';
      if (this.player2) this.player2.inventoryOpen = who === 'p2';
      this._invOwner = who;
    } else {
      if (who === 'p1' && this.player) this.player.inventoryOpen = false;
      if (who === 'p2' && this.player2) this.player2.inventoryOpen = false;
      if (this._invOwner === who) this._invOwner = 'p1';
    }

    const anyOpen = !!(this.player?.inventoryOpen || this.player2?.inventoryOpen);
    const p1Owns = !!this.player?.inventoryOpen;

    // Pointer lock / uiMode only when P1 bag is open — P2 pad inv must not steal P1 look
    if (p1Owns) {
      this.input.uiMode = true;
      this.input.setCaptureEnabled?.(false);
      if (document.pointerLockElement) document.exitPointerLock();
      this.input.breakHeld = false;
    } else if (!this.paused) {
      this.input.uiMode = false;
      this.input.setCaptureEnabled?.(!!this.started);
    }

    const panel = document.getElementById('inventory-screen');
    const title = panel?.querySelector('h2');
    if (anyOpen) {
      panel?.classList.remove('hidden');
      if (title) title.textContent = this._invOwner === 'p2' ? 'P2 Pack and Craft' : 'Pack and Craft';
      this._invNeedsPaint = true;
      this._paintInventory();
      this.audio.ui();
    } else {
      panel?.classList.add('hidden');
      if (title) title.textContent = 'Pack and Craft';
      if (this.started && !this.survival?.dead && !this.paused) this.saveGame({ quiet: true });
      if (this.started && !this.paused) {
        this.input.setCaptureEnabled?.(true);
        this.canvas?.focus?.();
        // Re-lock pointer for P1 only (P2 never needs pointer lock)
        this.input.requestLock?.();
      }
    }
    this._updateClickToPlay?.();
  }

  _tryCraft(recipeId) {
    const bag = this._bagPlayer?.() || this.player;
    if (!bag) return;
    const res = craftRecipe(bag.slots, recipeId, { heat: this._lastHeat || 0 });
    if (!res.ok) {
      if (res.error === 'need campfire heat') {
        bag.notify('Stand near a campfire to cook.');
      } else {
        bag.notify(res.error === 'inventory full' ? 'Inventory full.' : 'Missing ingredients.');
      }
      this.audio.hurt();
      return;
    }
    bag.slots = res.slots;
    this.audio.placeBlock();
    bag.notify(`Crafted: ${recipeId.replace(/_/g, ' ')}`);
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
      else this.setInventoryOpen(!this.player.inventoryOpen, 'p1');
    }
    if (this.coopMode && this.input2?.consumeInventory?.()) {
      this.setInventoryOpen(!this.player2?.inventoryOpen, 'p2');
    }
    if (this.input.consumeQuickSave()) {
      this.saveGame();
    }

    // survival keeps ticking even in inventory (you're still cold/hungry)
    this.time.tick(dt);
    this._crossHitT = Math.max(0, this._crossHitT - dt);
    this._bowCd = Math.max(0, this._bowCd - dt);
    this._bowCd2 = Math.max(0, (this._bowCd2 || 0) - dt);
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
      // Keep collision data available for the chunk the player is entering;
      // the surrounding visual ring is streamed incrementally below.
      if (this.world && this.player) {
        const c = this.world.worldToChunk(this.player.position.x, this.player.position.z);
        this.world.ensureChunk(c.cx, c.cz);
        if (this.coopMode && this.player2) {
          const c2 = this.world.worldToChunk(this.player2.position.x, this.player2.position.z);
          this.world.ensureChunk(c2.cx, c2.cz);
        }
      }
      move = this.player.update(this.world, this.input, this.survival, dt);
      if (this.coopMode && this.player2 && this.input2) {
        // P2 uses pad1 when P1 holds pad0; else pad0 if P1 is KBM-only
        const p2PadIndex = this.input?._gpConnected ? 1 : 0;
        const gp2 = getConnectedPad(p2PadIndex);
        this.input2.poll(gp2, dt, {
          deadzone: this.input?.deadzone ?? 0.15,
          sensitivity: this.input?.gpSensitivity ?? 0.03,
        });
        if (!this.player2.inventoryOpen) {
        this.player2.update(this.world, this.input2, this.survival2 || this.survival, dt);
        if (this.player2.pendingFallDamage > 0 && this.survival2) {
          this.survival2 = applyDamage(this.survival2, this.player2.pendingFallDamage, 'fall');
          this.player2.pendingFallDamage = 0;
        }
        }
      }
      const vis = this._terrainVisibilityPlan();
      this.world.updateStreaming(
        [this.player, this.coopMode ? this.player2 : null],
        {
          radius: this.worldRadius,
          fullRadius: vis.fullChunks,
          lodRadius: vis.lodChunks,
          proxyRadius: vis.proxyChunks,
          lodStep: vis.lodStep,
          proxyStep: vis.proxyStep,
        },
      );

      if (this.coopMode && this.player2 && this.input2 && !this.paused && !this.survival2?.dead) {
        // P2 bow steals R2 when holding bow
        if (this.input2.breakHeld && propsOf(this.player2.heldId())?.tool === 'bow') {
          this._tryShootBow('p2');
          this.player2.breaking = null;
        } else {
          this._handleCoopP2World(dt);
        }
        // P2 Circle/B near bed requests coop sleep (same rules as P1 F)
        if (this.input2.consumeUse?.()) {
          const origin = this.player2.eyePosition();
          const dir = this.player2.lookDir();
          const hit = this._raycastInteraction(origin, dir, 6);
          if (hit && hit.id === BLOCK.BED) this._trySleep();
        }
      }

      if (this.player.pendingFallDamage > 0) {
        const dmg = this.player.pendingFallDamage;
        this.player.pendingFallDamage = 0;
        this.survival = applyDamage(this.survival, dmg, 'fall');
        this.audio.hurt();
        this.player.notify(dmg > 20 ? 'Hard landing!' : 'Oof — rough landing.', 1.6);
        this.fx.burst(
          this.player.position.x - 0.5,
          this.player.position.y - 0.5,
          this.player.position.z - 0.5,
          [0.55, 0.5, 0.42],
          dmg > 20 ? 10 : 6,
        );
      }
      if (move.inWater && !this._wasInWater) {
        if (this.audio.splash) this.audio.splash();
        else this.audio.step('water');
        this.fx.burst(
          this.player.position.x - 0.5,
          this.player.position.y - 0.1,
          this.player.position.z - 0.5,
          [0.55, 0.75, 1.0],
          8,
        );
      }
      this._wasInWater = move.inWater;

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
    this._tickFurnaces(dt);
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
      const labels = { ocean: 'Ocean', tropical: 'Tropical Isle', shore: 'Shore', forest: 'Forest', desert: 'Desert', tundra: 'Tundra' };
      this.player.notify(`Entered ${labels[currentBiome] || currentBiome}`, 4);
      if (currentBiome === 'desert' || currentBiome === BIOME.DESERT) this._unlock('first_desert');
      this._lastBiome = currentBiome;
    }

    // Early-game grace: ~15 min to explore, gather, build shelter (like most survival games)
    if ((this._spawnProtectT || 0) > 0) {
      this._spawnProtectT = Math.max(0, this._spawnProtectT - dt);
      if (this._spawnProtectT <= 0 && !this._graceEndedNotified) {
        this._graceEndedNotified = true;
        this.player?.notify?.('The wild grows harsher — manage food, warmth, and rest.', 7);
      }
    }
    // Smooth fade over last 3 minutes
    const graceT = this._spawnProtectT || 0;
    const grace = graceT <= 0 ? 0 : graceT >= 180 ? 1 : graceT / 180;
    this.survival = tickSurvival(this.survival, {
      dt,
      dayPhase: this.time.dayPhase,
      weather: this.time.weather,
      blockHeat: grace > 0.2 ? Math.max(heat, 10) : heat,
      sprinting: move.sprinting,
      moving: move.moved,
      inWater: move.inWater,
      sleeping: false,
      hungerMult: mode.hungerMult,
      thirstMult: mode.thirstMult ?? 1,
      coldDamageMult: mode.coldDamageMult * expMult * (1 - grace * 0.95),
      wetnessGain: move.inWater ? 0 : wGain * (1 - grace * 0.8),
      desertHeat: grace > 0.5 ? false : desertHeat,
      ambientTempOffset: tempOffset * (1 - grace * 0.7),
      earlyGameGrace: grace,
    });

    // bleed DPS
    this.survival = tickBleed(this.survival, dt);

    // Coop P2 body systems (SC-depth: hunger/cold/stamina for second player)
    if (this.coopMode && this.player2 && this.survival2 && !this.survival2.dead) {
      const p2 = this.player2.position;
      const heat2 = this.world.sampleHeat(p2.x, p2.y + 1, p2.z, 7);
      const roof2 = hasRoofAbove(
        (x, y, z) => this.world.getBlock(x, y, z),
        p2.x, p2.y, p2.z, isSolid, isTransparent,
      );
      const exp2 = exposureColdMult({
        weather: this.time.weather,
        roofed: roof2,
        wetness: this.survival2.wetness || 0,
        isNight: this.time.isNight(),
      });
      const feet2 = this.world.getBlock(
        Math.floor(p2.x), Math.floor(p2.y - 0.2), Math.floor(p2.z),
      );
      const desert2 = feet2 === BLOCK.SAND && this.time.weather === 'clear' && !this.time.isNight();
      const biome2 = biomeAt(Math.floor(p2.x), Math.floor(p2.z), this.seed);
      const temp2 = ambientTempOffset(biome2);
      const inW2 = this.world.getBlock(p2.x, p2.y, p2.z) === BLOCK.WATER
        || this.world.getBlock(p2.x, p2.y + 1, p2.z) === BLOCK.WATER;
      // Approximate move/sprint from pad input2 if present
      const moving2 = !!(this.input2 && (
        this.input2.wantsForward() || this.input2.wantsBack()
        || this.input2.wantsLeft() || this.input2.wantsRight()
      ));
      const sprint2 = !!(this.input2 && this.input2.wantsSprint() && moving2);
      const wGain2 = wetnessGainRate({
        weather: this.time.weather,
        roofed: roof2,
        inWater: inW2,
      });
      this.survival2 = tickSurvival(this.survival2, {
        dt,
        dayPhase: this.time.dayPhase,
        weather: this.time.weather,
        blockHeat: grace > 0.2 ? Math.max(heat2, 10) : heat2,
        sprinting: sprint2,
        moving: moving2,
        inWater: inW2,
        sleeping: false,
        hungerMult: mode.hungerMult,
        thirstMult: mode.thirstMult ?? 1,
        coldDamageMult: mode.coldDamageMult * exp2 * (1 - grace * 0.95),
        wetnessGain: inW2 ? 0 : wGain2 * (1 - grace * 0.8),
        desertHeat: grace > 0.5 ? false : desert2,
        ambientTempOffset: temp2 * (1 - grace * 0.7),
        earlyGameGrace: grace,
      });
      this.survival2 = tickBleed(this.survival2, dt);
      // P2 spoilage
      const sp2 = tickSpoilage(this.player2.slots, dt, undefined, 1);
      this.player2.slots = sp2.slots;
    }

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
      const faunaTargets = [
        {
          id: 'p1',
          x: this.player.position.x,
          y: this.player.position.y,
          z: this.player.position.z,
        },
      ];
      if (this.coopMode && this.player2 && !this.player2.inventoryOpen) {
        faunaTargets.push({
          id: 'p2',
          x: this.player2.position.x,
          y: this.player2.position.y,
          z: this.player2.position.z,
        });
      }
      const fa = this.fauna.tick(
        dt,
        faunaTargets,
        this.time.isNight(),
        {
          senseMult: mode.predatorSenseMult * (move.crouching ? 0.55 : 1),
          damageMult: mode.predatorDamageMult,
          hostilePolicy: mode.hostilePolicy || 'provoke',
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
          const bleedAmt = Math.round((6 + ((Math.random() * 4) | 0)) * (mode.bleedMult ?? 0.5));
          if (bleedAmt > 0) this.survival = applyBleed(this.survival, bleedAmt);
        }
        dmg = mitigatePhysicalDamage(dmg, equipmentArmor(this.player.equipment));
        this.survival = applyDamage(this.survival, dmg, 'wolf');
        this.audio.hurt();
      }
      if ((fa.player2Damage || 0) > 0 && this.survival2 && this.player2) {
        let dmg = fa.player2Damage;
        dmg = mitigatePhysicalDamage(dmg, equipmentArmor(this.player2.equipment));
        this.survival2 = applyDamage(this.survival2, dmg, 'wolf');
        this.player2.notify('A predator mauls you!');
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

    const p1Dead = !!this.survival.dead;
    const p2Dead = !!(this.coopMode && this.survival2?.dead);
    const bothDead = this.coopMode
      ? isBothPlayersDown(this.survival, this.survival2)
      : p1Dead;

    // Solo death OR coop both-down → full death overlay (session over until respawn)
    if (bothDead) {
      this.setInventoryOpen(false, 'p1');
      if (this.player2?.inventoryOpen) this.setInventoryOpen(false, 'p2');
      this.input.uiMode = true;
      if (!this._deathSfxPlayed) {
        this.audio.death();
        this._deathSfxPlayed = true;
      }
      if (!this._deathHandled) {
        this._deathHandled = true;
        this._onDeath();
      }
      const cause = p1Dead
        ? this.survival.causeOfDeath
        : this.survival2?.causeOfDeath || 'The frontier claims you both.';
      this.hud.showDeath?.(cause, {
        mode: this.mode,
        permadeath: mode.permadeath,
        dropped: mode.deathDrops,
        day: this.time.dayNumber,
        kills: this._stats?.kills || 0,
        wolfKills: this._stats?.wolfKills || 0,
        coop: !!this.coopMode,
      });
      if (this.player) {
        this.player.yaw = this.input.lookX;
        this.player.pitch = this.input.lookY;
        const eye = this.player.eyePosition();
        this.camera.position.copy(eye);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.player.yaw;
        this.camera.rotation.x = this.player.pitch;
      }
      this._updateHud();
      return;
    }

    // Coop: one player down — session continues for the living partner
    if (this.coopMode && p1Dead && !p2Dead) {
      this.input.uiMode = true;
      if (document.pointerLockElement) document.exitPointerLock();
      if (!this._p1DownMsg) {
        this.player?.notify('You are down. Partner still fights — Respawn when ready.', 6);
        this._p1DownMsg = true;
        this.audio.hurt();
      }
    } else {
      this._p1DownMsg = false;
    }
    if (this.coopMode && p2Dead && !p1Dead) {
      if (!this._p2DownMsg) {
        this.player2?.notify('You are down. Partner still fights — Respawn when ready.', 6);
        this.player?.notify('P2 is down.', 4);
        this._p2DownMsg = true;
        this.audio.hurt();
      }
    } else {
      this._p2DownMsg = false;
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
      // bow shot steals LMB when holding bow (living P1 only)
      if (!this.survival.dead) {
      if (this.input.breakHeld && propsOf(this.player.heldId())?.tool === 'bow') {
        this._tryShootBow('p1');
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
      }
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
    this.clouds?.update(dt, this.camera);
    this._lightScanAcc += dt;
    if (this._lightScanAcc > 0.5) {
      this._lightScanAcc = 0;
      this._scanLights(false);
    }
    this._updateLighting();
    this._updateWaterVisuals();
    this._tickTooltips(dt);
    this._updateHud();
    if ((this.player?.inventoryOpen || this.player2?.inventoryOpen) && this._invNeedsPaint) this._paintInventory();

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

  /**
   * Early-game spawn pin: edge compass toward first-hour spawn.
   * Visible while grace remains or player is still near camp (~120m).
   */
  _updateSpawnMarker() {
    const el = document.getElementById('spawn-marker');
    if (!el || !this.player || !this._spawnPos) {
      el?.classList.add('hidden');
      return;
    }
    const px = this.player.position.x;
    const pz = this.player.position.z;
    const dx = this._spawnPos.x - px;
    const dz = this._spawnPos.z - pz;
    const dist = Math.hypot(dx, dz);
    const graceOn = (this._spawnProtectT || 0) > 0;
    // hide once far away after grace (finder becomes clutter)
    const show = this.started && !this.survival?.dead && (graceOn || dist < 120);
    el.classList.toggle('hidden', !show);
    if (!show) return;
    // world: +X east, -Z north; yaw 0 looks -Z
    const bearing = Math.atan2(dx, -dz);
    let rel = bearing - this.player.yaw;
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;
    const icon = el.querySelector('.marker-icon');
    if (icon) icon.style.transform = `rotate(${(rel * 180) / Math.PI}deg)`;
    const label = el.querySelector('.marker-label');
    if (label) {
      label.textContent = dist < 4 ? 'SPAWN' : `${Math.round(dist)}m`;
    }
  }

  _updateOutlineAndPrompt() {
    const origin = this.player.eyePosition();
    const dir = this.player.lookDir();
    const hit = this._raycastInteraction(origin, dir, 6);
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
                const feedMap = { berries: ITEM.BERRIES, raw_meat: ITEM.RAW_MEAT, seeds: ITEM.SEEDS };
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

  _raycastInteraction(origin, direction, maxDist = 6) {
    return raycastVoxel(
      origin,
      direction,
      maxDist,
      (x, y, z) => this.world.getBlock(x, y, z),
      (id) => id !== BLOCK.AIR && id !== BLOCK.WATER && !!BLOCK_PROPS[id],
    );
  }

  _handleMining(dt) {
    const origin = this.player.eyePosition();
    const dir = this.player.lookDir();

    // Friendly-fire off: ignore teammate as melee target
    if (this.input.breakHeld && this.coopMode && !this._friendlyFireOn()) {
      const tm = this._rayHitTeammate(origin, dir, 3.6, 'p1');
      if (tm) {
        // absorb swing — no damage
        this._meleeCd = Math.max(this._meleeCd, 0.2);
        return;
      }
    }
    // Melee animals on click-hold with cooldown
    if (this.input.breakHeld && this.fauna && this._meleeCd <= 0) {
      const heldP = propsOf(this.player.heldId());
      const reach = heldP?.meleeRange || 3.6;
      const ah = this.fauna.rayHit(origin, dir, reach);
      if (ah) {
        this.player.breaking = null;
        const held = heldP;
        let dmg = held?.melee || 4;
        // Mace smash bonus from recent fall speed (name/tool match until ITEM.MACE exists)
        const heldName = (displayName(this.player.heldId()) || '').toLowerCase();
        const toolName = String(held?.tool || '').toLowerCase();
        if (heldName.includes('mace') || toolName === 'mace') {
          const fallDist = Math.max(0, (this.player._fallVy || 0) * 0.45);
          dmg = maceSmashDamage(fallDist, dmg);
        }
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

    const hit = this._raycastInteraction(origin, dir, 6);

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
        let drop = resolveBlockDrop(hit.id, dropForBlock);
        let dropCount = 1;
        if (hit.id === BLOCK.LEAVES) {
          const r = Math.random();
          if (r < 0.06) drop = ITEM.APPLE;
          else if (r < 0.24) drop = ITEM.STICK;
          else if (r < 0.32) drop = ITEM.SEEDS;
          else drop = null;
        }
        if (hit.id === BLOCK.PALM_LEAVES) drop = palmLeafDrop(hit.id, Math.random());
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
    const hit = this._raycastInteraction(origin, dir, 6);
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
      if (blockId === BLOCK.SLAB_WOOD) {
        const half = slabHalfFromPitch(this.player.pitch);
        const meta = slabHalfMeta(half);
        this._slabHalf.set(`${px|0},${py|0},${pz|0}`, meta);
        this.player.notify(half === 'top' ? 'Top slab placed.' : 'Bottom slab placed.', 1.6);
      }
      if (blockId === BLOCK.STAIRS_WOOD) {
        const face = stairFacingFromYaw(this.player.yaw);
        const meta = stairFacingMeta(face);
        this._stairFace.set(`${px|0},${py|0},${pz|0}`, meta);
        this.player.notify(`Stairs face ${face}.`, 1.6);
      }
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
      if (blockId === BLOCK.BED) {
        const face = bedFacingFromYaw(this.player.yaw);
        const meta = bedFacingMeta(face);
        this._bedFace.set(`${px|0},${py|0},${pz|0}`, meta);
        this.player.notify(
          this.coopMode
            ? `Bed faces ${face}. Both players near bed + F/Circle at night.`
            : `Bed faces ${face}. Look at it and press F at night to sleep.`,
        );
      }
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
      const mode = this.modeDef();
      const poisonChance = mode.poisonMult ?? 0.35;
      if (p.eatDamage && Math.random() < poisonChance) {
        const dmg = Math.max(1, Math.round(p.eatDamage * Math.min(1, poisonChance + 0.25)));
        this.survival = applyDamage(this.survival, dmg, 'food_poisoning');
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
      const next = toggleDoor(hit.id, BLOCK.DOOR_CLOSED, BLOCK.DOOR_OPEN);
      if (next == null) return;
      this.world.setBlock(hit.x, hit.y, hit.z, next);
      this.audio.placeBlock();
      this.player.notify(next === BLOCK.DOOR_CLOSED ? 'Door closed.' : 'Door opened.');
      this._scanLights(true);
      return;
    }

    // Drink water
    if (hit && hit.id === BLOCK.WATER && this._drinkCd <= 0) {
      this.survival = drinkWater(this.survival, 42, 22);
      // sipping surface water slightly wets you
      this.survival = { ...this.survival, wetness: Math.min(100, (this.survival.wetness || 0) + 8) };
      this._drinkCd = 2;
      this.audio.splash?.() || this.audio.eat();
      this.player.notify('Drank water. Thirst eased.', 2);
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

    // Feed furnace fuel / smelt input via pure furnace-tick (keeps campfire heat map for warmth)
    if (hit && hit.id === BLOCK.FURNACE) {
      const k = `${hit.x|0},${hit.y|0},${hit.z|0}`;
      if (!this._furnaces.has(k)) {
        const st0 = createFurnaceState();
        st0.speedMult = 1; // smoker/blast can set 2 later
        this._furnaces.set(k, st0);
      }
      const st = this._furnaces.get(k);
      // Empty hand: take finished output
      if (held.id == null || held.count <= 0) {
        const out = takeOutput(st);
        if (out) {
          const add = addItems(this.player.slots, out.id, out.count);
          this.player.slots = add.slots;
          this.player.notify(`Furnace → +${out.count} ${displayName(out.id)}`, 2.2);
          this.audio.ui?.() || this.audio.placeBlock();
          return;
        }
      }
      if (held.id != null && isFuel(held.id)) {
        const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
        if (cons.ok) {
          this.player.slots = cons.slots;
          insertFuel(st, held.id, 1);
          // keep legacy warmth fuel map so nearby heat still works
          let f = this._campFuel.get(k) ?? 40;
          f += held.id === BLOCK.LOG ? 50 : held.id === ITEM.STICK ? 14 : 32;
          this._campFuel.set(k, Math.min(150, f));
          this.audio.placeBlock();
          this.player.notify('You fed the furnace.', 1.8);
          return;
        }
      }
      if (held.id != null && canSmelt(held.id)) {
        const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
        if (cons.ok) {
          this.player.slots = cons.slots;
          insertInput(st, held.id, 1);
          this.audio.placeBlock();
          this.player.notify(`Furnace: smelting ${displayName(held.id)}…`, 2);
          return;
        }
      }
      // legacy stick/coal set still handled above via isFuel; fall through if nothing matched
      const fuelIds = new Set([ITEM.STICK, ITEM.COAL, ITEM.CHARCOAL, BLOCK.LOG]);
      if (held.id != null && fuelIds.has(held.id)) {
        const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
        if (cons.ok) {
          this.player.slots = cons.slots;
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
    if (this.survival?.dead) return;
    // Coop: both living players must be near the sleeper (same bed area)
    if (this.coopMode && this.player2 && !this.survival2?.dead) {
      if (!wouldPartnerNearForSleep(this.player.position, this.player2.position, 4.5)) {
        this.player.notify('Co-op sleep: both players must stand near the bed.', 3.5);
        this.player2.notify('Co-op sleep: stand near your partner at the bed.', 3.5);
        return;
      }
    }

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
    const hours = this.time.isNight() ? 8 : 5;
    this.survival = applySleepRest(this.survival, hours);
    if (this.coopMode && this.survival2 && !this.survival2.dead) {
      this.survival2 = applySleepRest(this.survival2, hours);
      this.player2?.notify('You rest together. Fatigue fades.', 4);
    }
    this.audio.sleep?.() || this.audio.ui();
    this.player.notify(
      this.coopMode ? 'You both rest. Dawn approaches…' : 'You rest. Fatigue fades. Dawn approaches…',
      4,
    );
    this._unlock('first_sleep');
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
    const layout = animalPartLayout(type, spec);
    const g = new THREE.Group();
    for (const part of layout.parts) {
      const mat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(part.color[0], part.color[1], part.color[2]),
      });
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(part.sx, part.sy, part.sz),
        mat,
      );
      mesh.position.set(part.x, part.y, part.z);
      mesh.name = part.name;
      mesh.userData.role = part.role || part.name;
      mesh.userData.baseColor = [part.color[0], part.color[1], part.color[2]];
      g.add(mesh);
    }
    g.userData.type = type;
    g.userData.legNames = layout.legNames || [];
    g.userData.wingNames = layout.wingNames || [];
    g.userData.phase = 0;
    return g;
  }

  _syncAnimalMeshes() {
    if (!this.fauna) return;
    this._animClock = (this._animClock || 0) + 0.016;
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
      const spec = SPECIES[a.type] || SPECIES.hare;
      const spd = Math.hypot(a.vx || 0, a.vz || 0);
      const speed01 = Math.max(0, Math.min(1, spd / Math.max(0.1, spec.speed || 1)));
      mesh.userData.phase = (mesh.userData.phase || 0) + 0.016 * (6 + speed01 * 10);
      const legs = mesh.userData.legNames || [];
      const wings = mesh.userData.wingNames || [];
      const pose = animalLimbPose({}, legs, wings, mesh.userData.phase, speed01, a.type);
      for (const child of mesh.children) {
        const pr = pose[child.name];
        if (pr) {
          child.rotation.x = pr.rx || 0;
          child.rotation.z = pr.rz || 0;
        }
      }
      const hurt = a.hp < a.maxHp * 0.5;
      mesh.traverse((c) => {
        if (c.isMesh && c.material?.color) {
          const base = c.userData.baseColor || spec.color || [0.5, 0.5, 0.5];
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
    const pl = this._bagPlayer?.() || this.player;
    if (!pl) return;

    const bag = document.getElementById('inv-slots');
    if (bag) {
      bag.innerHTML = '';
      pl.slots.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'inv-slot' + (i === pl.hotbarIndex && i < HOTBAR_SIZE ? ' active' : '');
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
      const rows = [];
      for (const r of visibleRecipes()) {
        if (filter && !(`${r.name} ${r.desc || ''} ${r.id}`.toLowerCase().includes(filter))) continue;
        const hasIngr = hasIngredients(pl.slots, r.ingredients);
        const heatOk = !r.requiresHeat || (this._lastHeat || 0) >= r.requiresHeat;
        rows.push({ r, heatOk, can: hasIngr && heatOk });
      }
      rows.forEach((row, i) => { row._i = i; });
      rows.sort((a, b) => (b.can - a.can) || (a._i - b._i));
      const catLabel = (id) => RECIPE_CATEGORIES.find((c) => c.id === id)?.label || id;
      const tierLabel = (t) => RECIPE_TIERS.find((x) => x.tier === t)?.label || `Tier ${t}`;
      for (const { r, heatOk, can } of rows) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'recipe-btn' + (can ? ' can' : '');
        btn.dataset.recipe = r.id;
        btn.dataset.category = r.category;
        btn.dataset.tier = String(r.tier);
        btn.disabled = !can;
        let desc = r.desc || '';
        if (r.requiresHeat && !heatOk) desc += ' — stand by fire';
        const ingr = r.ingredients.map((ing) => `${displayName(ing.id)} ×${ing.count}`).join(', ');
        btn.innerHTML = `<strong>${r.name}</strong><span class="recipe-meta">${catLabel(r.category)} · ${tierLabel(r.tier)}</span>` +
          `<span>${desc}</span><span class="recipe-ingredients">${ingr}</span>`;
        recipesEl.appendChild(btn);
      }
    }

    const eqEl = document.getElementById('equip-slots');
    if (eqEl) {
      const w = equipmentWarmth(pl.equipment);
      eqEl.innerHTML = `<div class="equip-warmth">Clothing warmth: <b>${w}</b> (${this.coopMode ? 'L2' : 'F'} to equip held clothes)</div>`;
      for (const slot of EQUIP_SLOTS) {
        const id = pl.equipment?.[slot];
        const row = document.createElement('div');
        row.className = 'equip-row';
        const name = id != null ? displayName(id) : '— empty —';
        const p = id != null ? propsOf(id) : null;
        row.innerHTML = `<span class="equip-slot-label">${slot}</span><span class="equip-item">${name}${p?.warmth ? ` (+${p.warmth})` : ''}</span>`;
        eqEl.appendChild(row);
      }
    }
  }

  /**
   * Tick tooltip triggers — called every frame while game is running.
   * Queues tooltips when conditions are met, shows them with cooldown.
   */
  _showTooltipForMode(def) {
    if (!this.coopMode) return showTooltip(def);
    return showTooltip({ ...def, body: def.body
      .replaceAll('WASD', 'Left stick').replaceAll('Mouse', 'Right stick').replaceAll('Space', 'Cross')
      .replaceAll('Ctrl or C', 'R3').replaceAll('left-click', 'R2').replaceAll('right-click', 'L2')
      .replaceAll('Press E', 'Press Triangle').replaceAll('Press F', 'Press L2').replaceAll('Press R', 'Press Circle')
      .replaceAll('(E)', '(Triangle)').replaceAll('(F)', '(L2)') });
  }

  _tickTooltips(dt) {
    if (!this.started || this.paused || !this.player || this.survival?.dead) return;

    // Cooldown between tooltips (8 seconds minimum)
    if (this._tooltipQueue.length > 0) {
      this._tooltipShownAcc += dt;
      if (this._tooltipShownAcc >= 8) {
        const id = this._tooltipQueue.shift();
        this._tooltipShownAcc = 0;
        const result = checkTooltip(id);
        if (result) {
          const def = this.coopMode
            ? { ...result.def, body: result.def.body
              .replaceAll('WASD', 'Left stick')
              .replaceAll('Mouse', 'Right stick')
              .replaceAll('Space', 'Cross')
              .replaceAll('Ctrl or C', 'R3')
              .replaceAll('left-click', 'R2')
              .replaceAll('right-click', 'L2')
              .replaceAll('Press E', 'Press Triangle')
              .replaceAll('Press F', 'Press L2')
              .replaceAll('Press R', 'Press Circle')
              .replaceAll('(E)', '(Triangle)')
              .replaceAll('(F)', '(L2)') }
            : result.def;
          showTooltip(def);
        }
      }
    }

    const p = this.player.position;
    const biome = (() => { try { return biomeAt(p.x, p.z, this.seed); } catch(_) { return null; } })();

    // move_look: show immediately on first frame of play (deduped)
    if (!this._tooltipQueue.includes('move_look')) {
      this._tooltipQueue.push('move_look');
    }

    // mine_wood: after player has mined at least one log
    if (this.player.slots.some(s => s.id === BLOCK.LOG) && !this._tooltipQueue.includes('mine_wood')) {
      this._tooltipQueue.push('mine_wood');
    }

    // craft_table: after player has logs and it's day 2+ or fire placed
    if (this.player.slots.some(s => s.id === BLOCK.LOG) && !this._tooltipQueue.includes('craft_table') && (this._firstFireSeen || this.time.dayNumber > 1)) {
      this._tooltipQueue.push('craft_table');
    }

    // shelter: after player has placed any block (tracked via campfire/chest/door unlocks)
    if ((this._firstFireSeen || this._firstChestSeen || this._firstDoorSeen) && !this._tooltipQueue.includes('shelter')) {
      this._tooltipQueue.push('shelter');
    }

    // campfire: after player has placed a campfire
    if (this._firstFireSeen && !this._tooltipQueue.includes('campfire')) {
      this._tooltipQueue.push('campfire');
    }

    // cook_meat: after player has cooked meat (first_cook achievement)
    if (this._firstCookSeen && !this._tooltipQueue.includes('cook_meat')) {
      this._tooltipQueue.push('cook_meat');
    }

    // eat_food: after player has eaten anything (hunger > 0 change from eating)
    if ((this._firstCookSeen || this.time.dayNumber > 2) && !this._tooltipQueue.includes('eat_food')) {
      this._tooltipQueue.push('eat_food');
    }

    // first_night: after surviving into day 2 or when night falls on day 1
    if (this.time.dayNumber >= 2 && !this._tooltipQueue.includes('first_night')) {
      this._tooltipQueue.push('first_night');
    }

    // hunt: after player has killed an animal
    if (this._firstKillSeen && !this._tooltipQueue.includes('hunt')) {
      this._tooltipQueue.push('hunt');
    }

    // clothes: after player has equipped clothing
    if (this._firstClothesSeen && !this._tooltipQueue.includes('clothes')) {
      this._tooltipQueue.push('clothes');
    }

    // sleep: after player has placed a bed (first_door unlock also implies building)
    if ((this._firstSleepSeen || this.player.slots.some(s => s.id === BLOCK.BED)) && !this._tooltipQueue.includes('sleep')) {
      this._tooltipQueue.push('sleep');
    }

    // farm: after player has planted seeds (first_farm achievement)
    if (this._firstFarmSeen && !this._tooltipQueue.includes('farm')) {
      this._tooltipQueue.push('farm');
    }

    // water: after player has been in rain or near water (day 2+)
    if (this.time.dayNumber >= 2 && !this._tooltipQueue.includes('water')) {
      this._tooltipQueue.push('water');
    }

    // save: after 30 seconds of play
    if (this.time.elapsed > 30 && !this._tooltipQueue.includes('save')) {
      this._tooltipQueue.push('save');
    }

    // biome-specific: desert heat warning
    if (biome === BIOME.DESERT && !this._tooltipQueue.includes('shelter')) {
      this._tooltipQueue.push('shelter');
    }

    // first_night: warn when night falls on day 1
    if (this.time.dayNumber === 1 && this.time.isNight() && !this._tooltipQueue.includes('first_night')) {
      this._tooltipQueue.push('first_night');
    }

    // bow: after player has crafted a bow (check inventory) — reinforces hunting tip
    if (this.player.slots.some(s => s.id === ITEM.BOW) && !this._tooltipQueue.includes('hunt')) {
      this._tooltipQueue.push('hunt');
    }

    // desert: first time entering desert biome — reinforces shelter tip
    if (biome === BIOME.DESERT && !this._tooltipQueue.includes('shelter')) {
      this._tooltipQueue.push('shelter');
    }

    // bucket: after filling a bucket (first_bucket achievement) — reinforces water tip
    if (this._firstBucketSeen && !this._tooltipQueue.includes('water')) {
      this._tooltipQueue.push('water');
    }

    // snare: after placing a snare — reinforces farm/food tip
    if (this._firstSnareSeen && !this._tooltipQueue.includes('farm')) {
      this._tooltipQueue.push('farm');
    }

    // power: after powering a lamp (first_power achievement) — reinforces lighting tips
    if (this._firstPowerSeen && !this._tooltipQueue.includes('campfire')) {
      this._tooltipQueue.push('campfire');
    }

    // chest: after placing a chest — reinforces saving tip
    if (this._firstChestSeen && !this._tooltipQueue.includes('save')) {
      this._tooltipQueue.push('save');
    }

    // door: after placing a door (shelter reinforcement)
    if (this._firstDoorSeen && !this._tooltipQueue.includes('shelter')) {
      this._tooltipQueue.push('shelter');
    }

    // hunger warning: if player is starving, show eat tip
    if (this.survival.hunger < 20 && !this._tooltipQueue.includes('eat_food')) {
      this._tooltipQueue.push('eat_food');
    }

    // cold warning: if player is freezing, show clothes/fire tip
    if (this.survival.bodyTemp < 35 && !this._tooltipQueue.includes('campfire')) {
      this._tooltipQueue.push('campfire');
    }

    // night warning: if it's night and player has no light nearby, show campfire
    if (this.time.isNight() && !this._tooltipQueue.includes('campfire') && this._lightPool.length === 0) {
      this._tooltipQueue.push('campfire');
    }

    // starvation emergency: if hunger is critically low, show eat tip immediately
    if (this.survival.hunger < 10 && !this._tooltipQueue.includes('eat_food')) {
      // Clear queue and show immediately
      this._tooltipQueue = [];
      const result = checkTooltip('eat_food');
      if (result) this._showTooltipForMode(result.def);
    }

    // hypothermia emergency: if body temp is critically low, show campfire immediately
    if (this.survival.bodyTemp < 34.5 && !this._tooltipQueue.includes('campfire')) {
      this._tooltipQueue = [];
      const result = checkTooltip('campfire');
      if (result) this._showTooltipForMode(result.def);
    }

    // biome notify: show biome name periodically (existing logic)
  }

  _updateLighting() {
    const sunI = this.time.sunIntensity();
    const phase = this.time.dayPhase;
    const night = this.time.isNight();
    const palette = this._skyPalette;
    // Wrap-aware distance to each low-sun event so pre-dawn glow builds correctly.
    const distToDawn = Math.min(Math.abs(phase - 0.02), 1 - Math.abs(phase - 0.02));
    const lowSun = Math.max(0, 1 - Math.min(distToDawn, Math.abs(phase - 0.52)) / 0.16);
    // Continuous nightMix avoids a hard pop at the midnight/dawn boundary.
    let nightMix;
    if (phase < 0.04) nightMix = 1 - phase / 0.04;
    else if (phase < 0.50) nightMix = 0;
    else if (phase < 0.62) nightMix = (phase - 0.50) / 0.12;
    else nightMix = 1;
    const weatherMix = this.time.weather === 'rain' ? 0.2 : this.time.weather === 'snow' ? 0.28 : 0;
    const flash = this._stormFlashT > 0 ? Math.min(1, this._stormFlashT * 5) : 0;

    // Move the key light through a broad arc so terrain relief, tree crowns, and
    // water highlights describe the time of day instead of staying stage-flat.
    const sunArc = ((phase - 0.05) / 0.5) * Math.PI;
    const sunY = Math.max(10, Math.sin(sunArc) * 78);
    const sunX = Math.cos(sunArc) * 64;
    const sunZ = Math.sin(sunArc) * 42;
    this.sun.position.set(sunX, sunY, sunZ);
    this.fill.position.set(-sunX * 0.55, Math.max(18, sunY * 0.42), -sunZ * 0.55);

    palette.top.setHex(0x2966b0).lerp(palette.nightTop, nightMix);
    palette.mid.setHex(0x72bce8).lerp(palette.nightMid, nightMix);
    palette.horizon.setHex(0xffca92).lerp(palette.nightHorizon, nightMix);
    palette.ground.setHex(0x657681).lerp(palette.nightGround, nightMix);
    palette.warm.setHex(0xff9a50);
    palette.horizon.lerp(palette.warm, lowSun * (0.12 + 0.34 * (1 - nightMix)));
    palette.mid.lerp(palette.horizon, lowSun * 0.10);
    palette.weather.setHex(0x91a7ba);
    palette.top.lerp(palette.weather, weatherMix);
    palette.mid.lerp(palette.weather, weatherMix * 0.7);
    palette.horizon.lerp(palette.weather, weatherMix * 0.45);
    palette.ground.lerp(palette.weather, weatherMix * 0.55);
    palette.glow.setHex(0xffd7a2);

    if (this._stormFlashT > 0) {
      this._stormFlashT = Math.max(0, this._stormFlashT - 1 / 60);
    }
    const nightColors = nightMix > 0.5;
    const dayFactor = 1 - nightMix;
    this.sun.color.setHex(nightColors ? 0x9bb9e6 : lowSun > 0.1 ? 0xffc486 : 0xffe4bd);
    this.fill.color.setHex(nightColors ? 0x5578ad : 0x9fc8df);
    this.ambient.color.setHex(nightColors ? 0x26385c : 0x6688aa);
    this.hemi.color.setHex(nightColors ? 0x5d76a8 : 0x9ec9ff);
    this.sun.intensity = (0.08 * nightMix + (0.30 + sunI * 1.15) * dayFactor) + flash * 1.1;
    this.fill.intensity = (0.05 * nightMix + (0.10 + sunI * 0.20) * dayFactor) + flash * 0.22;
    this.ambient.intensity = (0.20 * nightMix + (0.30 + sunI * 0.56) * dayFactor) + flash * 1.7;
    this.hemi.intensity = (0.30 * nightMix + (0.28 + sunI * 0.44) * dayFactor) + flash * 0.9;

    this.scene.background.copy(palette.mid);
    // Normalized sun direction for sky shader and disc placement.
    const _sunLen = Math.hypot(sunX, sunY, sunZ) || 1;
    const _sdx = sunX / _sunLen, _sdy = sunY / _sunLen, _sdz = sunZ / _sunLen;

    // Moon arc: 12-hour offset from sun so it rises as the sun sets.
    const moonPhase = (phase + 0.5) % 1.0;
    const moonArc = ((moonPhase - 0.05) / 0.5) * Math.PI;
    const moonRawX = Math.cos(moonArc) * 64;
    const moonRawY = Math.sin(moonArc) * 78;
    const moonRawZ = Math.sin(moonArc) * 42;
    const _moonLen = Math.hypot(moonRawX, moonRawY, moonRawZ) || 1;
    const _mdx = moonRawX / _moonLen, _mdy = moonRawY / _moonLen, _mdz = moonRawZ / _moonLen;

    if (this.skyDome) {
      this.skyDome.position.copy(this.camera.position);
      const uniforms = this.skyDome.material.uniforms;
      uniforms.topColor.value.copy(palette.top);
      uniforms.midColor.value.copy(palette.mid);
      uniforms.horizonColor.value.copy(palette.horizon);
      uniforms.groundColor.value.copy(palette.ground);
      uniforms.sunGlowColor.value.copy(palette.glow);
      uniforms.sunGlowStrength.value = Math.min(0.38, (0.08 + lowSun * 0.28 + sunI * 0.05) * dayFactor);
      uniforms.sunDir.value.set(_sdx, _sdy, _sdz);
    }
    this.sunDisc?.update(_sdx, _sdy, _sdz, _mdx, _mdy, _mdz, this.camera.position, nightMix);
    this.starField?.update(nightMix, this.camera.position);
    // Fog: horizon-tinted for depth; lean slightly toward mid-blue for readability.
    palette.fog.copy(palette.horizon).lerp(palette.mid, 0.38);
    this.scene.fog.color.copy(palette.fog);
    const plan = this._terrainVisibilityPlan();
    const fog = fogForSun(plan, sunI);
    this.scene.fog.near = fog.near;
    this.scene.fog.far = fog.far;
    if (flash > 0) {
      this.scene.background.lerp(palette.flash, flash * 0.6);
      this.scene.fog.color.lerp(palette.flash, flash * 0.45);
    }

    // Held torch keeps a small readable pool at night without flattening shadows.
    if (night) {
      const held = this.player ? propsOf(this.player.heldId()) : null;
      if (held && this.player.heldId() === BLOCK.TORCH) {
        this.ambient.intensity = Math.max(this.ambient.intensity, 0.28);
        this.sun.intensity = Math.max(this.sun.intensity, 0.16);
      }
    }
    // Drive greedy shader lighting
    const mat = this.atlas?.greedyMaterial;
    if (mat?.uniforms) {
      mat.uniforms.sunIntensity.value = 0.32 * nightMix + (0.46 + sunI * 0.58) * dayFactor;
      mat.uniforms.ambientColor.value.set(
        0.22 * nightMix + 0.74 * dayFactor,
        0.24 * nightMix + 0.77 * dayFactor,
        0.32 * nightMix + 0.86 * dayFactor,
      );
    }
  }

  /** Apply a clear blue-green cast and short-range fog while the camera is submerged. */
  _updateWaterVisuals() {
    if (!this.world || !this.player || !this.scene?.fog) return;
    const eye = this.player.eyePosition();
    const underwater = this.world.getBlock(eye.x, eye.y, eye.z) === BLOCK.WATER;
    this._cameraInWater = underwater;
    if (!underwater) return;
    const style = underwaterFogStyle({ underwater, depth: Math.max(0, 16 - eye.y) });
    this.scene.background.setHex(style.color);
    this.scene.fog.color.setHex(style.color);
    this.scene.fog.near = style.near;
    this.scene.fog.far = style.far;
    this.ambient.color.setHex(0x4a9ab0);
    this.ambient.intensity = Math.max(this.ambient.intensity, 0.28 * style.tint);
    this.hemi.color.setHex(0x5bb8cf);
    this.sun.intensity *= 0.42;
  }

  /** P2 shared-world mine/place via pad (R2 break, L1 place). */
  _handleCoopP2World(dt) {
    const p = this.player2;
    const input = this.input2;
    if (!p || !input || !this.world || this.survival2?.dead) return;
    const origin = p.eyePosition();
    const dir = p.lookDir();

    if (input.breakHeld) {
      const hit = this._raycastInteraction(origin, dir, 6);
      if (hit && hit.id !== BLOCK.BEDROCK) {
        const key = `${hit.x},${hit.y},${hit.z}`;
        if (!p.breaking || p.breaking.key !== key) {
          p.breaking = { key, x: hit.x, y: hit.y, z: hit.z, progress: 0 };
        }
        const hard = getHardness(hit.id);
        const mult = mineMultiplier(p.heldId(), hit.id);
        p.breaking.progress += (this._breakSpeed * mult * dt) / hard;
        if (p.breaking.progress >= 1) {
          let drop = resolveBlockDrop(hit.id, dropForBlock);
          if (hit.id === BLOCK.PALM_LEAVES) drop = palmLeafDrop(hit.id, Math.random());
          this.world.setBlock(hit.x, hit.y, hit.z, BLOCK.AIR);
          if (drop != null) {
            const add = addItems(p.slots, drop, 1);
            p.slots = add.slots;
          }
          this.audio.breakBlock?.();
          p.breaking = null;
          this.fx?.setCrack?.(null, 0);
        }
      } else {
        p.breaking = null;
      }
    } else {
      p.breaking = null;
    }

    if (input.consumePlace?.()) {
      const hit = this._raycastInteraction(origin, dir, 6);
      if (hit && hit.normal) {
        const px = hit.x + hit.normal.x;
        const py = hit.y + hit.normal.y;
        const pz = hit.z + hit.normal.z;
        const placeId = placeBlockId(p.heldId());
        if (placeId != null && this.world.getBlock(px, py, pz) === BLOCK.AIR) {
          // don't place inside either player
          const inside = (pl) => {
            if (!pl) return false;
            const dx = pl.position.x - (px + 0.5);
            const dy = pl.position.y + 0.9 - (py + 0.5);
            const dz = pl.position.z - (pz + 0.5);
            return dx * dx + dy * dy + dz * dz < 1.1;
          };
          if (!inside(this.player) && !inside(p)) {
            const cons = consumeFromHotbar(p.slots, p.hotbarIndex, 1);
            if (cons.ok) {
              p.slots = cons.slots;
              this.world.setBlock(px, py, pz, placeId);
              this.audio.place?.() || this.audio.ui?.();
            }
          }
        }
      }
    }
  }

  _spawnCoopP2(spawn) {
    this.player2 = null;
    this.input2 = null;
    this.survival2 = null;
    if (!this.coopMode || !spawn) return;
    const s2 = {
      x: (spawn.x ?? spawn.position?.x ?? 0) + 2.2,
      y: spawn.y ?? spawn.position?.y ?? 40,
      z: spawn.z ?? spawn.position?.z ?? 0,
    };
    this.player2 = new Player(s2, { starterRations: this.modeDef().starterRations });
    this.input2 = new PadInputAdapter();
    this.input2.lookX = this.player?.yaw || 0;
    this.input2.lookY = 0;
    this.survival2 = { ...DEFAULT_SURVIVAL };
    this._p2Yaw = this.input2.lookX;
    this._p2Pitch = 0;
  }

  _applyCoopHudMode() {
    try {
      document.body.classList.toggle('coop-mode', !!this.coopMode);
      if (this.coopMode) {
        const replacements = [
          ['#btn-close-inv', 'Close (E)', 'Close (Triangle)'],
          ['#btn-close-furnace', 'Close (F)', 'Close (Circle)'],
          ['#chest-screen .inv-sub', 'inventory (E)', 'Pack & Craft (Triangle)'],
        ];
        for (const [selector, from, to] of replacements) {
          document.querySelectorAll(selector).forEach((el) => { el.textContent = el.textContent.replaceAll(from, to); });
        }
      }
    } catch (_) {}
    // Keep perf knobs in sync when toggling coop
    try { this._applyCoopPerfBudget?.(); } catch (_) {}
    if (this.coopMode && !this._coopRouter) {
      try {
        // Lazy import path already static at top for readGamepad; router from same module via dynamic if needed
        import(`./input-coop.js?v=261`).then((mod) => {
          if (!this.coopMode || this._coopRouter) return;
          this._coopRouter = new mod.CoopInputRouter(this.canvas, { kbmPlayer: mod.P1 });
          this._coopRouter.setKbmInput(this.input);
        }).catch(() => {});
      } catch (_) {}
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
    setBar('bar-thirst', s.thirst ?? 100, s.maxThirst ?? 100);
    setBar('bar-breath', s.breath ?? s.maxBreath ?? 30, s.maxBreath ?? 30);
    setBar('bar-stamina', s.stamina, s.maxStamina);
    setBar('bar-temp', this._tempBar(s.bodyTemp), 100);
    setBar('bar-sleep', s.sleep, 100);
    setBar('bar-bleed', s.bleed || 0, 100);

    // P2 half-screen meters (own survival2 when dual body active)
    if (this.coopMode) {
      const s2 = this.survival2 || s;
      setBar('bar-health-p2', s2.health, s2.maxHealth);
      setBar('bar-hunger-p2', s2.hunger, s2.maxHunger);
      setBar('bar-thirst-p2', s2.thirst ?? 100, s2.maxThirst ?? 100);
      setBar('bar-breath-p2', s2.breath ?? s2.maxBreath ?? 30, s2.maxBreath ?? 30);
      setBar('bar-stamina-p2', s2.stamina, s2.maxStamina);
      setBar('bar-temp-p2', this._tempBar(s2.bodyTemp), 100);
      setBar('bar-sleep-p2', s2.sleep, 100);
      const tl2 = document.getElementById('temp-label-p2');
      if (tl2) tl2.textContent = `${s2.bodyTemp.toFixed(1)}°C`;
    }

    const tempLabel = document.getElementById('temp-label');
    if (tempLabel) tempLabel.textContent = `${s.bodyTemp.toFixed(1)}°C`;

    // critical pulses
    const meters = document.getElementById('meters');
    if (meters) {
      meters.classList.toggle('crit-health', s.health < 28);
      meters.classList.toggle('crit-hunger', s.hunger < 18);
      meters.classList.toggle('crit-thirst', (s.thirst ?? 100) < 18);
      meters.classList.toggle('crit-cold', s.bodyTemp < 34.2);
      meters.classList.toggle('crit-bleed', (s.bleed || 0) > 20);
    }
    const bleedTag = document.getElementById('bleed-tag');
    if (bleedTag) bleedTag.classList.toggle('on', (s.bleed || 0) > 1);

    this._updateSpawnMarker();
    this._updateCoopPadPrompt();

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
        if (this._spawnPos) {
          const from = { x: this.player.position.x, z: this.player.position.z };
          const to = { x: this._spawnPos.x, z: this._spawnPos.z };
          const d = horizDistance(from, to);
          const deg = Math.round((compassNeedleAngle(this.player.yaw, from, to) * 180) / Math.PI);
          bits.push(`spawn ${Math.round(d)}m ${deg >= 0 ? '+' : ''}${deg}°`);
        }
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
      const statusText = bits.join(' · ');
      if (typeof window !== 'undefined' && typeof window.__FSStatusRender === 'function') {
        window.__FSStatusRender(statusText);
      } else {
        status.textContent = statusText;
      }
    }

    const msg = document.getElementById('message');
    if (msg) {
      msg.textContent = this.player.messageT > 0 ? this.player.message : '';
    }

    document.querySelectorAll('#hotbar .hotbar-slot').forEach((el, i) => {
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
        let glyphEl = el.querySelector('.hb-glyph');
        if (!glyphEl) {
          glyphEl = document.createElement('span');
          glyphEl.className = 'hb-glyph';
          el.appendChild(glyphEl);
        }
        glyphEl.textContent = displayName(stack.id).split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
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
        const glyphEl = el.querySelector('.hb-glyph');
        if (glyphEl) glyphEl.textContent = '';
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

    
    // Mirror hotbar chrome to P2 half (shared inv until dual inventory)
    if (this.coopMode && this.player) {
      const p2 = this.player2 || this.player;
      document.querySelectorAll('#hotbar-p2 .hotbar-slot').forEach((el, i) => {
        el.classList.toggle('active', i === p2.hotbarIndex);
        const stack = p2.slots[i];
        if (stack && stack.id != null && stack.count > 0) {
          const p = propsOf(stack.id);
          const col = p?.color || [0.5, 0.5, 0.5];
          el.style.background = `rgb(${(col[0]*255)|0},${(col[1]*255)|0},${(col[2]*255)|0})`;
          const glyph = displayName(stack.id).split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
          el.innerHTML = `<span class="hb-glyph">${glyph}</span>${stack.count > 1 ? `<span class="hb-count">${stack.count}</span>` : ''}`;
        } else {
          el.style.background = '';
          el.innerHTML = '';
          el.classList.add('empty');
        }
      });
    }

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

  /** Drive camera2 from player2 (pad body) or freecam fallback beside P1. */
  _updateCoopP2Camera(dt) {
    if (!this.camera2 || !this.player) return;
    if (this.player2 && this.input2) {
      this.camera2.position.copy(this.player2.eyePosition());
      this.camera2.rotation.order = 'YXZ';
      this.camera2.rotation.y = this.player2.yaw;
      this.camera2.rotation.x = this.player2.pitch;
      return;
    }
    // Freecam fallback (no body yet)
    try {
      const gp1 = getConnectedPad(this.input?._gpConnected ? 1 : 0);
      const st = readGamepad(gp1, this.input?.deadzone ?? 0.15);
      if (st) {
        const sens = this.input?.gpSensitivity ?? 0.03;
        this._p2Yaw -= st.rx * sens * 60 * dt;
        this._p2Pitch -= st.ry * sens * 60 * dt;
        const lim = Math.PI / 2 - 0.05;
        this._p2Pitch = Math.max(-lim, Math.min(lim, this._p2Pitch));
      }
    } catch (_) {}
    const eye = this.player.eyePosition();
    this._tmpRight.set(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));
    this.camera2.position.set(
      eye.x + this._tmpRight.x * 1.6,
      eye.y,
      eye.z + this._tmpRight.z * 1.6,
    );
    this.camera2.rotation.order = 'YXZ';
    this.camera2.rotation.y = this._p2Yaw;
    this.camera2.rotation.x = this._p2Pitch;
  }

  render() {
    const r = this.renderer;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!this.coopMode || !this.camera2 || !this.started) {
      r.setScissorTest(false);
      r.setViewport(0, 0, w, h);
      r.render(this.scene, this.camera);
      return;
    }

    // Keep P2 camera live every frame in coop
    this._updateCoopP2Camera(1 / 60);

    const [left, right] = splitViewport(w, h, 'lr');
    // WebGL scissor origin is bottom-left; splitViewport y is top-left CSS
    const toGL = (rect) => ({
      x: rect.x,
      y: h - rect.y - rect.h,
      w: rect.w,
      h: rect.h,
    });
    const L = toGL(left);
    const R = toGL(right);

    r.setScissorTest(true);

    r.setViewport(L.x, L.y, L.w, L.h);
    r.setScissor(L.x, L.y, L.w, L.h);
    r.render(this.scene, this.camera);

    r.setViewport(R.x, R.y, R.w, R.h);
    r.setScissor(R.x, R.y, R.w, R.h);
    r.render(this.scene, this.camera2);
  }

  respawn(who = 'p1') {
    if (!this.world) return;
    who = who === 'p2' ? 'p2' : 'p1';
    const mode = this.modeDef();
    if (mode.permadeath && (!this.coopMode || (this.survival?.dead && this.survival2?.dead))) {
      this.hud.hideDeath?.();
      this.newGame();
      return;
    }
    const base = this.world.findSpawn();
    const near = this.coopMode && this.player && who === 'p2' && !this.survival?.dead
      ? {
          x: this.player.position.x + 2,
          y: this.player.position.y,
          z: this.player.position.z,
        }
      : this.coopMode && this.player2 && who === 'p1' && !this.survival2?.dead
        ? {
            x: this.player2.position.x + 2,
            y: this.player2.position.y,
            z: this.player2.position.z,
          }
        : base;

    if (who === 'p2') {
      if (!this.player2) return;
      const keepSlots = this.player2.slots;
      const keepEq = this.player2.equipment;
      this.player2 = new Player(near, { starterRations: 0 });
      if (keepSlots) this.player2.slots = cloneSlots(keepSlots);
      if (keepEq) this.player2.equipment = { ...emptyEquipment(), ...keepEq };
      if (countItems(this.player2.slots, ITEM.RATION) === 0) {
        this.player2.slots = createStarterInventory(mode.deathDrops ? 1 : Math.min(3, mode.starterRations || 3));
      }
      this.survival2 = { ...DEFAULT_SURVIVAL };
      this.input2 = this.input2 || new PadInputAdapter();
      this.input2.lookX = this.player2.yaw;
      this.input2.lookY = 0;
      this._p2DownMsg = false;
      this.player2.notify('P2 respawned. Stay close to your partner.');
      this.hud.hideDeath?.();
      this.saveGame({ quiet: true });
      return;
    }

    const keepSlots = this.player?.slots;
    const keepEq = this.player?.equipment;
    this.player = new Player(near, { starterRations: 0 });
    if (keepSlots) this.player.slots = cloneSlots(keepSlots);
    if (keepEq) this.player.equipment = { ...emptyEquipment(), ...keepEq };
    if (countItems(this.player.slots, ITEM.RATION) === 0 && !mode.deathDrops) {
      this.player.slots = createStarterInventory(mode.starterRations);
    } else if (mode.deathDrops && countItems(this.player.slots, ITEM.RATION) === 0) {
      this.player.slots = createStarterInventory(1);
    }
    this.survival = { ...DEFAULT_SURVIVAL };
    this.prevHealth = 100;
    this._deathHandled = false;
    this._p1DownMsg = false;
    this.fauna?.clearNear(near.x, near.z, 14);
    this.hud.hideDeath?.();
    this.setInventoryOpen(false, 'p1');
    this.input.uiMode = false;
    this.input.setCaptureEnabled?.(true);
    this.player.notify(
      mode.deathDrops
        ? 'You wake with almost nothing. Rebuild your pack.'
        : 'You wake cold and hungry. Mine, craft, light a fire.',
    );
    this.saveGame({ quiet: true });
    this._scanLights(true);
    this.input.requestLock?.();
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this.input.unbind();
    this.fx?.dispose?.();
    this.weatherFx?.dispose?.();
  }
}
