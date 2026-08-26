import * as THREE from 'three';

/**
 * Small authored navigation landmark for the first tropical expedition.
 * Geometry is intentionally sparse: the voxel marker remains authoritative for
 * collision/interaction, while this group supplies a readable silhouette.
 */
export function createArrivalLandmark(position) {
  const group = new THREE.Group();
  group.name = 'tidewatch-arrival-landmark';
  group.position.set(position.x, position.y, position.z);

  const stone = new THREE.MeshStandardMaterial({
    color: 0x53646a,
    roughness: 0.96,
    metalness: 0.02,
  });
  const stoneCap = new THREE.MeshStandardMaterial({
    color: 0x80919a,
    roughness: 0.88,
    metalness: 0.04,
  });
  const beacon = new THREE.MeshStandardMaterial({
    color: 0xffb347,
    emissive: 0xff6a24,
    emissiveIntensity: 1.2,
    roughness: 0.34,
    metalness: 0.08,
  });
  const flagMat = new THREE.MeshStandardMaterial({
    color: 0xe7c98e,
    emissive: 0x51341a,
    emissiveIntensity: 0.22,
    roughness: 0.78,
    side: THREE.DoubleSide,
  });

  const pillarGeo = new THREE.CylinderGeometry(0.72, 0.9, 3.6, 6);
  for (const x of [-1.7, 1.7]) {
    const pillar = new THREE.Mesh(pillarGeo, stone);
    pillar.position.set(x, 1.8, 0);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.78, 0.28, 6), stoneCap);
    cap.position.set(x, 3.72, 0);
    cap.castShadow = true;
    group.add(cap);
  }

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.55, 0.8), stoneCap);
  lintel.position.set(0, 3.65, 0);
  lintel.castShadow = true;
  group.add(lintel);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 4.5, 8), stoneCap);
  mast.position.set(0, 5.35, 0);
  mast.castShadow = true;
  group.add(mast);

  const beaconMesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), beacon);
  beaconMesh.position.set(0, 4.25, 0);
  beaconMesh.name = 'tidewatch-beacon';
  group.add(beaconMesh);

  const flagGeo = new THREE.PlaneGeometry(2.2, 1.05, 4, 1);
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(1.05, 6.0, 0);
  flag.rotation.y = Math.PI / 2;
  flag.name = 'tidewatch-flag';
  group.add(flag);

  // A soft additive halo keeps the landmark readable through the distant haze.
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 32;
  haloCanvas.height = 32;
  const haloCtx = haloCanvas.getContext('2d');
  const gradient = haloCtx.createRadialGradient(16, 16, 1, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,190,88,0.78)');
  gradient.addColorStop(0.45, 'rgba(255,128,45,0.22)');
  gradient.addColorStop(1, 'rgba(255,104,32,0)');
  haloCtx.fillStyle = gradient;
  haloCtx.fillRect(0, 0, 32, 32);
  const haloTexture = new THREE.CanvasTexture(haloCanvas);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTexture,
    color: 0xffb45e,
    transparent: true,
    opacity: 0.68,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.position.set(0, 4.25, 0);
  halo.scale.set(3.8, 3.8, 1);
  halo.renderOrder = 8;
  halo.name = 'tidewatch-halo';
  group.add(halo);

  group.userData.beaconMaterial = beacon;
  group.userData.flag = flag;
  group.userData.haloMaterial = haloMat;
  group.userData.haloTexture = haloTexture;
  group.userData.motionTime = 0;
  return group;
}

/** Animate only the authored signal accents; no gameplay state is touched. */
export function updateArrivalLandmark(group, dt) {
  if (!group) return;
  const data = group.userData || {};
  data.motionTime = (data.motionTime || 0) + Math.max(0, Number(dt) || 0);
  const t = data.motionTime;
  if (data.beaconMaterial) {
    data.beaconMaterial.emissiveIntensity = 1.05 + Math.sin(t * 2.4) * 0.18;
  }
  if (data.haloMaterial) {
    data.haloMaterial.opacity = 0.58 + Math.sin(t * 2.4) * 0.08;
  }
  const flag = data.flag;
  const pos = flag?.geometry?.attributes?.position;
  if (pos) {
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, Math.sin(t * 2.0 + x * 2.2) * 0.11 * (i / Math.max(1, pos.count - 1)));
    }
    pos.needsUpdate = true;
  }
}
