/**
 * Campaign A — inventory friction helpers (items 4–20).
 * Pure module: deterministic, no DOM, no timers, no randomness.
 */

export const LOADOUTS = Object.freeze({
  expedition: Object.freeze({ name: 'Expedition', wants: ['Torch', 'Ration', 'Water Skin', 'Rope', 'Iron Pick'] }),
  building: Object.freeze({ name: 'Building', wants: ['Planks', 'Hammer', 'Nails', 'Stone Brick', 'Hammer'] }),
  fishing: Object.freeze({ name: 'Fishing', wants: ['Fishing Rod', 'Bait', 'Raw Fish', 'Tackle Box'] }),
});

/** Item 4: which slots in `inv` can be deposited into nearby storage capacity. */
export function depositCompatibleSlots(inv, capacity) {
  const slots = inv?.slots ?? [];
  const out = [];
  let remaining = Math.max(0, Number(capacity) || 0);
  for (let i = 0; i < slots.length && remaining > 0; i++) {
    const s = slots[i];
    if (!s || !s.item || !(s.count > 0)) continue;
    const take = Math.min(s.count, remaining);
    out.push({ index: i, item: s.item, take });
    remaining -= take;
  }
  return out;
}

/** Item 9: tooltip context lines for an inventory slot. */
export function inventoryTooltip(slot) {
  if (!slot || !slot.item) return [];
  const lines = [`${slot.item} ×${slot.count ?? 1}`];
  if (Number.isFinite(slot.durability) && slot.maxDurability) {
    const pct = Math.round((slot.durability / slot.maxDurability) * 100);
    lines.push(`Durability ${pct}%`);
  }
  if (Number.isFinite(slot.freshness)) {
    const f = Math.max(0, Math.min(1, slot.freshness));
    lines.push(`Freshness ${Math.round(f * 100)}%${f < 0.35 ? ' · eat soon' : ''}`);
  }
  if (Number.isFinite(slot.heat)) {
    lines.push(slot.heat > 0.5 ? 'Warm' : slot.heat < -0.5 ? 'Chilled' : 'Cool');
  }
  return lines;
}

/** Item 10: full-screen item search over catalog with category chips. */
export function searchItems(catalog, query, category) {
  const q = String(query ?? '').trim().toLowerCase();
  const cat = category && category !== 'all' ? String(category).toLowerCase() : null;
  return (catalog ?? [])
    .filter((it) => it && (!cat || String(it.category ?? '').toLowerCase() === cat))
    .filter((it) => !q || String(it.name ?? '').toLowerCase().includes(q))
    .slice(0, 40);
}

/** Item 12: radial quick-menu quadrants for food/tool/light/water. */
export function radialQuadrants(inventory, nameOf = (id) => String(id ?? '')) {
  const pick = (pred) => {
    const s = (inventory?.slots ?? []).find((slot) => slot && slot.id != null && slot.count > 0 && pred(nameOf(slot.id)));
    return s ? nameOf(s.id) : null;
  };
  return Object.freeze({
    food: pick((n) => /ration|berry|fish|fruit|bread|coconut/i.test(n)),
    tool: pick((n) => /pick|axe|hammer|rod|shovel/i.test(n)),
    light: pick((n) => /torch|lantern|lamp/i.test(n)),
    water: pick((n) => /water|flask|flotation/i.test(n)),
  });
}

/** Item 13: keybind conflict map — returns conflicts among bindings. */
export function keybindConflicts(bindings) {
  const seen = new Map();
  const conflicts = [];
  for (const [action, key] of Object.entries(bindings ?? {})) {
    if (!key) continue;
    const k = String(key).toLowerCase();
    if (seen.has(k)) conflicts.push({ key: k, actions: [seen.get(k), action] });
    else seen.set(k, action);
  }
  return conflicts;
}

/** Item 17: non-destructive disposal — only allowed with explicit confirm, returns refund preview. */
export function recyclePreview(slot, confirmed) {
  if (!slot || !slot.item) return { ok: false, reason: 'empty slot' };
  if (!confirmed) return { ok: false, reason: 'confirmation required' };
  return {
    ok: true,
    refund: {
      item: /plank|log|stone|brick/i.test(slot.item) ? slot.item : 'Scrap',
      count: Math.max(1, Math.floor((slot.count ?? 1) * 0.5)),
    },
  };
}

