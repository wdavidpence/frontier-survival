#!/usr/bin/env node
/**
 * FS no-idle watchdog — NO LLM.
 * - Keep oss20b (ornith) serial fauna wave fed: if running=0, unblock next scheduled "fauna:" card
 * - If luna running=0 and ready luna exists, dispatch
 * - Reclaim only very old running cards (≥ reclaim-minutes) then park
 * - Always dispatch --max N into free slots
 *
 * Usage (repo root):
 *   node scripts/fs-noidle-watchdog.mjs
 *   node scripts/fs-noidle-watchdog.mjs --reclaim-minutes 18 --dispatch-max 2
 *   node scripts/fs-noidle-watchdog.mjs --dry-run
 */
import { spawnSync } from 'child_process';
import { appendFileSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return def;
  const v = args[i + 1];
  if (v == null || v.startsWith('--')) return true;
  return v;
}

const RECLAIM_MIN = Number(flag('reclaim-minutes', 18)) || 18;
const DISPATCH_MAX = Number(flag('dispatch-max', 2)) || 2;
const DRY = !!flag('dry-run', false);
const LOG = resolve('docs/overnight-progress.md');
const STATE = resolve('docs/noidle-STATE.json');
const REPO = resolve('.');

function sh(cmd) {
  const r = spawnSync('bash', ['-lc', cmd], {
    encoding: 'utf8',
    maxBuffer: 12 * 1024 * 1024,
    cwd: REPO,
    env: process.env,
  });
  return { code: r.status ?? 1, out: `${r.stdout || ''}${r.stderr || ''}` };
}

function hermes(cmd) {
  return sh(`hermes ${cmd}`);
}

const summary = {
  ts: new Date().toISOString(),
  runningBefore: 0,
  runningAfter: 0,
  ossRunning: 0,
  lunaRunning: 0,
  unblocked: [],
  reclaimed: [],
  spawnHint: '',
  dry: DRY,
};

const stats = hermes('kanban stats');
const runM = stats.out.match(/running\s+(\d+)/i);
summary.runningBefore = runM ? Number(runM[1]) : -1;

// Per-assignee running counts from list
const runningList = hermes('kanban list --status running');
const runningLines = runningList.out.split('\n');
const runningByAssignee = { oss20b: [], luna: [], other: [] };
for (const line of runningLines) {
  const idm = line.match(/\b(t_[a-f0-9]+)\b/);
  if (!idm) continue;
  const id = idm[1];
  if (/oss20b/.test(line)) runningByAssignee.oss20b.push(id);
  else if (/\bluna\b/.test(line)) runningByAssignee.luna.push(id);
  else runningByAssignee.other.push(id);
}
summary.ossRunning = runningByAssignee.oss20b.length;
summary.lunaRunning = runningByAssignee.luna.length;

