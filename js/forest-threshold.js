import * as THREE from 'three';

/**
 * Authored visual module framing the transition between tropical cove and dense forest.
 * Contains low-poly stone shelf, root arch, freshwater pool, and glint accents.
 * Purely visual; no collisions or block modifications.
 */

function createPRNG(seed = 12345) {
  let s = Math.floor(Math.abs(seed)) || 12345;
  return function rand() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function createForestThreshold(position = { x: 0, y: 0, z: 0 }, options = {}) {
  const seed = options.seed !== undefined ? options.seed : 12345;
  const rand = createPRNG(seed);
  const scale = Number(options.scale) || 1.0;
  const enableAnimation = options.enableAnimation !== false;

  const group = new THREE.Group();
  group.name = 'forest-threshold-module';
  const posX = position ? (position.x || 0) : 0;
  const posY = position ? (position.y || 0) : 0;
  const posZ = position ? (position.z || 0) : 0;
  group.position.set(posX, posY, posZ);
  group.scale.set(scale, scale, scale);

  const geometries = [];
  const materials = [];

  // 1. Stone shelf material & geometry
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x48564b,
    roughness: 0.88,
    metalness: 0.05,
  });
  materials.push(stoneMat);

  const mossyStoneMat = new THREE.MeshStandardMaterial({
    color: 0x3d5438,
    roughness: 0.92,
    metalness: 0.02,
  });
  materials.push(mossyStoneMat);

  // Root wood material
  const rootMat = new THREE.MeshStandardMaterial({
    color: 0x44301f,
    roughness: 0.85,
    metalness: 0.02,
  });
  materials.push(rootMat);

  // Freshwater pool material
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x227870,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.82,
  });
  materials.push(waterMat);

  // Freshwater glint accent material
  const glintMat = new THREE.MeshStandardMaterial({
    color: 0x7bf5e7,
    emissive: 0x3bd4c3,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
  });
  materials.push(glintMat);

  // Moss detail material
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x2e602b,
    roughness: 0.95,
    metalness: 0.0,
  });
  materials.push(foliageMat);

  // --- Child 1: Main Base Stone Shelf ---
  const shelfGeo = new THREE.BoxGeometry(4.8, 0.6, 2.8);
  geometries.push(shelfGeo);
  const shelf = new THREE.Mesh(shelfGeo, stoneMat);
  shelf.position.set(0, 0.3, 0);
  shelf.castShadow = true;
  shelf.receiveShadow = true;
  group.add(shelf);

  // --- Child 2: Upper Mossy Step ---
  const stepWidth = 2.2 + rand() * 0.4;
  const stepGeo = new THREE.BoxGeometry(stepWidth, 0.45, 1.6);
  geometries.push(stepGeo);
  const step = new THREE.Mesh(stepGeo, mossyStoneMat);
  step.position.set(-1.1 + rand() * 0.2, 0.75, -0.3 + rand() * 0.2);
  step.castShadow = true;
  step.receiveShadow = true;
  group.add(step);

  // --- Child 3: Left Root Arch Pillar ---
  const rootLeftGeo = new THREE.CylinderGeometry(0.35, 0.55, 3.2, 6);
  geometries.push(rootLeftGeo);
  const rootLeft = new THREE.Mesh(rootLeftGeo, rootMat);
  rootLeft.position.set(-1.8, 1.8, 0.1);
  rootLeft.rotation.z = -0.18 + (rand() - 0.5) * 0.05;
  rootLeft.castShadow = true;
  group.add(rootLeft);

  // --- Child 4: Right Root Arch Pillar ---
  const rootRightGeo = new THREE.CylinderGeometry(0.3, 0.5, 3.0, 6);
  geometries.push(rootRightGeo);
  const rootRight = new THREE.Mesh(rootRightGeo, rootMat);
  rootRight.position.set(1.7, 1.7, -0.1);
  rootRight.rotation.z = 0.22 + (rand() - 0.5) * 0.05;
  rootRight.castShadow = true;
  group.add(rootRight);

  // --- Child 5: Overarching Root Lintel ---
  const archGeo = new THREE.CylinderGeometry(0.28, 0.32, 4.2, 6);
  geometries.push(archGeo);
  const arch = new THREE.Mesh(archGeo, rootMat);
  arch.position.set(-0.05, 3.2, 0.0);
  arch.rotation.z = Math.PI / 2 + (rand() - 0.5) * 0.08;
  arch.rotation.x = 0.1;
  arch.castShadow = true;
  group.add(arch);

  // --- Child 6: Freshwater Pool Shelf ---
  const waterGeo = new THREE.CylinderGeometry(1.1, 1.25, 0.12, 8);
  geometries.push(waterGeo);
  const pool = new THREE.Mesh(waterGeo, waterMat);
  pool.position.set(1.1, 0.62, 0.5);
  group.add(pool);

  // --- Child 7: Freshwater Glint Shimmer Accent ---
  const glintGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.04, 6);
  geometries.push(glintGeo);
  const glint = new THREE.Mesh(glintGeo, glintMat);
  glint.position.set(1.1, 0.67, 0.5);
  group.add(glint);

  // --- Child 8: Hanging Vine/Tendril Detail ---
  const tendrilGeo = new THREE.CylinderGeometry(0.06, 0.04, 1.4, 5);
  geometries.push(tendrilGeo);
  const tendril = new THREE.Mesh(tendrilGeo, foliageMat);
  tendril.position.set(-0.6, 2.4, 0.1);
  tendril.rotation.z = 0.12;
  group.add(tendril);

  // Store metadata and resources for animation and cleanup
  group.userData = {
    geometries,
    materials,
    glintMat,
    waterMat,
    tendril,
    motionTime: 0,
    options: {
      seed,
      scale,
      enableAnimation,
    },
  };

  return group;
}

