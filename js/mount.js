/** Pure mount state transitions for rideable wildlife. */
export const MOUNT_SPEED_MULTIPLIER = 1.7;

export function createMountState() {
  return { mountedAnimalId: null };
}

export function canMount(state, animal) {
  return !!animal && !animal.dead && animal.type === 'horse' && animal.tamed === true
    && (state?.mountedAnimalId == null);
}

export function mount(state, animal) {
  if (!canMount(state, animal)) return { ok: false, state: state || createMountState() };
  return { ok: true, state: { mountedAnimalId: animal.id }, animalId: animal.id };
}

export function dismount(state) {
  return { ok: state?.mountedAnimalId != null, state: createMountState(), animalId: state?.mountedAnimalId ?? null };
}

export function isMounted(state) {
  return state?.mountedAnimalId != null;
}

export function mountSpeedMultiplier(state) {
  return isMounted(state) ? MOUNT_SPEED_MULTIPLIER : 1;
}
