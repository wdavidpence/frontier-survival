/**
 * Visual sky layer: drifting Minecraft-like cloud banks, sun/moon discs,
 * and a night star field — all camera-relative so they fill the horizon
 * without becoming static backdrop props.
 */
import * as THREE from 'three';

const CLOUD_Y = 48;
const CLUSTER_CELL = 20;
const CLUSTER_GRID = 11;
const VOXEL_SPACING = 3.8;
const VOXEL_W = 4.8;
const VOXEL_H = 3.2;
const VOXEL_D = 4.8;
const DRIFT_SPEED = 0.35;

// Seven cloud-puff templates (in voxel-unit offsets) — longest has 7 blocks.
const TEMPLATES = [
  [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1]],
  [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1], [0, 1, 0], [1, 1, 0]],
  [[0, 0, 0], [-1, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0]],
  [[0, 0, 0], [0, 0, 1], [0, 0, -1], [1, 0, 0], [0, 1, 1]],
  [[0, 0, 0], [1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 1, 0], [1, 0, 1]],
  [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 0, 1], [1, 0, 1], [0, 1, 0]],
  [[0, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [1, 0, 0], [0, 1, 0], [1, 0, -1]],
];
const MAX_VOXELS = 7;

export class VoxelCloudLayer {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this._t = 0;

