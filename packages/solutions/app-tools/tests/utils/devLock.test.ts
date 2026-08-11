import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {
  DevServerLockError,
  LOCK_SCHEMA_VERSION,
  acquireCommandLock,
  clearDevLockIntent,
  getDevLockIntent,
  getLockDirectory,
  markDevLockReady,
  normalizeLockOperation,
  releaseAllLocks,
  releaseCommandLock,
  setDevLockIntent,
} from '../../src/utils/devLock';

const META = 'modern-js';

let appDirectory: string;
let lockDir: string;

const readLocks = () =>
  fs
    .readdirSync(lockDir)
    .filter(f => f.endsWith('.lock'))
    .map(f => JSON.parse(fs.readFileSync(path.join(lockDir, f), 'utf-8')));

// The identity check compares the recorded start time with the real one, so
// locks that should read as "alive" must record the pid's actual start time
// — mirroring the platform sources the implementation itself uses.
const realStartTime = (pid: number) => {
  try {
    if (process.platform === 'linux') {
      return fs.statSync(`/proc/${pid}`).ctimeMs;
    }
    if (process.platform === 'darwin') {
      const out = require('node:child_process')
        .execSync(`ps -o lstart= -p ${pid}`)
        .toString()
        .trim();
      const parsed = Date.parse(out);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  } catch {
    // fall through
  }
  return Date.now();
};

const writeForeignLock = (overrides: Record<string, unknown> = {}) => {
  fs.mkdirSync(lockDir, { recursive: true });
  const lock = {
    schemaVersion: LOCK_SCHEMA_VERSION,
    operation: 'dev',
    mode: 'shared',
    state: 'starting',
    pid: 999999,
    appDirectory,
    ...overrides,
  } as Record<string, unknown> & { pid: number };
  if (lock.processStartedAt === undefined) {
    lock.processStartedAt = realStartTime(lock.pid);
  }
  fs.writeFileSync(
    path.join(lockDir, `${lock.pid}.lock`),
    JSON.stringify(lock),
  );
  return lock;
};

beforeEach(() => {
  appDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'devlock-'));
  lockDir = getLockDirectory(appDirectory, META);
});

afterEach(() => {
  releaseAllLocks();
  fs.rmSync(appDirectory, { recursive: true, force: true });
});

describe('normalizeLockOperation', () => {
  it('treats start as an alias of dev and ignores read-only commands', () => {
    expect(normalizeLockOperation('dev')).toBe('dev');
    expect(normalizeLockOperation('start')).toBe('dev');
    expect(normalizeLockOperation('build')).toBe('build');
    expect(normalizeLockOperation('deploy')).toBe('deploy');
    expect(normalizeLockOperation('serve')).toBeNull();
    expect(normalizeLockOperation('inspect')).toBeNull();
    expect(normalizeLockOperation(undefined)).toBeNull();
  });
});

