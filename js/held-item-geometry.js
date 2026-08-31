/** Deterministic low-poly first-person held-item family geometry. */

function rgb(THREE, color, fallback = [0.62, 0.46, 0.25]) {
  const c = Array.isArray(color) ? color : fallback;
  return new THREE.Color(c[0] ?? fallback[0], c[1] ?? fallback[1], c[2] ?? fallback[2]);
}

function material(THREE, color, opts = {}) {
  return new THREE.MeshLambertMaterial({
    color: rgb(THREE, color),
    emissive: opts.metal ? rgb(THREE, shade(color, 0.35)) : 0x000000,
    emissiveIntensity: opts.metal ? 0.08 : 0,
  });
}

function shade(color, factor) {
  const c = Array.isArray(color) ? color : [0.62, 0.46, 0.25];
  return c.map((value) => Math.max(0, Math.min(1, (value ?? 0.5) * factor)));
}

function addShaft(THREE, group, wood) {
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.048, 1.22, 10), material(THREE, wood));
  shaft.name = 'shaft';
  shaft.position.y = -0.02;
  group.add(shaft);
  const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.22, 10), material(THREE, shade(wood, 0.72)));
  wrap.name = 'grip';
  wrap.position.set(0.01, -0.22, 0.01);
  group.add(wrap);
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.05, 10), material(THREE, [0.42, 0.38, 0.32], { metal: true }));
  ferrule.name = 'ferrule';
  ferrule.position.y = 0.48;
  group.add(ferrule);
  return shaft;
}

function addPick(THREE, group, headColor) {
  const metal = material(THREE, headColor, { metal: true });
  const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 8), metal);
  eye.name = 'pickEye';
  eye.position.set(0, 0.58, 0);
  group.add(eye);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.78, 8), metal);
  bar.name = 'pickHead';
  bar.position.set(0.04, 0.58, 0);
  bar.rotation.z = Math.PI / 2 - 0.12;
  group.add(bar);
  const point = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.38, 7), metal);
  point.name = 'pickPoint';
  point.rotation.z = -Math.PI / 2;
  point.position.set(0.46, 0.55, 0);
  group.add(point);
  const poll = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.12), metal);
  poll.name = 'pickPoll';
  poll.position.set(-0.32, 0.58, 0);
  group.add(poll);
}

function addAxe(THREE, group, headColor) {
  const metal = material(THREE, headColor, { metal: true });
  const poll = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.14), metal);
  poll.name = 'axePoll';
  poll.position.set(0.06, 0.54, 0);
  group.add(poll);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.46, 0.045), metal);
  blade.name = 'axeBlade';
  blade.position.set(0.26, 0.54, 0);
  blade.rotation.z = -0.18;
  group.add(blade);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.50, 0.02), material(THREE, shade(headColor, 1.25), { metal: true }));
  edge.name = 'axeEdge';
  edge.position.set(0.40, 0.53, 0);
  edge.rotation.z = -0.18;
  group.add(edge);
}

function addSpear(THREE, group, headColor) {
  const metal = material(THREE, headColor, { metal: true });
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.46, 7), metal);
  tip.name = 'spearhead';
  tip.position.y = 0.78;
  group.add(tip);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.09, 8), metal);
  collar.name = 'spearCollar';
  collar.position.y = 0.54;
  group.add(collar);
}

function addHoe(THREE, group, headColor) {
  const metal = material(THREE, headColor, { metal: true });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.28, 8), metal);
  neck.name = 'hoeNeck';
  neck.position.set(0.10, 0.58, 0);
  neck.rotation.z = Math.PI / 2 - 0.22;
  group.add(neck);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.22), metal);
  blade.name = 'hoeBlade';
  blade.position.set(0.28, 0.50, 0);
  blade.rotation.set(-0.55, 0, -0.12);
  group.add(blade);
}

function addSpade(THREE, group, headColor) {
  const metal = material(THREE, headColor, { metal: true });
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.16), metal);
  shoulder.name = 'spadeShoulder';
  shoulder.position.set(0.02, 0.50, 0);
  group.add(shoulder);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.42, 0.04), metal);
  blade.name = 'spadeBlade';
  blade.position.set(0.04, 0.28, 0);
  group.add(blade);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.18, 4), metal);
  tip.name = 'spadeTip';
  tip.position.set(0.04, 0.05, 0);
  tip.rotation.x = Math.PI;
  group.add(tip);
}

function addShield(THREE, group, headColor) {
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, 0.12, 12),
    material(THREE, shade(headColor, 0.82)),
  );
  face.position.set(0.12, 0.22, -0.02);
  face.rotation.x = Math.PI / 2;
  group.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 6, 16), material(THREE, shade(headColor, 1.16), { metal: true }));
  rim.position.set(0.12, 0.22, -0.10);
  rim.rotation.x = Math.PI / 2;
  group.add(rim);
  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), material(THREE, shade(headColor, 1.3), { metal: true }));
  boss.position.set(0.12, 0.22, -0.13);
  group.add(boss);
}

function addBlock(THREE, group, color) {
  const side = material(THREE, shade(color, 0.78));
  const top = material(THREE, shade(color, 1.14));
  const edge = material(THREE, shade(color, 0.96));
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.72, 0.72),
    [side, side, top, edge, side, side],
  );
  cube.position.set(0.10, 0.28, 0.02);
  cube.rotation.set(0.08, -0.12, 0.14);
  cube.castShadow = false;
  group.add(cube);
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
  const skin = new THREE.MeshLambertMaterial({ color: rgb(THREE, [0.72, 0.48, 0.28]) });
  const cuffMat = new THREE.MeshLambertMaterial({ color: rgb(THREE, [0.18, 0.28, 0.24]) });
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.18, 8), cuffMat);
  cuff.position.set(0.04, -0.10, -0.14);
  cuff.rotation.z = -0.12;
  cuff.material.depthTest = false;
  cuff.renderOrder = 10;
  group.add(cuff);
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), skin);
  palm.position.set(0.04, 0.10, -0.16);
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
