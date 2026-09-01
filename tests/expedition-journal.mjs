import assert from 'node:assert/strict';
import {
  JOURNAL_ENTRIES,
  createJournalState,
  discoverJournalEntry,
  journalProgress,
  nextJournalLead,
  visibleJournalEntries,
} from '../js/expedition-journal.js';

const fresh = createJournalState();
assert.equal(fresh.version, 1);
assert.deepEqual(fresh.discovered, []);
assert.equal(journalProgress(fresh).total, JOURNAL_ENTRIES.length);
assert.equal(nextJournalLead(fresh).id, 'tidewatch_wreck');

const first = discoverJournalEntry(fresh, 'tidewatch_wreck', { day: 2 });
assert.equal(first.newEntry, true);
assert.equal(first.state.discovered.length, 1);
assert.equal(first.entry.name, 'Tidewatch Wreck');
assert.equal(first.state.discovered[0].day, 2);
assert.equal(journalProgress(first.state).found, 1);
assert.equal(visibleJournalEntries(first.state)[0].id, 'tidewatch_wreck');

const repeated = discoverJournalEntry(first.state, 'tidewatch_wreck', { day: 9 });
assert.equal(repeated.newEntry, false);
assert.equal(repeated.state.discovered.length, 1);
assert.equal(repeated.state.discovered[0].day, 2, 'first discovery detail remains durable');

assert.throws(() => discoverJournalEntry(fresh, 'unknown_site'), /unknown journal entry/i);
console.log('PASS expedition journal contract');
