// Model-free unit tests for the grading engine against pilot-bank.json.
//
// For every task fixture (fixtures/<task>/correct*, fixtures/<task>/wrong-*):
//   1. copy the template project into a scratch run dir (node_modules symlinked)
//   2. overlay the fixture files (a "solution patch" against the template)
//   3. run engine.mjs pilot-bank.json <task> <runDir> --json
//   4. assert pass/fail matches _expect.json (default: correct* → pass)
//      and, for negatives, that reason points at an expected check name.
//
// Usage: node test-graders.mjs [--only T03] [--keep]
// Serial on purpose: canonical fixtures run REAL builds (~30-60 s each).

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(__dirname, 'template/demo-app');
const FIXTURES = path.join(__dirname, 'fixtures');
const TESTRUNS = path.join(__dirname, 'testruns');
const BANK = path.join(__dirname, 'pilot-bank.json');
const ENGINE = path.join(__dirname, 'engine.mjs');

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const keep = args.includes('--keep');

const bank = JSON.parse(fs.readFileSync(BANK, 'utf8'));
const taskIds = bank.tasks.map(t => t.id).filter(id => !only || id === only);

const realNodeModules = fs.realpathSync(path.join(TEMPLATE, 'node_modules'));

function prepareRunDir(taskId, fixtureName) {
  const dir = path.join(TESTRUNS, `${taskId}-${fixtureName}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const entry of fs.readdirSync(TEMPLATE)) {
    if (entry === 'node_modules') continue;
    fs.cpSync(path.join(TEMPLATE, entry), path.join(dir, entry), {
      recursive: true,
    });
  }
  fs.symlinkSync(realNodeModules, path.join(dir, 'node_modules'));
  // overlay fixture files (skip harness metadata)
  const fixDir = path.join(FIXTURES, taskId, fixtureName);
  const overlay = (from, to) => {
    for (const e of fs.readdirSync(from, { withFileTypes: true })) {
      if (e.name === '_expect.json') continue;
      const src = path.join(from, e.name);
      const dst = path.join(to, e.name);
      if (e.isDirectory()) {
        fs.mkdirSync(dst, { recursive: true });
        overlay(src, dst);
      } else {
        fs.copyFileSync(src, dst);
      }
    }
  };
  overlay(fixDir, dir);
  return dir;
}

function readExpect(taskId, fixtureName) {
  const p = path.join(FIXTURES, taskId, fixtureName, '_expect.json');
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  if (fixtureName.startsWith('correct')) return { pass: true };
  throw new Error(`missing _expect.json for ${taskId}/${fixtureName}`);
}

const rows = [];
let failures = 0;

for (const taskId of taskIds) {
  const taskFixDir = path.join(FIXTURES, taskId);
  if (!fs.existsSync(taskFixDir)) {
    console.error(`!! no fixtures for ${taskId}`);
    failures++;
    continue;
  }
  const fixtureNames = fs
    .readdirSync(taskFixDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort(
      (a, b) =>
        (a.startsWith('correct') ? -1 : 1) -
          (b.startsWith('correct') ? -1 : 1) || a.localeCompare(b),
    );

  for (const fixtureName of fixtureNames) {
    const expect = readExpect(taskId, fixtureName);
    const dir = prepareRunDir(taskId, fixtureName);
    const t0 = Date.now();
    const r = spawnSync('node', [ENGINE, BANK, taskId, dir, '--json'], {
      encoding: 'utf8',
      timeout: 8 * 60 * 1000,
    });
    const secs = Math.round((Date.now() - t0) / 1000);
    let res = null;
    try {
      res = JSON.parse((r.stdout || '').trim().split('\n').pop());
    } catch {}

    let ok = false;
    let note = '';
    if (!res) {
      note = `engine produced no JSON (exit ${r.status}): ${(r.stderr || '').slice(-200)}`;
    } else if (res.pass !== expect.pass) {
      note = `expected pass=${expect.pass}, got pass=${res.pass} (reason: ${res.reason})`;
    } else if (!expect.pass && expect.failCheck) {
      const allowed = Array.isArray(expect.failCheck)
        ? expect.failCheck
        : [expect.failCheck];
      const failedName = (res.reason || '').split(':')[0];
      if (!allowed.includes(failedName)) {
        note = `expected fail check ∈ [${allowed.join(', ')}], got "${res.reason}"`;
      } else {
        ok = true;
        note = res.reason;
      }
    } else {
      ok = true;
      note = res && !res.pass ? res.reason : '';
    }
    // engine exit code must agree with pass
    if (
      ok &&
      res &&
      ((res.pass && r.status !== 0) || (!res.pass && r.status !== 1))
    ) {
      ok = false;
      note = `exit code ${r.status} disagrees with pass=${res.pass}`;
    }

    if (!ok) failures++;
    rows.push({
      task: taskId,
      fixture: fixtureName,
      want: expect.pass ? 'PASS' : 'FAIL',
      ok,
      secs,
      note,
    });
    console.log(
      `${ok ? '✓' : '✗'} ${taskId}/${fixtureName} (want ${expect.pass ? 'PASS' : 'FAIL'}, ${secs}s)${note ? ` — ${note}` : ''}`,
    );
    if (!keep && ok) fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ---- matrix ----
console.log('\n=== grader unit-test matrix ===');
const pad = (s, n) => String(s).padEnd(n);
console.log(
  `${
    pad('task', 6) +
    pad('fixture', 16) +
    pad('want', 6) +
    pad('result', 8) +
    pad('time', 6)
  }reason`,
);
for (const r of rows) {
  console.log(
    pad(r.task, 6) +
      pad(r.fixture, 16) +
      pad(r.want, 6) +
      pad(r.ok ? 'OK' : 'MISMATCH', 8) +
      pad(`${r.secs}s`, 6) +
      (r.note || ''),
  );
}
console.log(
  `\n${rows.length - failures}/${rows.length} fixtures behave as expected${failures ? ` — ${failures} MISMATCH` : ' — ALL GREEN'}`,
);
process.exit(failures ? 1 : 0);
