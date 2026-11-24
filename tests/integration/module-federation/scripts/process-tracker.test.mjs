import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  parseProcesses,
  ProcessTracker,
  readProcesses,
  signalTrackedProcesses,
} from './process-tracker.mjs';
import { runCommand } from './run.mjs';

const row = (pid, parent, group, birth = 'first', state = 'S') => ({
  pid,
  parent,
  group,
  birth,
  state,
  command: `process-${pid}`,
});
const root = row(100, 50, 100);
const child = row(101, 100, 100);
function tracked() {
  const tracker = new ProcessTracker();
  tracker.seed(root);
  tracker.update([root, child]);
  return tracker;
}
const pids = rows => rows.map(row => row.pid).sort((a, b) => a - b);

test('parses birth identity independently of mutable command text', () => {
  const parsed = parseProcesses(
    '  100 50 100 Mon Nov  9 12:34:56 2026 Ss /usr/bin/node script with spaces\n',
  );
  assert.deepEqual(parsed, [
    {
      ...root,
      birth: 'Mon Nov 9 12:34:56 2026',
      state: 'Ss',
      command: '/usr/bin/node script with spaces',
    },
  ]);
  const tracker = new ProcessTracker();
  tracker.seed(parsed[0]);
  assert.equal(
    tracker.update([{ ...parsed[0], command: 'exec new-command' }]).length,
    1,
  );
});

test('a reused owned PID neither leaks nor grants ownership to its children', () => {
  const tracker = tracked();
  const reused = row(child.pid, 800, 800, 'second');
  assert.deepEqual(
    pids(tracker.update([root, reused, row(102, child.pid, 800)])),
    [root.pid],
  );
  assert.equal(tracker.active.has(child.pid), false);
  assert.equal(tracker.observed.size, 2);
});

test('a missing parent cannot transfer ownership through its stale PID', () => {
  const tracker = tracked();
  assert.deepEqual(pids(tracker.update([root, row(102, child.pid, 800)])), [
    root.pid,
  ]);
});

test('a reused process group is retired when its final known incarnation exits', () => {
  const tracker = tracked();
  assert.deepEqual(tracker.update([]), []);
  const external = row(root.pid, 800, root.group, 'second');
  assert.deepEqual(
    tracker.update([external, row(102, root.pid, root.group, 'second')]),
    [],
  );
  assert.equal(tracker.groups.size, 0);
});

test('same-snapshot PID and group reuse cannot inherit ownership', () => {
  const tracker = tracked();
  assert.deepEqual(
    tracker.update([
      row(root.pid, 800, root.group, 'second'),
      row(child.pid, root.pid, root.group, 'second'),
    ]),
    [],
  );
});

test('the live supervisor identifies a new orphan whose parent exited between samples', () => {
  const tracker = new ProcessTracker();
  tracker.seed(root);
  const orphan = row(103, 1, root.group);
  assert.deepEqual(pids(tracker.update([root, orphan])), [100, 103]);
  assert.deepEqual(pids(tracker.update([orphan])), [103]);
});

test('an observed detached group remains owned through a surviving orphan', () => {
  const tracker = tracked();
  const leader = row(200, child.pid, 200);
  const orphan = row(201, leader.pid, 200);
  tracker.update([root, child, leader, orphan]);
  assert.deepEqual(
    pids(tracker.update([root, { ...orphan, parent: 1 }])),
    [100, 201],
  );
});

test('joining an unrelated group does not authorize its other members', () => {
  const tracker = tracked();
  assert.deepEqual(
    pids(tracker.update([root, { ...child, group: 800 }, row(800, 1, 800)])),
    [100, 101],
  );
});

test('revalidates PID incarnation before each signal and never broadcasts to a group', () => {
  const tracker = tracked();
  let samples = 0;
  const signals = [];
  signalTrackedProcesses(
    tracker,
    () => {
      samples++;
      return samples === 1
        ? [root, child]
        : [root, row(child.pid, 800, 800, 'second')];
    },
    (...args) => signals.push(args),
    'SIGTERM',
    [root.pid],
  );
  assert.deepEqual(signals, []);
});

