import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  acquireRegistryMutex,
  getLockDirectory,
  releaseRegistryMutex,
} from '../../src/utils/devLock';

const execFileAsync = promisify(execFile);

let lockDir: string;
let appDirectory: string;

const mutexPath = () => path.join(lockDir, '.mutex');
const ownerPath = () => path.join(mutexPath(), 'owner.json');

const listEntries = (prefix: string) =>
  fs.readdirSync(lockDir).filter(entry => entry.startsWith(prefix));

const realStartTime = (pid: number) => {
  try {
    return fs.statSync(`/proc/${pid}`).ctimeMs;
  } catch {
    return Date.now();
  }
};

// Publish a mutex exactly like the implementation does, on behalf of a fake
// owner (dead pid or a live foreign process).
const publishForeignMutex = (owner: {
  pid: number;
  processStartedAt?: number;
  token?: string;
}) => {
  fs.mkdirSync(mutexPath(), { recursive: true });
  fs.writeFileSync(
    ownerPath(),
    JSON.stringify({
      token: `foreign-${owner.pid}`,
      acquiredAt: Date.now(),
      processStartedAt: realStartTime(owner.pid),
      ...owner,
    }),
  );
};

beforeEach(() => {
  appDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'devlock-mutex-'));
  lockDir = getLockDirectory(appDirectory, 'modern-js');
  fs.mkdirSync(lockDir, { recursive: true });
  process.env.MODERN_DEV_LOCK_MUTEX_WAIT_MS = '1500';
});

afterEach(() => {
  delete process.env.MODERN_DEV_LOCK_MUTEX_WAIT_MS;
  fs.rmSync(appDirectory, { recursive: true, force: true });
});

describe('registry mutex', () => {
  it('published mutex always carries a complete owner.json', async () => {
    const token = await acquireRegistryMutex(lockDir);
    const owner = JSON.parse(fs.readFileSync(ownerPath(), 'utf-8'));
    expect(owner.pid).toBe(process.pid);
    expect(owner.token).toBe(token);
    releaseRegistryMutex(lockDir, token);
    expect(fs.existsSync(mutexPath())).toBe(false);
  });

  it('a second acquire waits for a live holder and reports busy, never breaks it', async () => {
    const token = await acquireRegistryMutex(lockDir);
    await expect(acquireRegistryMutex(lockDir)).rejects.toMatchObject({
      code: 'EDEVLOCK_BUSY',
    });
    // The live holder's mutex must be fully intact after the failed attempt.
    expect(JSON.parse(fs.readFileSync(ownerPath(), 'utf-8')).token).toBe(token);
    releaseRegistryMutex(lockDir, token);
  });

  it('a queued acquire succeeds once the holder releases', async () => {
    const first = await acquireRegistryMutex(lockDir);
    const pending = acquireRegistryMutex(lockDir);
    await new Promise(resolve => setTimeout(resolve, 120));
    releaseRegistryMutex(lockDir, first);
    const second = await pending;
    expect(second).not.toBe(first);
    releaseRegistryMutex(lockDir, second);
  });

  it('takes over a dead owner via a tombstone rename', async () => {
    publishForeignMutex({ pid: 2 ** 22 - 3, processStartedAt: Date.now() });
    const token = await acquireRegistryMutex(lockDir);
    expect(JSON.parse(fs.readFileSync(ownerPath(), 'utf-8')).token).toBe(token);
    // The dead owner's mutex was moved aside, not deleted in place.
    expect(listEntries('.stale-')).toHaveLength(1);
    releaseRegistryMutex(lockDir, token);
  });

  it('concurrent waiters taking over the same dead owner produce exactly one new holder', async () => {
    publishForeignMutex({ pid: 2 ** 22 - 3, processStartedAt: Date.now() });
    // Both contenders race the tombstone rename and then the acquisition;
    // the loser of the acquisition must queue, so release the winner ASAP.
    const contenders = [
      acquireRegistryMutex(lockDir).then(token => {
        releaseRegistryMutex(lockDir, token);
        return token;
      }),
      acquireRegistryMutex(lockDir).then(token => {
        releaseRegistryMutex(lockDir, token);
        return token;
      }),
    ];
    const tokens = await Promise.all(contenders);
    expect(new Set(tokens).size).toBe(2);
    // Exactly one tombstone for the single dead owner.
    expect(listEntries('.stale-')).toHaveLength(1);
  });

  it('recovers from a damaged mutex (no owner.json) after the grace period', async () => {
    fs.mkdirSync(mutexPath(), { recursive: true });
    // Backdate the damaged mutex beyond the 5s grace window.
    const past = new Date(Date.now() - 10_000);
    fs.utimesSync(mutexPath(), past, past);
    const token = await acquireRegistryMutex(lockDir);
    expect(JSON.parse(fs.readFileSync(ownerPath(), 'utf-8')).token).toBe(token);
    releaseRegistryMutex(lockDir, token);
  });

  it('a stale release from a displaced owner never deletes the new mutex', async () => {
    publishForeignMutex({ pid: 2 ** 22 - 3, processStartedAt: Date.now() });
    const token = await acquireRegistryMutex(lockDir);
    // The displaced (dead) owner's release must be a no-op.
    releaseRegistryMutex(lockDir, `foreign-${2 ** 22 - 3}`);
    expect(fs.existsSync(mutexPath())).toBe(true);
    releaseRegistryMutex(lockDir, token);
  });

  it('cleans candidate debris left by a crash between create and rename', async () => {
    const debris = path.join(lockDir, '.mutex-candidate-4194301-crashed');
    fs.mkdirSync(debris, { recursive: true });
    fs.writeFileSync(
      path.join(debris, 'owner.json'),
      JSON.stringify({
        pid: 2 ** 22 - 3,
        processStartedAt: Date.now(),
        token: 'crashed',
        acquiredAt: Date.now(),
      }),
    );
    const token = await acquireRegistryMutex(lockDir);
    releaseRegistryMutex(lockDir, token);
    expect(listEntries('.mutex-candidate-')).toHaveLength(0);
  });
});