// Reclaim aged running (all assignees)
const allRunning = [
  ...new Set([
    ...runningByAssignee.oss20b,
    ...runningByAssignee.luna,
    ...runningByAssignee.other,
  ]),
];
for (const id of allRunning) {
  const show = hermes(`kanban show ${id}`);
  // started timestamp
  const sm = show.out.match(/started:\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
  let elapsedMin = 0;
  if (sm) {
    const started = Date.parse(sm[1].replace(' ', 'T'));
    if (Number.isFinite(started)) elapsedMin = (Date.now() - started) / 60000;
  }
  // also try runs elapsed
  const runs = hermes(`kanban runs ${id}`);
  const em = runs.out.match(/(\d+)m/);
  const eh = runs.out.match(/(\d+)h/);
  if (eh) elapsedMin = Math.max(elapsedMin, Number(eh[1]) * 60);
  if (em) elapsedMin = Math.max(elapsedMin, Number(em[1]));

  if (elapsedMin >= RECLAIM_MIN) {
    if (!DRY) {
      hermes(`kanban reclaim ${id}`);
      hermes(`kanban schedule ${id} thrash_${RECLAIM_MIN}m_watchdog`);
    }
    summary.reclaimed.push({ id, elapsedMin: Math.round(elapsedMin) });
  }
}

// Refresh oss running after reclaim
const running2 = hermes('kanban list --status running');
const ossStill = (running2.out.match(/oss20b/g) || []).length;
const lunaStill = (running2.out.match(/\bluna\b/g) || []).length;

// If oss20b idle: unblock next scheduled fauna card (title contains "fauna:")
if (ossStill === 0) {
  const sched = hermes('kanban list --assignee oss20b --status scheduled');
  const lines = sched.out.split('\n').filter((l) => /fauna:/i.test(l));
  for (const line of lines) {
    const idm = line.match(/\b(t_[a-f0-9]+)\b/);
    if (!idm) continue;
    const id = idm[1];
    if (!DRY) hermes(`kanban unblock ${id}`);
    summary.unblocked.push({ id, lane: 'oss20b-fauna' });
    break; // depth 1
  }
}

// If luna idle: keep hard lane fed (same idea as ornith serial feed)
// Priority: ready luna already → dispatch handles; else unblock ONE scheduled
// prefer ocean/world/stream/tropical/biome titles, then any FS:luna
if (lunaStill === 0) {
  const readyL = hermes('kanban list --assignee luna --status ready');
  const hasReady = /\b(t_[a-f0-9]+)\b/.test(readyL.out) && !/no matching/i.test(readyL.out);

  if (!hasReady) {
    // review-required blocked cards that are "done work" stay blocked for judge —
    // only auto-unblock scheduled (parked capacity), never sticky human blocked.
    const schedL = hermes('kanban list --assignee luna --status scheduled');
    const lines = schedL.out.split('\n').filter((l) => /\b(t_[a-f0-9]+)\b/.test(l));
    const prefer = (l) =>
      /ocean:|world:|stream|tropical|biome|reef|aquatic|island|coast|gen\.js|palm/i.test(l);
    const ordered = [
      ...lines.filter(prefer),
      ...lines.filter((l) => !prefer(l) && /FS:luna|luna:/i.test(l)),
    ];
    for (const line of ordered) {
      const idm = line.match(/\b(t_[a-f0-9]+)\b/);
      if (!idm) continue;
      const id = idm[1];
      if (!DRY) hermes(`kanban unblock ${id}`);
      summary.unblocked.push({ id, lane: 'luna-serial' });
      break; // depth 1 luna
    }
  }
}

// Dispatch — prefer 2 so luna+oss can both run when ready
if (!DRY) {
  const d = hermes(`kanban dispatch --max ${DISPATCH_MAX}`);
  const sp = d.out.match(/Spawned:\s*(\d+)/);
  summary.spawnHint = sp ? `Spawned ${sp[1]}` : d.out.slice(0, 180).replace(/\s+/g, ' ');
}

const stats2 = hermes('kanban stats');
const runM2 = stats2.out.match(/running\s+(\d+)/i);
summary.runningAfter = runM2 ? Number(runM2[1]) : -1;

const runningFinal = hermes('kanban list --status running');
const runningTitles = [];
for (const line of runningFinal.out.split('\n')) {
  const idm = line.match(/\b(t_[a-f0-9]+)\b/);
  if (!idm) continue;
  if (!/oss20b|luna|qwen|ornith|local|●|running/i.test(line)) continue;
  runningTitles.push(line.replace(/\s+/g, ' ').trim().slice(0, 140));
}
summary.runningTitles = runningTitles;

const human =
  `| ${summary.ts} | noidle ${summary.runningBefore}→${summary.runningAfter} ` +
  `oss=${summary.ossRunning} luna=${summary.lunaRunning} ` +
  `unblocked=${summary.unblocked.map((u) => u.id).join(',') || '-'} ` +
  `reclaimed=${summary.reclaimed.map((r) => r.id).join(',') || '-'} ` +
  `${summary.spawnHint || ''} |`;

console.log(JSON.stringify(summary));
console.log(human);

if (!DRY) {
  try {
    let prev = {};
    if (existsSync(STATE)) {
      try {
        prev = JSON.parse(readFileSync(STATE, 'utf8'));
      } catch {
        prev = {};
      }
    }
    const stateDoc = {
      updatedAt: summary.ts,
      cadence: {
        watchdogEvery: '5m',
        judgeEvery: '60m',
        chatPollDefaultMin: 5,
        note: 'CLI chat does not auto-receive cron; read this file + overnight-progress. Live session may 5m-poll.',
      },
      board: {
        runningBefore: summary.runningBefore,
        runningAfter: summary.runningAfter,
        ossRunning: summary.ossRunning,
        lunaRunning: summary.lunaRunning,
        runningTitles,
      },
      lastAction: {
        unblocked: summary.unblocked,
        reclaimed: summary.reclaimed,
        spawnHint: summary.spawnHint,
      },
      previousUpdatedAt: prev.updatedAt || null,
      protocol: 'docs/worker-24-7-ops.md#no-idle-default-2026-08-02',
    };
    writeFileSync(STATE, `${JSON.stringify(stateDoc, null, 2)}\n`);
  } catch {
    /* ignore */
  }
  if (existsSync(LOG)) {
    try {
      appendFileSync(LOG, `\n${human}\n`);
    } catch {
      /* ignore */
    }
  }
}

process.exit(0);
