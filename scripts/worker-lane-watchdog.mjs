#!/usr/bin/env node
/**
 * Worker lane watchdog — NO LLM.
 * Keeps OpenCode kanban lanes warm with dispatch only + optional thrash reclaim.
 *
 * Usage (from repo root):
 *   node scripts/worker-lane-watchdog.mjs
 *   node scripts/worker-lane-watchdog.mjs --reclaim-minutes 12 --dispatch-max 3
 *
 * Exit 0 always unless hermes missing. Prints one JSON summary line + human lines.
 */
import { spawnSync } from 'child_process';
import { appendFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return def;
  const v = args[i + 1];
  if (v == null || v.startsWith('--')) return true;
  return v;
}

const RECLAIM_MIN = Number(flag('reclaim-minutes', 45)) || 45; // was 12; Luna/goal cards need longer
const DISPATCH_MAX = Number(flag('dispatch-max', 3)) || 3;
const LOG = resolve('docs/overnight-progress.md');
const DRY = !!flag('dry-run', false);

function sh(cmd, input) {
  const r = spawnSync('bash', ['-lc', cmd], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    input,
    env: process.env,
  });
  return {
    code: r.status ?? 1,
    out: (r.stdout || '') + (r.stderr || ''),
  };
}

function hermes(cmd) {
  return sh(`hermes ${cmd}`);
}

const summary = {
  ts: new Date().toISOString(),
  runningBefore: 0,
  runningAfter: 0,
  reclaimed: [],
  dispatched: false,
  spawnHint: '',
  dry: DRY,
};

// stats
const stats = hermes('kanban stats');
const runM = stats.out.match(/running\s+(\d+)/i);
summary.runningBefore = runM ? Number(runM[1]) : -1;

// list running task ids
const list = hermes('kanban list --status running');
const runningIds = [...list.out.matchAll(/\b(t_[a-f0-9]+)\b/g)].map((m) => m[1]);
const uniq = [...new Set(runningIds)];

for (const id of uniq) {
  const runs = hermes(`kanban runs ${id}`);
  // Look for "(running)" line with elapsed like "12m" or "1h"
  const lines = runs.out.split('\n');
  let elapsedMin = 0;
  for (const line of lines) {
    if (!/\(running\)|running\s+@/i.test(line) && !/ELAPSED/.test(line)) {
      // e.g. "  1  (running)     qwen27s                 3m  2026-07-31"
      const em = line.match(/\b(\d+)m\b/);
      const eh = line.match(/\b(\d+)h\b/);
      if (eh) elapsedMin = Math.max(elapsedMin, Number(eh[1]) * 60);
      if (em) elapsedMin = Math.max(elapsedMin, Number(em[1]));
    }
    const em2 = line.match(/\(running\)[^\d]*(\d+)m/);
    if (em2) elapsedMin = Math.max(elapsedMin, Number(em2[1]));
    const eh2 = line.match(/\(running\)[^\d]*(\d+)h/);
    if (eh2) elapsedMin = Math.max(elapsedMin, Number(eh2[1]) * 60);
  }
  // fallback: parse any Xm on last non-header line
  if (elapsedMin === 0) {
    const last = [...lines].reverse().find((l) => /\d+m|\d+h/.test(l));
    if (last) {
      const eh = last.match(/(\d+)h/);
      const em = last.match(/(\d+)m/);
      if (eh) elapsedMin = Number(eh[1]) * 60;
      else if (em) elapsedMin = Number(em[1]);
    }
  }

  if (elapsedMin >= RECLAIM_MIN) {
    if (!DRY) {
      hermes(`kanban reclaim ${id}`);
      hermes(`kanban schedule ${id} thrash_${RECLAIM_MIN}m_no_progress`);
    }
    summary.reclaimed.push({ id, elapsedMin });
  }
}

// Always try dispatch into free depth
if (!DRY) {
  const d = hermes(`kanban dispatch --max ${DISPATCH_MAX}`);
  summary.dispatched = true;
  const sp = d.out.match(/Spawned:\s*(\d+)/);
  summary.spawnHint = sp ? `Spawned ${sp[1]}` : d.out.slice(0, 200).replace(/\s+/g, ' ');
}

const stats2 = hermes('kanban stats');
const runM2 = stats2.out.match(/running\s+(\d+)/i);
summary.runningAfter = runM2 ? Number(runM2[1]) : -1;

// progress log (no shell metacharacters)
try {
  const line =
    `| ${summary.ts} | watchdog running ${summary.runningBefore}→${summary.runningAfter} ` +
    `reclaimed ${summary.reclaimed.map((r) => r.id).join(',') || 'none'} ${summary.spawnHint} |\n`;
  appendFileSync(LOG, line);
} catch {
  /* ignore */
}

console.log(JSON.stringify(summary));
console.log(
  `watchdog: running ${summary.runningBefore} -> ${summary.runningAfter}; reclaimed=${summary.reclaimed.length}; ${summary.spawnHint}`,
);
process.exit(0);