describe('acquireCommandLock', () => {
  it('writes a shared lock for dev and removes it on release', async () => {
    await acquireCommandLock({
      appDirectory,
      metaName: META,
      operation: 'dev',
    });
    const [lock] = readLocks();
    expect(lock.mode).toBe('shared');
    expect(lock.state).toBe('starting');
    expect(lock.pid).toBe(process.pid);

    releaseCommandLock(appDirectory, META, 'dev');
    expect(readLocks()).toHaveLength(0);
  });

  it('re-entry from the same process reuses the lock (hot restart)', async () => {
    await acquireCommandLock({
      appDirectory,
      metaName: META,
      operation: 'dev',
    });
    // Second acquire in the same process must not conflict with itself.
    await acquireCommandLock({
      appDirectory,
      metaName: META,
      operation: 'dev',
    });
    expect(readLocks()).toHaveLength(1);
  });

  it('rejects a second dev while a live dev lock exists', async () => {
    // Use our parent process as a genuinely alive foreign process.
    writeForeignLock({ pid: process.ppid });
    await expect(
      acquireCommandLock({ appDirectory, metaName: META, operation: 'dev' }),
    ).rejects.toMatchObject({ code: 'EDEV_SERVER_RUNNING' });
  });

  it('allows a second dev with allowMultiple, which also writes its lock', async () => {
    writeForeignLock({ pid: process.ppid });
    await acquireCommandLock({
      appDirectory,
      metaName: META,
      operation: 'dev',
      allowMultiple: true,
    });
    expect(readLocks()).toHaveLength(2);
  });

  it('blocks build when a dev lock is alive, and dev when a build lock is alive', async () => {
    writeForeignLock({ pid: process.ppid });
    await expect(
      acquireCommandLock({ appDirectory, metaName: META, operation: 'build' }),
    ).rejects.toMatchObject({ code: 'EBUILD_BLOCKED_BY_DEV' });

    fs.rmSync(path.join(lockDir, `${process.ppid}.lock`));
    writeForeignLock({
      pid: process.ppid,
      operation: 'build',
      mode: 'exclusive',
      state: 'running',
    });
    await expect(
      acquireCommandLock({
        appDirectory,
        metaName: META,
        operation: 'dev',
        allowMultiple: true,
      }),
    ).rejects.toMatchObject({ code: 'EDEV_BLOCKED_BY_BUILD' });
    await expect(
      acquireCommandLock({ appDirectory, metaName: META, operation: 'deploy' }),
    ).rejects.toMatchObject({ code: 'EBUILD_IN_PROGRESS' });
  });

  it('cleans up a stale lock whose process is gone', async () => {
    // A pid that is (almost certainly) not running.
    writeForeignLock({ pid: 2 ** 22 - 3 });
    await acquireCommandLock({
      appDirectory,
      metaName: META,
      operation: 'dev',
    });
    const locks = readLocks();
    expect(locks).toHaveLength(1);
    expect(locks[0].pid).toBe(process.pid);
  });

  it('keeps an identity-verified live dev lock even when its port is closed (hot-restart window)', async () => {
    // During a config hot restart the server closes before CLI init re-runs:
    // the holder is alive but momentarily has no listening port. A failed
    // port probe must NOT strip it of protection.
    writeForeignLock({
      pid: process.ppid,
      state: 'ready',
      port: 65531,
      host: '127.0.0.1',
    });
    await expect(
      acquireCommandLock({ appDirectory, metaName: META, operation: 'build' }),
    ).rejects.toMatchObject({ code: 'EBUILD_BLOCKED_BY_DEV' });
    expect(readLocks()).toHaveLength(1);
  });

  it('keeps a ready dev lock whose port is actually listening', async () => {
    const server = net.createServer();
    await new Promise<void>(resolve =>
      server.listen(0, '127.0.0.1', () => resolve()),
    );
    const { port } = server.address() as net.AddressInfo;
    try {
      writeForeignLock({
        pid: process.ppid,
        state: 'ready',
        port,
        host: '127.0.0.1',
      });
      await expect(
        acquireCommandLock({
          appDirectory,
          metaName: META,
          operation: 'build',
        }),
      ).rejects.toMatchObject({ code: 'EBUILD_BLOCKED_BY_DEV' });
    } finally {
      server.close();
    }
  });

  it('never deletes a lock written by a newer CLI', async () => {
    writeForeignLock({
      pid: process.ppid,
      schemaVersion: LOCK_SCHEMA_VERSION + 1,
    });
    await expect(
      acquireCommandLock({ appDirectory, metaName: META, operation: 'dev' }),
    ).rejects.toMatchObject({ code: 'EUNSUPPORTED_LEASE' });
    expect(readLocks()).toHaveLength(1);
  });

  it('release is op-matched: an inner build release keeps the deploy lock', async () => {
    await acquireCommandLock({
      appDirectory,
      metaName: META,
      operation: 'deploy',
    });
    releaseCommandLock(appDirectory, META, 'build');
    expect(readLocks()).toHaveLength(1);
    releaseCommandLock(appDirectory, META, 'deploy');
    expect(readLocks()).toHaveLength(0);
  });

  it('markDevLockReady fills in port and flips state', async () => {
    await acquireCommandLock({
      appDirectory,
      metaName: META,
      operation: 'dev',
    });
    markDevLockReady(appDirectory, META, { port: 8080, host: 'localhost' });
    const [lock] = readLocks();
    expect(lock.state).toBe('ready');
    expect(lock.port).toBe(8080);
  });

  it('hot-restart re-entry inherits allowMultiple from its own lock file', async () => {
    // First acquire opted in to multi-instance mode alongside a live dev.
    writeForeignLock({ pid: process.ppid });
    await acquireCommandLock({
      appDirectory,
      metaName: META,
      operation: 'dev',
      allowMultiple: true,
    });
    // Config hot restart re-enters WITHOUT the original intent; the
    // privilege persisted in our own lock file must keep it passing.
    await acquireCommandLock({
      appDirectory,
      metaName: META,
      operation: 'dev',
    });
    const own = readLocks().find(lock => lock.pid === process.pid);
    expect(own.allowMultiple).toBe(true);
  });

  it('run-scoped intent is keyed by appDirectory and does not leak across apps', () => {
    setDevLockIntent(appDirectory, { allowMultiple: true });
    expect(getDevLockIntent(appDirectory)).toEqual({ allowMultiple: true });
    expect(getDevLockIntent('/some/other/app')).toBeUndefined();
    // A later run for the same app overwrites the previous intent.
    setDevLockIntent(appDirectory, { allowMultiple: false });
    expect(getDevLockIntent(appDirectory)).toEqual({ allowMultiple: false });
    clearDevLockIntent(appDirectory);
    expect(getDevLockIntent(appDirectory)).toBeUndefined();
  });

  it('errors carry structured instances for agents', async () => {
    writeForeignLock({ pid: process.ppid, state: 'starting' });
    try {
      await acquireCommandLock({
        appDirectory,
        metaName: META,
        operation: 'dev',
      });
      throw new Error('expected a DevServerLockError');
    } catch (err) {
      expect(err).toBeInstanceOf(DevServerLockError);
      const lockErr = err as DevServerLockError;
      expect(lockErr.instances[0]).toMatchObject({
        pid: process.ppid,
        operation: 'dev',
        mode: 'shared',
        // ppid's real start time is readable on linux/darwin, so the kill
        // suggestion is allowed for it.
        identityVerified: true,
      });
    }
  });
});
