export const HARBOR_CHOICES = Object.freeze([
  Object.freeze({ id: 'lookout', name: 'Lookout Plan', summary: 'Raise a chart-table and brass spyglass for the next offshore route.' }),
  Object.freeze({ id: 'landing', name: 'Landing Plan', summary: 'Build a low supply pier with mooring posts for skiff returns.' }),
]);

const CHOICE_IDS = new Set(HARBOR_CHOICES.map((choice) => choice.id));

export function createHarborChoiceState(raw = {}) {
  const choice = typeof raw?.choice === 'string' && CHOICE_IDS.has(raw.choice) ? raw.choice : null;
  return { version: 1, choice };
}

export function harborChoiceSummary(state) {
  const choice = HARBOR_CHOICES.find((entry) => entry.id === createHarborChoiceState(state).choice);
  return choice ? `${choice.name} · ${choice.summary}` : 'Choose a harbor plan at the Tidewatch signal.';
}

export function cycleHarborChoice(state) {
  const current = createHarborChoiceState(state);
  const currentIndex = HARBOR_CHOICES.findIndex((entry) => entry.id === current.choice);
  const next = HARBOR_CHOICES[(currentIndex + 1) % HARBOR_CHOICES.length];
  return { state: { ...current, choice: next.id }, choice: next };
}
