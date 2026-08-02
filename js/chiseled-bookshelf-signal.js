/**
 * Pure chiseled bookshelf comparator signal 0..6.
 */
export function bookshelfComparatorSignal(occupiedSlots) {
  const n = Math.max(0, Math.min(6, Math.floor(Number(occupiedSlots) || 0)));
  return n;
}
export function bookshelfSlotPowered(occupied, index) {
  const i = index | 0;
  if (i < 0 || i > 5) return false;
  return (occupied | 0) > i;
}
export function bookshelfFillFraction(occupied) {
  return Math.max(0, Math.min(1, (Number(occupied) || 0) / 6));
}
