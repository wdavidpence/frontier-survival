/** Deterministic low-poly first-person held-item family geometry. */

function rgb(THREE, color, fallback = [0.62, 0.46, 0.25]) {
  const c = Array.isArray(color) ? color : fallback;
  return new THREE.Color(c[0] ?? fallback[0], c[1] ?? fallback[1], c[2] ?? fallback[2]);
}

function material(THREE, color, rough = 0.78) {
  return new THREE.MeshLambertMaterial({ color: rgb(THREE, color), roughness: rough });
}

function shade(color, factor) {
  const c = Array.isArray(color) ? color : [0.62, 0.46, 0.25];
  return c.map((value) => Math.max(0, Math.min(1, (value ?? 0.5) * factor)));
}

function addShaft(THREE, group, wood) {
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.18, 8), material(THREE, wood));
  shaft.position.y = -0.04;
  group.add(shaft);
  return shaft;
}

function addPick(THREE, group, headColor) {
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.72, 8), material(THREE, headColor, 0.62));
  head.position.set(0, 0.57, 0);
  head.rotation.z = Math.PI / 2 - 0.18;
  group.add(head);
  const point = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.02, 0.42, 6), material(THREE, headColor, 0.62));
  point.rotation.z = -Math.PI / 2;
  point.position.set(0.42, 0.54, 0);
  group.add(point);
}

function addAxe(THREE, group, headColor) {
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.12), material(THREE, headColor, 0.62));
  head.position.set(0.16, 0.52, 0);
  head.rotation.z = -0.12;
  group.add(head);
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.34, 4), material(THREE, headColor, 0.58));
  blade.rotation.z = Math.PI / 2;
  blade.position.set(0.31, 0.52, 0);
  group.add(blade);
}

function addSpear(THREE, group, headColor) {
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 6), material(THREE, headColor, 0.58));
  tip.position.y = 0.76;
  group.add(tip);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.08, 8), material(THREE, headColor, 0.58));
  collar.position.y = 0.55;
  group.add(collar);
}

function addHoe(THREE, group, headColor) {
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.10), material(THREE, headColor, 0.58));
  blade.position.set(0.20, 0.53, 0);
  blade.rotation.z = -0.16;
  group.add(blade);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.22, 8), material(THREE, headColor, 0.58));
  neck.position.set(0.08, 0.58, 0);
  neck.rotation.z = Math.PI / 2 - 0.16;
  group.add(neck);
}

function addSpade(THREE, group, headColor) {
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.34, 4), material(THREE, headColor, 0.58));
  blade.position.set(0.12, 0.58, 0);
  blade.rotation.z = Math.PI / 2;
  blade.scale.set(1, 0.9, 0.62);
  group.add(blade);
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.08, 0.13), material(THREE, headColor, 0.58));
  shoulder.position.set(0.04, 0.48, 0);
  shoulder.rotation.z = -0.1;
  group.add(shoulder);
}

function addShield(THREE, group, headColor) {
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.12, 12),
    material(THREE, shade(headColor, 0.82), 0.68),
  );
  face.position.set(0.12, 0.22, -0.02);
  face.rotation.x = Math.PI / 2;
  group.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 16), material(THREE, shade(headColor, 1.16), 0.52));
  rim.position.set(0.12, 0.22, -0.10);
  rim.rotation.x = Math.PI / 2;
  group.add(rim);
  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), material(THREE, shade(headColor, 1.3), 0.42));
  boss.position.set(0.12, 0.22, -0.13);
  group.add(boss);
}

function addBlock(THREE, group, color) {
  const side = material(THREE, shade(color, 0.78), 0.92);
  const top = material(THREE, shade(color, 1.14), 0.84);
  const edge = material(THREE, shade(color, 0.96), 0.88);
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.72, 0.72),
    [side, side, top, edge, side, side],
  );
  cube.position.set(0.10, 0.28, 0.02);
  cube.rotation.set(0.08, -0.12, 0.14);
  cube.castShadow = false;
  group.add(cube);
  // A small raised top lip makes the held block read as a material object,
  // not as a flat colored cube, while keeping the silhouette compact.
  const lip = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.025, 0.58), top);
  lip.position.set(0.10, 0.66, 0.02);
  lip.rotation.y = -0.12;
  group.add(lip);
}

function addBow(THREE, group, wood) {
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 6, 12, Math.PI), material(THREE, wood));
  arc.rotation.z = Math.PI / 2;
  arc.position.set(0.08, 0.2, 0);
  group.add(arc);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.34, 8), material(THREE, wood));
  grip.position.set(0.08, 0.2, 0);
  group.add(grip);
}

function addHandAnchor(THREE, group) {
  const skin = new THREE.MeshBasicMaterial({ color: rgb(THREE, [0.58, 0.3, 0.14]) });
  const cuffMat = new THREE.MeshBasicMaterial({ color: rgb(THREE, [0.1, 0.32, 0.3]) });
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 8), cuffMat);
  cuff.position.set(0.04, -0.08, -0.16);
  cuff.rotation.z = -0.12;
  cuff.material.depthTest = false;
  cuff.renderOrder = 10;
  group.add(cuff);
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), skin);
  palm.position.set(0.04, 0.12, -0.18);
  palm.scale.set(0.78, 0.92, 0.72);
  palm.material.depthTest = false;
  palm.renderOrder = 10;
  group.add(palm);
  return { cuff, palm };
}

/** Return a fresh readable first-person group for a tool family. */
export function buildHeldItemGeometry(THREE, family, color = [0.62, 0.46, 0.25]) {
  const group = new THREE.Group();
  group.name = `held-${family}`;
  const wood = [0.55, 0.31, 0.14];
  const head = color;
  addHandAnchor(THREE, group);
  if (family === 'block') {
    addBlock(THREE, group, color);
  } else if (family === 'shield') {
    addShield(THREE, group, color);
  } else if (family === 'bow') {
    addBow(THREE, group, wood);
  } else {
    addShaft(THREE, group, wood);
    if (family === 'pick') addPick(THREE, group, head);
    else if (family === 'axe' || family === 'mason') addAxe(THREE, group, head);
    else if (family === 'hoe') addHoe(THREE, group, head);
    else if (family === 'spade') addSpade(THREE, group, head);
    else addSpear(THREE, group, head);
  }
  group.userData.heldFamily = family;
  group.userData.authoredGeometry = true;
  return group;
}

export function heldFamilyForProps(props) {
  const tool = props?.tool;
  if (['pick', 'axe', 'hoe', 'spade', 'mason', 'weapon', 'bow', 'shield'].includes(tool)) return tool;
  if (props?.placeable) return 'block';
  return null;
}