/** Item 18: saved loadout application — what would be moved, without mutating. */
export function loadoutPlan(loadoutId, inventory, storage) {
  const meta = LOADOUTS[loadoutId];
  if (!meta) return { ok: false, reason: 'unknown loadout' };
  const want = new Set(meta.wants.map((w) => w.toLowerCase()));
  const storageSlots = storage?.slots ?? [];
  const moves = [];
  (inventory?.slots ?? []).forEach((s, i) => {
    if (s?.item && want.has(String(s.item).toLowerCase()) && s.count > 0) {
      moves.push({ from: 'inventory', index: i, item: s.item, count: s.count });
    }
  });
  storageSlots.forEach((s, i) => {
    if (s?.item && want.has(String(s.item).toLowerCase()) && s.count > 0) {
      moves.push({ from: 'storage', index: i, item: s.item, count: s.count });
    }
  });
  return { ok: true, loadout: meta.name, moves };
}

/** Item 19: chest organization view — label + color per chest key. */
export function chestOrganization(chests) {
  const palette = ['#f3c987', '#8fe1e5', '#a5d6a7', '#ef9a9a', '#b39ddb', '#ffcc80'];
  return Object.entries(chests ?? {}).map(([key, chest], i) => ({
    key,
    label: chest?.label || 'Unnamed cache',
    color: palette[i % palette.length],
    items: (chest?.slots ?? []).filter((s) => s?.item).length,
  }));
}

/** Item 20: skippable pack tutorial script — one card per step, never pauses the world. */
export function packTutorialSteps() {
  return Object.freeze([
    { id: 'grab', text: 'Walk over items to collect them automatically.' },
    { id: 'open', text: 'Press I to open your pack. Drag to rearrange.' },
    { id: 'craft', text: 'Stand near a Crafting Table and pick a recipe.' },
    { id: 'stow', text: 'Press F near a chest to deposit everything compatible.' },
    { id: 'go', text: 'You are ready. The route guide marks the way.' },
  ]);
}

/** Item 6: favorites/pinned slots — pinned items survive sort. */
export function sortKeepingPinned(slots) {
  const list = (slots ?? []).slice();
  const pinned = [];
  const movable = [];
  list.forEach((s, i) => {
    if (s?.pinned) pinned.push({ i, slot: s });
    else movable.push(s);
  });
  movable.sort((a, b) => {
    const an = a?.item ? String(a.item).toLowerCase() : '~';
    const bn = b?.item ? String(b.item).toLowerCase() : '~';
    return an.localeCompare(bn);
  });
  const out = movable.slice();
  pinned.forEach(({ i, slot }) => { out[i] = slot; });
  for (let i = 0; i < list.length; i++) if (out[i] === undefined) out[i] = null;
  return out;
}

/** Item 7: objective filter — never hides emergency supplies. */
export function objectiveFilter(slots, objectiveWants) {
  const emergency = /torch|ration|water|bandage|rope/i;
  const wants = new Set((objectiveWants ?? []).map((w) => String(w).toLowerCase()));
  return (slots ?? []).filter((s) => {
    if (!s?.item) return false;
    return emergency.test(s.item) || wants.has(String(s.item).toLowerCase());
  });
}

/** Item 8: craft-from-nearby-storage reservation preview. */
export function craftReservation(recipe, storages) {
  const need = Object.entries(recipe?.cost ?? {});
  const pools = (storages ?? []).map((st) => ({ chest: st.key, slots: (st.slots ?? []).map((s) => ({ ...s })) }));
  const reserved = [];
  const shortfalls = [];
  for (const [item, qty] of need) {
    let remaining = Number(qty) || 0;
    for (const pool of pools) {
      if (remaining <= 0) break;
      pool.slots.forEach((s) => {
        if (remaining <= 0 || !s.item) return;
        if (String(s.item).toLowerCase() !== String(item).toLowerCase()) return;
        const take = Math.min(s.count ?? 0, remaining);
        if (take > 0) {
          s.count -= take;
          remaining -= take;
          reserved.push({ chest: pool.chest, item, count: take });
        }
      });
    }
    if (remaining > 0) shortfalls.push({ item, missing: remaining });
  }
  return { craftable: shortfalls.length === 0, reserved, shortfalls };
}

/** Item 5: quick-transfer rules for shift-click / shoulder buttons. */
export function quickTransfer(slot, target) {
  if (!slot?.item || !(slot.count > 0)) return null;
  if (!target) return null;
  if (target.item && String(target.item) !== String(slot.item)) return null;
  const max = Number(target.maxStack ?? 64);
  const space = max - (target.count ?? 0);
  if (space <= 0) return null;
  const move = Math.min(slot.count, space);
  return { item: slot.item, count: move };
}

/** Item 16: last-used and pinned recipe tracking. */
export function recipeRecency(pinnedIds, history) {
  const pinned = new Set(pinnedIds ?? []);
  const last = (history ?? []).filter(Boolean);
  const seen = [];
  for (const id of last) if (!seen.includes(id)) seen.push(id);
  return [...pinned, ...seen.filter((id) => !pinned.has(id))].slice(0, 8);
}
