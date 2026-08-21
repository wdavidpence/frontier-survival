/**
 * Break/hit visual juice: crack overlay + debris particles.
 */
import * as THREE from 'three';
import { crackTileForProgress, tileUVs } from './atlas-core.js?v=216';

export class BreakFX {
  /**
   * @param {THREE.Scene} scene
   * @param {import('./atlas.js').createBlockAtlas extends Function} atlas
   */
  constructor(scene, atlas) {
    this.scene = scene;
    this.atlas = atlas;
    this.crackMesh = null;
    this.particles = [];
    this._crackGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    /** @type {THREE.Mesh|null} */
    this._flashMesh = null;
    /** @type {THREE.BufferGeometry} */
    this._flashGeo = new THREE.SphereGeometry(0.35, 6, 4);
    /** @type {THREE.Material} */
    this._flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this._flashMesh = new THREE.Mesh(this._flashGeo, this._flashMat);
    this._flashMesh.visible = false;
    this.scene.add(this._flashMesh);
  }

  /**
   * @param {{x:number,y:number,z:number}|null} block
   * @param {number} progress 0..1
   */
  setCrack(block, progress) {
    if (!block || progress <= 0.02) {
      this.hideCrack();
      return;
    }
    if (!this.crackMesh) {
      this.crackMesh = new THREE.Mesh(this._crackGeo, this.atlas.crackMaterial.clone());
      this.crackMesh.renderOrder = 2;
      this.scene.add(this.crackMesh);
    }
    this.crackMesh.visible = true;
    this.crackMesh.position.set(block.x + 0.5, block.y + 0.5, block.z + 0.5);
    const tile = crackTileForProgress(progress);
    const uvs = tileUVs(tile);
    // full box uses same UV on all faces via simple approach: update material map offset/repeat for one tile
    const mat = this.crackMesh.material;
    const n = 8;
    const tx = tile % n;
    const ty = (tile / n) | 0;
    mat.map = this.atlas.texture;
    mat.map.offset.set(tx / n, 1 - (ty + 1) / n);
    mat.map.repeat.set(1 / n, 1 / n);
    // cloning texture state is shared — use UV on geometry instead
    mat.map.offset.set(0, 0);
    mat.map.repeat.set(1, 1);
    this._applyBoxUVs(this.crackMesh.geometry, uvs);
    mat.opacity = 0.85;
    mat.transparent = true;
    mat.needsUpdate = true;
  }

  _applyBoxUVs(geo, faceUV) {
    // BoxGeometry groups 6 faces × 4 verts; assign same face UV pattern
    const uvAttr = geo.getAttribute('uv');
    if (!uvAttr) return;
    for (let f = 0; f < 6; f++) {
      for (let i = 0; i < 4; i++) {
        const idx = f * 4 + i;
        // box face UV order differs slightly; cycle
        const u = faceUV[i][0];
        const v = faceUV[i][1];
        uvAttr.setXY(idx, u, v);
      }
    }
    uvAttr.needsUpdate = true;
  }

  hideCrack() {
    if (this.crackMesh) this.crackMesh.visible = false;
  }

  /**
   * Burst colored debris at block center.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {[number,number,number]} color
   * @param {number} count
   */
  burst(x, y, z, color = [0.5, 0.5, 0.5], count = 10) {
    const cx = x + 0.5;
    const cy = y + 0.5;
    const cz = z + 0.5;

    // Hard cap to prevent runaway particle counts
    const capped = Math.min(count, 24);

    // Brief impact flash for camera readability
    this._flashMesh.position.set(cx, cy, cz);
    this._flashMesh.visible = true;
    this._flashMat.opacity = 0.9;
    // Tint flash toward block color but keep it bright
    this._flashMat.color.setRGB(
      Math.min(1, color[0] + 0.5),
      Math.min(1, color[1] + 0.5),
      Math.min(1, color[2] + 0.5)
    );
    this._flashLife = 0.12;

    for (let i = 0; i < capped; i++) {
      // Two size tiers: ~60% small, ~40% medium for silhouette variety
      const isMedium = Math.random() < 0.4;
      const size = isMedium ? 0.1 + Math.random() * 0.08 : 0.05 + Math.random() * 0.06;
      const geo = new THREE.BoxGeometry(size, size, size);

      // Color jitter: ±15% per channel for varied debris look
      const r = Math.max(0, Math.min(1, color[0] + (Math.random() - 0.5) * 0.3));
      const g = Math.max(0, Math.min(1, color[1] + (Math.random() - 0.5) * 0.3));
      const b = Math.max(0, Math.min(1, color[2] + (Math.random() - 0.5) * 0.3));

      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(r, g, b),
        transparent: true,
        opacity: 1,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(cx, cy, cz);

      // Stronger outward spread; upward bias for readability
      const speed = 2.5 + Math.random() * 3.5;
      const vx = (Math.random() - 0.5) * speed;
      const vy = 2.5 + Math.random() * 3.5;
      const vz = (Math.random() - 0.5) * speed;

      this.scene.add(m);
      const maxLife = 0.45 + Math.random() * 0.35;
      this.particles.push({ mesh: m, vx, vy, vz, life: maxLife, maxLife });
    }
  }

