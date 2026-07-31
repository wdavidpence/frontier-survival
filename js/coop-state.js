export { clonePlayer, cloneSurvivalState, serializeCoopGameState };

import { DEFAULT_SURVIVAL } from './survival.js?v=202';

// Clone a player object shallowly (position etc.). For now just deep copy of slots.
function clonePlayer(player) {
  if (!player) return null;
  const cloned = { ...player, slots: [...player.slots] };
  return cloned;
}

// Clone survival state using DEFAULT_SURVIVAL defaults for missing keys.
function cloneSurvivalState(state) {
  return { ...DEFAULT_SURVIVAL, ...(state ?? {}) };
}

// Serialize a coop game state: players array and world data. For now simply returns input.
function serializeCoopGameState(game) {
  // Expect game has player1/player2 attributes; fallback to null.
  const { player1, player2, world } = game || {};
  return {
    player1: clonePlayer(player1),
    player2: clonePlayer(player2),
    world: world ? { ...world } : {},
  };
}
