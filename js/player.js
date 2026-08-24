import * as THREE from 'three';
import { isSolid, BLOCK, BLOCK_PROPS } from './blocks.js?v=291';
import { canSprint, moveSpeedMultiplier, fallDamageFromSpeed } from './survival.js?v=221';
import { honeyMoveMult, honeyJumpMult } from './honey-slide.js?v=220';
import { powderSnowSinkVy } from './powder-snow.js?v=220';
import { scaffoldingClimbVy } from './scaffolding.js?v=220';
import { createStarterInventory, getHotbarStack } from './inventory.js?v=222';
import { emptyEquipment } from './equipment.js?v=220';
import { ITEM } from './items.js?v=250';

const PLAYER_RADIUS = 0.3;
const PLAYER_HEIGHT = 1.7;
const EYE = 1.55;
const GRAVITY = 22;
const JUMP_V = 8.2;
const BASE_SPEED = 5.2;

export class Player {
  /**
   * @param {{x:number,y:number,z:number}} spawn
   * @param {{ starterRations?: number }} [opts]
   */
  constructor(spawn, opts = {}) {
    this.position = new THREE.Vector3(spawn.x, spawn.y, spawn.z);
    this.velocity = new THREE.Vector3();
    this.onGround = false;
    this.yaw = 0;
    this.pitch = 0;
    this.hotbarIndex = 0;
    this.breaking = null; // {x,y,z, progress}
    this.slots = createStarterInventory(opts.starterRations ?? 3);
    this.equipment = emptyEquipment();
    this.inventoryOpen = false;
    this.message = '';
    this.messageT = 0;
    this._fallVy = 0;
    /** @type {number} last fall damage this frame (consumed by game) */
    this.pendingFallDamage = 0;
  }

  heldStack() {
    return getHotbarStack(this.slots, this.hotbarIndex);
  }

  heldId() {
    return this.heldStack().id;
  }

  eyePosition(out = new THREE.Vector3()) {
    return out.set(this.position.x, this.position.y + EYE, this.position.z);
  }

  setLook(yaw, pitch) {
    this.yaw = yaw;
    this.pitch = pitch;
  }

  lookDir(out = new THREE.Vector3()) {
    const cp = Math.cos(this.pitch);
    out.set(
      -Math.sin(this.yaw) * cp,
      -Math.sin(this.pitch),
      -Math.cos(this.yaw) * cp,
    );
    return out.normalize();
  }

  notify(msg, t = 2.5) {
    this.message = msg;
    this.messageT = t;
  }

