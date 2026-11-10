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
import { pathToFileURL } from 'node:url';
import { jobEnv, repoRoot, selectFiles, unitFiles } from './groups.mjs';

function processes() {
  return execFileSync('ps', ['-axo', 'pid=,ppid=,pgid=,stat=,command='], {
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .flatMap(line => {
      const match = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/);
      return match
        ? [
            {
              pid: Number(match[1]),
              parent: Number(match[2]),
              group: Number(match[3]),
              state: match[4],
              command: match[5],
            },
          ]
        : [];
    });
}

// Audit before any fallback cleanup. Leaks fail the job and remain in its report.
export async function runCommand(command, args, env, directory, name) {
  const startedAt = new Date().toISOString();
  const log = openSync(path.join(directory, `${name}.log`), 'wx');
  const temporary = mkdtempSync(path.join(tmpdir(), 'mf-run-'));
  const owned = new Set();
  const ownedGroups = new Set();
  const observed = new Map();
  const workspaces = new Set();
  let auditError;
  const child = spawn(command, args, {
    cwd: repoRoot,
    env: { ...env, TMPDIR: temporary, TMP: temporary, TEMP: temporary },
    stdio: ['ignore', 'pipe', 'pipe'],
    // A dedicated process group also identifies short-lived parents' orphans.
    detached: true,
  });
  if (child.pid) {
    owned.add(child.pid);
    ownedGroups.add(child.pid);
  }
  const sample = () => {
    try {
      const rows = processes();
      let size;
      do {
        size = owned.size;
        for (const row of rows) {
          if (
            owned.has(row.parent) ||
            owned.has(row.pid) ||
            ownedGroups.has(row.group)
          ) {
            owned.add(row.pid);
            if (row.group === row.pid) ownedGroups.add(row.group);
            observed.set(row.pid, row);
          }
        }
      } while (size !== owned.size);
      for (const name of readdirSync(temporary)) workspaces.add(name);
      return rows.filter(
        row => owned.has(row.pid) && !row.state.startsWith('Z'),
      );
    } catch (error) {
      auditError = String(error);
      return [];
    }
  };
  const signalGroups = signal => {
    for (const group of ownedGroups) {
      try {
        process.kill(-group, signal);
      } catch (error) {
        if (error.code !== 'ESRCH') auditError = String(error);
      }
    }
  };
  let interrupted;
  const handlers = ['SIGINT', 'SIGTERM'].map(signal => {
    const handler = () => {
      interrupted = signal;
      sample();
      signalGroups(signal);
    };
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
  const result = await new Promise(resolve => {
    child.on('error', error => resolve({ code: null, error: String(error) }));
    child.on('close', (code, signal) => resolve({ code, signal }));
  });
  clearInterval(timer);
  for (const [signal, handler] of handlers)
    process.removeListener(signal, handler);
  closeSync(log);
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
    observedProcesses: [...observed.values()],
    observedWorkspaces: [...workspaces].sort(),
    live,
    remaining,
  };
  if (live.length) {
    signalGroups('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 100));
    if (sample().length) signalGroups('SIGKILL');
    const deadline = Date.now() + 1000;
    while (sample().length && Date.now() < deadline)
      await new Promise(resolve => setTimeout(resolve, 100));
    cleanup.afterCleanup = sample();
  }
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
