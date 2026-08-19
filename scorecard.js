import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

function run(command, args) {
  try {
    const output = execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, output: output.trim().split('\n').slice(-3) };
  } catch (error) {
    return { ok: false, output: String(error.stdout || error.stderr || error.message).trim().split('\n').slice(-5) };
  }
}

const report = {
  checkedAt: new Date().toISOString(),
  smoke: run('node', ['tests/smoke.mjs']),
  diffCheck: run('git', ['diff', '--check']),
  htmlParity: run('cmp', ['index.html', 'public/index.html']),
  statePresent: existsSync('STATE.json'),
  entryMarker: readFileSync('index.html', 'utf8').match(/main\.js\?v=\d+/)?.[0] || null
};
report.ok = report.smoke.ok && report.diffCheck.ok && report.htmlParity.ok && report.statePresent;
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
