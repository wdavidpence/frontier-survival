import * as THREE from 'three';
import { isSolid, BLOCK } from './blocks.js';
import { canSprint, moveSpeedMultiplier } from './survival.js';
import { createStarterInventory, getHotbarStack } from './inventory.js';
import { emptyEquipment } from './equipment.js';

const PLAYER_RADIUS = 0.3;
const PLAYER_HEIGHT = 1.7;
const EYE = 1.55;
const GRAVITY = 22;
const JUMP_V = 8.2;
const BASE_SPEED = 5.2;

export class Player {
  constructor(spawn) {
    this.position = new THREE.Vector3(spawn.x, spawn.y, spawn.z);
    this.velocity = new THREE.Vector3();
    this.onGround = false;
    this.yaw = 0;
    this.pitch = 0;
    this.hotbarIndex = 0;
    this.breaking = null; // {x,y,z, progress}
    this.slots = createStarterInventory();
    this.equipment = emptyEquipment();
    this.inventoryOpen = false;
    this.message = '';
    this.messageT = 0;
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
   * @param {import('./world.js').World} world
   * @param {import('./input.js').Input} input
   * @param {object} survival state
   * @param {number} dt
   */
  update(world, input, survival, dt) {
    this.yaw = input.lookX;
    this.pitch = input.lookY;

    if (this.messageT > 0) this.messageT -= dt;

    if (survival.dead) {
      this.velocity.set(0, 0, 0);
      return { moved: false, sprinting: false, inWater: false };
    }

    const slot = input.consumeSlot();
    if (slot >= 0) this.hotbarIndex = slot;

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wish = new THREE.Vector3();
    if (input.wantsForward()) wish.add(forward);
    if (input.wantsBack()) wish.sub(forward);
    if (input.wantsLeft()) wish.sub(right);
    if (input.wantsRight()) wish.add(right);
    const moving = wish.lengthSq() > 0;
    if (moving) wish.normalize();

    const sprinting = input.wantsSprint() && moving && canSprint(survival);
    const speed = BASE_SPEED * moveSpeedMultiplier(survival, sprinting);

    // water
    const feetY = this.position.y + 0.1;
    const inWater = world.getBlock(this.position.x, feetY, this.position.z) === BLOCK.WATER
      || world.getBlock(this.position.x, this.position.y + 1.0, this.position.z) === BLOCK.WATER;

    this.velocity.x = wish.x * speed * (inWater ? 0.55 : 1);
    this.velocity.z = wish.z * speed * (inWater ? 0.55 : 1);

    if (inWater) {
      this.velocity.y += (input.wantsJump() ? 12 : -6) * dt;
      this.velocity.y *= (1 - Math.min(1, 4 * dt));
    } else {
      this.velocity.y -= GRAVITY * dt;
      if (this.onGround && input.wantsJump()) {
        this.velocity.y = JUMP_V;
        this.onGround = false;
      }
    }

    this._moveAxis(world, dt, 'x');
    this._moveAxis(world, dt, 'y');
    this._moveAxis(world, dt, 'z');

    // fall reset if void
    if (this.position.y < -20) {
      this.position.y = 40;
      this.velocity.y = 0;
      this.notify('You scramble back from the void...');
    }

    return { moved: moving, sprinting, inWater };
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
