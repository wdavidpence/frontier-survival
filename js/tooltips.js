/**
 * Tutorial tooltips — contextual tips for the first hour of play.
 * Pure logic + DOM helpers; no Three.js dependency.
 */

/** @typedef {{ id: string, title: string, body: string }} TooltipDef */

/**
 * Ordered tooltip queue. Each entry fires once when its trigger is met.
 * Triggers are checked in game.js via showTooltip().
 */
export const TOOLTIPS = /** @type {TooltipDef[]} */ ([
  {
    id: 'move_look',
    title: 'Move & Look',
    body: 'WASD to move · Mouse to look · Space to jump · Ctrl or C to crouch',
  },
  {
    id: 'mine_wood',
    title: 'Gather Wood',
    body: 'Hold left-click on a tree trunk to chop it. Logs are your first resource.',
  },
  {
    id: 'craft_table',
    title: 'Crafting Table',
    body: 'Press E to open crafting. Make a Crafting Table from 4 logs, then place it.',
  },
  {
    id: 'shelter',
    title: 'Build Shelter',
    body: 'Place blocks to make a roof and walls. You need shelter before nightfall.',
  },
  {
    id: 'campfire',
    title: 'Light a Fire',
    body: 'Craft and place a campfire (E). Stand close to light it. Fires provide warmth, light, and cooking.',
  },
  {
    id: 'cook_meat',
    title: 'Cook Your Food',
    body: 'Hold raw meat near a lit campfire and press F to cook it. Raw meat damages your stomach.',
  },
  {
    id: 'eat_food',
    title: 'Stay Fed',
    body: 'Press R to eat. Cooked meat restores more hunger than raw. Berries are safe but weak.',
  },
  {
    id: 'first_night',
    title: 'Survive the Night',
    body: 'Night brings cold and predators. Stay near your fire, eat regularly, and keep warm.',
  },
  {
    id: 'hunt',
    title: 'Hunt Wildlife',
    body: 'Left-click animals to attack. They drop meat and hide. Cook the meat before eating.',
  },
  {
    id: 'clothes',
    title: 'Wear Clothes',
    body: 'Craft leather armor from hide (E). Hold clothes and press F to equip — warmth matters at night.',
  },
  {
    id: 'sleep',
    title: 'Sleep in a Bed',
    body: 'Craft and place a bed. Press F while looking at it to sleep — restores fatigue.',
  },
  {
    id: 'farm',
    title: 'Start Farming',
    body: 'Plant seeds on dirt (right-click). Wheat grows over time. Make bread for reliable food.',
  },
  {
    id: 'water',
    title: 'Water Source',
    body: 'Press F near water to drink. It restores stamina but adds wetness — stay dry in cold biomes.',
  },
  {
    id: 'save',
    title: 'Save Your Game',
    body: 'Press K to save. The game auto-saves every 40 seconds, but manual saves are safer.',
  },
]);

/** @type {Set<string>} */
let shown = new Set();

/** Reset tooltip state (for testing / new game). */
export function resetTooltips() {
  shown.clear();
}

/**
 * Check if a tooltip should be shown now.
 * @param {string} id
 * @returns {{ def: TooltipDef | null, isNew: boolean } | null}
 */
export function checkTooltip(id) {
  if (shown.has(id)) return null;
  const def = TOOLTIPS.find((t) => t.id === id);
  if (!def) return null;
  shown.add(id);
  return { def, isNew: true };
}

/** Whether a tooltip is currently visible. */
export function isVisible() {
  return document.getElementById('tooltip-box')?.classList.contains('visible') ?? false;
}

/**
 * Show a tooltip in the HUD.
 * @param {TooltipDef} def
 */
export function show(def) {
  const box = document.getElementById('tooltip-box');
  if (!box) return;

  // Build content
  let html = `<div class="tooltip-title">${def.title}</div>`;
  html += `<div class="tooltip-body">${def.body}</div>`;

  // Dismiss button
  html += `<button class="tooltip-dismiss" type="button">✕</button>`;

  box.innerHTML = html;
  box.classList.add('visible');

  // Auto-dismiss after 12 seconds
  clearTimeout(box._timer);
  box._timer = setTimeout(() => {
    hide();
  }, 12000);

  // Dismiss button handler
  const btn = box.querySelector('.tooltip-dismiss');
  if (btn) {
    btn.addEventListener('click', () => hide());
  }
}

/** Hide the tooltip. */
export function hide() {
  const box = document.getElementById('tooltip-box');
  if (!box) return;
  clearTimeout(box._timer);
  box.classList.remove('visible');
}