test('TERM then PID reuse never sends KILL to the replacement', () => {
  const tracker = tracked();
  const signals = [];
  const kill = (...args) => signals.push(args);
  signalTrackedProcesses(tracker, () => [root, child], kill, 'SIGTERM', [
    root.pid,
  ]);
  signalTrackedProcesses(
    tracker,
    () => [root, row(child.pid, 800, 800, 'second')],
    kill,
    'SIGKILL',
    [root.pid],
  );
  assert.deepEqual(signals, [[child.pid, 'SIGTERM']]);
});

test('a failed identity read prevents signaling stale targets', () => {
  const tracker = tracked();
  const signals = [];
  let samples = 0;
  assert.throws(
    () =>
      signalTrackedProcesses(
        tracker,
        () => {
          if (++samples > 1) throw new Error('ps failed');
          return [root, child];
        },
        (...args) => signals.push(args),
        'SIGTERM',
        [root.pid],
      ),
    /ps failed/,
  );
  assert.deepEqual(signals, []);
});

test('zombies are observed but never signaled or counted as live', () => {
  const tracker = tracked();
  const zombie = { ...child, state: 'Z' };
  assert.deepEqual(pids(tracker.update([root, zombie])), [root.pid]);
  const signals = [];
  signalTrackedProcesses(
    tracker,
    () => [root, zombie],
    (...args) => signals.push(args),
    'SIGTERM',
    [root.pid],
  );
  assert.deepEqual(signals, []);
});

test('cancellation before the startup handshake never starts the command', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'mf-tracker-cancel-'));
  try {
    const pending = runCommand(
      process.execPath,
      ['-e', "console.log('must-not-start')"],
      process.env,
      directory,
      'probe',
      { read: () => [] },
    );
    process.emit('SIGTERM');
    const result = await pending;
    assert.equal(result.signal, 'SIGTERM');
    assert.equal(result.cleanup, true);
    assert.equal(readFileSync(path.join(directory, 'probe.log'), 'utf8'), '');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('audit failure reports without waiting for an unknown orphan to close stdout', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'mf-tracker-pipe-'));
  const marker = path.join(directory, 'orphan-finished');
  // This finite probe exits by itself. It never needs a PID-only test cleanup.
  const orphan = `setTimeout(() => require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'done'), 1500)`;
  const command = `require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(orphan)}], { stdio: 'inherit' }).unref()`;
  let reads = 0;
  try {
    const result = await runCommand(
      process.execPath,
      ['-e', command],
      process.env,
      directory,
      'probe',
      {
        read: () => {
          if (++reads > 1) throw new Error('intentional audit read failure');
          return readProcesses();
        },
      },
    );
    assert.equal(result.code, 0);
    assert.equal(result.cleanup, false);
    const report = JSON.parse(
      readFileSync(path.join(directory, 'probe-cleanup.json'), 'utf8'),
    );
    assert.match(report.auditError, /intentional audit read failure/);
    assert.equal(
      existsSync(marker),
      false,
      'runner waited for the orphan-held pipe',
    );
  } finally {
    const deadline = Date.now() + 5000;
    while (!existsSync(marker) && Date.now() < deadline)
      await new Promise(resolve => setTimeout(resolve, 50));
    rmSync(directory, { recursive: true, force: true });
  }
});

test('cancellation handlers remain installed during the final audit', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'mf-tracker-audit-'));
  const listeners = process.listenerCount('SIGTERM');
  let reads = 0;
  try {
    const result = await runCommand(
      process.execPath,
      ['-e', ''],
      process.env,
      directory,
      'probe',
      {
        read: () => {
          if (++reads === 2) {
            assert.equal(process.listenerCount('SIGTERM'), listeners + 1);
            process.emit('SIGTERM');
          }
          return readProcesses();
        },
      },
    );
    assert.equal(result.signal, 'SIGTERM');
    assert.equal(result.cleanup, true);
    assert.equal(process.listenerCount('SIGTERM'), listeners);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