// Real multi-process contention over the built CJS artifact. Skipped when
// the package has not been built (`nx build @modern-js/app-tools`).
const testDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
const distDevLock = path.resolve(testDir, '../../dist/cjs/utils/devLock.js');
const describeWithDist = fs.existsSync(distDevLock) ? describe : describe.skip;

describeWithDist('registry mutex across real processes', () => {
  it('exclusive build locks never overlap between processes', async () => {
    const logFile = path.join(appDirectory, 'sections.log');
    const childScript = `
        const fs = require('fs');
        const { acquireCommandLock, releaseCommandLock } =
          require(${JSON.stringify(distDevLock)});
        const appDirectory = process.argv[1];
        const logFile = process.argv[2];
        (async () => {
          await acquireCommandLock({
            appDirectory,
            metaName: 'modern-js',
            operation: 'build',
          });
          fs.appendFileSync(logFile, 'enter ' + Date.now() + '\\n');
          await new Promise(r => setTimeout(r, 150));
          fs.appendFileSync(logFile, 'exit ' + Date.now() + '\\n');
          releaseCommandLock(appDirectory, 'modern-js', 'build');
          process.exit(0);
        })().catch(err => {
          fs.appendFileSync(logFile, 'blocked ' + (err.code || err) + '\\n');
          process.exit(3);
        });
      `;
    const children = Array.from({ length: 4 }, () =>
      execFileAsync(
        process.execPath,
        ['-e', childScript, appDirectory, logFile],
        { env: { ...process.env, MODERN_DEV_LOCK_MUTEX_WAIT_MS: '8000' } },
      ).catch(err => err),
    );
    await Promise.all(children);

    const lines = fs
      .readFileSync(logFile, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean);
    // Replay the log: at no point may two processes be inside the
    // exclusive section simultaneously.
    let inside = 0;
    let winners = 0;
    for (const line of lines) {
      const [kind] = line.split(' ');
      if (kind === 'enter') {
        inside += 1;
        winners += 1;
        expect(inside).toBe(1);
      } else if (kind === 'exit') {
        inside -= 1;
      }
    }
    // At least one process must have made it through; the rest either
    // queued (also fine) or were rejected with a typed conflict.
    expect(winners).toBeGreaterThanOrEqual(1);
    for (const line of lines) {
      if (line.startsWith('blocked')) {
        expect(line).toMatch(/EBUILD_IN_PROGRESS|EDEVLOCK_BUSY/);
      }
    }
  }, 30_000);
});
