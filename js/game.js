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
    this.fauna = null;
    this._animalMeshes = new Map();
    this.input = new Input(canvas);
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

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('beforeunload', this._onBeforeUnload);

    this._bindInventoryUi();

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

  start(seed = this.seed) {
    this.seed = seed;
    this._bootWorld({
      seed,
      freshPlayer: true,
      notify: 'Hunt wildlife for meat, cook at campfires, watch for wolves at night. E craft · F cook · K save',
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
      this.player = new Player(spawn);
      this.survival = { ...DEFAULT_SURVIVAL };
      this.time = new GameTime({ dayLengthSec: 420 });
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
      this.mode = saveData.mode || 'survival';
    }

    this.prevHealth = this.survival.health;
    // keep spawn safe from wolves/hares packed on face
    if (this.fauna && this.player) {
      this.fauna.clearNear(this.player.position.x, this.player.position.z, 16);
    }
    this.started = true;
    this.paused = false;
    this.input.bind();
    this.setInventoryOpen(false);
    if (notify) {
      this.player.notify(notify, 7);
    } else if (freshPlayer) {
      this.player.notify('Hunt hares & deer for meat. Cook at a campfire. Wolves hunt you at night.', 8);
    }
    if (!this._raf) this._loop();
    this.hud.hideTitle?.();
    this._invNeedsPaint = true;
    this._autosaveAcc = 0;
    this._syncAnimalMeshes();
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
    };
  }

  saveGame({ quiet = false } = {}) {
    if (!this.started || !this.player || !this.world) {
      return { ok: false, error: 'not started' };
    }
    if (this.survival.dead) {
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
    if (!this.paused && this.started) this.update(dt);
    this.render();
  };

  setInventoryOpen(open) {
    if (!this.player) return;
    this.player.inventoryOpen = open;
    this.input.uiMode = open;
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
      if (this.started && !this.survival.dead) this.saveGame({ quiet: true });
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

    let move = { moved: false, sprinting: false, inWater: false };
    if (!this.player.inventoryOpen) {
      move = this.player.update(this.world, this.input, this.survival, dt);
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
      hungerMult: this.mode === 'harmless' ? 0.15 : 1,
    });

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
      this.hud.showDeath?.(this.survival.causeOfDeath);
      return;
    }
    this._deathSfxPlayed = false;

    if (!this.player.inventoryOpen) {
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
      this._handleCookUse();
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

  _handleMining(dt) {
    const origin = this.player.eyePosition();
    const dir = this.player.lookDir();

    // Melee animals on click-hold with cooldown
    if (this.input.breakHeld && this.fauna && this._meleeCd <= 0) {
      const ah = this.fauna.rayHit(origin, dir, 3.6);
      if (ah) {
        this.player.breaking = null;
        const held = propsOf(this.player.heldId());
        const dmg = held?.melee || 4;
        const res = this.fauna.damageAnimal(ah.animal, dmg);
        this.audio.breakBlock();
        this._meleeCd = 0.35;
        this.audio.hit?.();
        if (res?.killed) {
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
        if (hit.id === BLOCK.LEAVES) {
          drop = Math.random() < 0.12 ? ITEM.STICK : null;
        }
        const col = getColor(hit.id, 'side');
        this.fx.burst(hit.x, hit.y, hit.z, col, 12);
        this.fx.hideCrack();
        this.world.setBlock(hit.x, hit.y, hit.z, BLOCK.AIR);
        this.audio.breakBlock();
        this.player.breaking = null;
        if (drop && drop !== BLOCK.AIR) {
          const res = addItems(this.player.slots, drop, 1);
          this.player.slots = res.slots;
          if (res.leftover > 0) {
            this.player.notify('Inventory full — drop lost.');
          } else {
            this.player.notify(`+1 ${displayName(drop)}`, 1.4);
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
      if (blockId === BLOCK.CAMPFIRE) this.player.notify('Campfire lit. Stay close — heat fights the cold.');
      if (blockId === BLOCK.TORCH) this.player.notify('Torch placed.');
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

    const status = document.getElementById('status-line');
    if (status) {
      const bits = [];
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
    if (cross && this._target && !this.player.inventoryOpen) cross.classList.add('hit');
    else if (cross) cross.classList.remove('hit');
  }

  _tempBar(bodyTemp) {
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
    this.setInventoryOpen(false);
    this.player.notify('You wake cold and hungry. Mine, craft, light a fire.');
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this.input.unbind();
  }
}