  /** @type {number} */
  _flashLife = 0;

  tick(dt) {
    // Decay impact flash
    if (this._flashLife > 0 && this._flashMesh) {
      this._flashLife -= dt;
      if (this._flashLife <= 0) {
        this._flashMesh.visible = false;
        this._flashMat.opacity = 0;
        this._flashLife = 0;
      } else {
        // Rapid fade: linear from 0.9 → 0 over flash lifetime
        this._flashMat.opacity = (this._flashLife / 0.12) * 0.9;
        // Slight scale pulse
        const s = 1 + (this._flashLife / 0.12) * 0.5;
        this._flashMesh.scale.setScalar(s);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vy -= 14 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += dt * 8;
      p.mesh.rotation.y += dt * 6;

      // Opacity fade-out in last 40% of life for smooth pop-off
      const ratio = p.maxLife > 0 ? p.life / p.maxLife : 0;
      const mat = p.mesh.material;
      if (ratio < 0.4) {
        mat.opacity = ratio / 0.4; // linear fade to 0
      } else {
        mat.opacity = 1;
      }

      // Scale shrink in last 30% of life for readability
      if (ratio < 0.3) {
        const s = ratio / 0.3; // 1 → 0
        p.mesh.scale.setScalar(0.2 + s * 0.8);
      } else {
        p.mesh.scale.setScalar(1);
      }

      if (p.life <= 0 || p.mesh.position.y < -5) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  dispose() {
    this.hideCrack();
    if (this.crackMesh) {
      this.scene.remove(this.crackMesh);
      this.crackMesh.geometry.dispose();
      this.crackMesh.material.dispose();
      this.crackMesh = null;
    }
    if (this._flashMesh) {
      this.scene.remove(this._flashMesh);
      // _flashGeo and _flashMat are shared — dispose only once at end
    }
    this._flashGeo.dispose();
    this._flashMat.dispose();
    this._flashMesh = null;
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    this.particles.length = 0;
  }
}

/**
 * Compute particle parameter specs for a given weather type.
 * @param {string} weather - 'clear' | 'rain' | 'snow'
 * @returns {{color: number, size: number, opacity: number, speed: number, isSnow: boolean, visible: boolean}}
 */
export function getWeatherFXParams(weather) {
  if (weather === 'snow') {
    return { color: 0xffffff, size: 0.13, opacity: 0.8, speed: 3.5, isSnow: true, visible: true };
  }
  if (weather === 'rain') {
    return { color: 0x99ccff, size: 0.08, opacity: 0.6, speed: 15.0, isSnow: false, visible: true };
  }
  return { color: 0x99ccff, size: 0.08, opacity: 0.0, speed: 0, isSnow: false, visible: false };
}

/**
 * Step a single particle position for weather motion.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} dt
 * @param {string} weather
 * @param {number} elapsed
 * @param {number} index
 * @returns {[number, number, number]}
 */
export function stepWeatherParticle(x, y, z, dt, weather, elapsed, index) {
  const params = getWeatherFXParams(weather);
  if (!params.visible) return [x, y, z];

  let ny = y - params.speed * (0.7 + (index % 7) * 0.08) * dt;
  let nx = x;
  let nz = z;

  if (params.isSnow) {
    nx += Math.sin(elapsed * 2 + index * 0.5) * 0.8 * dt;
    nz += Math.cos(elapsed * 1.5 + index * 0.3) * 0.5 * dt;
  } else {
    nx -= 1.2 * dt;
  }

  if (ny < -6) {
    nx = (Math.random() - 0.5) * 40;
    ny = 16 + Math.random() * 12;
    nz = (Math.random() - 0.5) * 40;
  }
  return [nx, ny, nz];
}

/**
 * Weather atmosphere rain/snow particle system.
 */
export class WeatherFX {
  /**
   * @param {THREE.Scene} scene
   * @param {number} [particleCount=450]
   */
  constructor(scene, particleCount = 450) {
    this.scene = scene;
    this.particleCount = particleCount;
    this.elapsed = 0;
    this.pointsMesh = null;
    this.geometry = null;
    this.material = null;
    this._initMesh();
  }

  _initMesh() {
    if (typeof THREE === 'undefined' || !THREE || !THREE.BufferGeometry) return;
    this.geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(this.particleCount * 3);
    for (let i = 0; i < this.particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 25 - 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.material = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.visible = false;
    if (this.scene) {
      this.scene.add(this.pointsMesh);
    }
  }

  /**
   * Update particle positions and visuals for active weather.
   * @param {number} dt
   * @param {string} weather - 'clear' | 'rain' | 'snow'
   * @param {{x:number, y:number, z:number}} [centerPos]
   * @param {boolean} [active=true]
   */
  tick(dt, weather, centerPos, active = true) {
    const params = getWeatherFXParams(weather);
    const isStorm = active && params.visible;
    if (this.pointsMesh) {
      this.pointsMesh.visible = isStorm;
    }
    if (!isStorm || !this.geometry) return;

    this.elapsed += dt;
    const pos = this.geometry.attributes.position.array;
    const cx = centerPos ? centerPos.x : 0;
    const cy = centerPos ? centerPos.y : 0;
    const cz = centerPos ? centerPos.z : 0;

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const [nx, ny, nz] = stepWeatherParticle(
        pos[idx],
        pos[idx + 1],
        pos[idx + 2],
        dt,
        weather,
        this.elapsed,
        i,
      );
      pos[idx] = nx;
      pos[idx + 1] = ny;
      pos[idx + 2] = nz;
    }

    if (this.pointsMesh) {
      this.pointsMesh.position.set(cx, cy, cz);
    }
    if (this.geometry && this.geometry.attributes.position) {
      this.geometry.attributes.position.needsUpdate = true;
    }

    if (this.material) {
      this.material.color.setHex(params.color);
      this.material.size = params.size;
      this.material.opacity = params.opacity;
    }
  }

  dispose() {
    if (this.pointsMesh) {
      if (this.scene) this.scene.remove(this.pointsMesh);
      if (this.geometry) this.geometry.dispose();
      if (this.material) this.material.dispose();
      this.pointsMesh = null;
      this.geometry = null;
      this.material = null;
    }
  }
}

/** Small deterministic firefly constellation for the Mangrove Rootwalk. */
export class MangroveFireflyFX {
  constructor(scene, count = 18) {
    this.scene = scene;
    this.count = count;
    this.elapsed = 0;
    this.geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 2.5 + (i % 5) * 0.8;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = 1.8 + (i % 4) * 0.65;
      pos[i * 3 + 2] = Math.sin(a) * r * 0.72;
    }
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.material = new THREE.PointsMaterial({
      color: 0xffd86a,
      size: 0.14,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.visible = false;
    scene?.add(this.points);
  }

  tick(dt, active, center, nightMix = 0) {
    this.elapsed += dt;
    this.points.visible = Boolean(active && center);
    if (!this.points.visible) return;
    this.points.position.set(55.5, 20.2, 58.5);
    const pos = this.geometry.attributes.position.array;
    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      pos[idx + 1] += Math.sin(this.elapsed * 2.2 + i * 1.7) * 0.004;
      pos[idx] += Math.sin(this.elapsed * 1.4 + i) * 0.002;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.material.size = 0.14 + nightMix * 0.07;
    this.material.opacity = 0.58 + Math.sin(this.elapsed * 3.1) * 0.22 + nightMix * 0.16;
  }

  dispose() {
    this.scene?.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}

/** Restrained pale moth motes that appear only after dusk at the Rootwalk. */
export class MangroveMothFX {
  constructor(scene, count = 6) {
    this.scene = scene;
    this.count = count;
    this.elapsed = 0;
    this.geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 2.1 + (i % 3) * 0.7;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = 2.4 + (i % 3) * 0.55;
      pos[i * 3 + 2] = Math.sin(a) * r * 0.6;
    }
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.material = new THREE.PointsMaterial({
      color: 0xd9e7ff,
      size: 0.08,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.visible = false;
    scene?.add(this.points);
  }

  tick(dt, active, center, nightMix = 0) {
    this.elapsed += dt;
    this.points.visible = Boolean(active && center && nightMix > 0.18);
    if (!this.points.visible) return;
    this.points.position.set(55.5, 20.2, 58.5);
    const pos = this.geometry.attributes.position.array;
    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      pos[idx] += Math.sin(this.elapsed * 1.8 + i * 1.9) * 0.006;
      pos[idx + 1] += Math.cos(this.elapsed * 2.1 + i * 1.3) * 0.005;
      pos[idx + 2] += Math.sin(this.elapsed * 1.5 + i) * 0.004;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.material.size = 0.08 + nightMix * 0.04;
    this.material.opacity = 0.18 + nightMix * 0.26;
  }

  dispose() {
    this.scene?.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}
