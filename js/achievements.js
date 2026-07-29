/**
 * Achievement toast state — pure logic.
 */

/** @typedef {{ id: string, title: string, desc: string }} AchievementDef */

/** @type {AchievementDef[]} */
export const ACHIEVEMENTS = [
  { id: 'first_log', title: 'Woodsman', desc: 'Gather your first log.' },
  { id: 'first_fire', title: 'Spark of Life', desc: 'Place a campfire.' },
  { id: 'first_cook', title: 'Hot Meal', desc: 'Cook meat at a fire.' },
  { id: 'first_night', title: 'Still Breathing', desc: 'Survive into day 2.' },
  { id: 'first_kill', title: 'Hunter', desc: 'Take down wildlife.' },
  { id: 'first_wolf', title: 'Who Hunts Whom', desc: 'Kill a wolf.' },
  { id: 'first_clothes', title: 'Layer Up', desc: 'Equip any clothing.' },
  { id: 'first_sleep', title: 'Restful', desc: 'Sleep in a bed.' },
  { id: 'first_bow', title: 'Marksman', desc: 'Craft a bow.' },
  { id: 'first_iron', title: 'Iron Age', desc: 'Smelt an iron ingot.' },
  { id: 'first_farm', title: 'Planter', desc: 'Plant crop seeds.' },
  { id: 'first_bread', title: 'Baker', desc: 'Bake bread from wheat.' },
  { id: 'first_chest', title: 'Stockpile', desc: 'Place a chest.' },
  { id: 'first_boat', title: 'Cast Off', desc: 'Craft a boat.' },
  { id: 'first_fish', title: 'Angler', desc: 'Catch a fish.' },
  { id: 'first_shield', title: 'Hold the Line', desc: 'Craft a shield.' },
  { id: 'first_armor', title: 'Hardened Hide', desc: 'Equip leather armor.' },
  { id: 'first_snare', title: 'Trapper', desc: 'Place a snare.' },
];

export function emptyAchievements() {
  return { unlocked: /** @type {Record<string, boolean>} */ ({}), queue: /** @type {string[]} */ ([]) };
}

/**
 * @param {{ unlocked: Record<string, boolean>, queue: string[] }} state
 * @param {string} id
 */
export function unlockAchievement(state, id) {
  if (!id || state.unlocked[id]) return { ...state, changed: false };
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) return { ...state, changed: false };
  return {
    unlocked: { ...state.unlocked, [id]: true },
    queue: [...state.queue, id],
    changed: true,
  };
}

/**
 * Pop next toast id from queue.
 * @param {{ unlocked: Record<string, boolean>, queue: string[] }} state
 */
export function popAchievementToast(state) {
  if (!state.queue.length) return { state, id: null };
  const [id, ...rest] = state.queue;
  return { state: { unlocked: state.unlocked, queue: rest }, id };
}

export function achievementTitle(id) {
  return ACHIEVEMENTS.find((a) => a.id === id)?.title || id;
}

export function achievementDesc(id) {
  return ACHIEVEMENTS.find((a) => a.id === id)?.desc || '';
}