export function updateForestThreshold(group, dt = 0) {
  if (!group || !group.userData) return;
  const data = group.userData;
  if (data.options?.enableAnimation === false) return;

  const delta = Math.max(0, Number(dt) || 0);
  data.motionTime = (data.motionTime || 0) + delta;
  const t = data.motionTime;

  // Pulse freshwater glint emissive and opacity
  if (data.glintMat) {
    data.glintMat.emissiveIntensity = 0.7 + Math.sin(t * 2.5) * 0.25;
    data.glintMat.opacity = 0.8 + Math.cos(t * 1.8) * 0.15;
  }

  // Subtle water surface shimmer
  if (data.waterMat) {
    data.waterMat.opacity = 0.8 + Math.sin(t * 1.2) * 0.05;
  }

  // Subtle hanging vine sway
  if (data.tendril) {
    data.tendril.rotation.z = 0.12 + Math.sin(t * 1.5) * 0.04;
  }
}

export function disposeForestThreshold(group) {
  if (!group) return;

  const data = group.userData || {};
  if (data.disposed) return;
  const disposedGeometries = new Set();
  const disposedMaterials = new Set();

  // Dispose explicit tracking arrays once; several children intentionally share
  // geometry/material references.
  if (Array.isArray(data.geometries)) {
    for (const geo of data.geometries) {
      if (geo && !disposedGeometries.has(geo) && typeof geo.dispose === 'function') {
        disposedGeometries.add(geo);
        geo.dispose();
      }
    }
  }

  if (Array.isArray(data.materials)) {
    for (const mat of data.materials) {
      if (mat && !disposedMaterials.has(mat)) {
        disposedMaterials.add(mat);
        if (mat.map && typeof mat.map.dispose === 'function') mat.map.dispose();
        if (mat.normalMap && typeof mat.normalMap.dispose === 'function') mat.normalMap.dispose();
        if (typeof mat.dispose === 'function') mat.dispose();
      }
    }
  }

  group.children.length = 0;
  group.userData = {};
}
