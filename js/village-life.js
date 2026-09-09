/**
 * Coastal village people + trades. Buildings already exist; this is the life.
 */

export const VILLAGER_ROLES = Object.freeze(['fisher', 'mason', 'weaver', 'chandler']);

export const TRADES = Object.freeze({
  fisher: Object.freeze([
    { want: 'raw_fish', wantCount: 4, give: 'bread', giveCount: 2, label: '4 Raw Fish → 2 Bread' },
    { want: 'cooked_fish', wantCount: 2, give: 'fish_bait', giveCount: 4, label: '2 Cooked Fish → 4 Bait' },
  ]),
  mason: Object.freeze([
    { want: 'cobble', wantCount: 16, give: 'bricks', giveCount: 4, label: '16 Cobble → 4 Bricks' },
    { want: 'clay_ball', wantCount: 8, give: 'glass', giveCount: 4, label: '8 Clay → 4 Glass' },
  ]),
  weaver: Object.freeze([
    { want: 'wool', wantCount: 3, give: 'cloth', giveCount: 4, label: '3 Wool → 4 Cloth' },
    { want: 'hide', wantCount: 2, give: 'wool_coat', giveCount: 1, label: '2 Hide → Wool Coat' },
  ]),
  chandler: Object.freeze([
    { want: 'honeycomb', wantCount: 2, give: 'beeswax', giveCount: 3, label: '2 Honeycomb → 3 Beeswax' },
    { want: 'coal', wantCount: 4, give: 'torch', giveCount: 8, label: '4 Coal → 8 Torches' },
  ]),
});

function hash01(a, b) {
  let n = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function villagersForSite(site = {}) {
  const cx = site.cx | 0;
  const cz = site.cz | 0;
  const seed = site.seed | 0;
  const count = Math.max(2, Math.min(4, (site.structureCount | 0) > 4 ? 4 : 3));
  const people = [];
  for (let i = 0; i < count; i++) {
    const role = VILLAGER_ROLES[i % VILLAGER_ROLES.length];
    const ox = ((hash01(cx + i * 9, cz + seed) * 6) | 0) - 3;
    const oz = ((hash01(cz + i * 5, cx + seed) * 6) | 0) - 3;
    const ground = Number.isFinite(site.ground) ? site.ground : 17;
    people.push({
      id: `v-${cx}-${cz}-${i}`,
      role,
      name: role[0].toUpperCase() + role.slice(1),
      x: cx + ox + 0.5,
      z: cz + oz + 0.5,
      y: ground + 1,
      trades: TRADES[role],
    });
  }
  return people;
}

export function applyTrade(slots, trade, idOf) {
  const wantId = typeof idOf === 'function' ? idOf(trade.want) : trade.want;
  const giveId = typeof idOf === 'function' ? idOf(trade.give) : trade.give;
  const list = Array.isArray(slots) ? slots.map((s) => (s ? { ...s } : { id: null, count: 0 })) : [];
  let need = trade.wantCount | 0;
  for (const s of list) {
    if (!s || s.id !== wantId || s.count <= 0) continue;
    const take = Math.min(s.count, need);
    s.count -= take;
    need -= take;
    if (s.count <= 0) {
      s.id = null;
      s.count = 0;
    }
    if (need <= 0) break;
  }
  if (need > 0) return { ok: false, slots, reason: 'missing' };
  let left = trade.giveCount | 0;
  for (const s of list) {
    if (s && s.id === giveId && s.count > 0 && s.count < 64) {
      const add = Math.min(64 - s.count, left);
      s.count += add;
      left -= add;
      if (left <= 0) return { ok: true, slots: list };
    }
  }
  for (const s of list) {
    if (s && (s.id == null || s.count <= 0)) {
      s.id = giveId;
      s.count = left;
      left = 0;
      break;
    }
  }
  if (left > 0) return { ok: false, slots, reason: 'full' };
  return { ok: true, slots: list };
}

const ROLE_SASH = Object.freeze({
  fisher: [0.18, 0.52, 0.62],
  mason: [0.52, 0.50, 0.48],
  weaver: [0.78, 0.62, 0.42],
  chandler: [0.86, 0.62, 0.18],
  cache: [0.42, 0.28, 0.16],
});

/** Multi-box standing person. Same part contract as animal-visuals. */
export function villagerLayout(role = 'fisher') {
  const sash = ROLE_SASH[role] || ROLE_SASH.fisher;
  const skin = [0.76, 0.58, 0.42];
  const cloth = [0.28, 0.24, 0.22];
  const parts = [
    { name: 'legL', sx: 0.16, sy: 0.46, sz: 0.16, x: -0.11, y: 0.23, z: 0, color: cloth, role: 'leg' },
    { name: 'legR', sx: 0.16, sy: 0.46, sz: 0.16, x: 0.11, y: 0.23, z: 0, color: cloth, role: 'leg' },
    { name: 'body', sx: 0.36, sy: 0.48, sz: 0.22, x: 0, y: 0.70, z: 0, color: cloth, role: 'body' },
    { name: 'sash', sx: 0.38, sy: 0.12, sz: 0.24, x: 0, y: 0.62, z: 0.01, color: sash, role: 'marking' },
    { name: 'armL', sx: 0.12, sy: 0.40, sz: 0.12, x: -0.26, y: 0.66, z: 0, color: skin, role: 'arm' },
    { name: 'armR', sx: 0.12, sy: 0.40, sz: 0.12, x: 0.26, y: 0.66, z: 0, color: skin, role: 'arm' },
    { name: 'head', sx: 0.28, sy: 0.28, sz: 0.26, x: 0, y: 1.08, z: 0.02, color: skin, role: 'head' },
    { name: 'eyeL', sx: 0.05, sy: 0.05, sz: 0.04, x: -0.07, y: 1.10, z: 0.13, color: [0.08, 0.08, 0.08], role: 'eye' },
    { name: 'eyeR', sx: 0.05, sy: 0.05, sz: 0.04, x: 0.07, y: 1.10, z: 0.13, color: [0.08, 0.08, 0.08], role: 'eye' },
  ];
  return { parts, legNames: ['legL', 'legR'] };
}

/**
 * Two traders in the opening look cone, kept on the beach (not in the bay).
 * Look is (-sin yaw, -cos yaw) to match the FPS camera.
 */
export function arrivalTraders({ x = 0, y = 17, z = 0, yaw = 0.92 } = {}) {
  const lx = -Math.sin(yaw);
  const lz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const face = yaw + Math.PI;
  const place = (role, dist, lat) => {
    let px = x + lx * dist + rx * lat;
    let pz = z + lz * dist + rz * lat;
    if (pz < -29) {
      const pull = -29 - pz;
      px += lx * pull;
      pz = -29;
    }
    return {
      id: `arrival-${role}`,
      role,
      name: role[0].toUpperCase() + role.slice(1),
      x: px,
      y,
      z: pz,
      yaw: face,
      arrival: true,
      trades: TRADES[role],
    };
  };
  return [place('fisher', 2.8, -2.35), place('chandler', 3.2, 2.55)];
}
