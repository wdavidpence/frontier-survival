import * as THREE from 'three';
import { World } from './world.js?v=285';
import { Player } from './player.js?v=238';
import { Input } from './input.js?v=283';
import { GameTime } from './time.js?v=220';
import { getSunForTime } from './lighting-palette.js?v=1';
import { torchFalloff } from './torch-falloff.js?v=1';
import { AudioBus } from './audio.js?v=220';
import {
  DEFAULT_SURVIVAL,
  tickSurvival,
  eatFood,
  drinkWater,
  applyDamage,
} from './survival.js?v=243';
import { BLOCK, getHardness, isSolid, isTransparent, getColor, BLOCK_PROPS } from './blocks.js?v=285';
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
import { visibleRecipes, craftRecipe } from './crafting.js?v=220';
import { FaunaSystem, SPECIES, canFeed, tryFeed } from './animals.js?v=245';
import { animalPartLayout, animalLimbPose } from './animal-visuals.js?v=242';
import { createBlockAtlas } from './atlas.js?v=285';
import { ATLAS_N } from './atlas-core.js?v=285';
import { BreakFX, WeatherFX } from './fx.js?v=245';
import { underwaterFogStyle } from './underwater-fog.js?v=244';
import { terrainVisibilityPlan, fogForSun } from './terrain-visibility.js?v=285';
import { VoxelCloudLayer } from './sky-clouds.js?v=1';
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
import { readGamepad } from './input-coop.js?v=260';
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
    this.renderer.toneMappingExposure = 1.08;

    this.scene = new THREE.Scene();
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x4f86c6) },
        bottomColor: { value: new THREE.Color(0xd9ecff) },
        offset: { value: 0.0 },
        exponent: { value: 0.6 },
      },
      vertexShader: 'varying vec3 vLocal; void main(){ vLocal=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vLocal; void main(){ float h=normalize(vLocal).y; float t=max(pow(max(h+offset,0.0),exponent),0.0); gl_FragColor=vec4(mix(bottomColor,topColor,t),1.0); }',
    });
    this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMat);
    this.skyUniforms = skyMat.uniforms;
    this.skyDome.renderOrder = -100;
    this.scene.add(this.skyDome);

    const sunDiscGeo = new THREE.CircleGeometry(6, 32);
    const sunDiscMat = new THREE.MeshBasicMaterial({
      color: 0xffffee,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    this.sunDisc = new THREE.Mesh(sunDiscGeo, sunDiscMat);
    this.sunDisc.renderOrder = -99;
    this.scene.add(this.sunDisc);

    const moonGeo = new THREE.CircleGeometry(4, 24);
    // Crater detail painted onto a canvas so the moon disc isn't flat-shaded.
    let moonSurfaceTexture = null;
    if (typeof document !== 'undefined') {
      const moonCanvas = document.createElement('canvas');
      moonCanvas.width = 128;
      moonCanvas.height = 128;
      const mctx = moonCanvas.getContext?.('2d');
      if (mctx) {
        mctx.fillStyle = '#d9d9e8';
        mctx.beginPath();
        mctx.arc(64, 64, 64, 0, Math.PI * 2);
        mctx.fill();
        const craters = [[40, 36, 13], [82, 48, 9], [54, 84, 11], [92, 88, 6], [28, 78, 7], [70, 22, 5], [20, 44, 5]];
        mctx.fillStyle = 'rgba(130,130,158,0.5)';
        for (const [cx, cy, cr] of craters) {
          mctx.beginPath();
          mctx.arc(cx, cy, cr, 0, Math.PI * 2);
          mctx.fill();
        }
        moonSurfaceTexture = new THREE.CanvasTexture(moonCanvas);
      }
    }
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: moonSurfaceTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.moonDisc = new THREE.Mesh(moonGeo, moonMat);
    this.moonDisc.renderOrder = -98;
    this.scene.add(this.moonDisc);

    // Soft glow halo behind the moon disc.
    let moonHaloTexture = null;
    if (typeof document !== 'undefined') {
      const moonHaloCanvas = document.createElement('canvas');
      moonHaloCanvas.width = 64;
      moonHaloCanvas.height = 64;
      const hctx = moonHaloCanvas.getContext?.('2d');
      if (hctx) {
        const hgrad = hctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        hgrad.addColorStop(0, 'rgba(220,230,255,0.9)');
        hgrad.addColorStop(0.4, 'rgba(180,200,255,0.35)');
        hgrad.addColorStop(1, 'rgba(180,200,255,0)');
        hctx.fillStyle = hgrad;
        hctx.fillRect(0, 0, 64, 64);
        moonHaloTexture = new THREE.CanvasTexture(moonHaloCanvas);
      }
    }
    const moonGlowMat = new THREE.SpriteMaterial({
      map: moonHaloTexture,
      color: 0xaad0ff,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });
    this.moonGlow = new THREE.Sprite(moonGlowMat);
    this.moonGlow.scale.set(16, 16, 1);
    this.moonGlow.renderOrder = -97;
    this.scene.add(this.moonGlow);

    // --- Night sky: star field, constellations, Milky Way band -----------
    const STAR_COUNT = 2000;
    const STAR_RADIUS = 175;
    const starPositions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random()); // upper hemisphere only
      starPositions[i * 3] = STAR_RADIUS * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = STAR_RADIUS * Math.cos(phi);
      starPositions[i * 3 + 2] = STAR_RADIUS * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    });
    this.starField = new THREE.Points(starGeo, starMat);
    this.starField.renderOrder = -100.3;
    this.scene.add(this.starField);

    // Simple constellation patterns (ordered polylines of points on the star
    // sphere): Big Dipper, Orion (belt + shoulders/feet), Cassiopeia, Southern Cross.
    const constellationPolylines = [
      [[-60, 90, -110], [-45, 95, -115], [-30, 92, -120], [-15, 88, -118], [0, 78, -125], [10, 65, -122], [-5, 60, -110]],
      [[65, 90, -95], [70, 70, -100], [60, 45, -108]],
      [[108, 88, -98], [100, 66, -104], [112, 42, -110]],
      [[70, 70, -100], [85, 68, -102], [100, 66, -104]],
      [[-100, 100, 40], [-80, 115, 45], [-60, 102, 48], [-40, 118, 44], [-20, 105, 40]],
      [[30, 130, 90], [30, 100, 95]],
      [[10, 118, 92], [50, 112, 93]],
    ];
    const constellationPositions = [];
    for (const line of constellationPolylines) {
      for (let i = 0; i < line.length - 1; i++) {
        constellationPositions.push(...line[i], ...line[i + 1]);
      }
    }
    const constellationGeo = new THREE.BufferGeometry();
    constellationGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(constellationPositions), 3));
    const constellationMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    });
    this.constellationLines = new THREE.LineSegments(constellationGeo, constellationMat);
    this.constellationLines.renderOrder = -100.2;
    this.scene.add(this.constellationLines);

    // Milky Way: a soft gradient band wrapped around a thin open cylinder.
    let milkyWayTexture = null;
    if (typeof document !== 'undefined') {
      const mwCanvas = document.createElement('canvas');
      mwCanvas.width = 512;
      mwCanvas.height = 64;
      const wctx = mwCanvas.getContext?.('2d');
      if (wctx) {
        const wgrad = wctx.createLinearGradient(0, 0, 0, 64);
        wgrad.addColorStop(0, 'rgba(210,225,255,0)');
        wgrad.addColorStop(0.5, 'rgba(225,235,255,0.9)');
        wgrad.addColorStop(1, 'rgba(210,225,255,0)');
        wctx.fillStyle = wgrad;
        wctx.fillRect(0, 0, 512, 64);
        milkyWayTexture = new THREE.CanvasTexture(mwCanvas);
      }
    }
    const milkyWayGeo = new THREE.CylinderGeometry(174, 174, 40, 48, 1, true);
    const milkyWayMat = new THREE.MeshBasicMaterial({
      map: milkyWayTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    this.milkyWay = new THREE.Mesh(milkyWayGeo, milkyWayMat);
    this.milkyWay.rotation.z = Math.PI * 0.18; // tilt the band across the sky
    this.milkyWay.rotation.x = Math.PI * 0.06;
    this.milkyWay.renderOrder = -100.1;
    this.scene.add(this.milkyWay);

    // Soft additive radial-gradient texture reused for bloom halos (torches,
    // glow blocks, sun) and the sunset/sunrise lens flare.
    this._glowHaloTexture = null;
    if (typeof document !== 'undefined') {
      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = 64;
      glowCanvas.height = 64;
      const gctx = glowCanvas.getContext?.('2d');
      if (gctx) {
        const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,0.95)');
        grad.addColorStop(0.35, 'rgba(255,224,160,0.55)');
        grad.addColorStop(1, 'rgba(255,180,80,0)');
        gctx.fillStyle = grad;
        gctx.fillRect(0, 0, 64, 64);
        this._glowHaloTexture = new THREE.CanvasTexture(glowCanvas);
      }
    }

    // Sun bloom / god-ray-ish glow + sunrise/sunset lens flare (single sprite)
    const sunGlowMat = new THREE.SpriteMaterial({
      map: this._glowHaloTexture,
      color: 0xfff2d6,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });
    this.sunGlow = new THREE.Sprite(sunGlowMat);
    this.sunGlow.scale.set(46, 46, 1);
    this.sunGlow.renderOrder = -97;
    this.scene.add(this.sunGlow);

    this.scene.background = new THREE.Color(0x87b5ff);
    this.scene.fog = new THREE.FogExp2(0x87b5ff, 0.007);
    this.scene.fog.near = 60;
    this.scene.fog.far = 180;

    // Volumetric light rays from sun direction (simple cone mesh)
    const lightRayGeo = new THREE.ConeGeometry(18, 90, 16, 1, true);
    const lightRayMat = new THREE.MeshBasicMaterial({
      color: 0xfff5cc,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.volumetricLightRays = new THREE.Mesh(lightRayGeo, lightRayMat);
    this.volumetricLightRays.renderOrder = -80;
    this.scene.add(this.volumetricLightRays);

    // Sunset/Sunrise Lens flare sprite & Horizon glow
    const lensFlareMat = new THREE.SpriteMaterial({
      map: this._glowHaloTexture,
      color: 0xff8833,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });
    this.lensFlareSprite = new THREE.Sprite(lensFlareMat);
    this.lensFlareSprite.scale.set(65, 65, 1);
    this.lensFlareSprite.renderOrder = -96;
    this.scene.add(this.lensFlareSprite);

    const horizonGlowGeo = new THREE.PlaneGeometry(350, 40);
    const horizonGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff7733,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.horizonGlowMesh = new THREE.Mesh(horizonGlowGeo, horizonGlowMat);
    this.horizonGlowMesh.renderOrder = -95;
    this.scene.add(this.horizonGlowMesh);

    // Water surface reflection plane — Fresnel reflections + light blue SSS + multi-frequency waves
    const waterGeo = new THREE.PlaneGeometry(400, 400, 64, 64);
    const waterMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(0x2266aa) },
        uSunColor: { value: new THREE.Color(0xffffff) },
        uSunDir: { value: new THREE.Vector3(0.4, 1.0, 0.2) },
        uTime: { value: 0 },
        uOpacity: { value: 0.55 },
        uSunIntensity: { value: 1.0 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        uniform float uTime;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          // Multi-frequency wave displacement
          float w1 = sin(worldPos.x * 0.35 + uTime * 1.4) * 0.12;
          float w2 = sin(worldPos.z * 0.45 - uTime * 1.1) * 0.08;
          float w3 = sin((worldPos.x + worldPos.z) * 0.8 + uTime * 1.8) * 0.04;
          worldPos.y += w1 + w2 + w3;
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uSunColor;
        uniform vec3 uSunDir;
        uniform float uTime;
        uniform float uOpacity;
        uniform float uSunIntensity;
        varying vec3 vWorldPos;

        void main() {
          // Multiple frequency layers for animated normal
          vec3 N = normalize(vec3(
            sin(vWorldPos.x * 0.35 + uTime * 1.4) * 0.15 + sin(vWorldPos.z * 0.8 - uTime * 2.0) * 0.08,
            1.0,
            sin(vWorldPos.z * 0.45 + uTime * 1.1) * 0.15 + sin(vWorldPos.x * 0.7 + uTime * 1.8) * 0.08
          ));
          vec3 V = normalize(cameraPosition - vWorldPos);

          // Fresnel reflections
          float fresnel = clamp(pow(1.0 - max(dot(N, V), 0.0), 3.5) * 0.88 + 0.08, 0.0, 1.0);
          vec3 skyReflect = mix(uColor * 1.4, uSunColor, 0.4);

          // Subsurface scattering approximation: light blue glow
          float sssDir = max(0.0, dot(V, -normalize(uSunDir) + N * 0.3));
          float sssFactor = pow(sssDir, 2.2) * 0.6 + max(0.0, dot(N, normalize(uSunDir))) * 0.25;
          vec3 sssGlow = vec3(0.15, 0.80, 0.95) * sssFactor * (0.3 + 0.7 * uSunIntensity);

          // Animated caustic interference pattern
          float c1 = sin(vWorldPos.x * 0.6 + uTime * 1.3) * sin(vWorldPos.z * 0.6 - uTime * 1.1);
          float c2 = sin(vWorldPos.x * 1.3 - uTime * 0.7) * sin(vWorldPos.z * 1.3 + uTime * 0.9);
          float caustic = smoothstep(0.55, 0.95, max(c1, c2) * 0.5 + 0.5);

          // Water depth color variation: shallow cyan-blue to deep dark navy
          vec3 deep = vec3(0.04, 0.12, 0.38);
          vec3 shallow = vec3(0.38, 0.85, 0.96);
          float depthFactor = clamp((32.0 - vWorldPos.y) * 0.15 + (1.0 - fresnel) * 0.5, 0.0, 1.0);
          vec3 baseWater = mix(shallow, deep, depthFactor);
          vec3 rgb = mix(baseWater, skyReflect, fresnel * 0.5) + sssGlow * 0.45 + vec3(0.5, 0.85, 0.95) * caustic * 0.18;

          float alpha = clamp(uOpacity + fresnel * 0.35, 0.0, 0.92);
          gl_FragColor = vec4(rgb, alpha);
        }
      `,
    });
    this.waterSurface = new THREE.Mesh(waterGeo, waterMat);
    this.waterSurface.rotation.x = -Math.PI / 2;
    this.waterSurface.position.y = 31.5; // Just below surface blocks
    this.waterSurface.renderOrder = -50;
    this.scene.add(this.waterSurface);

    // Grass blade particles — instanced patches on terrain
    this._grassBlades = null;
    this._grassTimer = 0;
    const GRASS_COUNT = 3000;
    const bladeGeo = new THREE.PlaneGeometry(0.1, 0.5);
    const bladeMat = new THREE.MeshBasicMaterial({
      color: 0x44aa22,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this._grassBlades = new THREE.InstancedMesh(bladeGeo, bladeMat, GRASS_COUNT);
    this._grassBlades.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._grassBlades.frustumCulled = false;
    this.scene.add(this._grassBlades);

    // Pre-compute dummy matrices
    this._grassDummy = new THREE.Object3D();
    this._grassMatrices = [];
    let gseed = 7777;
    const grnd = () => { gseed = (gseed * 16807) % 2147483647; return (gseed - 1) / 2147483646; };
    for (let i = 0; i < GRASS_COUNT; i++) {
      this._grassDummy.position.set(
        (grnd() - 0.5) * 300,
        0,
        (grnd() - 0.5) * 300
      );
      this._grassDummy.rotation.set(
        (grnd() - 0.5) * 0.3,
        grnd() * Math.PI * 2,
        (grnd() - 0.5) * 0.3
      );
      this._grassDummy.scale.setScalar(0.5 + grnd() * 1.0);
      this._grassDummy.updateMatrix();
      this._grassBlades.setMatrixAt(i, this._grassDummy.matrix);
    }
    this._grassBlades.instanceMatrix.needsUpdate = true;

    // Vine / foliage overlays — instanced hanging vines on tree leaves
    const VINE_COUNT = 800;
    const vineGeo = new THREE.CylinderGeometry(0.03, 0.05, 1.2, 4);
    const vineMat = new THREE.MeshBasicMaterial({
      color: 0x2e8b57,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    this._vines = new THREE.InstancedMesh(vineGeo, vineMat, VINE_COUNT);
    this._vines.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._vines.frustumCulled = false;
    this.scene.add(this._vines);
    this._vineDummy = new THREE.Object3D();
    for (let i = 0; i < VINE_COUNT; i++) {
      this._vineDummy.position.set(0, -1000, 0);
      this._vineDummy.scale.setScalar(0);
      this._vineDummy.updateMatrix();
      this._vines.setMatrixAt(i, this._vineDummy.matrix);
    }
    this._vines.instanceMatrix.needsUpdate = true;

    // Moss overlays on stone/dirt blocks near ground level in forest/tropical biomes
    this._mossPatches = null;
    this._mossTimer = 0;
    const MOSS_COUNT = 600;
    const mossGeo = new THREE.PlaneGeometry(0.8, 0.8);
    const mossMat = new THREE.MeshBasicMaterial({
      color: 0x3d7023,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this._mossPatches = new THREE.InstancedMesh(mossGeo, mossMat, MOSS_COUNT);
    this._mossPatches.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._mossPatches.frustumCulled = false;
    this.scene.add(this._mossPatches);
    this._mossDummy = new THREE.Object3D();
    for (let i = 0; i < MOSS_COUNT; i++) {
      this._mossDummy.position.set(0, -1000, 0);
      this._mossDummy.scale.setScalar(0);
      this._mossDummy.updateMatrix();
      this._mossPatches.setMatrixAt(i, this._mossDummy.matrix);
    }
    this._mossPatches.instanceMatrix.needsUpdate = true;

    // Flower patches on grass blocks
    this._flowerPatches = null;
    this._flowerTimer = 0;
    const FLOWER_COUNT = 400;
    const flowerGeo = new THREE.PlaneGeometry(0.35, 0.35);
    const flowerMat = new THREE.MeshBasicMaterial({
      color: 0xe85d75,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this._flowerPatches = new THREE.InstancedMesh(flowerGeo, flowerMat, FLOWER_COUNT);
    this._flowerPatches.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._flowerPatches.frustumCulled = false;
    this.scene.add(this._flowerPatches);
    this._flowerDummy = new THREE.Object3D();
    this._flowerPatches.instanceMatrix.needsUpdate = true;

    // Environmental Particles (Pollen, Fireflies, Snow hints)
    const POLLEN_COUNT = 220;
    const pollenGeo = new THREE.BufferGeometry();
    const pollenPos = new Float32Array(POLLEN_COUNT * 3);
    for (let i = 0; i < POLLEN_COUNT * 3; i += 3) {
      pollenPos[i] = (Math.random() - 0.5) * 60;
      pollenPos[i + 1] = Math.random() * 15;
      pollenPos[i + 2] = (Math.random() - 0.5) * 60;
    }
    pollenGeo.setAttribute('position', new THREE.BufferAttribute(pollenPos, 3));
    const pollenMat = new THREE.PointsMaterial({
      color: 0xd8ee44,
      size: 0.28,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this._pollenParticles = new THREE.Points(pollenGeo, pollenMat);
    this.scene.add(this._pollenParticles);

    const FIREFLY_COUNT = 150;
    const fireflyGeo = new THREE.BufferGeometry();
    const fireflyPos = new Float32Array(FIREFLY_COUNT * 3);
    for (let i = 0; i < FIREFLY_COUNT * 3; i += 3) {
      fireflyPos[i] = (Math.random() - 0.5) * 50;
      fireflyPos[i + 1] = 1 + Math.random() * 5;
      fireflyPos[i + 2] = (Math.random() - 0.5) * 50;
    }
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
    const fireflyMat = new THREE.PointsMaterial({
      color: 0xeeff55,
      size: 0.45,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this._fireflyParticles = new THREE.Points(fireflyGeo, fireflyMat);
    this.scene.add(this._fireflyParticles);

    const SNOW_COUNT = 180;
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(SNOW_COUNT * 3);
    for (let i = 0; i < SNOW_COUNT * 3; i += 3) {
      snowPos[i] = (Math.random() - 0.5) * 70;
      snowPos[i + 1] = Math.random() * 20;
      snowPos[i + 2] = (Math.random() - 0.5) * 70;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xf0f8ff,
      size: 0.35,
      transparent: true,
      opacity: 0,
    });
    this._snowHintParticles = new THREE.Points(snowGeo, snowMat);
    this.scene.add(this._snowHintParticles);

    // Pebble/rock detail patches on dirt blocks
    const PEBBLE_COUNT = 400;
    const pebbleGeo = new THREE.DodecahedronGeometry(0.08, 0);
    const pebbleMat = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.85,
    });
    this._pebblePatches = new THREE.InstancedMesh(pebbleGeo, pebbleMat, PEBBLE_COUNT);
    this._pebblePatches.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._pebblePatches.frustumCulled = false;
    this.scene.add(this._pebblePatches);
    this._pebbleDummy = new THREE.Object3D();
    for (let i = 0; i < PEBBLE_COUNT; i++) {
      this._pebbleDummy.position.set(0, -1000, 0);
      this._pebbleDummy.scale.setScalar(0);
      this._pebbleDummy.updateMatrix();
      this._pebblePatches.setMatrixAt(i, this._pebbleDummy.matrix);
    }
    this._pebblePatches.instanceMatrix.needsUpdate = true;

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 200);
    /** P2 camera for local split-screen (active when coopMode). */
    this.camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 200);
    this._p2Yaw = 0;
    this._p2Pitch = 0;
    this._p2Offset = new THREE.Vector3(1.6, 0, 0);
    this._tmpRight = new THREE.Vector3();
    this._tmpFwd = new THREE.Vector3();

    // Contact shadow sprite under player
    if (typeof document !== 'undefined') {
      try {
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 64;
        shadowCanvas.height = 64;
        const shadowCtx = shadowCanvas.getContext?.('2d');
        if (shadowCtx) {
          const gradient = shadowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
          gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          shadowCtx.fillStyle = gradient;
          shadowCtx.fillRect(0, 0, 64, 64);
        }
        const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
        const shadowMat = new THREE.SpriteMaterial({
          map: shadowTexture,
          transparent: true,
          depthWrite: false,
          opacity: 0.6,
        });
        this.playerShadow = new THREE.Sprite(shadowMat);
        this.playerShadow.scale.set(2, 1.4, 1);
        this.scene.add(this.playerShadow);
      } catch (e) {
        const shadowMat = new THREE.SpriteMaterial({
          transparent: true,
          depthWrite: false,
          opacity: 0.6,
        });
        this.playerShadow = new THREE.Sprite(shadowMat);
        this.playerShadow.scale.set(2, 1.4, 1);
        this.scene.add(this.playerShadow);
      }
    }

    // Apply render distance from settings
    this._applyRenderDistance();

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 250;
    this.sunLight.shadow.camera.left = -100;
    this.sunLight.shadow.camera.right = 100;
    this.sunLight.shadow.camera.top = 100;
    this.sunLight.shadow.camera.bottom = -100;
    this.sunLight.shadow.bias = -0.001;
    this.sunLight.shadow.normalBias = 0.02;

    this.sunTarget = new THREE.Object3D();
    this.sunTarget.position.set(0, 40, 0);
    this.scene.add(this.sunTarget);
    this.sunLight.target = this.sunTarget;

    this.ambientLight = new THREE.HemisphereLight(0x86a8d7, 0x3a4a2a, 0.6);
    this.scene.add(this.ambientLight, this.sunLight);

    // Aliases for backwards compatibility
    this.sun = this.sunLight;
    this.ambient = this.ambientLight;
    this.hemi = this.ambientLight;

    // Torch point light pool
    this._torchLights = [];
    const TORCH_LIGHT_MAX = 24; // Max visible torches
    for (let i = 0; i < TORCH_LIGHT_MAX; i++) {
      const light = new THREE.PointLight(0xffaa44, 0, 12, 2);
      light.visible = false;
      this.scene.add(light);
      this._torchLights.push(light);
    }
    this._torchUpdateTimer = 0;
    this._waterTimer = 0;

    // Glow block point light pool
    this._glowLights = [];
    const GLOW_LIGHT_MAX = 16;
    for (let i = 0; i < GLOW_LIGHT_MAX; i++) {
      const light = new THREE.PointLight(0xffddaa, 0, 10, 2);
      light.visible = false;
      this.scene.add(light);
      this._glowLights.push(light);
    }
    this._glowTimer = 0;

    // Underwater caustics light
    this._causticsLight = new THREE.PointLight(0x44ccff, 0, 25, 2);
    this._causticsLight.visible = false;
    this.scene.add(this._causticsLight);

    this._initProceduralTerrain();
    this._initLightingEffects();
    this._initWaterVFX();
    this._initWeatherVFX();
    this._initCreaturesVFX();
    this._blockPops = [];
    this._screenShakeAcc = 0;
    this._caveEnclosedFactor = 0;
    this._lastCamYaw = 0;
    this._lastCamPitch = 0;
    this._camRotVel = 0;

    this.clouds = new VoxelCloudLayer(this.scene);

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
      this.camera.far = Math.max(plan.cameraFar, 50);
      this.camera.updateProjectionMatrix();
    }
    if (this.camera2) {
      this.camera2.far = Math.max(plan.cameraFar, 50);
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
    this.render(dt);
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
          const hit = this.world.raycast(origin, dir, 6);
          if (hit && hit.id === BLOCK.BED) this._trySleep();
        }
      }

      if (this.player.pendingFallDamage > 0) {
        const dmg = this.player.pendingFallDamage;
        this.player.pendingFallDamage = 0;
        this.survival = applyDamage(this.survival, dmg, 'fall');
        this.audio.hurt();
        this.player.notify(dmg > 20 ? 'Hard landing!' : 'Oof — rough landing.', 1.6);
      }
      if (move.inWater && !this._wasInWater) {
        if (this.audio.splash) this.audio.splash();
        else this.audio.step('water');
        this._spawnWaterSplash(this.player.position.x, this.player.position.y, this.player.position.z, 22);
        this._spawnWaterRipple(this.player.position.x, this.player.position.y, this.player.position.z);
      }
      if (move.inWater && this.input.jump && Math.random() < 0.35) {
        this._spawnWaterSplash(this.player.position.x, this.player.position.y, this.player.position.z, 8);
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
      this._syncAnimalMeshes(dt);
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
    this._updateWaterEffects(dt);
    this._updateCreaturesVFX(dt);
    this._updateWeatherVFX(dt);
    this._updateBlockPops(dt);
    this._updateScreenVFX(dt);
    this.clouds?.update(dt);
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

    // Enhanced systems update
    this._updateCreatureEcology(dt);
    this._updateAudioSystem(dt);
    this._updateEnvironmentalInteractivity(dt);
    this._updatePlayerPhysics(dt);
    this._updateWeatherSystem(dt);
    this._updateCoopSystem(dt);

    // periodic autosave
    this._autosaveAcc += dt;
    if (this._autosaveAcc >= this._autosaveInterval) {
      this._autosaveAcc = 0;
      this.saveGame({ quiet: true });
    }
  }

  _updateCreatureEcology(dt) {
    if (!this.fauna || !this.started) return;
    this._ecologyTimer = (this._ecologyTimer || 0) + dt;

    // 1. Biome-based Creature Spawning (every 15s)
    if (this._ecologyTimer > 15) {
      this._ecologyTimer = 0;
      const px = this.player ? this.player.position.x : 0;
      const pz = this.player ? this.player.position.z : 0;
      const curBiome = biomeAt(Math.floor(px), Math.floor(pz), this.seed);
      const isNight = this.time.isNight();

      let desiredSpecies = ['hare', 'cow', 'chicken'];
      if (curBiome === 'forest' || curBiome === BIOME.FOREST) {
        desiredSpecies = ['wolf', 'deer', 'fox', 'boar', 'bear'];
      } else if (curBiome === 'ocean' || curBiome === BIOME.OCEAN || curBiome === 'shore' || curBiome === BIOME.SHORE || curBiome === 'tropical' || curBiome === BIOME.TROPICAL) {
        desiredSpecies = ['tropical_fish', 'sea_turtle', 'reef_shark', 'crab', 'alligator'];
      }
      if (isNight) {
        desiredSpecies.push('bat');
      }

      for (const spId of desiredSpecies) {
        const count = this.fauna.countLiving(spId);
        const spec = SPECIES[spId];
        if (spec && count < (spec.count || 3)) {
          const ang = Math.random() * Math.PI * 2;
          const rad = 20 + Math.random() * 18;
          const sx = px + Math.cos(ang) * rad;
          const sz = pz + Math.sin(ang) * rad;
          const sy = (this.world && typeof groundY === 'function') ? groundY(this.world, sx, sz) : 20;
          if (spec.aquatic) {
            const wY = (this.world && typeof waterSurfaceY === 'function') ? waterSurfaceY(this.world, sx, sz) : null;
            if (wY !== null) {
              const anim = this.fauna._make(spec, sx, wY - (spec.swimDepth || 0.8), sz);
              this.fauna.animals.push(anim);
            }
          } else if (this.world) {
            const bBelow = this.world.getBlock(Math.floor(sx), Math.floor(sy - 1), Math.floor(sz));
            if (bBelow !== BLOCK.WATER && bBelow !== BLOCK.AIR) {
              const anim = this.fauna._make(spec, sx, sy, sz);
              this.fauna.animals.push(anim);
            }
          }
        }
      }
    }

    // 2. Creature AI (Food/Water seeking), Predator/Prey & Tamed Companion dynamics
    const living = this.fauna.living();
    const mode = this.modeDef();
    const isNight = this.time.isNight();

    for (const a of living) {
      if (a.dead) continue;
      const spec = SPECIES[a.type];
      if (!spec) continue;

      // Herbivore / creature AI: seeking food & water when wandering
      if (a.state === 'wander' && Math.random() < 0.15) {
        const seekRadius = 8;
        let foodX = null, foodZ = null;
        for (let dx = -seekRadius; dx <= seekRadius && foodX === null; dx += 2) {
          for (let dz = -seekRadius; dz <= seekRadius && foodX === null; dz += 2) {
            const bx = Math.floor(a.x + dx);
            const bz = Math.floor(a.z + dz);
            const by = Math.floor(a.y);
            const bId = this.world.getBlock(bx, by, bz);
            const bBelow = this.world.getBlock(bx, by - 1, bz);
            if (bId === BLOCK.GRASS || bId === BLOCK.CROP || bId === BLOCK.BUSH || bBelow === BLOCK.WATER) {
              foodX = bx + 0.5;
              foodZ = bz + 0.5;
            }
          }
        }
        if (foodX !== null) {
          a.targetX = foodX;
          a.targetZ = foodZ;
          const distToFood = Math.hypot(foodX - a.x, foodZ - a.z);
          if (distToFood < 1.5 && this.fx) {
            this.fx.burst(a.x, a.y + 0.3, a.z, [0.3, 0.8, 0.3], 4);
          }
        }
      }

      // Handle breeding & inLove timer
      if (a._inLove > 0) {
        a._inLove -= dt;
        for (const partner of living) {
          if (partner !== a && partner.type === a.type && partner._inLove > 0 && !partner.dead) {
            const dx = a.x - partner.x;
            const dz = a.z - partner.z;
            if (dx * dx + dz * dz < 10) {
              a._inLove = 0;
              partner._inLove = 0;
              const baby = this.fauna._make(spec, (a.x + partner.x) * 0.5, (a.y + partner.y) * 0.5, (a.z + partner.z) * 0.5);
              baby.isBaby = true;
              baby.hp = Math.max(2, Math.floor(spec.hp * 0.5));
              this.fauna.animals.push(baby);
              if (this.fx) this.fx.burst(baby.x, baby.y + 0.5, baby.z, [1, 0.4, 0.7], 15);
              if (this.audio) this.audio.toast();
              if (this.player) this.player.notify(`A baby ${spec.name} was born!`, 3);
              break;
            }
          }
        }
      }

      // Tamed Companion behavior (wolves follow and protect player)
      if (a.tamed && this.player) {
        const px = this.player.position.x;
        const pz = this.player.position.z;
        const pdx = px - a.x;
        const pdz = pz - a.z;
        const pdist = Math.hypot(pdx, pdz);

        if (pdist > 22) {
          // Teleport companion closer if too far
          a.x = px + (Math.random() - 0.5) * 3;
          a.z = pz + (Math.random() - 0.5) * 3;
          a.y = (this.world && typeof groundY === 'function') ? groundY(this.world, a.x, a.z) : this.player.position.y;
        } else if (pdist > 5 && a.state !== 'chase') {
          a.state = 'wander';
          a.targetX = px + (Math.random() - 0.5) * 4;
          a.targetZ = pz + (Math.random() - 0.5) * 4;
        }

        if (this._lastPlayerAttackedAnimal && !this._lastPlayerAttackedAnimal.dead && this._lastPlayerAttackedAnimal !== a) {
          const target = this._lastPlayerAttackedAnimal;
          const tdx = target.x - a.x;
          const tdz = target.z - a.z;
          const tdist = Math.hypot(tdx, tdz);
          if (tdist < 16) {
            a.state = 'chase';
            a.vx = (tdx / tdist) * spec.speed * 1.35;
            a.vz = (tdz / tdist) * spec.speed * 1.35;
            if (tdist < 1.6 && (a.attackTimer || 0) <= 0) {
              a.attackTimer = 1.2;
              this.fauna.damageAnimal(target, 8);
              if (this.audio) this.audio.hit();
            }
          }
        }
      }

      // Predator vs Prey dynamics
      if (spec.hostile && !a.tamed) {
        const preyTypes = ['hare', 'chicken', 'deer', 'tropical_fish'];
        for (const prey of living) {
          if (!prey.dead && preyTypes.includes(prey.type)) {
            const dx = prey.x - a.x;
            const dz = prey.z - a.z;
            const d2 = dx * dx + dz * dz;
            if (d2 < 12 * 12 && a.state !== 'chase') {
              a.state = 'chase';
              const dist = Math.sqrt(d2);
              a.vx = (dx / dist) * spec.speed;
              a.vz = (dz / dist) * spec.speed;
              if (dist < (spec.attackRange || 1.4) && (a.attackTimer || 0) <= 0) {
                a.attackTimer = spec.attackCd || 1.4;
                this.fauna.damageAnimal(prey, spec.damage || 10);
                if (this.fx) this.fx.burst(prey.x, prey.y + 0.4, prey.z, [0.8, 0.1, 0.1], 8);
                if (this.audio) this.audio.hit();
              }
              break;
            }
          }
        }

        if (isNight && mode.hostilePolicy === 'hunt' && this.player) {
          const pdx = this.player.position.x - a.x;
          const pdz = this.player.position.z - a.z;
          if (pdx * pdx + pdz * pdz < 18 * 18) {
            a.state = 'chase';
            a.aggro = true;
          }
        }
      }
    }
  }

  _updateAudioSystem(dt) {
    if (!this.audio || !this.started) return;

    // Ambient mix tick
    const px = this.player ? Math.floor(this.player.position.x) : 0;
    const pz = this.player ? Math.floor(this.player.position.z) : 0;
    const curBiome = biomeAt(px, pz, this.seed);
    const nearWater = this.world ? this.world.getBlock(px, Math.floor(this.player?.position.y || 20), pz) === BLOCK.WATER : false;
    this.audio.tickAmbient(dt, {
      biome: curBiome,
      isNight: this.time.isNight(),
      weather: this.time.weather,
      nearWater,
      dayPhase: this.time.getSunProgress?.() || 0.25,
      dead: !!this.survival?.dead,
    });

    // Night crickets
    if (this.time.isNight() && !this.survival?.dead) {
      this._cricketTimer = (this._cricketTimer || 0) - dt;
      if (this._cricketTimer <= 0) {
        this._cricketTimer = 6 + Math.random() * 8;
        this.audio.beep(4200 + Math.random() * 600, 0.03, 'sine', 0.02);
      }
    }

    // Creature vocalizations
    this._sfxCreatureTimer = (this._sfxCreatureTimer || 0) + dt;
    if (this._sfxCreatureTimer > 8) {
      this._sfxCreatureTimer = 0;
      if (this.fauna && this.player) {
        const ppos = this.player.position;
        for (const a of this.fauna.living()) {
          const dx = a.x - ppos.x;
          const dz = a.z - ppos.z;
          if (dx * dx + dz * dz < 18 * 18) {
            if (a.type === 'cow') {
              this.audio.beep(130, 0.35, 'sawtooth', 0.08);
              break;
            } else if (a.type === 'chicken') {
              this.audio.beep(650, 0.04, 'sine', 0.06);
              setTimeout(() => this.audio.beep?.(750, 0.04, 'sine', 0.05), 60);
              break;
            } else if (a.type === 'bird' || a.type === 'bat') {
              this.audio.beep(1400, 0.05, 'triangle', 0.05);
              break;
            } else if (a.type === 'wolf' && (this.time.isNight() || a.tamed)) {
              if (this.audio._wolfHowl) this.audio._wolfHowl();
              break;
            } else if (a.type === 'hare' || a.type === 'fox') {
              this.audio.beep(950, 0.03, 'sine', 0.04);
              break;
            }
          }
        }
      }
    }

    // Footstep leaves rustling
    if (this.player && this.player.onGround && (this.player.vx || this.player.vz)) {
      const feetId = this.world.getBlock(
        Math.floor(this.player.position.x),
        Math.floor(this.player.position.y),
        Math.floor(this.player.position.z)
      );
      if (feetId === BLOCK.LEAVES || feetId === BLOCK.SPRUCE_LEAVES || feetId === BLOCK.BUSH || feetId === BLOCK.PALM_LEAVES) {
        if (Math.random() < 0.25) {
          this.audio.beep(380 + Math.random() * 140, 0.04, 'triangle', 0.03);
        }
      }
    }
  }

  _fellTree(x, y, z) {
    if (!this.world) return;
    const trunkIds = [BLOCK.LOG, BLOCK.SPRUCE_LOG, BLOCK.SEQUOIA_LOG];
    const leafIds = [BLOCK.LEAVES, BLOCK.SPRUCE_LEAVES, BLOCK.SEQUOIA_LEAVES, BLOCK.PALM_LEAVES];

    let topY = y;
    for (let cy = y + 1; cy <= y + 12; cy++) {
      const b = this.world.getBlock(x, cy, z);
      if (trunkIds.includes(b)) {
        topY = cy;
        this.world.setBlock(x, cy, z, BLOCK.AIR);
        const dropItem = b === BLOCK.SPRUCE_LOG ? ITEM.SPRUCE_LOG : (b === BLOCK.SEQUOIA_LOG ? ITEM.SEQUOIA_LOG : ITEM.LOG);
        if (this.player) {
          const add = addItems(this.player.slots, dropItem, 1);
          this.player.slots = add.slots;
        }
        if (this.fx) this.fx.burst(x, cy, z, [0.45, 0.3, 0.15], 6);
      } else {
        break;
      }
    }

    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = topY - 2; dy <= topY + 3; dy++) {
          const lb = this.world.getBlock(x + dx, dy, z + dz);
          if (leafIds.includes(lb)) {
            if (Math.random() < 0.75) {
              this.world.setBlock(x + dx, dy, z + dz, BLOCK.AIR);
              if (this.fx) this.fx.burst(x + dx, dy, z + dz, [0.2, 0.7, 0.2], 5);
              if (Math.random() < 0.1 && this.player) {
                const item = Math.random() < 0.3 ? ITEM.APPLE : ITEM.STICK;
                this.player.slots = addItems(this.player.slots, item, 1).slots;
              }
            }
          }
        }
      }
    }
  }

  _updateEnvironmentalInteractivity(dt) {
    this._updateWaterFlow(dt);
    this._updateFireSpread(dt);
    this._updatePlantGrowth(dt);
    this._updateSeasonalChanges(dt);
  }

  _updateWaterFlow(dt) {
    this._waterFlowTimer = (this._waterFlowTimer || 0) + dt;
    if (this._waterFlowTimer < 0.4) return;
    this._waterFlowTimer = 0;

    if (!this.world || !this.player) return;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);

    const rad = 6;
    for (let dx = -rad; dx <= rad; dx += 2) {
      for (let dz = -rad; dz <= rad; dz += 2) {
        for (let dy = -2; dy <= 2; dy++) {
          const wx = px + dx;
          const wy = py + dy;
          const wz = pz + dz;
          if (this.world.getBlock(wx, wy, wz) === BLOCK.WATER) {
            if (this.world.getBlock(wx, wy - 1, wz) === BLOCK.AIR) {
              this.world.setBlock(wx, wy - 1, wz, BLOCK.WATER);
              return;
            }
            const neighbors = [[wx + 1, wy, wz], [wx - 1, wy, wz], [wx, wy, wz + 1], [wx, wy, wz - 1]];
            for (const [nx, ny, nz] of neighbors) {
              if (this.world.getBlock(nx, ny, nz) === BLOCK.AIR && isSolid(this.world.getBlock(nx, ny - 1, nz))) {
                if (Math.random() < 0.3) {
                  this.world.setBlock(nx, ny, nz, BLOCK.WATER);
                  return;
                }
              }
            }
          }
        }
      }
    }
  }

  _updateFireSpread(dt) {
    this._fireSpreadTimer = (this._fireSpreadTimer || 0) + dt;
    if (this._fireSpreadTimer < 1.5) return;
    this._fireSpreadTimer = 0;

    if (this.time.weather === 'rain') return;
    if (!this.world || !this.player) return;

    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const flammable = [BLOCK.LOG, BLOCK.PLANKS, BLOCK.LEAVES, BLOCK.BUSH, BLOCK.SPRUCE_LOG, BLOCK.SPRUCE_LEAVES, BLOCK.STICK_PILE];

    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -5; dz <= 5; dz++) {
        for (let dy = -2; dy <= 2; dy++) {
          const fx = px + dx;
          const fy = py + dy;
          const fz = pz + dz;
          if (this.world.getBlock(fx, fy, fz) === BLOCK.CAMPFIRE) {
            const neighbors = [
              [fx + 1, fy, fz], [fx - 1, fy, fz],
              [fx, fy + 1, fz], [fx, fy, fz + 1], [fx, fy, fz - 1]
            ];
            for (const [nx, ny, nz] of neighbors) {
              const nb = this.world.getBlock(nx, ny, nz);
              if (flammable.includes(nb) && Math.random() < 0.15) {
                this.world.setBlock(nx, ny, nz, BLOCK.AIR);
                if (this.fx) this.fx.burst(nx, ny, nz, [0.9, 0.4, 0.1], 8);
                if (this.audio) this.audio.beep(200, 0.05, 'sawtooth', 0.04);
                return;
              }
            }
          }
        }
      }
    }
  }

  _updatePlantGrowth(dt) {
    this._plantGrowthTimer = (this._plantGrowthTimer || 0) + dt;
    if (this._plantGrowthTimer < 4.0) return;
    this._plantGrowthTimer = 0;

    if (!this.world || !this.player) return;
    const season = Math.floor((this.time.dayNumber || 0) / 4) % 4;
    if ((season === 0 || season === 1) && Math.random() < 0.35) {
      const px = Math.floor(this.player.position.x) + ((Math.random() * 12 - 6) | 0);
      const pz = Math.floor(this.player.position.z) + ((Math.random() * 12 - 6) | 0);
      const py = (typeof groundY === 'function') ? groundY(this.world, px, pz) : 20;
      if (this.world.getBlock(px, py - 1, pz) === BLOCK.GRASS && this.world.getBlock(px, py, pz) === BLOCK.AIR) {
        this.world.setBlock(px, py, pz, Math.random() < 0.5 ? BLOCK.BUSH : BLOCK.FLOWER);
      }
    }
  }

  _updateSeasonalChanges(dt) {
    this._seasonTimer = (this._seasonTimer || 0) + dt;
    if (this._seasonTimer < 5.0) return;
    this._seasonTimer = 0;

    const season = Math.floor((this.time.dayNumber || 0) / 4) % 4;
    if (season === 3 || this.time.weather === 'snow') {
      if (this.player && this.world) {
        const px = Math.floor(this.player.position.x) + ((Math.random() * 16 - 8) | 0);
        const pz = Math.floor(this.player.position.z) + ((Math.random() * 16 - 8) | 0);
        const b = biomeAt(px, pz, this.seed);
        if (b !== 'desert' && b !== BIOME.DESERT && b !== 'tropical' && b !== BIOME.TROPICAL) {
          const py = (typeof groundY === 'function') ? groundY(this.world, px, pz) : 20;
          if (this.world.getBlock(px, py, pz) === BLOCK.AIR && isSolid(this.world.getBlock(px, py - 1, pz))) {
            this.world.setBlock(px, py, pz, BLOCK.SNOW);
          }
        }
      }
    } else if (season === 0 || this.time.weather === 'clear') {
      // Snow melts in warm clear weather
      if (this.player && this.world && Math.random() < 0.4) {
        const px = Math.floor(this.player.position.x) + ((Math.random() * 16 - 8) | 0);
        const pz = Math.floor(this.player.position.z) + ((Math.random() * 16 - 8) | 0);
        const py = (typeof groundY === 'function') ? groundY(this.world, px, pz) : 20;
        if (this.world.getBlock(px, py, pz) === BLOCK.SNOW) {
          this.world.setBlock(px, py, pz, BLOCK.AIR);
        }
      }
    }
  }

  _updatePlayerPhysics(dt) {
    if (!this.player || !this.started || !this.world) return;

    const eyeY = this.player.position.y + 1.6;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const eyeId = this.world.getBlock(px, Math.floor(eyeY), pz);
    const feetId = this.world.getBlock(px, py, pz);

    // Swimming & underwater movement
    const inWater = eyeId === BLOCK.WATER || feetId === BLOCK.WATER;
    if (inWater) {
      if (this.input && this.input.wantsJump && this.input.wantsJump()) {
        this.player.position.y += 4.2 * dt;
      }
      if (Math.random() < 0.15 && this.fx) {
        this.fx.burst(this.player.position.x, this.player.position.y + 0.8, this.player.position.z, [0.6, 0.8, 1.0], 3);
      }
    }

    // Climbing Mechanics (Ladders, Vines, Roots, Scaffolding)
    const isClimbable = feetId === BLOCK.LADDER || feetId === BLOCK.VINES || feetId === BLOCK.ROOTS || feetId === BLOCK.SCAFFOLDING || eyeId === BLOCK.LADDER;
    if (isClimbable && this.input) {
      if (this.input.wantsForward?.() || this.input.wantsJump?.()) {
        this.player.position.y += 3.8 * dt;
      } else if (this.input.wantsBack?.() || this.input.crouching) {
        this.player.position.y -= 3.2 * dt;
      }
    }

    // Fall damage calculation on landing
    if (!this.player.onGround) {
      if (this._fallStartY === undefined || this.player.position.y > this._fallStartY) {
        this._fallStartY = this.player.position.y;
      }
    } else {
      if (this._fallStartY !== undefined) {
        const fallDist = this._fallStartY - this.player.position.y;
        this._fallStartY = undefined;

        const landingBlock = feetId || this.world.getBlock(px, py - 1, pz);
        const isSafeLanding = landingBlock === BLOCK.WATER || landingBlock === BLOCK.LEAVES || landingBlock === BLOCK.SNOW;
        if (fallDist > 3.8 && !isSafeLanding) {
          const dmg = Math.round((fallDist - 3.2) * 7.5);
          this.survival = applyDamage(this.survival, dmg, 'fall');
          if (this.audio) this.audio.hurt();
          this.player.notify(dmg > 20 ? 'Oof — hard landing!' : 'Rough fall!', 2);
        }
      }
    }
  }

  _updateWeatherSystem(dt) {
    if (!this.started || !this.scene) return;

    if (this.time.weather === 'rain' || this.time.weather === 'snow') {
      this._lightningTimer = (this._lightningTimer || 0) + dt;
      if (this._lightningTimer > 16.0) {
        this._lightningTimer = 0;
        if (this.audio && this.audio.thunder) this.audio.thunder();

        if (this.player && this.world) {
          const lx = this.player.position.x + (Math.random() * 30 - 15);
          const lz = this.player.position.z + (Math.random() * 30 - 15);
          const ly = (typeof groundY === 'function') ? groundY(this.world, lx, lz) : 20;

          const boltGeo = new THREE.CylinderGeometry(0.1, 0.4, 60, 6);
          const boltMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
          const boltMesh = new THREE.Mesh(boltGeo, boltMat);
          boltMesh.position.set(lx, ly + 30, lz);
          this.scene.add(boltMesh);

          if (this.fx) this.fx.burst(lx, ly, lz, [1.0, 0.9, 0.4], 20);

          // Fire on impact if flammable block
          const bAt = this.world.getBlock(Math.floor(lx), Math.floor(ly), Math.floor(lz));
          if (bAt === BLOCK.LOG || bAt === BLOCK.LEAVES || bAt === BLOCK.GRASS) {
            this.world.setBlock(Math.floor(lx), Math.floor(ly), Math.floor(lz), BLOCK.AIR);
          }

          setTimeout(() => {
            this.scene.remove(boltMesh);
            boltGeo.dispose();
            boltMat.dispose();
          }, 180);
        }
      }
    }

    if (this.scene.fog) {
      if (this.time.weather === 'rain' || this.time.weather === 'snow') {
        this.scene.fog.near = 15;
        this.scene.fog.far = 60;
      } else {
        this.scene.fog.near = 40;
        this.scene.fog.far = 130;
      }
    }
  }

  _updateCoopSystem(dt) {
    if (!this.coopMode || !this.player2 || !this.started) return;

    const d2 = horizDistance ? horizDistance(this.player.position, this.player2.position) : Math.hypot(this.player.position.x - this.player2.position.x, this.player.position.z - this.player2.position.z);
    if (d2 < 4.0) {
      this._lastHeat = Math.max(this._lastHeat || 0, 10);
    }
    // Shared revival mechanism
    if (this.survival?.dead && !this.survival2?.dead && d2 < 3.5) {
      if (this.input2?.consumeAction?.() || this.input2?.consumePlace?.()) {
        this.survival.dead = false;
        this.survival.health = 25;
        this.player.notify('Revived by P2!', 3);
        if (this.audio) this.audio.toast();
      }
    } else if (this.survival2?.dead && !this.survival?.dead && d2 < 3.5) {
      if (this.input?.consumeAction?.() || this.input?.consumePlace?.()) {
        this.survival2.dead = false;
        this.survival2.health = 25;
        this.player2.notify('Revived by P1!', 3);
        if (this.audio) this.audio.toast();
      }
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

  updateTorchLights() {
    if (!this.player || !this.world) return;

    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);

    // Find torch blocks near the player
    const torchPositions = [];
    const searchRadius = 32;
    const TORCH = 'TORCH';

    for (let x = px - searchRadius; x <= px + searchRadius; x++) {
      for (let z = pz - searchRadius; z <= pz + searchRadius; z++) {
        for (let y = Math.max(0, py - 8); y <= py + 16; y++) {
          const block = this.world.getBlock(x, y, z);
          if (block && (block === BLOCK.TORCH || block === BLOCK.SOUL_TORCH || block === BLOCK.REDSTONE_TORCH || String(block).includes(TORCH))) {
            const dist = Math.hypot(x - px, y - py, z - pz);
            if (dist < searchRadius) {
              torchPositions.push({ x: x + 0.5, y: y + 1, z: z + 0.5, dist });
            }
          }
        }
      }
    }

    // Sort by distance, use nearest ones
    torchPositions.sort((a, b) => a.dist - b.dist);

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const tick200 = Math.floor(now / 200);

    // Update light pool with ±10% flicker every 200ms & warmer color temperature shift
    for (let i = 0; i < this._torchLights.length; i++) {
      const light = this._torchLights[i];
      if (i < torchPositions.length) {
        const tp = torchPositions[i];
        light.position.set(tp.x, tp.y, tp.z);
        const baseIntensity = Math.max(0.5, 1.5 - tp.dist * 0.03);

        // Torch flickering: ±10% variation every 200ms
        const hash = Math.sin(tick200 * 12.9898 + i * 78.233 + tp.x * 3.1) * 43758.5453;
        const flicker = ((hash - Math.floor(hash)) - 0.5) * 0.20; // -0.10 to +0.10
        light.intensity = Math.max(0.2, baseIntensity * (1.0 + flicker));
        light.visible = true;

        // Subtle color temperature shift (warmer hue & lower lightness when flickering dimmer)
        const baseHue = 0.07 + (tp.x * 0.001 + tp.z * 0.002) % 0.03;
        const warmerHue = Math.max(0.03, baseHue + flicker * 0.12);
        light.color.setHSL(warmerHue, 0.95, 0.58 + flicker * 0.08);
      } else {
        light.visible = false;
      }
    }
  }

  updateGlowBlocks() {
    if (!this.player || !this.world || !this._glowLights) return;

    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);

    const glowPositions = [];
    const searchRadius = 32;

    for (let x = px - searchRadius; x <= px + searchRadius; x++) {
      for (let z = pz - searchRadius; z <= pz + searchRadius; z++) {
        for (let y = Math.max(0, py - 12); y <= py + 16; y++) {
          const block = this.world.getBlock(x, y, z);
          if (!block) continue;

          let color = null;
          let intensity = 1.2;
          let distance = 10;

          if ((BLOCK.GLOWSTONE && block === BLOCK.GLOWSTONE) || block === 34 /* LAMP */) {
            color = 0xffe082;
            intensity = 1.8;
            distance = 12;
          } else if (block === BLOCK.LAVA || block === 38) {
            color = 0xff5500;
            intensity = 2.0;
            distance = 14;
          } else if ((BLOCK.CORAL && block === BLOCK.CORAL) || block === 48) {
            color = 0x44eedd;
            intensity = 1.0;
            distance = 8;
          } else if ((BLOCK.SEAPLANT && block === BLOCK.SEAPLANT) || block === 49 /* KELP */ || block === 50 /* SEAGRASS */) {
            color = 0x22ffaa;
            intensity = 0.9;
            distance = 6;
          } else if ((BLOCK.LILY_PAD && block === BLOCK.LILY_PAD) || block === 55 /* MUSHROOM */) {
            color = 0xaa66ff;
            intensity = 0.8;
            distance = 6;
          } else if (typeof block === 'string' && (block.includes('GLOW') || block.includes('LAMP') || block.includes('CORAL') || block.includes('BIOLUM'))) {
            color = 0xffe082;
            intensity = 1.2;
            distance = 10;
          }

          if (color !== null) {
            const dist = Math.hypot(x - px, y - py, z - pz);
            if (dist < searchRadius) {
              glowPositions.push({ x: x + 0.5, y: y + 0.5, z: z + 0.5, dist, color, intensity, distance });
            }
          }
        }
      }
    }

    glowPositions.sort((a, b) => a.dist - b.dist);

    for (let i = 0; i < this._glowLights.length; i++) {
      const light = this._glowLights[i];
      if (i < glowPositions.length) {
        const gp = glowPositions[i];
        light.position.set(gp.x, gp.y, gp.z);
        light.color.setHex(gp.color);
        light.distance = gp.distance;
        light.intensity = Math.max(0.2, gp.intensity * (1 - gp.dist / searchRadius));
        light.visible = true;
      } else {
        light.visible = false;
      }
    }
  }

  updateWeather(dt) {
    if (!this._weatherParticles) return;
    
    // Random weather transitions based on game time
    this._weatherTimer += dt;
    if (this._weatherTimer > 60) { // Check every 60 seconds
      this._weatherTimer = 0;
      const shouldWeather = Math.random() < 0.3; // 30% chance
      if (shouldWeather && !this._weatherActive) {
        this._weatherActive = true;
        this._weatherType = Math.random() < 0.7 ? 'rain' : 'snow';
      } else if (!shouldWeather && this._weatherActive) {
        this._weatherActive = false;
      }
    }
    
    // Smooth opacity transition
    const targetOpacity = this._weatherActive ? 0.7 : 0;
    this._weatherParticles.material.opacity += (targetOpacity - this._weatherParticles.material.opacity) * dt * 2;
    
    // Update color based on type
    if (this._weatherType === 'snow') {
      this._weatherParticles.material.color.setHex(0xeeeeff);
      this._weatherParticles.material.size = 0.5;
    } else {
      this._weatherParticles.material.color.setHex(0x8899bb);
      this._weatherParticles.material.size = 0.3;
    }
    
    if (!this._weatherActive && this._weatherParticles.material.opacity < 0.01) return;
    
    // Update particle positions
    const positions = this._weatherParticles.geometry.attributes.position.array;
    const px = this.player ? this.player.position.x : 0;
    const py = this.player ? this.player.position.y : 30;
    const pz = this.player ? this.player.position.z : 0;
    
    for (let i = 0; i < this._wpVelocities.length / 3; i++) {
      positions[i*3]   += this._wpVelocities[i*3] * dt * 60;
      positions[i*3+1] += this._wpVelocities[i*3+1] * dt * 60;
      positions[i*3+2] += this._wpVelocities[i*3+2] * dt * 60;
      
      // Reset particles that fall below ground or drift too far
      if (positions[i*3+1] < py - 20 || 
          Math.abs(positions[i*3] - px) > 120 || 
          Math.abs(positions[i*3+2] - pz) > 120) {
        positions[i*3]   = px + (Math.random() - 0.5) * 200;
        positions[i*3+1] = py + 60 + Math.random() * 60;
        positions[i*3+2] = pz + (Math.random() - 0.5) * 200;
      }
    }
    this._weatherParticles.geometry.attributes.position.needsUpdate = true;
    
    // Move particle cloud center with player
    this._weatherParticles.position.set(px, 0, pz);
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
        this._lastPlayerAttackedAnimal = ah.animal;
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
        if (hit.id === BLOCK.LOG || hit.id === BLOCK.SPRUCE_LOG || hit.id === BLOCK.SEQUOIA_LOG) {
          this._unlock('first_log');
          this._fellTree(hit.x, hit.y, hit.z);
        }
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
      this._spawnBlockPop(px, py, pz, blockId);
      if (blockId === BLOCK.TORCH || (BLOCK.LANTERN && blockId === BLOCK.LANTERN)) {
        if (this.fx) this.fx.burst(px, py, pz, [1.0, 0.65, 0.15], 14);
      }
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

    // Feed animal (canFeed/tryFeed)
    const ah = this.fauna?.rayHit(origin, dir, 5);
    if (ah) {
        const feedSpec = this.fauna.getSpec(ah.animal.type);
        if (feedSpec && feedSpec.feedItem) {
            const cons = consumeFromHotbar(this.player.slots, this.player.hotbarIndex, 1);
            if (cons.ok && canFeed(ah.animal, cons.id)) {
                this.player.slots = cons.slots;
                const result = tryFeed(ah.animal, cons.id);
                if (result.fed) {
                    ah.animal._inLove = 30;
                    if (ah.animal.type === 'wolf' || result.tamed) {
                      ah.animal.tamed = true;
                      if (result.tamed) this._unlock('first_tame');
                    }
                    const msg = ah.animal.tamed
                        ? `${feedSpec.name} is now your loyal tamed companion!`
                        : `${feedSpec.name} fed — in love & ready to breed!`;
                    this.audio.eat();
                    if (this.fx) this.fx.burst(ah.animal.x, ah.animal.y + 0.6, ah.animal.z, [1, 0.4, 0.7], 12);
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
      const isEye = part.role === 'eye' || part.name.startsWith('eye');
      const mat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(part.color[0], part.color[1], part.color[2]),
        emissive: isEye ? new THREE.Color(0x111111) : new THREE.Color(0x000000),
      });
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(part.sx, part.sy, part.sz),
        mat,
      );
      mesh.position.set(part.x, part.y, part.z);
      mesh.name = part.name;
      mesh.castShadow = !isEye;
      mesh.receiveShadow = !isEye;
      mesh.userData.role = part.role || part.name;
      mesh.userData.baseColor = [part.color[0], part.color[1], part.color[2]];
      mesh.userData.baseY = part.y;
      g.add(mesh);
    }

    // Contact shadow underneath creature
    const shadowScale = Math.max(0.25, Math.max(spec.scale?.[0] || 0.5, spec.scale?.[2] || 0.7) * 0.55);
    const shadowGeo = new THREE.CircleGeometry(shadowScale, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.name = 'contactShadow';
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.015, 0);
    g.add(shadowMesh);

    g.userData.type = type;
    g.userData.legNames = layout.legNames || [];
    g.userData.wingNames = layout.wingNames || [];
    g.userData.eyeNames = layout.eyeNames || [];
    g.userData.phase = Math.random() * Math.PI * 2;
    g.userData.isNew = true;
    return g;
  }

  _syncAnimalMeshes(dt = 0.016) {
    if (!this.fauna) return;
    const delta = (typeof dt === 'number' && dt > 0) ? Math.min(dt, 0.1) : 0.016;
    this._animClock = (this._animClock || 0) + delta;
    const living = this.fauna.living();
    const seen = new Set();
    const isNight = !!(this.dayCycle && typeof this.dayCycle.isNight === 'function' && this.dayCycle.isNight());

    for (const a of living) {
      seen.add(a.id);
      let mesh = this._animalMeshes.get(a.id);
      if (!mesh) {
        mesh = this._makeAnimalMesh(a.type);
        this._animalMeshes.set(a.id, mesh);
        this.scene.add(mesh);
      }

      if (a.isBaby) {
        mesh.scale.setScalar(0.55);
      } else {
        mesh.scale.setScalar(1.0);
      }

      // Smooth position interpolation
      const targetX = a.x;
      const targetY = a.y;
      const targetZ = a.z;
      if (mesh.userData.isNew) {
        mesh.position.set(targetX, targetY, targetZ);
        mesh.userData.isNew = false;
      } else {
        const dx = targetX - mesh.position.x;
        const dy = targetY - mesh.position.y;
        const dz = targetZ - mesh.position.z;
        if (dx * dx + dy * dy + dz * dz > 64) {
          mesh.position.set(targetX, targetY, targetZ);
        } else {
          const lerpSpd = Math.min(1, delta * 10);
          mesh.position.x += dx * lerpSpd;
          mesh.position.y += dy * lerpSpd;
          mesh.position.z += dz * lerpSpd;
        }
      }

      // Smooth yaw rotation lerp
      const targetYaw = a.yaw || 0;
      const currentYaw = mesh.rotation.y;
      let diff = targetYaw - currentYaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      mesh.rotation.y = currentYaw + diff * Math.min(1, delta * 8);

      const spec = SPECIES[a.type] || SPECIES.hare;
      const spd = Math.hypot(a.vx || 0, a.vz || 0);
      const speed01 = Math.max(0, Math.min(1, spd / Math.max(0.1, spec.speed || 1)));

      // Flap frequency & movement phase scaling
      const isFlyer = a.type === 'bird' || a.type === 'bat';
      const animSpeed = isFlyer
        ? ((a.type === 'bat' ? 16 : 12) + speed01 * (a.type === 'bat' ? 14 : 18))
        : (6 + speed01 * 10);
      mesh.userData.phase = (mesh.userData.phase || 0) + delta * animSpeed;
      const phase = mesh.userData.phase;

      const legs = mesh.userData.legNames || [];
      const wings = mesh.userData.wingNames || [];
      const pose = animalLimbPose({}, legs, wings, phase, speed01, a.type);

      const hurt = a.hp < a.maxHp * 0.5;

      for (const child of mesh.children) {
        if (child.name === 'contactShadow') {
          const heightOffset = Math.max(0, mesh.position.y - a.y);
          const heightFade = Math.max(0, 1 - heightOffset * 0.3);
          if (child.material) child.material.opacity = 0.35 * heightFade;
          continue;
        }

        // Apply limb & wing animations
        const pr = pose[child.name];
        if (pr) {
          child.rotation.x = pr.rx || 0;
          child.rotation.z = pr.rz || 0;
        }

        // Head/body bobbing for walking/standing/flying animals
        if ((child.userData.role === 'head' || child.userData.role === 'body') && child.userData.baseY !== undefined) {
          const bobAmt = isFlyer ? 0.04 : (0.015 + 0.02 * speed01);
          child.position.y = child.userData.baseY + Math.sin(phase * 0.5) * bobAmt;
        }

        // Eye details & night glow for nocturnal/predatory creatures (bat, wolf)
        const isEye = child.userData.role === 'eye' || child.name.startsWith('eye');
        if (isEye && child.material) {
          if (isNight && (a.type === 'bat' || a.type === 'wolf')) {
            child.material.emissive?.setRGB(0.8, 0.1, 0.1);
          } else {
            child.material.emissive?.setRGB(0.05, 0.05, 0.05);
          }
        }

        // Hurt tint update
        if (child.isMesh && child.material?.color && !isEye) {
          const base = child.userData.baseColor || spec.color || [0.5, 0.5, 0.5];
          child.material.color.setRGB(
            hurt ? Math.min(1, base[0] + 0.25) : base[0],
            hurt ? base[1] * 0.7 : base[1],
            hurt ? base[2] * 0.7 : base[2],
          );
        }
      }
      // Footstep particles for moving animals
      if (spd > 0.3 && Math.random() < 0.22) {
        if (this.world && this.world.getBlock(Math.floor(a.x), Math.floor(a.y), Math.floor(a.z)) === BLOCK.WATER) {
          this._spawnWaterSplash(a.x, a.y + 0.1, a.z, 3);
        } else if (this.fx) {
          this.fx.burst(a.x, a.y, a.z, [0.55, 0.45, 0.35], 3);
        }
      }
    }

    for (const [id, mesh] of this._animalMeshes) {
      if (!seen.has(id)) {
        if (this.fx && mesh.position) {
          this.fx.burst(mesh.position.x, mesh.position.y + 0.3, mesh.position.z, [0.85, 0.25, 0.25], 16);
        }
        this.scene.remove(mesh);
        mesh.traverse?.((c) => {
          c.geometry?.dispose?.();
          if (c.material) {
            if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose?.());
            else c.material.dispose?.();
          }
        });
        this._animalMeshes.delete(id);
      }
    }
  }

  _initEnhancedUI() {
    if (this._enhancedUIInited) return;
    this._enhancedUIInited = true;
    this._unlockedRecipes = new Set();

    try {
      const style = document.createElement('style');
      style.id = 'enhanced-ui-styles';
      style.textContent = `
        #bar-health { background: linear-gradient(90deg, #ef4444, #f43f5e, #ec4899) !important; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); transition: width 0.3s ease-out; }
        #bar-hunger { background: linear-gradient(90deg, #d97706, #f59e0b, #fbbf24) !important; box-shadow: 0 0 8px rgba(217, 119, 6, 0.4); transition: width 0.3s ease-out; }
        #xp-bar-container { height: 6px; width: 100%; background: rgba(15, 23, 42, 0.7); border-radius: 3px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); margin-top: 4px; }
        #bar-xp { height: 100%; width: 0%; background: linear-gradient(90deg, #059669, #10b981, #34d399); box-shadow: 0 0 8px rgba(16, 185, 129, 0.8); transition: width 0.3s ease; }
        
        #minimap-container { position: fixed; top: 16px; right: 16px; width: 120px; height: 120px; border-radius: 50%; border: 3px solid rgba(251, 191, 36, 0.7); background: rgba(15, 23, 42, 0.85); box-shadow: 0 8px 24px rgba(0,0,0,0.6); overflow: hidden; z-index: 1000; pointer-events: none; }
        #minimap-canvas { width: 100%; height: 100%; display: block; }
        
        #inventory-screen { transition: opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1), transform 0.22s cubic-bezier(0.4, 0, 0.2, 1) !important; }
        #inventory-screen.hidden { opacity: 0 !important; transform: scale(0.95) translateY(10px) !important; pointer-events: none !important; visibility: hidden; }
        #inventory-screen:not(.hidden) { opacity: 1 !important; transform: scale(1) translateY(0) !important; pointer-events: auto !important; visibility: visible; }
        
        .inv-slot { position: relative; transition: transform 0.15s ease, border-color 0.15s ease; }
        .inv-slot:hover { transform: scale(1.06); z-index: 10; }
        .inv-slot.drag-target { border: 2px solid #fbbf24 !important; box-shadow: 0 0 12px #fbbf24 !important; }
        .inv-count { background: rgba(15, 23, 42, 0.85); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.5); font-weight: 700; font-size: 11px; padding: 1px 4px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.5); position: absolute; bottom: 2px; right: 2px; }
        
        #item-3d-preview { position: fixed; display: none; width: 100px; height: 100px; background: rgba(15, 23, 42, 0.92); border: 2px solid rgba(251, 191, 36, 0.7); border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.7); z-index: 9999; pointer-events: none; text-align: center; color: #fff; padding: 4px; }
        #item-3d-preview canvas { display: block; margin: 0 auto; }
        #item-3d-preview .preview-name { font-size: 11px; font-weight: 600; color: #fbbf24; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        #crafting-recipe-preview { margin-top: 10px; padding: 10px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(251, 191, 36, 0.4); border-radius: 8px; color: #fff; font-size: 12px; }
        .recipe-preview-header { font-size: 12px; margin-bottom: 6px; color: #fbbf24; }
        .recipe-preview-body { display: flex; align-items: center; gap: 8px; }
        .recipe-grid-3x3 { display: grid; grid-template-columns: repeat(3, 24px); grid-template-rows: repeat(3, 24px); gap: 2px; }
        .recipe-grid-slot { width: 24px; height: 24px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.2); position: relative; font-size: 9px; }
        .recipe-grid-slot.empty { background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.08); }
        .recipe-arrow { font-size: 18px; color: #fbbf24; }
        .recipe-result-slot { width: 32px; height: 32px; border-radius: 4px; border: 2px solid #fbbf24; position: relative; }
        .ing-count { position: absolute; bottom: 0; right: 1px; font-size: 9px; font-weight: bold; color: #fff; text-shadow: 0 1px 2px #000; }
        
        #inv-drag-ghost { position: fixed; display: none; width: 44px; height: 44px; background: rgba(251, 191, 36, 0.85); border: 2px solid #fff; border-radius: 8px; color: #000; font-weight: bold; font-size: 12px; text-align: center; line-height: 40px; box-shadow: 0 8px 20px rgba(0,0,0,0.6); pointer-events: none; z-index: 99999; }
        
        #recipe-unlock-toast { position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%) translateY(20px); opacity: 0; background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px solid #fbbf24; border-radius: 10px; color: #fbbf24; padding: 8px 18px; font-weight: 700; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,0.6); transition: all 0.3s ease; z-index: 10000; pointer-events: none; }
        #recipe-unlock-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      `;
      if (document.head) document.head.appendChild(style);

      const meters = document.getElementById('meters');
      if (meters && !document.getElementById('xp-bar-container')) {
        const container = document.createElement('div');
        container.id = 'xp-bar-container';
        container.title = 'Experience';
        const fill = document.createElement('div');
        fill.id = 'bar-xp';
        container.appendChild(fill);
        meters.appendChild(container);
      }

      if (document.body && !document.getElementById('minimap-container')) {
        const miniContainer = document.createElement('div');
        miniContainer.id = 'minimap-container';
        const miniCanvas = document.createElement('canvas');
        miniCanvas.id = 'minimap-canvas';
        miniCanvas.width = 120;
        miniCanvas.height = 120;
        miniContainer.appendChild(miniCanvas);
        document.body.appendChild(miniContainer);
      }

      if (document.body && !document.getElementById('item-3d-preview')) {
        const prev = document.createElement('div');
        prev.id = 'item-3d-preview';
        const c = document.createElement('canvas');
        c.width = 72;
        c.height = 72;
        const lbl = document.createElement('div');
        lbl.className = 'preview-name';
        prev.appendChild(c);
        prev.appendChild(lbl);
        document.body.appendChild(prev);
      }

      if (document.body && !document.getElementById('inv-drag-ghost')) {
        const ghost = document.createElement('div');
        ghost.id = 'inv-drag-ghost';
        document.body.appendChild(ghost);
      }

      if (document.body && !document.getElementById('recipe-unlock-toast')) {
        const toast = document.createElement('div');
        toast.id = 'recipe-unlock-toast';
        document.body.appendChild(toast);
      }
    } catch (_) {}
  }

  _updateMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    if (!canvas || !this.player || !this.world) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const px = Math.floor(this.player.position.x);
    const pz = Math.floor(this.player.position.z);
    const py = Math.floor(this.player.position.y);
    const size = 32;
    const cellSize = canvas.width / size;

    for (let rz = 0; rz < size; rz++) {
      for (let rx = 0; rx < size; rx++) {
        const wx = px - 16 + rx;
        const wz = pz - 16 + rz;
        let color = '#3a4a3a';

        const block = this.world.getBlock(wx, py, wz) || this.world.getBlock(wx, py - 1, wz);
        if (block === BLOCK.WATER) color = '#1e88e5';
        else if (block === BLOCK.GRASS) color = '#4caf50';
        else if (block === BLOCK.DIRT) color = '#795548';
        else if (block === BLOCK.STONE || block === BLOCK.COBBLE) color = '#9e9e9e';
        else if (block === BLOCK.SAND || block === BLOCK.SANDSTONE) color = '#fbc02d';
        else if (block === BLOCK.LOG || block === BLOCK.PLANKS) color = '#8d6e63';
        else if (block === BLOCK.LEAVES || block === BLOCK.SPRUCE_LEAVES) color = '#2e7d32';
        else if (block === BLOCK.SNOW || block === BLOCK.ICE) color = '#e0f7fa';
        else if (block === BLOCK.LAVA) color = '#ff5722';

        ctx.fillStyle = color;
        ctx.fillRect(rx * cellSize, rz * cellSize, cellSize + 0.5, cellSize + 0.5);
      }
    }

    if (this._spawnPos) {
      const sx = Math.floor(this._spawnPos.x);
      const sz = Math.floor(this._spawnPos.z);
      const relSx = (sx - px + 16) * cellSize;
      const relSz = (sz - pz + 16) * cellSize;
      if (relSx >= 0 && relSx <= canvas.width && relSz >= 0 && relSz <= canvas.height) {
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(relSx, relSz, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const yaw = this.player.yaw || 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-yaw);
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 4);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _updateXPBar() {
    const xpBar = document.getElementById('bar-xp');
    if (!xpBar) return;
    const kills = this._stats?.kills || 0;
    const day = this.time?.dayNumber || 1;
    const xpVal = (kills * 25 + day * 10) % 100;
    xpBar.style.width = `${xpVal}%`;
  }

  _render3DItemPreview(canvas, itemId) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (itemId == null) return;
    const p = propsOf(itemId);
    const col = p?.color || [0.6, 0.6, 0.6];
    const r = (col[0] * 255) | 0;
    const g = (col[1] * 255) | 0;
    const b = (col[2] * 255) | 0;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 - 4;
    const w = 18;
    const h = 10;
    const d = 18;

    // Top face
    ctx.fillStyle = `rgb(${Math.min(255, r + 40)},${Math.min(255, g + 40)},${Math.min(255, b + 40)})`;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx + w, cy);
    ctx.lineTo(cx, cy + h);
    ctx.lineTo(cx - w, cy);
    ctx.closePath();
    ctx.fill();

    // Left face
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.moveTo(cx - w, cy);
    ctx.lineTo(cx, cy + h);
    ctx.lineTo(cx, cy + h + d);
    ctx.lineTo(cx - w, cy + d);
    ctx.closePath();
    ctx.fill();

    // Right face
    ctx.fillStyle = `rgb(${Math.max(0, r - 35)},${Math.max(0, g - 35)},${Math.max(0, b - 35)})`;
    ctx.beginPath();
    ctx.moveTo(cx, cy + h);
    ctx.lineTo(cx + w, cy);
    ctx.lineTo(cx + w, cy + d);
    ctx.lineTo(cx, cy + h + d);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx + w, cy);
    ctx.lineTo(cx + w, cy + d);
    ctx.lineTo(cx, cy + h + d);
    ctx.lineTo(cx - w, cy + d);
    ctx.lineTo(cx - w, cy);
    ctx.closePath();
    ctx.stroke();
  }

  _showRecipePreview(recipe) {
    let previewEl = document.getElementById('crafting-recipe-preview');
    if (!previewEl) {
      const parent = document.getElementById('inventory-screen') || document.body;
      previewEl = document.createElement('div');
      previewEl.id = 'crafting-recipe-preview';
      parent.appendChild(previewEl);
    }
    if (!recipe) {
      previewEl.style.display = 'none';
      return;
    }
    previewEl.style.display = 'block';

    let gridHtml = '<div class="recipe-grid-3x3">';
    const ings = recipe.ingredients || [];
    for (let i = 0; i < 9; i++) {
      const ing = ings[i];
      if (ing) {
        const p = propsOf(ing.id);
        const col = p?.color || [0.5, 0.5, 0.5];
        const bg = `rgb(${(col[0]*255)|0},${(col[1]*255)|0},${(col[2]*255)|0})`;
        gridHtml += `<div class="recipe-grid-slot" style="background:${bg}" title="${displayName(ing.id)} x${ing.count}"><span class="ing-count">${ing.count}</span></div>`;
      } else {
        gridHtml += `<div class="recipe-grid-slot empty"></div>`;
      }
    }
    gridHtml += '</div>';

    const resId = recipe.result || recipe.id;
    const resCount = recipe.count || recipe.resultCount || 1;
    const resP = propsOf(resId);
    const resCol = resP?.color || [0.5, 0.5, 0.5];
    const resBg = `rgb(${(resCol[0]*255)|0},${(resCol[1]*255)|0},${(resCol[2]*255)|0})`;

    previewEl.innerHTML = `
      <div class="recipe-preview-header">Recipe: <strong>${recipe.name}</strong></div>
      <div class="recipe-preview-body">
        ${gridHtml}
        <div class="recipe-arrow">➔</div>
        <div class="recipe-result-slot" style="background:${resBg}" title="${displayName(resId)} x${resCount}">
          <span class="ing-count">${resCount}</span>
        </div>
      </div>
    `;
  }

  _showRecipeUnlockToast(name) {
    const toast = document.getElementById('recipe-unlock-toast');
    if (!toast) return;
    toast.textContent = `✨ Recipe Unlocked: ${name}`;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  _setupSlotInteractions(el, s, i, pl) {
    if (s.id != null && s.count > 0) {
      el.draggable = true;

      el.addEventListener('mouseenter', (e) => {
        const preview = document.getElementById('item-3d-preview');
        if (!preview) return;
        preview.style.display = 'block';
        preview.style.left = `${e.clientX + 14}px`;
        preview.style.top = `${e.clientY + 14}px`;
        const c = preview.querySelector('canvas');
        const lbl = preview.querySelector('.preview-name');
        if (lbl) lbl.textContent = displayName(s.id);
        this._render3DItemPreview(c, s.id);
      });

      el.addEventListener('mousemove', (e) => {
        const preview = document.getElementById('item-3d-preview');
        if (preview) {
          preview.style.left = `${e.clientX + 14}px`;
          preview.style.top = `${e.clientY + 14}px`;
        }
      });

      el.addEventListener('mouseleave', () => {
        const preview = document.getElementById('item-3d-preview');
        if (preview) preview.style.display = 'none';
      });

      el.addEventListener('dragstart', (e) => {
        this._draggedSlotIndex = i;
        const ghost = document.getElementById('inv-drag-ghost');
        if (ghost) {
          ghost.textContent = displayName(s.id).slice(0, 3);
          ghost.style.display = 'block';
          ghost.style.left = `${e.clientX - 22}px`;
          ghost.style.top = `${e.clientY - 22}px`;
        }
      });
    }

    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.classList.add('drag-target');
      const ghost = document.getElementById('inv-drag-ghost');
      if (ghost) {
        ghost.style.left = `${e.clientX - 22}px`;
        ghost.style.top = `${e.clientY - 22}px`;
      }
    });

    el.addEventListener('dragleave', () => {
      el.classList.remove('drag-target');
    });

    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drag-target');
      const ghost = document.getElementById('inv-drag-ghost');
      if (ghost) ghost.style.display = 'none';

      if (this._draggedSlotIndex != null && this._draggedSlotIndex !== i && pl?.slots) {
        const temp = pl.slots[i];
        pl.slots[i] = pl.slots[this._draggedSlotIndex];
        pl.slots[this._draggedSlotIndex] = temp;
        this._draggedSlotIndex = null;
        this._paintInventory();
      }
    });

    el.addEventListener('dragend', () => {
      const ghost = document.getElementById('inv-drag-ghost');
      if (ghost) ghost.style.display = 'none';
      const preview = document.getElementById('item-3d-preview');
      if (preview) preview.style.display = 'none';
    });
  }

  _setupRecipeBtnInteractions(btn, r) {
    btn.addEventListener('mouseenter', () => {
      this._showRecipePreview(r);
    });
    btn.addEventListener('click', () => {
      this._showRecipePreview(r);
    });
  }

  _paintInventory() {
    this._invNeedsPaint = false;
    const pl = this._bagPlayer?.() || this.player;
    if (!pl) return;

    if (!this._enhancedUIInited) this._initEnhancedUI();

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
        this._setupSlotInteractions(el, s, i, pl);
        bag.appendChild(el);
      });
    }

    const recipesEl = document.getElementById('recipe-list');
    if (recipesEl) {
      recipesEl.innerHTML = '';
      const filter = (this._recipeFilter || '').toLowerCase().trim();
      for (const r of visibleRecipes()) {
        if (filter && !(`${r.name} ${r.desc || ''} ${r.id}`.toLowerCase().includes(filter))) continue;
        const has = hasIngredients(pl.slots, r.ingredients);
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
        this._setupRecipeBtnInteractions(btn, r);
        recipesEl.appendChild(btn);

        if (can && this._unlockedRecipes && !this._unlockedRecipes.has(r.id)) {
          this._unlockedRecipes.add(r.id);
          if (this._recipeUnlockReady) {
            this._showRecipeUnlockToast(r.name);
          }
        }
      }
      this._recipeUnlockReady = true;
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

  updateSunLight() {
    if (!this.time) return;
    const tickNum = typeof this.time.tick === 'number' ? this.time.tick : Math.floor((this.time.elapsed || 0) * 50);
    const timeOfDay = ((tickNum % 24000) + 24000) % 24000 / 24000;
    const palette = getSunForTime(timeOfDay);
    const sunColor = new THREE.Color(palette.sun[0], palette.sun[1], palette.sun[2]);
    const skyColor = new THREE.Color(palette.skyTop[0], palette.skyTop[1], palette.skyTop[2]);
    const groundColor = new THREE.Color(palette.ground[0], palette.ground[1], palette.ground[2]);

    // Sun intensity: 0 at night, 1.2 at noon
    const sunIntensity = Math.max(0, Math.sin(timeOfDay * Math.PI * 2 - Math.PI / 2)) * 1.2;

    if (this.sunLight) {
      this.sunLight.color.copy(sunColor);
      this.sunLight.intensity = Math.max(0.05, sunIntensity); // minimum 5% at night

      // Sun position arcs across the sky
      const angle = timeOfDay * Math.PI * 2 - Math.PI / 2;
      const radius = 100;
      this.sunLight.position.set(
        Math.cos(angle) * radius * 0.7,
        Math.max(Math.sin(angle) * radius, -10), // dont go below horizon
        30 + Math.cos(angle * 0.5) * 20
      );
    }

    // Hemisphere ambient shifts with time
    if (this.ambientLight) {
      this.ambientLight.color.copy(skyColor);
      this.ambientLight.groundColor.copy(groundColor);
      this.ambientLight.intensity = 0.15 + sunIntensity * 0.4;
    }

    // Sky dome color update
    if (this.skyDome?.material) {
      if (this.skyDome.material.color) {
        this.skyDome.material.color.copy(skyColor);
      }
      if (this.skyDome.material.uniforms?.topColor) {
        this.skyDome.material.uniforms.topColor.value.copy(skyColor);
      }
    }

    // Fog update
    if (this.scene) {
      this.scene.background = skyColor;
      if (this.scene.fog) {
        this.scene.fog.color.copy(skyColor);
      } else {
        this.scene.fog = new THREE.Fog(skyColor, 60, 180);
      }
    }

    // Sun disc follows the light direction
    if (this.sunDisc) {
      const dir = this.sunLight.position.clone().normalize();
      this.sunDisc.position.copy(dir.multiplyScalar(178));
      this.sunDisc.lookAt(this.camera.position);
      const isDay = this.sunLight.intensity > 0.3;
      this.sunDisc.material.opacity = isDay ? 0.95 : Math.max(0, (this.sunLight.intensity - 0.05) / 0.25);
    }

    // Moon opposite the sun
    if (this.moonDisc) {
      const sunDir = this.sunLight.position.clone().normalize();
      this.moonDisc.position.copy(sunDir.multiplyScalar(-178));
      this.moonDisc.lookAt(this.camera.position);
      const moonOpacity = this.sunLight.intensity < 0.5 ? Math.max(0, (0.5 - this.sunLight.intensity) / 0.45) * 0.8 : 0;
      this.moonDisc.material.opacity = moonOpacity;
    }

    // Moon glow halo follows the moon disc; craters are baked into the texture
    // so they're always visible whenever the disc itself is.
    if (this.moonGlow && this.moonDisc) {
      this.moonGlow.position.copy(this.moonDisc.position);
      this.moonGlow.material.opacity = this.moonDisc.material.opacity * 0.6;
    }

    // Night sky: stars, constellations and the Milky Way fade in as the sun
    // dips below sunIntensity 0.2, fully out by 0.5 (day).
    const nightFactor = this.sunLight.intensity < 0.2
      ? 1
      : Math.max(0, 1 - (this.sunLight.intensity - 0.2) / 0.3);
    if (this.starField) {
      this.starField.position.copy(this.camera.position);
      this.starField.material.opacity = nightFactor;
    }
    if (this.constellationLines) {
      this.constellationLines.position.copy(this.camera.position);
      this.constellationLines.material.opacity = nightFactor * 0.8;
    }
    if (this.milkyWay) {
      this.milkyWay.position.copy(this.camera.position);
      this.milkyWay.material.opacity = nightFactor * 0.15;
    }
  }

  updatePlayerShadow() {
    if (!this.playerShadow || !this.player?.position) return;

    this.playerShadow.position.set(
      this.player.position.x,
      this.player.position.y - 0.9,
      this.player.position.z
    );

    let sunIntensity = 1;
    if (this.time && typeof this.time.sunIntensity === 'function') {
      sunIntensity = this.time.sunIntensity();
    } else if (this.sunLight) {
      sunIntensity = Math.min(1, Math.max(0, this.sunLight.intensity / 1.2));
    }

    const sunFactor = Math.max(0, Math.min(1, sunIntensity));
    const opacity = 0.1 + sunFactor * 0.6;
    this.playerShadow.material.opacity = Math.max(0.1, Math.min(0.7, opacity));

    const scaleFactor = 1.4 - sunFactor * 0.4;
    this.playerShadow.scale.set(2 * scaleFactor, 1.4 * scaleFactor, 1);
  }

  _updateLighting() {
    const sunI = this.time.sunIntensity();
    this.hemi.color.setHex(0x9ec9ff);
    // storm lightning flash boost
    if (this._stormFlashT > 0) {
      this.ambient.intensity += this._stormFlashT * 8;
      this.scene.background.setHex(0xccddff);
      this._stormFlashT -= 1 / 60;
    }
    this.sun.intensity = 0.3 + sunI * 1.15;
    this.ambient.intensity = 0.2 + sunI * 0.48;
    this.hemi.intensity = 0.24 + sunI * 0.4;
    const sky = this.time.skyColor();
    const color = new THREE.Color(sky.r, sky.g, sky.b);
    this.scene.background = color;
    if (this.skyDome) {
      this.skyDome.position.copy(this.camera.position);
      this.skyTopColor = color.clone().multiplyScalar(0.62);
      this.skyBottomColor = color.clone().lerp(new THREE.Color(0xfff0d2), 0.28);
      // Sky gradient update via uniforms
      if (this.skyUniforms) {
        this.skyUniforms.topColor.value.copy(this.skyTopColor);
        this.skyUniforms.bottomColor.value.copy(this.skyBottomColor);
      }
    }
    this.scene.fog.color.copy(color);
    const plan = this._terrainVisibilityPlan();
    const fog = fogForSun(plan, sunI);
    this.scene.fog.near = fog.near;
    this.scene.fog.far = fog.far;
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
        : 0.62 + sunI * 0.78;
      mat.uniforms.ambientColor.value.set(
        this.time.isNight() ? 0.18 : 0.42,
        this.time.isNight() ? 0.2 : 0.48,
        this.time.isNight() ? 0.28 : 0.58,
      );
    }
  }

  applyUnderwaterVisuals() {
    if (!this.scene || !this.camera) return;
    const py = this.player ? this.player.position.y : 30;
    const waterLevel = 32;
    const isUnderwater = py < waterLevel - 1;

    if (isUnderwater) {
      const depth = waterLevel - py;
      const res = underwaterFogStyle(typeof depth === 'object' ? depth : { underwater: true, depth });
      const style = {
        near: (res && typeof res.near === 'number') ? res.near : Math.max(1.5, 3.5 - depth * 0.08),
        far: (res && typeof res.far === 'number') ? res.far : Math.max(16, 30 - depth * 0.55),
      };

      // Blue-green underwater fog
      this.scene.fog = new THREE.Fog(
        new THREE.Color(0.05, 0.25, 0.35),
        style.near,
        style.far
      );

      // Dark blue tint on background
      this.scene.background = new THREE.Color(0.02, 0.12, 0.22);

      // Reduce camera far to match underwater visibility
      this.camera.far = style.far + 20;
      this.camera.updateProjectionMatrix();

      // Reduce sun intensity underwater
      if (this.sunLight) {
        this.sunLight.intensity = Math.max(0.02, 0.3 - depth * 0.02);
      }

      // Animated water caustics light pattern underwater
      if (this._causticsLight) {
        const time = this.time ? (this.time.elapsed || 0) : Date.now() * 0.001;
        const px = this.player ? this.player.position.x : 0;
        const pz = this.player ? this.player.position.z : 0;
        const causticX = px + Math.sin(time * 1.5) * 3;
        const causticZ = pz + Math.cos(time * 2.1) * 3;
        const causticY = py + 4 + Math.sin(time * 3.0) * 0.5;

        this._causticsLight.position.set(causticX, causticY, causticZ);
        const causticPulse = 0.6 + Math.sin(time * 4.0) * 0.25 + Math.cos(time * 2.7) * 0.15;
        this._causticsLight.intensity = Math.max(0.2, causticPulse * Math.max(0.3, 1.0 - depth * 0.03));
        const blueHue = 0.52 + Math.sin(time * 1.2) * 0.04;
        this._causticsLight.color.setHSL(blueHue, 0.85, 0.6);
        this._causticsLight.visible = true;
      }
    } else {
      // Restore normal visibility when above water
      if (this.scene.fog) {
        this.scene.fog.near = 60;
        this.scene.fog.far = 180;
      }
      this.camera.far = 200;
      this.camera.updateProjectionMatrix();
      if (this._causticsLight) {
        this._causticsLight.visible = false;
      }
    }
  }

  updateWaterSurface(dt) {
    if (!this.waterSurface) return;

    const time = this.time ? (this.time.elapsed || 0) : 0;
    if (this.waterSurface.material?.uniforms) {
      const u = this.waterSurface.material.uniforms;
      if (u.uTime) u.uTime.value = time;
      if (this.sunLight && u.uSunDir) u.uSunDir.value.copy(this.sunLight.position).normalize();
      if (this.sunLight && u.uSunIntensity) u.uSunIntensity.value = Math.max(0, Math.min(1, this.sunLight.intensity));
    }

    // Move water surface with player (keep it centered)
    if (this.player) {
      this.waterSurface.position.x = this.player.position.x;
      this.waterSurface.position.z = this.player.position.z;
    }

    // Water color shifts with time of day
    if (this.sunLight) {
      const sunI = this.sunLight.intensity;
      const r = 0.1 + sunI * 0.15;
      const g = 0.2 + sunI * 0.35;
      const b = 0.4 + sunI * 0.45;
      if (this.waterSurface.material?.uniforms?.uColor) {
        this.waterSurface.material.uniforms.uColor.value.setRGB(r, g, b);
      } else if (this.waterSurface.material?.color) {
        this.waterSurface.material.color.setRGB(r, g, b);
      }
    }
  }

  updateGrassBlades(dt) {
    if (!this._grassBlades || !this.player || !this.world) return;
    
    const px = Math.floor(this.player.position.x);
    const py = this.player.position.y;
    const pz = Math.floor(this.player.position.z);
    const time = this.time ? (this.time.elapsed || 0) : 0;
    
    // Distribute grass blades around player on grass-level height
    const range = 40;
    let idx = 0;
    let vineIdx = 0;
    const maxVines = 800;
    
    for (let x = px - range; x <= px + range && idx < 3000; x += 2) {
      for (let z = pz - range; z <= pz + range && idx < 3000; z += 2) {
        try {
          let grassY = -1;
          const baseY = Math.floor(py);
          for (let y = baseY + 4; y >= baseY - 6; y--) {
            const block = this.world.getBlock(x, y, z);
            if (block === BLOCK.GRASS) {
              grassY = y;
              break;
            }
            if (this._vines && vineIdx < maxVines &&
                (block === BLOCK.LEAVES || block === BLOCK.SPRUCE_LEAVES || block === BLOCK.SEQUOIA_LEAVES || block === BLOCK.PALM_LEAVES)) {
              if (this.world.getBlock(x, y - 1, z) === BLOCK.AIR) {
                const swayV = Math.sin(time * 1.5 + x * 0.4 + z * 0.6) * 0.08;
                const vx = x + 0.5 + Math.sin(x * 13 + z * 7) * 0.35;
                const vz = z + 0.5 + Math.cos(x * 7 + z * 13) * 0.35;
                const vy = y - 0.6;
                this._vineDummy.position.set(vx, vy, vz);
                this._vineDummy.rotation.set(swayV, (x + z) * 0.5, swayV * 0.5);
                this._vineDummy.scale.set(0.8 + ((x * 5 + z) % 5) * 0.1, 0.8 + ((x * 3 + z) % 7) * 0.1, 0.8);
                this._vineDummy.updateMatrix();
                this._vines.setMatrixAt(vineIdx, this._vineDummy.matrix);
                vineIdx++;
              }
            }
          }

          if (grassY !== -1 && idx < 3000) {
            const b = biomeAt(x, z, this.world.seed);
            const isPlainsOrTropical = (b === BIOME.PLAINS || b === BIOME.TROPICAL);
            const tallGrassMult = isPlainsOrTropical ? 1.6 : 1.0;

            const sway = Math.sin(time * 2 + x * 0.5 + z * 0.3) * 0.1;
            const targetY = grassY + 1;
            
            this._grassDummy.position.set(
              x + ((x * 7 + z * 13) % 5) / 5,
              targetY,
              z + ((x * 11 + z * 3) % 5) / 5
            );
            this._grassDummy.rotation.set(
              sway,
              ((x * 7 + z * 13) % 6) / 6 * Math.PI * 2,
              sway * 0.5
            );
            const baseScale = 0.5 + (((x * 3 + z) % 7) / 7) * 0.8;
            this._grassDummy.scale.set(baseScale, baseScale * tallGrassMult, baseScale);
            this._grassDummy.updateMatrix();
            this._grassBlades.setMatrixAt(idx, this._grassDummy.matrix);
            idx++;
          }
        } catch(e) { /* skip invalid positions */ }
      }
    }
    
    // Hide remaining instances
    for (let i = idx; i < 3000; i++) {
      this._grassDummy.position.set(0, -1000, 0);
      this._grassDummy.scale.setScalar(0);
      this._grassDummy.updateMatrix();
      this._grassBlades.setMatrixAt(i, this._grassDummy.matrix);
    }
    
    this._grassBlades.instanceMatrix.needsUpdate = true;

    if (this._vines) {
      for (let i = vineIdx; i < maxVines; i++) {
        this._vineDummy.position.set(0, -1000, 0);
        this._vineDummy.scale.setScalar(0);
        this._vineDummy.updateMatrix();
        this._vines.setMatrixAt(i, this._vineDummy.matrix);
      }
      this._vines.instanceMatrix.needsUpdate = true;
    }
    
    // Grass color shifts with time of day
    if (this.sunLight) {
      const sunI = this.sunLight.intensity;
      const g = 0.3 + sunI * 0.6;
      this._grassBlades.material.color.setRGB(0.2 + sunI * 0.2, g, 0.1);
      this._grassBlades.material.opacity = 0.5 + sunI * 0.3;
      if (this._vines) {
        this._vines.material.color.setRGB(0.1 + sunI * 0.25, 0.4 + sunI * 0.4, 0.15);
      }
    }
  }

  updateMossPatches() {
    if (!this._mossPatches || !this.player || !this.world) return;

    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);

    const range = 35;
    let idx = 0;
    const maxMoss = 600;

    for (let x = px - range; x <= px + range && idx < maxMoss; x += 2) {
      for (let z = pz - range; z <= pz + range && idx < maxMoss; z += 2) {
        try {
          const b = biomeAt(x, z, this.seed);
          if (b !== BIOME.FOREST && b !== BIOME.TROPICAL) continue;

          for (let y = py + 4; y >= py - 6; y--) {
            const block = this.world.getBlock(x, y, z);
            if ((block === BLOCK.STONE || block === BLOCK.COBBLE || block === BLOCK.DIRT) &&
                (this.world.getBlock(x, y + 1, z) === BLOCK.AIR)) {
              this._mossDummy.position.set(
                x + 0.5 + Math.sin(x * 7 + z * 13) * 0.15,
                y + 1.01,
                z + 0.5 + Math.cos(x * 11 + z * 5) * 0.15
              );
              this._mossDummy.rotation.set(-Math.PI / 2, 0, (x * 3 + z * 7) * 0.2);
              this._mossDummy.scale.setScalar(0.7 + ((x * 3 + z) % 5) * 0.1);
              this._mossDummy.updateMatrix();
              this._mossPatches.setMatrixAt(idx, this._mossDummy.matrix);
              idx++;
              break;
            }
          }
        } catch (e) { /* silent catch */ }
      }
    }

    for (let i = idx; i < maxMoss; i++) {
      this._mossDummy.position.set(0, -1000, 0);
      this._mossDummy.scale.setScalar(0);
      this._mossDummy.updateMatrix();
      this._mossPatches.setMatrixAt(i, this._mossDummy.matrix);
    }
    this._mossPatches.instanceMatrix.needsUpdate = true;

    if (this.sunLight) {
      const sunI = this.sunLight.intensity;
      this._mossPatches.material.color.setRGB(0.15 + sunI * 0.1, 0.35 + sunI * 0.3, 0.1);
    }
  }

  updateFlowers() {
    if (!this._flowerPatches || !this.player || !this.world) return;

    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);

    const range = 35;
    let idx = 0;
    const maxFlowers = 400;

    for (let x = px - range; x <= px + range && idx < maxFlowers; x += 2) {
      for (let z = pz - range; z <= pz + range && idx < maxFlowers; z += 2) {
        try {
          const b = biomeAt(x, z, this.world.seed);
          if (b === BIOME.DESERT || b === BIOME.TUNDRA || b === BIOME.OCEAN) continue;
          const highDensity = (b === BIOME.PLAINS || b === BIOME.TROPICAL || b === BIOME.FOREST);
          if (!highDensity && ((x * 17 + z * 31) % 5) > 1) continue;

          for (let y = py + 4; y >= py - 6; y--) {
            const block = this.world.getBlock(x, y, z);
            if ((block === BLOCK.GRASS || (BLOCK.FLOWER && block === BLOCK.FLOWER)) &&
                (this.world.getBlock(x, y + 1, z) === BLOCK.AIR)) {
              this._flowerDummy.position.set(
                x + 0.3 + ((x * 13 + z * 7) % 5) * 0.1,
                y + 1.02,
                z + 0.3 + ((x * 5 + z * 11) % 5) * 0.1
              );
              this._flowerDummy.rotation.set(-Math.PI / 2, 0, (x * 5 + z * 9) * 0.3);
              this._flowerDummy.scale.setScalar(0.4 + ((x * 3 + z * 2) % 4) * 0.15);
              this._flowerDummy.updateMatrix();
              this._flowerPatches.setMatrixAt(idx, this._flowerDummy.matrix);
              idx++;
              break;
            }
          }
        } catch (e) { /* silent catch */ }
      }
    }

    for (let i = idx; i < maxFlowers; i++) {
      this._flowerDummy.position.set(0, -1000, 0);
      this._flowerDummy.scale.setScalar(0);
      this._flowerDummy.updateMatrix();
      this._flowerPatches.setMatrixAt(i, this._flowerDummy.matrix);
    }
    this._flowerPatches.instanceMatrix.needsUpdate = true;

    if (this.sunLight) {
      const sunI = this.sunLight.intensity;
      this._flowerPatches.material.color.setRGB(0.7 + sunI * 0.2, 0.2 + sunI * 0.2, 0.4 + sunI * 0.2);
    }
  }

  _initProceduralTerrain() {
    const MUSHROOM_COUNT = 200;
    const capGeo = new THREE.ConeGeometry(0.12, 0.14, 6);
    const shroomMat = new THREE.MeshLambertMaterial({ color: 0xd3422a, roughness: 0.8 });
    this._mushroomPatches = new THREE.InstancedMesh(capGeo, shroomMat, MUSHROOM_COUNT);
    this._mushroomPatches.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._mushroomPatches.frustumCulled = false;
    this.scene.add(this._mushroomPatches);
    this._mushroomDummy = new THREE.Object3D();
    for (let i = 0; i < MUSHROOM_COUNT; i++) {
      this._mushroomDummy.position.set(0, -1000, 0);
      this._mushroomDummy.scale.setScalar(0);
      this._mushroomDummy.updateMatrix();
      this._mushroomPatches.setMatrixAt(i, this._mushroomDummy.matrix);
    }
    this._mushroomPatches.instanceMatrix.needsUpdate = true;

    const STUMP_COUNT = 120;
    const stumpGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.75, 7);
    const stumpMat = new THREE.MeshLambertMaterial({ color: 0x5a3e2b, roughness: 0.9 });
    this._stumpPatches = new THREE.InstancedMesh(stumpGeo, stumpMat, STUMP_COUNT);
    this._stumpPatches.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._stumpPatches.frustumCulled = false;
    this.scene.add(this._stumpPatches);
    this._stumpDummy = new THREE.Object3D();
    for (let i = 0; i < STUMP_COUNT; i++) {
      this._stumpDummy.position.set(0, -1000, 0);
      this._stumpDummy.scale.setScalar(0);
      this._stumpDummy.updateMatrix();
      this._stumpPatches.setMatrixAt(i, this._stumpDummy.matrix);
    }
    this._stumpPatches.instanceMatrix.needsUpdate = true;
  }

  updateMushroomPatches() {
    if (!this._mushroomPatches || !this.player || !this.world) return;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const range = 24;
    let idx = 0;
    const max = 200;

    for (let x = px - range; x <= px + range && idx < max; x += 3) {
      for (let z = pz - range; z <= pz + range && idx < max; z += 3) {
        try {
          for (let y = py + 3; y >= py - 5; y--) {
            const b = this.world.getBlock(x, y, z);
            if ((b === BLOCK.DIRT || b === BLOCK.GRASS || b === BLOCK.DAMP_SOIL) &&
                this.world.getBlock(x, y + 1, z) === BLOCK.AIR) {
              const nearLog = this.world.getBlock(x + 1, y, z) === BLOCK.LOG ||
                              this.world.getBlock(x - 1, y, z) === BLOCK.LOG ||
                              this.world.getBlock(x, y, z + 1) === BLOCK.LOG ||
                              this.world.getBlock(x, y, z - 1) === BLOCK.LOG;
              const aboveLeaves = this.world.getBlock(x, y + 3, z) === BLOCK.LEAVES ||
                                  this.world.getBlock(x, y + 4, z) === BLOCK.LEAVES;
              if (nearLog || aboveLeaves || ((x * 13 + z * 19) % 11 < 2)) {
                this._mushroomDummy.position.set(
                  x + 0.3 + ((x * 7 + z * 3) % 5) * 0.1,
                  y + 1.07,
                  z + 0.3 + ((x * 3 + z * 11) % 5) * 0.1
                );
                this._mushroomDummy.rotation.set(0, (x * 5 + z * 7) * 0.4, 0);
                this._mushroomDummy.scale.setScalar(0.7 + ((x + z) % 4) * 0.2);
                this._mushroomDummy.updateMatrix();
                this._mushroomPatches.setMatrixAt(idx, this._mushroomDummy.matrix);
                idx++;
                break;
              }
            }
          }
        } catch (e) {}
      }
    }

    for (let i = idx; i < max; i++) {
      this._mushroomDummy.position.set(0, -1000, 0);
      this._mushroomDummy.scale.setScalar(0);
      this._mushroomDummy.updateMatrix();
      this._mushroomPatches.setMatrixAt(i, this._mushroomDummy.matrix);
    }
    this._mushroomPatches.instanceMatrix.needsUpdate = true;
  }

  updateStumpProps() {
    if (!this._stumpPatches || !this.player || !this.world) return;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const range = 32;
    let idx = 0;
    const max = 120;

    for (let x = px - range; x <= px + range && idx < max; x += 5) {
      for (let z = pz - range; z <= pz + range && idx < max; z += 5) {
        try {
          const biome = biomeAt ? biomeAt(x, z, this.world.seed) : BIOME.FOREST;
          if (biome !== BIOME.FOREST && biome !== BIOME.TAIGA) continue;
          if (((x * 19 + z * 23) % 13) > 2) continue;

          for (let y = py + 3; y >= py - 4; y--) {
            const b = this.world.getBlock(x, y, z);
            if ((b === BLOCK.GRASS || b === BLOCK.DIRT) &&
                this.world.getBlock(x, y + 1, z) === BLOCK.AIR &&
                this.world.getBlock(x, y + 2, z) === BLOCK.AIR) {
              this._stumpDummy.position.set(x + 0.5, y + 1.37, z + 0.5);
              this._stumpDummy.rotation.set((x % 3) * 0.05, (x * 7 + z * 3) * 0.5, 0);
              this._stumpDummy.scale.set(0.9 + (x % 3) * 0.15, 0.8 + (z % 3) * 0.2, 0.9 + (x % 3) * 0.15);
              this._stumpDummy.updateMatrix();
              this._stumpPatches.setMatrixAt(idx, this._stumpDummy.matrix);
              idx++;
              break;
            }
          }
        } catch (e) {}
      }
    }

    for (let i = idx; i < max; i++) {
      this._stumpDummy.position.set(0, -1000, 0);
      this._stumpDummy.scale.setScalar(0);
      this._stumpDummy.updateMatrix();
      this._stumpPatches.setMatrixAt(i, this._stumpDummy.matrix);
    }
    this._stumpPatches.instanceMatrix.needsUpdate = true;
  }

  updateCaveDarkening(dt) {
    if (!this.player || !this.world || !this.scene?.fog) return;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);

    const roofAbove = hasRoofAbove(this.world, px, py, pz, 15);
    const isUnderground = py < 45 || roofAbove;
    const targetEnclosed = isUnderground ? (py < 30 ? 1.0 : 0.65) : 0.0;
    this._caveEnclosedFactor += (targetEnclosed - this._caveEnclosedFactor) * Math.min(1, dt * 3.0);

    if (this._caveEnclosedFactor > 0.05) {
      const caveColor = new THREE.Color(0x05070a);
      this.scene.fog.color.lerp(caveColor, this._caveEnclosedFactor * 0.6);
      if (this.ambientLight) {
        this.ambientLight.intensity = Math.max(0.12, this.ambientLight.intensity * (1.0 - this._caveEnclosedFactor * 0.5));
      }
    }
  }

  _initLightingEffects() {
    let haloTex = null;
    if (typeof document !== 'undefined' && document.createElement) {
      try {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx = c.getContext('2d');
        if (ctx) {
          const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
          g.addColorStop(0, 'rgba(255, 210, 120, 0.9)');
          g.addColorStop(0.35, 'rgba(255, 140, 40, 0.45)');
          g.addColorStop(1, 'rgba(255, 80, 0, 0)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
        }
        haloTex = new THREE.CanvasTexture(c);
      } catch (e) {}
    }
    const torchHaloMat = new THREE.SpriteMaterial({
      map: haloTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.75,
    });
    this._torchHalos = [];
    for (let i = 0; i < 24; i++) {
      const s = new THREE.Sprite(torchHaloMat);
      s.visible = false;
      s.scale.set(2.2, 2.2, 1);
      this.scene.add(s);
      this._torchHalos.push(s);
    }

    this._lavaLights = [];
    this._lavaHalos = [];
    const lavaHaloMat = new THREE.SpriteMaterial({
      map: haloTex,
      color: 0xff4400,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85,
    });
    for (let i = 0; i < 12; i++) {
      const pl = new THREE.PointLight(0xff4400, 0, 14, 2);
      pl.visible = false;
      this.scene.add(pl);
      this._lavaLights.push(pl);
      const hs = new THREE.Sprite(lavaHaloMat);
      hs.visible = false;
      hs.scale.set(3.5, 3.5, 1);
      this.scene.add(hs);
      this._lavaHalos.push(hs);
    }

    const beamGeo = new THREE.CylinderGeometry(0.18, 0.25, 80, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x88ffff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this._beaconBeamMesh = new THREE.Mesh(beamGeo, beamMat);
    this._beaconBeamMesh.visible = false;
    this.scene.add(this._beaconBeamMesh);

    const rayGeo = new THREE.ConeGeometry(1.2, 12, 8, 1, true);
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xfffae0,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const GODRAY_COUNT = 35;
    this._canopyGodRays = new THREE.InstancedMesh(rayGeo, rayMat, GODRAY_COUNT);
    this._canopyGodRays.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._canopyGodRays.frustumCulled = false;
    this.scene.add(this._canopyGodRays);
    this._godRayDummy = new THREE.Object3D();
    for (let i = 0; i < GODRAY_COUNT; i++) {
      this._godRayDummy.position.set(0, -1000, 0);
      this._godRayDummy.scale.setScalar(0);
      this._godRayDummy.updateMatrix();
      this._canopyGodRays.setMatrixAt(i, this._godRayDummy.matrix);
    }
    this._canopyGodRays.instanceMatrix.needsUpdate = true;
  }

  updateTorchLights() {
    if (!this.world || !this.player) return;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const time = this.time ? (this.time.elapsed || 0) : 0;
    const range = 20;
    let idx = 0;

    for (let x = px - range; x <= px + range && idx < this._torchLights.length; x += 2) {
      for (let z = pz - range; z <= pz + range && idx < this._torchLights.length; z += 2) {
        for (let y = py - 4; y <= py + 6 && idx < this._torchLights.length; y++) {
          const b = this.world.getBlock(x, y, z);
          if (b === BLOCK.TORCH || (BLOCK.LANTERN && b === BLOCK.LANTERN)) {
            const flicker = Math.sin(time * 12 + idx * 3) * 0.15 + Math.cos(time * 18 + idx) * 0.1;
            const l = this._torchLights[idx];
            l.position.set(x + 0.5, y + 0.6, z + 0.5);
            l.intensity = 2.2 + flicker;
            l.visible = true;

            const h = this._torchHalos[idx];
            if (h) {
              h.position.set(x + 0.5, y + 0.6, z + 0.5);
              const scale = 2.2 + flicker * 0.4;
              h.scale.set(scale, scale, 1);
              h.visible = true;
            }
            idx++;
          }
        }
      }
    }

    for (let i = idx; i < this._torchLights.length; i++) {
      this._torchLights[i].visible = false;
      if (this._torchHalos[i]) this._torchHalos[i].visible = false;
    }
  }

  updateLavaLights() {
    if (!this.world || !this.player || !this._lavaLights) return;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const time = this.time ? (this.time.elapsed || 0) : 0;
    const range = 20;
    let idx = 0;

    for (let x = px - range; x <= px + range && idx < this._lavaLights.length; x += 3) {
      for (let z = pz - range; z <= pz + range && idx < this._lavaLights.length; z += 3) {
        for (let y = py - 6; y <= py + 4 && idx < this._lavaLights.length; y++) {
          const b = this.world.getBlock(x, y, z);
          if (b === BLOCK.LAVA || (BLOCK.LAVA_STILL && b === BLOCK.LAVA_STILL)) {
            const flicker = Math.sin(time * 8 + idx * 2) * 0.2;
            const l = this._lavaLights[idx];
            l.position.set(x + 0.5, y + 0.8, z + 0.5);
            l.intensity = 2.6 + flicker;
            l.visible = true;

            const h = this._lavaHalos[idx];
            if (h) {
              h.position.set(x + 0.5, y + 0.8, z + 0.5);
              const scale = 3.6 + flicker * 0.5;
              h.scale.set(scale, scale, 1);
              h.visible = true;
            }
            idx++;
            break;
          }
        }
      }
    }

    for (let i = idx; i < this._lavaLights.length; i++) {
      this._lavaLights[i].visible = false;
      if (this._lavaHalos[i]) this._lavaHalos[i].visible = false;
    }
  }

  updateBeaconBeams() {
    if (!this._beaconBeamMesh || !this.player || !this.world) return;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const range = 40;
    let found = false;

    for (let x = px - range; x <= px + range && !found; x += 4) {
      for (let z = pz - range; z <= pz + range && !found; z += 4) {
        for (let y = py - 10; y <= py + 15; y++) {
          const b = this.world.getBlock(x, y, z);
          if ((BLOCK.BEACON && b === BLOCK.BEACON) || (BLOCK.END_ROD && b === BLOCK.END_ROD)) {
            this._beaconBeamMesh.position.set(x + 0.5, y + 40, z + 0.5);
            this._beaconBeamMesh.rotation.y += 0.01;
            this._beaconBeamMesh.visible = true;
            found = true;
            break;
          }
        }
      }
    }

    if (!found && this._deathBeacon && this._deathBeaconT > 0) {
      this._beaconBeamMesh.position.set(this._deathBeacon.x, this._deathBeacon.y + 40, this._deathBeacon.z);
      this._beaconBeamMesh.rotation.y += 0.01;
      this._beaconBeamMesh.visible = true;
      found = true;
    }

    if (!found) this._beaconBeamMesh.visible = false;
  }

  updateCanopyGodRays(dt) {
    if (!this._canopyGodRays || !this.player || !this.world || !this.sunLight) return;
    const sunI = this.time ? this.time.sunIntensity() : 1.0;
    if (sunI < 0.25) {
      this._canopyGodRays.visible = false;
      return;
    }
    this._canopyGodRays.visible = true;

    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const range = 24;
    let idx = 0;
    const max = 35;
    const time = this.time ? (this.time.elapsed || 0) : 0;

    for (let x = px - range; x <= px + range && idx < max; x += 4) {
      for (let z = pz - range; z <= pz + range && idx < max; z += 4) {
        try {
          for (let y = py + 8; y >= py; y--) {
            const b = this.world.getBlock(x, y, z);
            if ((b === BLOCK.LEAVES || b === BLOCK.SPRUCE_LEAVES || b === BLOCK.SEQUOIA_LEAVES || b === BLOCK.PALM_LEAVES) &&
                this.world.getBlock(x, y - 1, z) === BLOCK.AIR) {
              const sway = Math.sin(time * 1.2 + x + z) * 0.1;
              this._godRayDummy.position.set(x + 0.5, y - 4, z + 0.5);
              this._godRayDummy.rotation.set(0.3 + sway * 0.2, (x + z) * 0.4, sway);
              this._godRayDummy.scale.set(0.8 + sway * 0.2, 1.2, 0.8 + sway * 0.2);
              this._godRayDummy.updateMatrix();
              this._canopyGodRays.setMatrixAt(idx, this._godRayDummy.matrix);
              idx++;
              break;
            }
          }
        } catch (e) {}
      }
    }

    for (let i = idx; i < max; i++) {
      this._godRayDummy.position.set(0, -1000, 0);
      this._godRayDummy.scale.setScalar(0);
      this._godRayDummy.updateMatrix();
      this._canopyGodRays.setMatrixAt(i, this._godRayDummy.matrix);
    }
    this._canopyGodRays.instanceMatrix.needsUpdate = true;
  }

  _initWaterVFX() {
    this._waterSplashPool = [];
    const splashGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const splashMat = new THREE.MeshBasicMaterial({ color: 0xddffff, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 40; i++) {
      const m = new THREE.Mesh(splashGeo, splashMat);
      m.visible = false;
      this.scene.add(m);
      this._waterSplashPool.push({ mesh: m, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0.45 });
    }

    const WATERFALL_COUNT = 120;
    const wfGeo = new THREE.BufferGeometry();
    const wfPos = new Float32Array(WATERFALL_COUNT * 3);
    for (let i = 0; i < WATERFALL_COUNT * 3; i += 3) {
      wfPos[i] = 0; wfPos[i + 1] = -1000; wfPos[i + 2] = 0;
    }
    wfGeo.setAttribute('position', new THREE.BufferAttribute(wfPos, 3));
    const wfMat = new THREE.PointsMaterial({
      color: 0xbceeff,
      size: 0.22,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    this._waterfallParticles = new THREE.Points(wfGeo, wfMat);
    this.scene.add(this._waterfallParticles);

    this._waterRipplePool = [];
    const ringGeo = new THREE.RingGeometry(0.08, 0.18, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x77ddff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    for (let i = 0; i < 20; i++) {
      const m = new THREE.Mesh(ringGeo, ringMat);
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      this.scene.add(m);
      this._waterRipplePool.push({ mesh: m, life: 0, maxLife: 0.75, scale: 0.2 });
    }

    this._underwaterBubblePool = [];
    const bubbleGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const bubbleMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    for (let i = 0; i < 30; i++) {
      const m = new THREE.Mesh(bubbleGeo, bubbleMat);
      m.visible = false;
      this.scene.add(m);
      this._underwaterBubblePool.push({ mesh: m, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1.2 });
    }
  }

  _spawnWaterSplash(x, y, z, count = 15) {
    let spawned = 0;
    for (const p of this._waterSplashPool) {
      if (p.life <= 0) {
        p.mesh.position.set(x + (Math.random() - 0.5) * 0.6, y, z + (Math.random() - 0.5) * 0.6);
        p.vx = (Math.random() - 0.5) * 2.5;
        p.vy = 2.0 + Math.random() * 2.5;
        p.vz = (Math.random() - 0.5) * 2.5;
        p.life = p.maxLife;
        p.mesh.visible = true;
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  _spawnWaterRipple(x, y, z) {
    for (const r of this._waterRipplePool) {
      if (r.life <= 0) {
        r.mesh.position.set(x, y + 0.02, z);
        r.scale = 0.2;
        r.mesh.scale.set(0.2, 0.2, 0.2);
        r.life = r.maxLife;
        r.mesh.visible = true;
        break;
      }
    }
  }

  _spawnUnderwaterBubble(x, y, z) {
    for (const b of this._underwaterBubblePool) {
      if (b.life <= 0) {
        b.mesh.position.set(x + (Math.random() - 0.5) * 0.4, y, z + (Math.random() - 0.5) * 0.4);
        b.vx = (Math.random() - 0.5) * 0.3;
        b.vy = 1.0 + Math.random() * 0.8;
        b.vz = (Math.random() - 0.5) * 0.3;
        b.life = b.maxLife;
        b.mesh.visible = true;
        break;
      }
    }
  }

  _updateWaterEffects(dt) {
    for (const p of this._waterSplashPool) {
      if (p.life > 0) {
        p.life -= dt;
        p.vy -= 9.8 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.material.opacity = (p.life / p.maxLife) * 0.85;
        if (p.life <= 0) p.mesh.visible = false;
      }
    }

    for (const r of this._waterRipplePool) {
      if (r.life > 0) {
        r.life -= dt;
        const progress = 1 - (r.life / r.maxLife);
        const s = 0.2 + progress * 2.2;
        r.mesh.scale.set(s, s, s);
        r.mesh.material.opacity = (1 - progress) * 0.7;
        if (r.life <= 0) r.mesh.visible = false;
      }
    }

    if (this.player && (this._cameraInWater || this.player.inWater)) {
      if (Math.random() < 0.3) {
        const eye = this.player.eyePosition();
        this._spawnUnderwaterBubble(eye.x, eye.y - 0.3, eye.z);
      }
    }
    for (const b of this._underwaterBubblePool) {
      if (b.life > 0) {
        b.life -= dt;
        b.mesh.position.x += (b.vx + Math.sin(b.life * 8) * 0.2) * dt;
        b.mesh.position.y += b.vy * dt;
        b.mesh.position.z += (b.vz + Math.cos(b.life * 8) * 0.2) * dt;
        b.mesh.material.opacity = (b.life / b.maxLife) * 0.65;
        if (b.life <= 0) b.mesh.visible = false;
      }
    }
  }

  updateWaterfallParticles(dt) {
    if (!this._waterfallParticles || !this.player || !this.world) return;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const range = 24;
    const pos = this._waterfallParticles.geometry.attributes.position.array;
    let idx = 0;
    const max = pos.length / 3;

    for (let x = px - range; x <= px + range && idx < max; x += 3) {
      for (let z = pz - range; z <= pz + range && idx < max; z += 3) {
        for (let y = py + 4; y >= py - 6; y--) {
          const b = this.world.getBlock(x, y, z);
          if (b === BLOCK.WATER && this.world.getBlock(x, y - 1, z) === BLOCK.AIR) {
            pos[idx * 3] = x + 0.5 + (Math.random() - 0.5) * 0.8;
            pos[idx * 3 + 1] = y - (Math.random() * 2.0);
            pos[idx * 3 + 2] = z + 0.5 + (Math.random() - 0.5) * 0.8;
            idx++;
            break;
          }
        }
      }
    }

    for (let i = idx; i < max; i++) {
      pos[i * 3 + 1] = -1000;
    }
    this._waterfallParticles.geometry.attributes.position.needsUpdate = true;
  }

  _initWeatherVFX() {
    const PUDDLE_COUNT = 250;
    const puddleGeo = new THREE.PlaneGeometry(0.85, 0.85);
    const puddleMat = new THREE.MeshBasicMaterial({
      color: 0x3a5a70,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this._rainPuddlePatches = new THREE.InstancedMesh(puddleGeo, puddleMat, PUDDLE_COUNT);
    this._rainPuddlePatches.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._rainPuddlePatches.frustumCulled = false;
    this.scene.add(this._rainPuddlePatches);
    this._rainPuddleDummy = new THREE.Object3D();
    for (let i = 0; i < PUDDLE_COUNT; i++) {
      this._rainPuddleDummy.position.set(0, -1000, 0);
      this._rainPuddleDummy.scale.setScalar(0);
      this._rainPuddleDummy.updateMatrix();
      this._rainPuddlePatches.setMatrixAt(i, this._rainPuddleDummy.matrix);
    }
    this._rainPuddlePatches.instanceMatrix.needsUpdate = true;

    const boltMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 3,
      transparent: true,
      opacity: 0.0,
    });
    const boltGeo = new THREE.BufferGeometry();
    this._lightningBoltMesh = new THREE.LineSegments(boltGeo, boltMat);
    this.scene.add(this._lightningBoltMesh);

    const SNOW_ACC_COUNT = 300;
    const snowAccGeo = new THREE.PlaneGeometry(0.98, 0.98);
    const snowAccMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this._snowAccumulationPatches = new THREE.InstancedMesh(snowAccGeo, snowAccMat, SNOW_ACC_COUNT);
    this._snowAccumulationPatches.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._snowAccumulationPatches.frustumCulled = false;
    this.scene.add(this._snowAccumulationPatches);
    this._snowAccumulationDummy = new THREE.Object3D();
    for (let i = 0; i < SNOW_ACC_COUNT; i++) {
      this._snowAccumulationDummy.position.set(0, -1000, 0);
      this._snowAccumulationDummy.scale.setScalar(0);
      this._snowAccumulationDummy.updateMatrix();
      this._snowAccumulationPatches.setMatrixAt(i, this._snowAccumulationDummy.matrix);
    }
    this._snowAccumulationPatches.instanceMatrix.needsUpdate = true;
  }

  updateRainPuddles(dt) {
    if (!this._rainPuddlePatches || !this.player || !this.world) return;
    const isRain = this._lastWeather === 'rain';
    const targetOpacity = isRain ? 0.65 : 0.0;
    this._rainPuddlePatches.material.opacity += (targetOpacity - this._rainPuddlePatches.material.opacity) * dt * 0.8;

    if (this._rainPuddlePatches.material.opacity <= 0.01) return;

    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const range = 25;
    let idx = 0;
    const max = 250;

    for (let x = px - range; x <= px + range && idx < max; x += 3) {
      for (let z = pz - range; z <= pz + range && idx < max; z += 3) {
        if (((x * 11 + z * 17) % 7) > 2) continue;
        for (let y = py + 3; y >= py - 4; y--) {
          const b = this.world.getBlock(x, y, z);
          if ((b === BLOCK.DIRT || b === BLOCK.GRASS || b === BLOCK.STONE) &&
              this.world.getBlock(x, y + 1, z) === BLOCK.AIR) {
            this._rainPuddleDummy.position.set(x + 0.5, y + 1.01, z + 0.5);
            this._rainPuddleDummy.rotation.set(-Math.PI / 2, 0, (x * 3 + z * 5) * 0.2);
            this._rainPuddleDummy.scale.set(0.8, 0.8, 1);
            this._rainPuddleDummy.updateMatrix();
            this._rainPuddlePatches.setMatrixAt(idx, this._rainPuddleDummy.matrix);
            idx++;
            break;
          }
        }
      }
    }

    for (let i = idx; i < max; i++) {
      this._rainPuddleDummy.position.set(0, -1000, 0);
      this._rainPuddleDummy.scale.setScalar(0);
      this._rainPuddleDummy.updateMatrix();
      this._rainPuddlePatches.setMatrixAt(i, this._rainPuddleDummy.matrix);
    }
    this._rainPuddlePatches.instanceMatrix.needsUpdate = true;
  }

  updateSnowAccumulation(dt) {
    if (!this._snowAccumulationPatches || !this.player || !this.world) return;
    const isSnow = this._lastWeather === 'snow';
    const targetOpacity = isSnow ? 0.85 : 0.0;
    this._snowAccumulationPatches.material.opacity += (targetOpacity - this._snowAccumulationPatches.material.opacity) * dt * 0.8;

    if (this._snowAccumulationPatches.material.opacity <= 0.01) return;

    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);
    const range = 25;
    let idx = 0;
    const max = 300;

    for (let x = px - range; x <= px + range && idx < max; x += 2) {
      for (let z = pz - range; z <= pz + range && idx < max; z += 2) {
        for (let y = py + 4; y >= py - 5; y--) {
          const b = this.world.getBlock(x, y, z);
          if (isSolid(b) && this.world.getBlock(x, y + 1, z) === BLOCK.AIR) {
            this._snowAccumulationDummy.position.set(x + 0.5, y + 1.01, z + 0.5);
            this._snowAccumulationDummy.rotation.set(-Math.PI / 2, 0, 0);
            this._snowAccumulationDummy.scale.set(0.98, 0.98, 1);
            this._snowAccumulationDummy.updateMatrix();
            this._snowAccumulationPatches.setMatrixAt(idx, this._snowAccumulationDummy.matrix);
            idx++;
            break;
          }
        }
      }
    }

    for (let i = idx; i < max; i++) {
      this._snowAccumulationDummy.position.set(0, -1000, 0);
      this._snowAccumulationDummy.scale.setScalar(0);
      this._snowAccumulationDummy.updateMatrix();
      this._snowAccumulationPatches.setMatrixAt(i, this._snowAccumulationDummy.matrix);
    }
    this._snowAccumulationPatches.instanceMatrix.needsUpdate = true;
  }

  _updateWeatherVFX(dt) {
    if (this._stormFlashT > 0) {
      this._stormFlashT -= dt;
      this._screenShakeAcc = Math.max(0, this._stormFlashT * 0.6);
      if (this._lightningBoltMesh) {
        this._lightningBoltMesh.material.opacity = Math.min(1, this._stormFlashT * 3.0);
        if (this._stormFlashT > 0.2) {
          this._lightningBoltMesh.material.color.setHex(0xffffff);
        } else {
          this._lightningBoltMesh.material.color.setHex(0x9966ff);
        }
      }
    } else if (this._lightningBoltMesh) {
      this._lightningBoltMesh.material.opacity = 0;
    }

    if (this._screenShakeAcc > 0 && this.camera) {
      this.camera.position.x += (Math.random() - 0.5) * this._screenShakeAcc;
      this.camera.position.y += (Math.random() - 0.5) * this._screenShakeAcc;
      this._screenShakeAcc = Math.max(0, this._screenShakeAcc - dt * 2.0);
    }
  }

  _triggerLightningStrike(x, z) {
    if (!this.player || !this._lightningBoltMesh) return;
    const py = Math.floor(this.player.position.y);
    const groundY = py;
    const points = [];
    let curX = x;
    let curY = 90;
    let curZ = z;

    while (curY > groundY) {
      const nextY = Math.max(groundY, curY - 8 - Math.random() * 10);
      const nextX = curX + (Math.random() - 0.5) * 6;
      const nextZ = curZ + (Math.random() - 0.5) * 6;
      points.push(curX, curY, curZ, nextX, nextY, nextZ);
      curX = nextX; curY = nextY; curZ = nextZ;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    this._lightningBoltMesh.geometry.dispose();
    this._lightningBoltMesh.geometry = geo;
    this._stormFlashT = 0.35;
    this._screenShakeAcc = 0.5;
    this.audio.thunder?.() || this.audio.hurt?.();
  }

  _initCreaturesVFX() {
    this._birdFlockGroup = new THREE.Group();
    this._birdFlockList = [];
    const birdGeo = new THREE.ConeGeometry(0.15, 0.4, 4);
    const wingGeo = new THREE.BoxGeometry(0.45, 0.02, 0.15);
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x223344 });
    for (let i = 0; i < 5; i++) {
      const bird = new THREE.Group();
      const body = new THREE.Mesh(birdGeo, birdMat);
      body.rotation.x = Math.PI / 2;
      const leftWing = new THREE.Mesh(wingGeo, birdMat);
      leftWing.position.set(-0.22, 0, 0);
      const rightWing = new THREE.Mesh(wingGeo, birdMat);
      rightWing.position.set(0.22, 0, 0);
      bird.add(body, leftWing, rightWing);

      const vOffset = (i === 0) ? { x: 0, z: 0 } : (i % 2 === 1) ? { x: i * 1.5, z: i * 2.0 } : { x: -i * 1.5, z: i * 2.0 };
      bird.position.set(vOffset.x, 0, vOffset.z);
      this._birdFlockGroup.add(bird);
      this._birdFlockList.push({ group: bird, lwing: leftWing, rwing: rightWing });
    }
    this.scene.add(this._birdFlockGroup);

    this._fishFlockGroup = new THREE.Group();
    this._fishFlockList = [];
    const fishBodyGeo = new THREE.ConeGeometry(0.08, 0.35, 5);
    const fishMat = new THREE.MeshLambertMaterial({ color: 0xff8844 });
    for (let i = 0; i < 6; i++) {
      const fish = new THREE.Mesh(fishBodyGeo, fishMat);
      fish.rotation.x = Math.PI / 2;
      fish.position.set((Math.random() - 0.5) * 8, -0.6 - Math.random() * 1.2, (Math.random() - 0.5) * 8);
      this._fishFlockGroup.add(fish);
      this._fishFlockList.push({ mesh: fish, phase: Math.random() * Math.PI * 2 });
    }
    this.scene.add(this._fishFlockGroup);
  }

  _updateCreaturesVFX(dt) {
    const time = this.time ? (this.time.elapsed || 0) : 0;
    if (this.player && this._birdFlockGroup) {
      const px = this.player.position.x;
      const py = this.player.position.y;
      const pz = this.player.position.z;
      this._birdFlockGroup.position.set(
        px + Math.sin(time * 0.1) * 40,
        py + 35,
        pz + Math.cos(time * 0.1) * 40
      );
      this._birdFlockGroup.rotation.y = time * 0.1;

      for (let i = 0; i < this._birdFlockList.length; i++) {
        const b = this._birdFlockList[i];
        const flap = Math.sin(time * 8 + i) * 0.4;
        b.lwing.rotation.z = flap;
        b.rwing.rotation.z = -flap;
      }
    }

    if (this.player && this._fishFlockGroup) {
      const px = Math.floor(this.player.position.x);
      const py = Math.floor(this.player.position.y);
      const pz = Math.floor(this.player.position.z);
      this._fishFlockGroup.position.set(px, py, pz);

      for (let i = 0; i < this._fishFlockList.length; i++) {
        const f = this._fishFlockList[i];
        f.phase += dt * 3.0;
        f.mesh.position.x += Math.sin(f.phase * 0.7) * dt * 0.6;
        f.mesh.position.z += Math.cos(f.phase * 0.5) * dt * 0.6;
        f.mesh.rotation.z = Math.sin(f.phase * 2) * 0.25;
      }
    }
  }

  _spawnBlockPop(x, y, z, blockId) {
    const geo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    const col = getColor(blockId, 'top');
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(col[0], col[1], col[2]),
      transparent: true,
      opacity: 0.5,
      wireframe: true,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x + 0.5, y + 0.5, z + 0.5);
    m.scale.setScalar(0.8);
    this.scene.add(m);
    this._blockPops.push({ mesh: m, t: 0, maxT: 0.15 });
  }

  _updateBlockPops(dt) {
    for (let i = this._blockPops.length - 1; i >= 0; i--) {
      const p = this._blockPops[i];
      p.t += dt;
      const progress = Math.min(1, p.t / p.maxT);
      const scale = 0.8 + Math.sin(progress * Math.PI) * 0.28;
      p.mesh.scale.setScalar(scale);
      p.mesh.material.opacity = (1 - progress) * 0.6;
      if (progress >= 1) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this._blockPops.splice(i, 1);
      }
    }
  }

  _updateScreenVFX(dt) {
    if (!this.player || !this.camera) return;

    const curYaw = this.player.yaw || 0;
    const curPitch = this.player.pitch || 0;
    const dYaw = Math.abs(curYaw - (this._lastCamYaw || 0));
    const dPitch = Math.abs(curPitch - (this._lastCamPitch || 0));
    this._lastCamYaw = curYaw;
    this._lastCamPitch = curPitch;
    const rotSpeed = (dYaw + dPitch) / dt;
    this._camRotVel += (rotSpeed - this._camRotVel) * Math.min(1, dt * 5.0);

    const hurt = (typeof document !== 'undefined') ? document.getElementById('hurt-vignette') : null;
    if (hurt) {
      const ssaoFactor = Math.min(0.4, (this._caveEnclosedFactor || 0) * 0.35);
      const curOp = parseFloat(hurt.style.opacity || '0');
      hurt.style.opacity = String(Math.max(curOp, ssaoFactor));
    }
  }

  updatePebblePatches() {
    if (!this._pebblePatches || !this.player || !this.world) return;

    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    const pz = Math.floor(this.player.position.z);

    const range = 30;
    let idx = 0;
    const maxPebbles = 400;

    for (let x = px - range; x <= px + range && idx < maxPebbles; x += 3) {
      for (let z = pz - range; z <= pz + range && idx < maxPebbles; z += 3) {
        try {
          if (((x * 23 + z * 37) % 7) > 2) continue;

          for (let y = py + 3; y >= py - 5; y--) {
            const block = this.world.getBlock(x, y, z);
            if ((block === BLOCK.DIRT || block === BLOCK.DAMP_SOIL || block === BLOCK.COARSE_DIRT) &&
                (this.world.getBlock(x, y + 1, z) === BLOCK.AIR)) {
              this._pebbleDummy.position.set(
                x + 0.3 + ((x * 11 + z * 17) % 5) * 0.1,
                y + 1.04,
                z + 0.3 + ((x * 7 + z * 13) % 5) * 0.1
              );
              this._pebbleDummy.rotation.set((x % 3) * 0.2, (x * 7 + z * 5) * 0.4, (z % 3) * 0.2);
              this._pebbleDummy.scale.set(0.12, 0.06, 0.12);
              this._pebbleDummy.updateMatrix();
              this._pebblePatches.setMatrixAt(idx, this._pebbleDummy.matrix);
              idx++;
              break;
            }
          }
        } catch (e) { /* silent catch */ }
      }
    }

    for (let i = idx; i < maxPebbles; i++) {
      this._pebbleDummy.position.set(0, -1000, 0);
      this._pebbleDummy.scale.setScalar(0);
      this._pebbleDummy.updateMatrix();
      this._pebblePatches.setMatrixAt(i, this._pebbleDummy.matrix);
    }
    this._pebblePatches.instanceMatrix.needsUpdate = true;
  }

  updateEnvironmentalParticles(dt) {
    if (!this.player) return;
    const px = this.player.position.x;
    const py = this.player.position.y;
    const pz = this.player.position.z;
    const time = this.time ? (this.time.elapsed || 0) : 0;
    const currentBiome = biomeAt ? biomeAt(px, pz, this.world ? this.world.seed : 1) : BIOME.FOREST;

    // 1. Floating Pollen (Forest & Tropical)
    if (this._pollenParticles) {
      const isPollenBiome = (currentBiome === BIOME.FOREST || currentBiome === BIOME.TROPICAL);
      const targetOpacity = isPollenBiome ? 0.70 : 0.0;
      this._pollenParticles.material.opacity += (targetOpacity - this._pollenParticles.material.opacity) * dt * 3.0;

      if (this._pollenParticles.material.opacity > 0.01) {
        const pos = this._pollenParticles.geometry.attributes.position.array;
        for (let i = 0; i < pos.length / 3; i++) {
          pos[i * 3]     += Math.sin(time * 0.9 + i) * dt * 0.6;
          pos[i * 3 + 1] += Math.cos(time * 0.7 + i * 2) * dt * 0.3;
          pos[i * 3 + 2] += Math.sin(time * 0.8 + i * 3) * dt * 0.6;

          if (Math.abs(pos[i * 3] - px) > 35) pos[i * 3] = px + (Math.random() - 0.5) * 60;
          if (pos[i * 3 + 1] < py - 5 || pos[i * 3 + 1] > py + 20) pos[i * 3 + 1] = py + Math.random() * 15;
          if (Math.abs(pos[i * 3 + 2] - pz) > 35) pos[i * 3 + 2] = pz + (Math.random() - 0.5) * 60;
        }
        this._pollenParticles.geometry.attributes.position.needsUpdate = true;
      }
    }

    // 2. Fireflies at Night (hovering above ground)
    if (this._fireflyParticles) {
      const isNight = this.time ? this.time.isNight() : false;
      const targetOpacity = isNight ? 0.85 : 0.0;
      this._fireflyParticles.material.opacity += (targetOpacity - this._fireflyParticles.material.opacity) * dt * 3.0;

      if (this._fireflyParticles.material.opacity > 0.01) {
        const pos = this._fireflyParticles.geometry.attributes.position.array;
        for (let i = 0; i < pos.length / 3; i++) {
          pos[i * 3]     += Math.sin(time * 1.5 + i * 1.7) * dt * 0.8;
          pos[i * 3 + 1] += Math.sin(time * 2.2 + i * 0.5) * dt * 0.4;
          pos[i * 3 + 2] += Math.cos(time * 1.3 + i * 2.1) * dt * 0.8;

          if (Math.abs(pos[i * 3] - px) > 30) pos[i * 3] = px + (Math.random() - 0.5) * 50;
          if (Math.abs(pos[i * 3 + 2] - pz) > 30) pos[i * 3 + 2] = pz + (Math.random() - 0.5) * 50;
          
          const groundY = (this.world && typeof heightAt === 'function') 
            ? heightAt(pos[i * 3], pos[i * 3 + 2], this.world.seed) 
            : py;
          if (pos[i * 3 + 1] < groundY + 0.5 || pos[i * 3 + 1] > groundY + 5.0) {
            pos[i * 3 + 1] = groundY + 1.0 + Math.random() * 3.0;
          }
        }
        this._fireflyParticles.geometry.attributes.position.needsUpdate = true;
      }
    }

    // 3. Snow accumulation hints in Tundra
    if (this._snowHintParticles) {
      const isTundra = (currentBiome === BIOME.TUNDRA);
      const targetOpacity = isTundra ? 0.75 : 0.0;
      this._snowHintParticles.material.opacity += (targetOpacity - this._snowHintParticles.material.opacity) * dt * 3.0;

      if (this._snowHintParticles.material.opacity > 0.01) {
        const pos = this._snowHintParticles.geometry.attributes.position.array;
        for (let i = 0; i < pos.length / 3; i++) {
          pos[i * 3]     += Math.sin(time * 1.1 + i) * dt * 0.8;
          pos[i * 3 + 1] -= dt * 1.5;
          pos[i * 3 + 2] += Math.cos(time * 0.9 + i * 2) * dt * 0.8;

          if (pos[i * 3 + 1] < py - 10 || Math.abs(pos[i * 3] - px) > 40 || Math.abs(pos[i * 3 + 2] - pz) > 40) {
            pos[i * 3]     = px + (Math.random() - 0.5) * 70;
            pos[i * 3 + 1] = py + 10 + Math.random() * 15;
            pos[i * 3 + 2] = pz + (Math.random() - 0.5) * 70;
          }
        }
        this._snowHintParticles.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  updateAtmosphericEffects(dt) {
    if (!this.scene || !this.sunLight) return;
    const sunDir = this.sunLight.position.clone().normalize();
    const sunI = this.time ? this.time.sunIntensity() : 1.0;
    const sunsetFactor = Math.max(0, 1.0 - Math.abs(sunDir.y) / 0.35);

    // FogExp2 + dynamic gradient
    const targetDensity = 0.006 + (1.0 - sunI) * 0.008;
    if (!(this.scene.fog instanceof THREE.FogExp2)) {
      const curColor = this.scene.fog ? this.scene.fog.color : new THREE.Color(0x87b5ff);
      this.scene.fog = new THREE.FogExp2(curColor, targetDensity);
    }
    this.scene.fog.density = targetDensity;
    this.scene.fog.near = 1.0 / (targetDensity * 4.0);
    this.scene.fog.far = 1.0 / targetDensity;

    const sky = this.time ? this.time.skyColor() : { r: 0.5, g: 0.7, b: 1.0 };
    const skyTopColor = new THREE.Color(sky.r, sky.g, sky.b);
    const skyBottomColor = skyTopColor.clone().lerp(new THREE.Color(0xff7744), sunsetFactor * 0.75);
    const fogColor = skyBottomColor.clone().lerp(skyTopColor, 0.35);
    this.scene.fog.color.copy(fogColor);

    // Volumetric light rays
    if (this.volumetricLightRays && this.camera) {
      const rayDist = 45;
      this.volumetricLightRays.position.copy(this.camera.position).addScaledVector(sunDir, rayDist);
      this.volumetricLightRays.lookAt(this.camera.position);
      this.volumetricLightRays.rotateX(Math.PI / 2);
      const rayOpacity = Math.max(0, (sunI - 0.1) * 0.18 * (1.0 - sunsetFactor * 0.4));
      this.volumetricLightRays.material.opacity = rayOpacity;
    }

    // Sunset/Sunrise Lens flare sprite
    if (this.lensFlareSprite && this.camera) {
      this.lensFlareSprite.position.copy(this.camera.position).addScaledVector(sunDir, 160);
      const flareIntensity = sunsetFactor * 0.95;
      this.lensFlareSprite.material.opacity = flareIntensity;
      if (flareIntensity > 0.01) {
        this.lensFlareSprite.material.color.setHSL(0.06 + (1.0 - sunI) * 0.04, 0.95, 0.6);
        this.lensFlareSprite.scale.set(70 * (1.0 + sunsetFactor * 0.5), 70 * (1.0 + sunsetFactor * 0.5), 1);
      }
    }

    // Horizon glow effect
    if (this.horizonGlowMesh && this.camera) {
      this.horizonGlowMesh.position.set(
        this.camera.position.x + sunDir.x * 120,
        Math.max(16, this.camera.position.y - 2),
        this.camera.position.z + sunDir.z * 120
      );
      this.horizonGlowMesh.lookAt(this.camera.position);
      this.horizonGlowMesh.material.opacity = sunsetFactor * 0.45;
      if (sunsetFactor > 0.01) {
        this.horizonGlowMesh.material.color.setRGB(1.0, 0.45 + sunI * 0.2, 0.25);
      }
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
      const hit = this.world.raycast(origin, dir, 6);
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
      const hit = this.world.raycast(origin, dir, 6);
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
        import(`./input-coop.js?v=260`).then((mod) => {
          if (!this.coopMode || this._coopRouter) return;
          this._coopRouter = new mod.CoopInputRouter(this.canvas, { kbmPlayer: mod.P1 });
          this._coopRouter.setKbmInput(this.input);
        }).catch(() => {});
      } catch (_) {}
    }
  }

  _updateHud() {
    if (!this._enhancedUIInited) this._initEnhancedUI();
    this._updateMinimap();
    this._updateXPBar();

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
      status.textContent = bits.join(' · ');
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
          el.innerHTML = stack.count > 1 ? `<span class="hb-count">${stack.count}</span>` : '';
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

  render(dt = 0.016) {
    this.updateSunLight();
    this.updateAtmosphericEffects(dt);
    this.updateEnvironmentalParticles(dt);
    this.updatePlayerShadow();
    this.applyUnderwaterVisuals();
    this._waterTimer += dt;
    if (this._waterTimer > 0.033) { // ~30fps
      this._waterTimer = 0;
      this.updateWaterSurface(dt);
    }

    this._grassTimer += dt;
    if (this._grassTimer > 1) { // Update grass every second (expensive)
      this._grassTimer = 0;
      this.updateGrassBlades(dt);
    }

    this._mossTimer = (this._mossTimer || 0) + dt;
    if (this._mossTimer > 2.0) { // Update moss patches every 2 seconds
      this._mossTimer = 0;
      this.updateMossPatches();
    }

    this._flowerTimer = (this._flowerTimer || 0) + dt;
    if (this._flowerTimer > 2.0) { // Update flower patches every 2 seconds
      this._flowerTimer = 0;
      this.updateFlowers();
    }

    this._pebbleTimer = (this._pebbleTimer || 0) + dt;
    if (this._pebbleTimer > 2.0) {
      this._pebbleTimer = 0;
      this.updatePebblePatches();
    }

    this._mushroomTimer = (this._mushroomTimer || 0) + dt;
    if (this._mushroomTimer > 2.0) {
      this._mushroomTimer = 0;
      this.updateMushroomPatches();
    }

    this._stumpTimer = (this._stumpTimer || 0) + dt;
    if (this._stumpTimer > 2.0) {
      this._stumpTimer = 0;
      this.updateStumpProps();
    }

    this._torchUpdateTimer += dt;
    if (this._torchUpdateTimer > 0.5) { // Update torches twice per second
      this._torchUpdateTimer = 0;
      this.updateTorchLights();
    }
    this._glowTimer = (this._glowTimer || 0) + dt;
    if (this._glowTimer > 2.0) { // Update glow blocks every 2 seconds
      this._glowTimer = 0;
      this.updateGlowBlocks();
    }

    this._lavaTimer = (this._lavaTimer || 0) + dt;
    if (this._lavaTimer > 1.0) {
      this._lavaTimer = 0;
      this.updateLavaLights();
    }

    this._beaconTimer = (this._beaconTimer || 0) + dt;
    if (this._beaconTimer > 0.5) {
      this._beaconTimer = 0;
      this.updateBeaconBeams();
    }

    this.updateCanopyGodRays(dt);
    this.updateWaterfallParticles(dt);
    this.updateRainPuddles(dt);
    this.updateSnowAccumulation(dt);
    this.updateCaveDarkening(dt);
    this.updateWeather(dt);
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
