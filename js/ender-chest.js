/**
 * Pure ender-chest player-keyed slots stub (MC-breadth).
 */

/**
 * @typedef {Map<string, Array<{id:number,count:number}|null>>} EnderStore
 */

export function createEnderStore() {
  return new Map();
}

export function getEnderSlots(store, playerId, size = 27) {
  const S = store instanceof Map ? store : createEnderStore();
  const key = String(playerId ?? 'default');
  if (!S.has(key)) {
    S.set(key, Array.from({ length: Math.max(1, size | 0) }, () => null));
  }
  return S.get(key);
}

export function setEnderSlots(store, playerId, slots) {
  const S = store instanceof Map ? store : createEnderStore();
  S.set(String(playerId ?? 'default'), slots);
  return S;
}

export function enderPlayerCount(store) {
  return store instanceof Map ? store.size : 0;
}
