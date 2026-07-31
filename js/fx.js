/**
 * Break/hit visual juice: crack overlay + debris particles.
 */
import * as THREE from 'three';
import { crackTileForProgress, tileUVs } from './atlas-core.js?v=215';

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
    for (let i = 0; i < count; i++) {
      const size = 0.06 + Math.random() * 0.1;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color[0], color[1], color[2]),
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(cx, cy, cz);
      const speed = 2 + Math.random() * 3;
      const vx = (Math.random() - 0.5) * speed;
      const vy = 2 + Math.random() * 3;
      const vz = (Math.random() - 0.5) * speed;
      this.scene.add(m);
      this.particles.push({ mesh: m, vx, vy, vz, life: 0.45 + Math.random() * 0.35 });
    }
  }

  tick(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vy -= 14 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.rotation.x += dt * 8;
      p.mesh.rotation.y += dt * 6;
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
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    this.particles.length = 0;
  }
}