  /**
   * @param {import('./world.js?v=220').World} world
   * @param {import('./input.js?v=220').Input} input
   * @param {object} survival state
   * @param {number} dt
   */
  update(world, input, survival, dt) {
    this.yaw = input.lookX;
    this.pitch = input.lookY;
    this.pendingFallDamage = 0;

    if (this.messageT > 0) this.messageT -= dt;

    if (survival.dead) {
      this.velocity.set(0, 0, 0);
      return { moved: false, sprinting: false, inWater: false, crouching: false, onLadder: false, boat: false };
    }

    const slot = input.consumeSlot();
    if (slot >= 0) this.hotbarIndex = slot;

    const scroll = input.consumeHotbarScroll();
    if (scroll !== 0) {
      this.hotbarIndex = (this.hotbarIndex + scroll + 9) % 9;
    }

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wish = new THREE.Vector3();
    if (input.wantsForward()) wish.add(forward);
    if (input.wantsBack()) wish.sub(forward);
    if (input.wantsLeft()) wish.sub(right);
    if (input.wantsRight()) wish.add(right);
    const moving = wish.lengthSq() > 0;
    if (moving) wish.normalize();

    const crouching = !!(input.wantsCrouch && input.wantsCrouch());
    const sprinting = !crouching && input.wantsSprint() && moving && canSprint(survival);
    let speed = BASE_SPEED * moveSpeedMultiplier(survival, sprinting);
    if (crouching) speed *= 0.42;

    // honey block under feet (name match until dedicated BLOCK.HONEY exists)
    const underId = world.getBlock(this.position.x, this.position.y - 0.05, this.position.z);
    const underName = (BLOCK_PROPS[underId]?.name || '').toLowerCase();
    const onHoney = underName.includes('honey');
    speed *= honeyMoveMult(onHoney);

    // powder snow at feet/body (name match until BLOCK.POWDER_SNOW)
    const feetId = world.getBlock(this.position.x, this.position.y + 0.1, this.position.z);
    const bodyId = world.getBlock(this.position.x, this.position.y + 1.0, this.position.z);
    const feetName = (BLOCK_PROPS[feetId]?.name || '').toLowerCase();
    const bodyName = (BLOCK_PROPS[bodyId]?.name || '').toLowerCase();
    const inPowderSnow =
      feetName.includes('powder') && feetName.includes('snow') ||
      bodyName.includes('powder') && bodyName.includes('snow') ||
      feetName.includes('powdersnow') ||
      bodyName.includes('powdersnow');

    // water
    const feetY = this.position.y + 0.1;
    const inWater = world.getBlock(this.position.x, feetY, this.position.z) === BLOCK.WATER
      || world.getBlock(this.position.x, this.position.y + 1.0, this.position.z) === BLOCK.WATER;

    // boat boost
    const held = this.heldId();
    const boat = held === ITEM.BOAT;
    const waterMul = inWater ? (boat ? 1.35 : 0.55) : 1;

    // ladder / scaffolding climb
    const bx = Math.floor(this.position.x);
    const by = Math.floor(this.position.y + 0.5);
    const bz = Math.floor(this.position.z);
    const idHere = world.getBlock(bx, by, bz);
    const idUp = world.getBlock(bx, by + 1, bz);
    const idFeet = world.getBlock(bx, Math.floor(this.position.y), bz);
    const nameHere = (BLOCK_PROPS[idHere]?.name || '').toLowerCase();
    const nameUp = (BLOCK_PROPS[idUp]?.name || '').toLowerCase();
    const nameFeet = (BLOCK_PROPS[idFeet]?.name || '').toLowerCase();
    const onScaffolding =
      nameHere.includes('scaffold') ||
      nameUp.includes('scaffold') ||
      nameFeet.includes('scaffold');
    const onLadder =
      idHere === BLOCK.LADDER ||
      idUp === BLOCK.LADDER ||
      idFeet === BLOCK.LADDER ||
      onScaffolding;

    this.velocity.x = wish.x * speed * waterMul;
    this.velocity.z = wish.z * speed * waterMul;

    if (onLadder) {
      this.velocity.y = 0;
      if (onScaffolding) {
        const up = !!(input.wantsJump() || input.wantsForward());
        const down = !!(crouching || input.wantsBack());
        this.velocity.y = scaffoldingClimbVy(up && !down) || (down ? -scaffoldingClimbVy(true) * 0.85 : 0);
        if (up && down) this.velocity.y = 0;
      } else {
        if (input.wantsJump() || input.wantsForward()) this.velocity.y = 4.2;
        if (crouching || input.wantsBack()) this.velocity.y = -3.5;
      }
      this._fallVy = 0;
      this.onGround = true;
    } else if (inWater) {
      this.velocity.y += (input.wantsJump() ? (boat ? 14 : 12) : -6) * dt;
      this.velocity.y *= (1 - Math.min(1, 4 * dt));
      this._fallVy = 0;
    } else if (inPowderSnow) {
      // sink slowly; jump still works but reduced
      const sink = powderSnowSinkVy(true, false);
      this.velocity.y = sink;
      if (input.wantsJump()) this.velocity.y = Math.max(this.velocity.y, JUMP_V * 0.35);
      this._fallVy = 0;
    } else {
      this.velocity.y -= GRAVITY * dt;
      if (this.onGround && input.wantsJump()) {
        this.velocity.y = JUMP_V * (crouching ? 0.7 : 1) * honeyJumpMult(onHoney);
        this.onGround = false;
      }
      if (this.velocity.y < 0) this._fallVy = Math.max(this._fallVy, -this.velocity.y);
    }

    const wasGround = this.onGround;
    this._moveAxis(world, dt, 'x');
    this._moveAxis(world, dt, 'y');
    this._moveAxis(world, dt, 'z');

    // landing fall damage
    if (!inWater && !wasGround && this.onGround && this._fallVy > 0) {
      const dmg = fallDamageFromSpeed(this._fallVy);
      if (dmg > 0) this.pendingFallDamage = dmg;
      this._fallVy = 0;
    }
    if (this.onGround || inWater) this._fallVy = 0;

    // fall reset if void
    if (this.position.y < -20) {
      this.position.y = 40;
      this.velocity.y = 0;
      this._fallVy = 0;
      this.pendingFallDamage = 25;
      this.notify('You scramble back from the void...');
    }

    return { moved: moving, sprinting, inWater, crouching, onLadder, boat };
  }

  _moveAxis(world, dt, axis) {
    const p = this.position;
    const v = this.velocity;
    if (axis === 'x') p.x += v.x * dt;
    if (axis === 'y') p.y += v.y * dt;
    if (axis === 'z') p.z += v.z * dt;

    const minX = p.x - PLAYER_RADIUS;
    const maxX = p.x + PLAYER_RADIUS;
    const minY = p.y;
    const maxY = p.y + PLAYER_HEIGHT;
    const minZ = p.z - PLAYER_RADIUS;
    const maxZ = p.z + PLAYER_RADIUS;

    const x0 = Math.floor(minX);
    const x1 = Math.floor(maxX);
    const y0 = Math.floor(minY);
    const y1 = Math.floor(maxY);
    const z0 = Math.floor(minZ);
    const z1 = Math.floor(maxZ);

    if (axis === 'y') this.onGround = false;

    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        for (let x = x0; x <= x1; x++) {
          if (!isSolid(world.getBlock(x, y, z))) continue;
          // AABB resolve
          const bx0 = x;
          const bx1 = x + 1;
          const by0 = y;
          const by1 = y + 1;
          const bz0 = z;
          const bz1 = z + 1;
          if (maxX <= bx0 || minX >= bx1 || maxY <= by0 || minY >= by1 || maxZ <= bz0 || minZ >= bz1) continue;

          if (axis === 'x') {
            if (v.x > 0) p.x = bx0 - PLAYER_RADIUS - 1e-4;
            else if (v.x < 0) p.x = bx1 + PLAYER_RADIUS + 1e-4;
            v.x = 0;
          } else if (axis === 'z') {
            if (v.z > 0) p.z = bz0 - PLAYER_RADIUS - 1e-4;
            else if (v.z < 0) p.z = bz1 + PLAYER_RADIUS + 1e-4;
            v.z = 0;
          } else if (axis === 'y') {
            if (v.y > 0) {
              p.y = by0 - PLAYER_HEIGHT - 1e-4;
              v.y = 0;
            } else if (v.y < 0) {
              p.y = by1 + 1e-4;
              v.y = 0;
              this.onGround = true;
            }
          }
        }
      }
    }
  }
}
