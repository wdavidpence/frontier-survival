export const JOURNAL_ENTRIES = Object.freeze([
  Object.freeze({
    id: 'tidewatch_wreck',
    name: 'Tidewatch Wreck',
    category: 'Expedition',
    clue: 'A broken mast catches the sun beyond the cove. Prepare an iron pick, then follow the signal.',
    reward: 'Charts and signal torches',
  }),
  Object.freeze({
    id: 'iron_ravine',
    name: 'Iron Ravine',
    category: 'Expedition',
    clue: 'The wreck marks a route inland to a narrow vein of iron and a prepared challenge.',
    reward: 'A working chart and harbor supplies',
  }),
  Object.freeze({
    id: 'harbor_signal',
    name: 'Tidewatch Harbor Signal',
    category: 'Harbor',
    clue: 'Recovered charts and signal torches turn a successful voyage into a visible camp landmark.',
    reward: 'A lit signal mast, route board, and a reason to launch the next voyage',
  }),
  Object.freeze({
    id: 'seaglass_cay',
    name: 'Seaglass Cay',
    category: 'Expedition',
    clue: 'The Lookout plan charts a second offshore cay marked by a glass beacon.',
    reward: 'A surveyed cay chart and a reason to keep exploring offshore',
  }),
  Object.freeze({
    id: 'lantern_rootwalk',
    name: 'Lantern Rootwalk',
    category: 'Ecology',
    clue: 'A raised lantern route winds through the mangrove shallows.',
    reward: 'Fishing bait and a safe wetland route',
  }),
]);

const ENTRY_BY_ID = new Map(JOURNAL_ENTRIES.map((entry) => [entry.id, entry]));

function copyDiscovery(record) {
  return {
    id: String(record.id),
    day: Number.isFinite(record.day) ? Math.max(0, Math.floor(record.day)) : null,
  };
}

function normalizeDiscovered(records) {
  if (!Array.isArray(records)) return [];
  const seen = new Set();
  const normalized = [];
  for (const record of records) {
    const id = typeof record === 'string' ? record : record?.id;
    if (!ENTRY_BY_ID.has(id) || seen.has(id)) continue;
    seen.add(id);
    normalized.push(copyDiscovery(typeof record === 'string' ? { id } : record));
  }
  return normalized;
}

export function createJournalState(raw = {}) {
  return {
    version: 1,
    discovered: normalizeDiscovered(raw?.discovered ?? raw?.entries),
  };
}

export function discoverJournalEntry(state, id, detail = {}) {
  const entry = ENTRY_BY_ID.get(id);
  if (!entry) throw new Error(`unknown journal entry: ${id}`);
  const current = createJournalState(state);
  const existing = current.discovered.find((record) => record.id === id);
  if (existing) return { state: current, entry, newEntry: false };
  const day = Number.isFinite(detail?.day) ? Math.max(0, Math.floor(detail.day)) : null;
  const next = {
    ...current,
    discovered: [...current.discovered, { id, day }],
  };
  return { state: next, entry, newEntry: true };
}

export function visibleJournalEntries(state) {
  const discovered = new Map(createJournalState(state).discovered.map((record) => [record.id, record]));
  return JOURNAL_ENTRIES
    .filter((entry) => discovered.has(entry.id))
    .map((entry) => ({ ...entry, day: discovered.get(entry.id).day }));
}

export function journalProgress(state) {
  const found = createJournalState(state).discovered.length;
  return { found, total: JOURNAL_ENTRIES.length, complete: found >= JOURNAL_ENTRIES.length };
}

export function nextJournalLead(state) {
  const discovered = new Set(createJournalState(state).discovered.map((record) => record.id));
  return JOURNAL_ENTRIES.find((entry) => !discovered.has(entry.id)) ?? null;
}

export function journalHudSummary(state) {
  const progress = journalProgress(state);
  const lead = nextJournalLead(state);
  if (!lead) return `Discovery Log · ${progress.found}/${progress.total} · All known leads recorded`;
  return `Discovery Log · ${progress.found}/${progress.total} · Next: ${lead.name}`;
}
