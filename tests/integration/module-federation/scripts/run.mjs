import { spawn, execFileSync } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  rmSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { jobEnv, repoRoot, selectFiles, unitFiles } from './groups.mjs';
import {
  ProcessTracker,
  readProcesses,
  signalTrackedProcesses,
} from './process-tracker.mjs';

// Audit before any fallback cleanup. Leaks fail the job and remain in its report.
export async function runCommand(
  command,
  args,
  env,
  directory,
  name,
  { read = readProcesses } = {},
) {
  const startedAt = new Date().toISOString();
  const log = openSync(path.join(directory, `${name}.log`), 'wx');
  const temporary = mkdtempSync(path.join(tmpdir(), 'mf-run-'));
  const tracker = new ProcessTracker();
  const workspaces = new Set();
  let auditError;
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL('./process-command.mjs', import.meta.url))],
    {
      cwd: repoRoot,
      env: { ...env, TMPDIR: temporary, TMP: temporary, TEMP: temporary },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      // An IPC-gated supervisor anchors the group until the audit is complete.
      detached: true,
    },
  );
  const sample = () => {
    try {
      const live = tracker.update(read());
      for (const name of readdirSync(temporary)) workspaces.add(name);
      return live.filter(row => row.pid !== child.pid);
    } catch (error) {
      auditError = String(error);
      return [];
    }
  };
  const signalOwned = signal => {
    try {
      signalTrackedProcesses(tracker, read, process.kill, signal, [child.pid]);
    } catch (error) {
      auditError = String(error);
    }
  };
  let interrupted;
  const interrupt = signal => {
    interrupted = signal;
    signalOwned(signal);
  };
  const handlers = ['SIGINT', 'SIGTERM'].map(signal => {
    const handler = () => interrupt(signal);
    process.once(signal, handler);
    return [signal, handler];
  });
  const timer = setInterval(sample, 1000);
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', data => {
      writeSync(log, data);
      (stream === child.stdout ? process.stdout : process.stderr).write(data);
    });
  }
  const closed = new Promise(resolve => child.on('close', resolve));
  const exited = new Promise(resolve => {
    child.on('exit', resolve);
    child.on('error', resolve);
  });
  const result = await new Promise(resolve => {
    child.on('error', error => resolve({ code: null, error: String(error) }));
    child.on('exit', (code, signal) => resolve({ code, signal }));
    child.on('message', message => {
      if (message.type === 'interrupted') interrupt(message.signal);
      if (message.type === 'finished') {
        const { type: _, ...result } = message;
        resolve(result);
      }
      if (message.type === 'ready') {
        if (interrupted) {
          resolve({ code: null, signal: interrupted });
          return;
        }
        try {
          const rows = read();
          const root = rows.find(
            row =>
              row.pid === child.pid &&
              row.parent === process.pid &&
              row.group === child.pid,
          );
          if (!root)
            throw new Error('Cannot identify the waiting command supervisor');
          tracker.seed(root);
          tracker.update(rows);
          child.send({ type: 'start', command, args });
        } catch (error) {
          auditError = String(error);
          resolve({ code: null, error: auditError });
        }
      }
    });
  });
  clearInterval(timer);
  let live = sample();
  // SIGTERM delivery in Lab.stop is asynchronous. Observe exit without changing
  // any test readiness, assertion, hook timeout or retry setting.
  const deadline = Date.now() + 5000;
  while (live.length && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 100));
    live = sample();
  }
  const remaining = readdirSync(temporary).filter(
    name => name.startsWith('modern-') || name.startsWith('puppeteer_'),
  );
  const cleanup = {
    ok: !auditError && live.length === 0 && remaining.length === 0,
    auditError,
    temporary,
    observedProcesses: [...tracker.observed.values()],
    observedWorkspaces: [...workspaces].sort(),
    live,
    remaining,
  };
  if (live.length) {
    signalOwned('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 100));
    if (sample().length) signalOwned('SIGKILL');
    const deadline = Date.now() + 1000;
    while (sample().length && Date.now() < deadline)
      await new Promise(resolve => setTimeout(resolve, 100));
    cleanup.afterCleanup = sample();
  }
  // Release only after the final process snapshot. This also handles a command
  // that creates an orphan and exits entirely between periodic samples.
  if (child.connected) child.send({ type: 'release' });
  await exited;
  // Drain normal buffered output, but do not wait on an orphan-held pipe.
  let drainTimer;
  await Promise.race([
    closed,
    new Promise(resolve => {
      drainTimer = setTimeout(resolve, 100);
    }),
  ]);
  clearTimeout(drainTimer);
  // A failed audit must still produce its report if an unidentifiable orphan
  // retains an inherited pipe. Releasing the supervisor does not close that fd.
  child.stdout.destroy();
  child.stderr.destroy();
  await closed;
  for (const [signal, handler] of handlers)
    process.removeListener(signal, handler);
  closeSync(log);
  cleanup.auditError = auditError;
  if (auditError) cleanup.ok = false;
  // Cleanup never changes the failed audit into a pass.
  rmSync(temporary, { recursive: true, force: true });
  writeFileSync(
    path.join(directory, `${name}-cleanup.json`),
    `${JSON.stringify(cleanup, null, 2)}\n`,
  );
  return {
    ...result,
    ...(interrupted ? { signal: interrupted } : {}),
    cleanup: cleanup.ok,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}

export async function run(id, directory) {
  const env = { ...process.env };
  for (const key of ['MF_LAB_SUITE', 'MF_LAB_MODE', 'MF_LAB_SHARD'])
    delete env[key];
  if (id !== 'serial') Object.assign(env, jobEnv(id));
  selectFiles(env);
  mkdirSync(directory, { recursive: true });
  if (existsSync(path.join(directory, 'status.json')))
    throw new Error(`Refusing to reuse completed artifacts: ${directory}`);
  Object.assign(env, { MF_LAB_ARTIFACT_DIR: directory, MF_JOB_ID: id });
  const status = {
    version: 1,
    job: id,
    revision: execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim(),
    runId: env.GITHUB_RUN_ID ?? 'local',
    attempt: env.GITHUB_RUN_ATTEMPT ?? '1',
    startedAt: new Date().toISOString(),
    commands: {},
    result: 'failure',
  };
  try {
    if (id === 'common' || id === 'serial') {
      for (const [name, file] of Object.entries(unitFiles)) {
        status.commands[name] = await runCommand(
          'pnpm',
          [
            'exec',
            'rstest',
            '-c',
            'tests/integration/module-federation/unit.rstest.config.mts',
            file,
            '--bail=1',
          ],
          { ...env, MF_REPORT_NAME: name },
          directory,
          name,
        );
        if (
          status.commands[name].code !== 0 ||
          status.commands[name].signal ||
          !status.commands[name].cleanup
        )
          throw new Error(`${name} failed or leaked resources`);
      }
    }
    status.commands.mf = await runCommand(
      'pnpm',
      ['--filter', 'mf-lab-tests', 'test', '--bail=1'],
      { ...env, MF_REPORT_NAME: 'mf' },
      directory,
      'mf',
    );
    if (
      status.commands.mf.code !== 0 ||
      status.commands.mf.signal ||
      !status.commands.mf.cleanup
    )
      throw new Error('MF tests failed or leaked resources');
    status.result = 'success';
  } finally {
    status.finishedAt = new Date().toISOString();
    writeFileSync(
      path.join(directory, 'status.json'),
      `${JSON.stringify(status, null, 2)}\n`,
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [id, directory, ...extra] = process.argv.slice(2);
  if (!directory || extra.length)
    throw new Error(
      'Usage: node scripts/run.mjs <job|serial> <artifact-directory>',
    );
  await run(id, path.resolve(directory));
}
