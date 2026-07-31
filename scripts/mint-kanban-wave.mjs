#!/usr/bin/env node
/**
 * Mint next wave of Kanban cards from competitive-backlog.json
 * Usage: node scripts/mint-kanban-wave.mjs [--count 20] [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const backlogPath = join(root, 'docs/roadmap/competitive-backlog.json');
const statePath = join(root, 'docs/roadmap/mint-state.json');
const WORK = `dir:${root}`;
const BOARD = 'frontier-survival';

const args = process.argv.slice(2);
const countIdx = args.indexOf('--count');
const count = countIdx >= 0 ? Number(args[countIdx + 1]) || 20 : 20;
const dry = args.includes('--dry-run');

const data = JSON.parse(readFileSync(backlogPath, 'utf8'));
const state = existsSync(statePath)
  ? JSON.parse(readFileSync(statePath, 'utf8'))
  : { mintedIds: [], lastWaveAt: null, totalMinted: 0 };

const pending = data.items
  .filter((i) => i.status === 'backlog' && !state.mintedIds.includes(i.id))
  .sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));

const wave = pending.slice(0, count);
console.log(`Backlog pending: ${pending.length}; minting: ${wave.length}; dry=${dry}`);

const created = [];
for (const item of wave) {
  const title = `FS:${item.pillar}: ${item.title}`.slice(0, 120);
  const body = [
    `BACKLOG_ID: ${item.id}`,
    `PILLAR: ${item.pillar}`,
    `PRIORITY: ${item.priority}`,
    '',
    item.body,
    '',
    `FILES (preferred): ${item.files}`,
    '',
    'CONSTRAINTS:',
    '- Repo: /mnt/c/Users/wdavi/Projects/Frontier-Survival',
    '- Surgical edits only. Never git reset/clean/checkout --hard.',
    '- Prefer OpenCode: opencode run --model lmstudio/qwen3.6-35b-a3b-mtp or qwen27/qwen3.6-27b-mlx or qwen35/...',
    '- Run: node tests/smoke.mjs (must pass)',
    '- Sync index.html and public/index.html if UI changes',
    '- Do NOT push unless card explicitly says publish; orchestrator publishes batches',
    '- On blocked: comment exact error; do not loop full-file rewrites',
    '',
    'ACCEPTANCE:',
    '- Feature works in local server :8765 or pure tests cover it',
    '- No new smoke failures',
    '- Summary lists files changed + how verified',
  ].join('\n');

  if (dry) {
    console.log(`[dry] ${item.assignee_pref} :: ${title}`);
    created.push({ id: item.id, title });
    continue;
  }

  const r = spawnSync(
    'hermes',
    [
      'kanban',
      '--board',
      BOARD,
      'create',
      '--json',
      '--assignee',
      item.assignee_pref || 'qwen27s',
      '--workspace',
      WORK,
      '--priority',
      String(1000 - (item.priority || 50)),
      '--max-runtime',
      '45m',
      '--idempotency-key',
      item.id,
      '--body',
      body,
      title,
    ],
    { encoding: 'utf8', cwd: root, maxBuffer: 5_000_000 },
  );
  const out = (r.stdout || '') + (r.stderr || '');
  let taskId = null;
  try {
    const j = JSON.parse(r.stdout || '{}');
    taskId = j.task_id || j.id || j.task?.id || null;
  } catch {
    const m = out.match(/t_[a-f0-9]+/);
    taskId = m ? m[0] : null;
  }
  if (r.status !== 0 && !taskId) {
    console.error('FAIL mint', item.id, out.slice(0, 400));
    continue;
  }
  console.log('OK', taskId || 'ok', title.slice(0, 70));
  state.mintedIds.push(item.id);
  state.totalMinted = (state.totalMinted || 0) + 1;
  const it = data.items.find((x) => x.id === item.id);
  if (it) {
    it.status = 'minted';
    it.minted_task_id = taskId;
  }
  created.push({ id: item.id, taskId, title });
}

state.lastWaveAt = new Date().toISOString();
if (!dry) {
  writeFileSync(statePath, JSON.stringify(state, null, 2));
  writeFileSync(backlogPath, JSON.stringify(data, null, 2));
}
console.log(JSON.stringify({ minted: created.length, totalMinted: state.totalMinted, remaining: pending.length - created.length }, null, 2));
