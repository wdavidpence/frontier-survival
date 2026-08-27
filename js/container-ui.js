/**
 * Shared container UI helpers for chest/barrel grids.
 * Rendering is DOM-only; transfer helpers stay deterministic for smoke tests.
 */
import { addItems, cloneSlots } from './inventory.js?v=255';

export const CONTAINER_SIZE = Object.freeze({ chest: 9, barrel: 27 });

export function containerSize(kind) {
  return CONTAINER_SIZE[kind] || CONTAINER_SIZE.chest;
}

export function containerTitle(kind) {
  return kind === 'barrel' ? 'Barrel' : 'Chest';
}

/** Move one item between a player inventory and a fixed-size container. */
export function transferOne(playerSlots, containerSlots, playerIndex, containerIndex, direction = 'deposit', kind = 'chest') {
  const player = cloneSlots(playerSlots);
  const container = containerSlots.map((slot) => slot ? { ...slot } : { id: null, count: 0 }).slice(0, containerSize(kind));
  const src = direction === 'withdraw' ? container[containerIndex] : player[playerIndex];
  if (!src || src.id == null || src.count <= 0) return { ok: false, playerSlots: player, containerSlots: container };

  if (direction === 'withdraw') {
    const added = addItems(player, src.id, 1);
    if (added.leftover > 0) return { ok: false, playerSlots: player, containerSlots: container, error: 'inventory full' };
    src.count -= 1;
    if (src.count <= 0) container[containerIndex] = { id: null, count: 0 };
    return { ok: true, playerSlots: added.slots, containerSlots: container };
  }

  let dest = container.findIndex((slot) => slot?.id === src.id && slot.count > 0 && slot.count < 64);
  if (dest < 0) dest = container.findIndex((slot) => !slot?.id || slot.count <= 0);
  if (dest < 0) return { ok: false, playerSlots: player, containerSlots: container, error: 'container full' };
  const id = src.id;
  src.count -= 1;
  if (src.count <= 0) player[playerIndex] = { id: null, count: 0 };
  if (!container[dest]?.id || container[dest].count <= 0) container[dest] = { id, count: 1 };
  else container[dest].count += 1;
  return { ok: true, playerSlots: player, containerSlots: container };
}

/** Paint a safe, keyboard-focusable container slot grid. */
export function paintContainerGrid(root, slots, { dataAttribute = 'data-container-slot', propsOf, displayName } = {}) {
  if (!root) return;
  root.replaceChildren();
  slots.forEach((slot, index) => {
    const el = root.ownerDocument.createElement('button');
    el.type = 'button';
    el.className = 'inv-slot';
    el.setAttribute(dataAttribute, String(index));
    el.setAttribute('aria-label', slot?.id != null && slot.count > 0
      ? `${displayName?.(slot.id) || `Item ${slot.id}`} x${slot.count}`
      : 'Empty container slot');
    if (slot?.id != null && slot.count > 0) {
      const props = propsOf?.(slot.id);
      const color = props?.color || [0.5, 0.5, 0.5];
      el.style.background = `rgb(${(color[0] * 255) | 0},${(color[1] * 255) | 0},${(color[2] * 255) | 0})`;
      const count = root.ownerDocument.createElement('span');
      count.className = 'inv-count';
      count.textContent = String(slot.count);
      const name = root.ownerDocument.createElement('span');
      name.className = 'inv-name';
      name.textContent = displayName?.(slot.id) || `Item ${slot.id}`;
      el.append(count, name);
    } else {
      el.classList.add('empty');
    }
    root.appendChild(el);
  });
}
