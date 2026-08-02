/**
 * Pure boat-with-chest attach flag.
 */
export function createBoatChest(hasChest = false) {
  return { hasChest: !!hasChest, slots: hasChest ? 27 : 0 };
}
export function boatAttachChest(state) {
  return { hasChest: true, slots: 27 };
}
export function boatDetachChest(state) {
  return { hasChest: false, slots: 0 };
}
export function boatChestSlots(state) {
  return state?.hasChest ? 27 : 0;
}
