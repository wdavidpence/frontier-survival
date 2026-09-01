import * as THREE from 'three';

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.08, ...options });
}

function box(group, name, size, position, mat, rotation = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.name = name;
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

/** Visible Seaglass Cay beacon unlocked by the Lookout harbor plan. */
export function createSeaglassCay({ x = 0, y = 0, z = 0 } = {}) {
  const group = new THREE.Group();
  group.name = 'seaglass-cay';
  group.position.set(x, y, z);
  group.userData = { elapsed: 0, pennants: [], shards: [] };

  const stone = material(0x8a7a68, { roughness: 0.92 });
  const darkStone = material(0x5c5348, { roughness: 0.9 });
  const glass = material(0x7ec8c2, { roughness: 0.18, metalness: 0.22, transparent: true, opacity: 0.72 });
  const brass = material(0xb98a3e, { metalness: 0.48, roughness: 0.4 });
  const cloth = material(0x2f6d74, { side: THREE.DoubleSide });

  box(group, 'cay-cairn', [1.35, 0.42, 1.35], [0, 0.22, 0], stone);
  box(group, 'cay-cairn-top', [0.82, 0.28, 0.82], [0, 0.54, 0], darkStone);
  box(group, 'cay-beacon', [0.16, 1.85, 0.16], [0, 1.45, 0], brass, [0.03, 0, -0.04]);
  box(group, 'cay-glass', [0.34, 0.34, 0.34], [0, 2.38, 0], glass);
  box(group, 'cay-shard-a', [0.22, 0.08, 0.34], [-0.48, 0.48, 0.28], glass, [0.2, 0.4, 0.1]);
  box(group, 'cay-shard-b', [0.18, 0.07, 0.28], [0.42, 0.46, -0.22], glass, [-0.15, -0.3, 0.2]);

  const pennant = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.28), cloth);
  pennant.name = 'cay-pennant';
  pennant.position.set(0.28, 2.12, 0.06);
  group.add(pennant);
  group.userData.pennants.push({ pennant, phase: 0.6 });
  return group;
}

export function updateSeaglassCay(group, dt = 0) {
  if (!group?.userData) return;
  const data = group.userData;
  data.elapsed = (data.elapsed || 0) + Math.max(0, Number(dt) || 0);
  for (const { pennant, phase } of data.pennants || []) {
    pennant.rotation.y = Math.sin(data.elapsed * 1.8 + phase) * 0.22;
  }
}

export function disposeSeaglassCay(group) {
  group?.traverse?.((node) => {
    node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((mat) => mat.dispose?.());
  });
}
