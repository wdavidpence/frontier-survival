/**
 * Pure chiseled bookshelf slot occupancy 0..6 (MC-breadth).
 */

export const CHISELED_BOOKSHELF_SLOTS = 6;

export function createChiseledBookshelf() {
  return { slots: Array.from({ length: CHISELED_BOOKSHELF_SLOTS }, () => null) };
}

/**
 * Insert book id into first empty slot; returns false if full.
 */
export function bookshelfInsert(state, bookId) {
  const s = state || createChiseledBookshelf();
  if (bookId == null) return false;
  for (let i = 0; i < s.slots.length; i++) {
    if (s.slots[i] == null) {
      s.slots[i] = bookId;
      return true;
    }
  }
  return false;
}

/** Remove book from slot index; returns book id or null. */
export function bookshelfRemove(state, index) {
  const s = state || createChiseledBookshelf();
  const i = index | 0;
  if (i < 0 || i >= s.slots.length) return null;
  const id = s.slots[i];
  s.slots[i] = null;
  return id;
}

export function bookshelfOccupied(state) {
  return (state?.slots || []).filter((x) => x != null).length;
}

/** Comparator signal strength 0..6. */
export function bookshelfSignal(state) {
  return bookshelfOccupied(state);
}