    const count = CLUSTER_GRID * CLUSTER_GRID * MAX_VOXELS;
    const geo = new THREE.BoxGeometry(VOXEL_W, VOXEL_H, VOXEL_D);
    // Lambert picks up directional/hemisphere light: bright tops, shadowed undersides.
    const mat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0x1c1c1c),
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.renderOrder = -50;
    this.mesh.frustumCulled = false;

    // Deterministic pseudo-random layout: clustered puffs with gaps of sky.
    let seed = 1337;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    this._active = [];
    this._x = [];
    this._y = [];
    this._z = [];
    this._scale = [];
    this._bobPhase = [];
    this._bobAmp = [];
    const tintColor = new THREE.Color();
    for (let gx = 0; gx < CLUSTER_GRID; gx++) {
      for (let gz = 0; gz < CLUSTER_GRID; gz++) {
        const show = rand() < 0.52;
        const template = TEMPLATES[Math.floor(rand() * TEMPLATES.length)];
        const clusterJitterX = (rand() - 0.5) * VOXEL_SPACING * 0.6;
        const clusterJitterZ = (rand() - 0.5) * VOXEL_SPACING * 0.6;
        // Stepped altitude tiers (rather than continuous height) read as
        // distinct layered banks, Minecraft-style.
        const tier = Math.floor(rand() * 3);
        const baseHeight = (tier - 1) * (VOXEL_H * 0.9) + (rand() - 0.5) * 0.4;
        // Lower tiers read slightly darker/denser, like shadowed underside banks.
        const tierTint = 0.82 + tier * 0.09 + rand() * 0.06;
        this._bobPhase.push(rand() * Math.PI * 2);
        this._bobAmp.push(0.18 + rand() * 0.24);

        for (let slot = 0; slot < MAX_VOXELS; slot++) {
          const active = show && slot < template.length;
          let lx = 0, ly = 0, lz = 0, scale = 1;
          if (active) {
            const [dx, dy, dz] = template[slot];
            lx = dx * VOXEL_SPACING + clusterJitterX + (rand() - 0.5) * 0.6;
            ly = dy * VOXEL_H * 0.7 + baseHeight;
            lz = dz * VOXEL_SPACING + clusterJitterZ + (rand() - 0.5) * 0.6;
            scale = 0.85 + rand() * 0.3;
          }
          this._active.push(active);
          this._x.push(lx);
          this._y.push(ly);
          this._z.push(lz);
          this._scale.push(scale);
          const idx = this._active.length - 1;
          const v = active ? tierTint : 1;
          this.mesh.setColorAt(idx, tintColor.setRGB(v, v, v));
        }
      }
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this._layout(0, 0, 0);
    this.scene.add(this.mesh);
  }

  _layout(anchorX, anchorZ, offset) {
    const dummy = new THREE.Object3D();
    const half = CLUSTER_GRID / 2;
    let i = 0;
    let c = 0;
    for (let gx = 0; gx < CLUSTER_GRID; gx++) {
      for (let gz = 0; gz < CLUSTER_GRID; gz++) {
        const clusterX = anchorX + (gx - half) * CLUSTER_CELL + offset;
        const clusterZ = anchorZ + (gz - half) * CLUSTER_CELL;
        // Gentle vertical bob per cluster so banks feel adrift, not static.
        const bob = Math.sin(this._t * 0.6 + this._bobPhase[c]) * this._bobAmp[c];
        for (let slot = 0; slot < MAX_VOXELS; slot++) {
          const active = this._active[i];
          const scale = active ? this._scale[i] : 0;
          dummy.position.set(
            clusterX + this._x[i],
            CLOUD_Y + this._y[i] + bob,
            clusterZ + this._z[i]
          );
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          this.mesh.setMatrixAt(i, dummy.matrix);
          i++;
        }
        c++;
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * @param {number} dt seconds elapsed
   */
  update(dt, camera) {
    this._t += dt * DRIFT_SPEED;
    const offset = this._t % (CLUSTER_GRID * CLUSTER_CELL);
    const anchorX = camera?.position.x || 0;
    const anchorZ = camera?.position.z || 0;
    this._layout(anchorX, anchorZ, offset);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

/**
 * Visible sun and moon orbs that track the light arc on the sky dome.
 * Positioned at a fixed radius from the camera so they sit inside the dome.
 */
export class SunDisc {
  constructor(scene) {
    this.scene = scene;
    const sunGeo = new THREE.SphereGeometry(4.8, 12, 8);
    this._sunMat = new THREE.MeshBasicMaterial({
      color: 0xfff5c8,
      depthTest: false,
      depthWrite: false,
    });
    this._sun = new THREE.Mesh(sunGeo, this._sunMat);
    this._sun.renderOrder = -95;
    scene.add(this._sun);

    const moonGeo = new THREE.SphereGeometry(3.2, 12, 8);
    this._moonMat = new THREE.MeshBasicMaterial({
      color: 0xd8e8ff,
      depthTest: false,
      depthWrite: false,
    });
    this._moon = new THREE.Mesh(moonGeo, this._moonMat);
    this._moon.renderOrder = -95;
    this._moon.visible = false;
    scene.add(this._moon);

    // Soft additive halos improve readability against bright or busy sky.
    const sunGlowGeo = new THREE.SphereGeometry(8.4, 12, 8);
    this._sunGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfff5c8,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
    this._sunGlow = new THREE.Mesh(sunGlowGeo, this._sunGlowMat);
    this._sunGlow.renderOrder = -96;
    scene.add(this._sunGlow);

    const moonGlowGeo = new THREE.SphereGeometry(5.4, 12, 8);
    this._moonGlowMat = new THREE.MeshBasicMaterial({
      color: 0xd8e8ff,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
    this._moonGlow = new THREE.Mesh(moonGlowGeo, this._moonGlowMat);
    this._moonGlow.renderOrder = -96;
    this._moonGlow.visible = false;
    scene.add(this._moonGlow);

    this._sunDayColor = new THREE.Color(0xfff5c8);
    this._sunLowColor = new THREE.Color(0xff8030);
  }

  /**
   * @param {number} sx  normalized sun direction x
   * @param {number} sy  normalized sun direction y
   * @param {number} sz  normalized sun direction z
   * @param {number} mx  normalized moon direction x
   * @param {number} my  normalized moon direction y
   * @param {number} mz  normalized moon direction z
   * @param {THREE.Vector3} cameraPos
   * @param {number} nightMix 0=full day, 1=full night
   */
  update(sx, sy, sz, mx, my, mz, cameraPos, nightMix) {
    const DIST = 162;
    const elevT = Math.min(1, Math.max(0, sy) * 5.0);
    this._sunMat.color.copy(this._sunLowColor).lerp(this._sunDayColor, elevT);
    this._sunGlowMat.color.copy(this._sunMat.color);
    this._sun.position.set(
      cameraPos.x + sx * DIST,
      cameraPos.y + sy * DIST,
      cameraPos.z + sz * DIST
    );
    this._sunGlow.position.copy(this._sun.position);
    this._sun.visible = sy > -0.06;
    this._sunGlow.visible = this._sun.visible;

    this._moon.position.set(
      cameraPos.x + mx * DIST,
      cameraPos.y + my * DIST,
      cameraPos.z + mz * DIST
    );
    this._moonGlow.position.copy(this._moon.position);
    this._moon.visible = my > -0.06 && nightMix > 0.08;
    this._moonGlow.visible = this._moon.visible;
  }

  dispose() {
    this.scene.remove(this._sun);
    this.scene.remove(this._moon);
    this.scene.remove(this._sunGlow);
    this.scene.remove(this._moonGlow);
    this._sunMat.dispose();
    this._moonMat.dispose();
    this._sunGlowMat.dispose();
    this._moonGlowMat.dispose();
  }
}

const STAR_COUNT = 340;

/**
 * Sparse star field on the upper sky dome — fades in at night, camera-relative.
 */
export class StarField {
  constructor(scene) {
    this.scene = scene;
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    // Separate deterministic seed from cloud layer.
    let seed = 9973;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };
    const starColor = new THREE.Color();
    for (let i = 0; i < STAR_COUNT; i++) {
      // Uniform random direction, biased toward zenith.
      const theta = rand() * Math.PI * 2;
      const cosP = rand() * 0.9 + 0.1; // avoid very-low horizon stars
      const sinP = Math.sqrt(1 - cosP * cosP);
      const r = 170;
      positions[i * 3]     = sinP * Math.cos(theta) * r;
      positions[i * 3 + 1] = cosP * r;
      positions[i * 3 + 2] = sinP * Math.sin(theta) * r;
      // Subtle per-star brightness/warmth variation reads as depth, not noise.
      const brightness = 0.55 + rand() * 0.6;
      const warmth = rand();
      starColor.setRGB(
        brightness * (0.92 + warmth * 0.08),
        brightness * (0.95 + warmth * 0.05),
        brightness
      );
      colors[i * 3] = starColor.r;
      colors[i * 3 + 1] = starColor.g;
      colors[i * 3 + 2] = starColor.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this._mat = new THREE.PointsMaterial({
      color: 0xddeeff,
      vertexColors: true,
      size: 1.5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    });
    this._points = new THREE.Points(geo, this._mat);
    this._points.renderOrder = -96;
    this._points.frustumCulled = false;
    scene.add(this._points);
  }

  /**
   * @param {number} opacity 0=invisible (day), 1=full night
   * @param {THREE.Vector3} cameraPos
   */
  update(opacity, cameraPos) {
    this._mat.opacity = Math.max(0, Math.min(1, opacity));
    this._points.position.copy(cameraPos);
  }

  dispose() {
    this.scene.remove(this._points);
    this._mat.dispose();
    this._points.geometry.dispose();
  }
}
