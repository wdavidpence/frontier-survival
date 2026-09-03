import * as THREE from 'three';
import { BLOCK } from './blocks.js?v=298';
import { pollinatorActivity } from './apiary-state.js?v=1';

function hash(x, z, seed = 0) {
  const value = Math.sin(x * 127.1 + z * 311.7 + seed * 17.3) * 43758.5453;
  return value - Math.floor(value);
}

function disposeGroup(group) {
  group.traverse((child) => {
    child.geometry?.dispose?.();
    child.material?.dispose?.();
  });
}

/** Bounded visible bees + wild apiary props around existing flower fields. */
export class PollinatorHabitatFX {
  constructor(scene, capacity = 12) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'pollinatorHabitatFX';
    this.group.visible = false;
    scene.add(this.group);
    this.capacity = Math.max(4, Math.min(18, capacity | 0));
    this.anchors = [];
    this._rebuildT = 0;
    this._elapsed = 0;
    this._beeGeo = new THREE.SphereGeometry(0.075, 6, 5);
    this._wingGeo = new THREE.PlaneGeometry(0.11, 0.055);
    this._beeMat = new THREE.MeshLambertMaterial({ color: 0xf7b733 });
    this._stripeMat = new THREE.MeshLambertMaterial({ color: 0x2a2017 });
    this._wingMat = new THREE.MeshBasicMaterial({ color: 0xe9f5ff, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
    this._hiveMat = new THREE.MeshLambertMaterial({ color: 0xbf7927 });
    this._hiveDarkMat = new THREE.MeshLambertMaterial({ color: 0x704018 });
    this._honeyMat = new THREE.MeshBasicMaterial({ color: 0xffc338 });
    this.bees = Array.from({ length: this.capacity }, (_, index) => this._makeBee(index));
  }

  _makeBee(index) {
    const bee = new THREE.Group();
    bee.name = `apiaryBee_${index}`;
    const body = new THREE.Mesh(this._beeGeo, this._beeMat);
    body.scale.set(1.3, 0.82, 1);
    const stripe = new THREE.Mesh(this._beeGeo, this._stripeMat);
    stripe.scale.set(0.42, 0.86, 1.02);
    stripe.position.x = -0.025;
    const wingA = new THREE.Mesh(this._wingGeo, this._wingMat);
    wingA.position.set(0, 0.055, 0.055);
    wingA.rotation.y = 0.52;
    const wingB = wingA.clone();
    wingB.position.z = -0.055;
    wingB.rotation.y = -0.52;
    bee.add(body, stripe, wingA, wingB);
    bee.visible = false;
    this.group.add(bee);
    return bee;
  }

  _makeHive(anchor) {
    const hive = new THREE.Group();
    hive.name = `wildHive_${anchor.key}`;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.58, 0.54), this._hiveMat);
    body.position.y = 0.82;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.28, 6), this._hiveDarkMat);
    roof.position.y = 1.25;
    roof.rotation.y = Math.PI / 6;
    const entrance = new THREE.Mesh(new THREE.CircleGeometry(0.095, 8), this._honeyMat);
    entrance.position.set(0, 0.80, 0.276);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.75, 6), this._hiveDarkMat);
    post.position.y = 0.35;
    for (const y of [0.68, 0.90, 1.11]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.034, 0.57), this._hiveDarkMat);
      band.position.y = y;
      hive.add(band);
    }
    hive.add(post, body, roof, entrance);
    hive.position.set(anchor.x + 0.5, anchor.y, anchor.z + 0.5);
    hive.userData.key = anchor.key;
    hive.userData.anchor = anchor;
    this.group.add(hive);
    return hive;
  }

  _rebuild(world, player, seed, scanRadius = 30) {
    const next = [];
    const px = Math.floor(player.x);
    const pz = Math.floor(player.z);
    const py = Math.floor(player.y);
    const accepted = [];
    const candidates = [];
    for (let z = pz - scanRadius; z <= pz + scanRadius && next.length < 5; z += 1) {
      for (let x = px - scanRadius; x <= px + scanRadius && next.length < 5; x += 1) {
        let fy = -1;
        for (let y = Math.max(1, py - 9); y <= Math.min(46, py + 9); y++) {
          if (world.getBlock(x, y, z) === BLOCK.WILDFLOWER) { fy = y; break; }
        }
        if (fy < 0) continue;
        const ground = world.getBlock(x, fy - 1, z);
        if (![BLOCK.GRASS, BLOCK.DIRT, BLOCK.DAMP_SOIL, BLOCK.MANGROVE_MUD].includes(ground)) continue;
        let builtNearby = 0;
        for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) for (let dy = -1; dy <= 2; dy++) {
          const id = world.getBlock(x + dx, fy + dy, z + dz);
          if ([BLOCK.PLANKS, BLOCK.COBBLE, BLOCK.BRICKS, BLOCK.WALL, BLOCK.GLASS, BLOCK.DOOR_CLOSED, BLOCK.DOOR_OPEN].includes(id)) builtNearby++;
        }
        if (builtNearby > 3) continue;
        candidates.push({ x, y: fy, z, score: hash(x, z, seed) });
        if (hash(x, z, seed) < 0.72) continue;
        if (accepted.some((a) => Math.hypot(a.x - x, a.z - z) < 12)) continue;
        const anchor = { x, y: fy, z, key: `${x},${fy},${z}`, flowers: 5 + Math.floor(hash(x + 19, z - 7, seed) * 6) };
        accepted.push(anchor);
        next.push(anchor);
      }
    }
    if (!next.length && candidates.length) {
      // A real flower clearing should never feel empty just because its hash missed the rare-hive roll.
      candidates.sort((a, b) => a.score - b.score || a.x - b.x || a.z - b.z);
      const c = candidates[0];
      next.push({ x: c.x, y: c.y, z: c.z, key: `${c.x},${c.y},${c.z}`, flowers: 8 + Math.floor(c.score * 4) });
    }
    const old = new Map(this.anchors.map((a) => [a.key, a]));
    for (const anchor of next) {
      const prior = old.get(anchor.key);
      anchor.mesh = prior?.mesh || this._makeHive(anchor);
      if (anchor.mesh) anchor.mesh.visible = true;
    }
    for (const anchor of this.anchors) {
      if (!next.some((a) => a.key === anchor.key) && anchor.mesh) anchor.mesh.visible = false;
    }
    this.anchors = next;
  }

  tick(dt, { world, player, seed = 0, dayPhase = 0.25, weather = 'clear', started = false, scanRadius = 30, rebuildInterval = 3.5 } = {}) {
    this._elapsed += Math.max(0, dt || 0);
    this._rebuildT -= Math.max(0, dt || 0);
    if (!started || !world || !player) {
      this.group.visible = false;
      return { active: false, activity: 0, visibleBees: 0, buzzGain: 0 };
    }
    if (this._rebuildT <= 0) {
      this._rebuild(world, player, seed, scanRadius);
      this._rebuildT = rebuildInterval;
    }
    let nearest = null;
    for (const anchor of this.anchors) {
      const dx = player.x - (anchor.x + 0.5); const dz = player.z - (anchor.z + 0.5);
      anchor.distance = Math.hypot(dx, dz);
      if (!nearest || anchor.distance < nearest.distance) nearest = anchor;
      if (anchor.mesh) anchor.mesh.visible = anchor.distance < 38;
    }
    const state = pollinatorActivity({ dayPhase, weather, flowers: nearest?.flowers || 0, distance: nearest?.distance || 99 });
    this.group.visible = !!nearest && nearest.distance < 38;
    const visible = Math.min(this.bees.length, state.visibleBees);
    for (let i = 0; i < this.bees.length; i++) {
      const bee = this.bees[i];
      if (!nearest || i >= visible || !state.active) { bee.visible = false; continue; }
      const phase = this._elapsed * (2.8 + (i % 3) * 0.4) + i * 1.73;
      const radius = 0.75 + (i % 4) * 0.18;
      bee.visible = true;
      bee.position.set(nearest.x + 0.5 + Math.cos(phase) * radius, nearest.y + 0.85 + Math.sin(phase * 1.7) * 0.26 + (i % 2) * 0.12, nearest.z + 0.5 + Math.sin(phase) * radius);
      bee.rotation.y = -phase + Math.PI * 0.5;
      const flutter = 0.75 + Math.sin(this._elapsed * 24 + i) * 0.35;
      bee.children[2].scale.y = flutter;
      bee.children[3].scale.y = flutter;
    }
    return { ...state, nearest };
  }

  nearestHive(pos, maxDistance = 3.2) {
    let best = null;
    for (const anchor of this.anchors) {
      const distance = Math.hypot(pos.x - (anchor.x + 0.5), pos.y - (anchor.y + 0.8), pos.z - (anchor.z + 0.5));
      if (distance <= maxDistance && (!best || distance < best.distance)) best = { ...anchor, distance };
    }
    return best;
  }

  dispose() {
    this.scene.remove(this.group);
    disposeGroup(this.group);
    this._beeGeo.dispose(); this._wingGeo.dispose();
    this._beeMat.dispose(); this._stripeMat.dispose(); this._wingMat.dispose();
    this._hiveMat.dispose(); this._hiveDarkMat.dispose(); this._honeyMat.dispose();
  }
}
