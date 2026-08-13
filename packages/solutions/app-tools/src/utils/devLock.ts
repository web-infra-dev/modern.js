import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { logger } from '@modern-js/utils';

export const LOCK_SCHEMA_VERSION = 1;

// Identity tolerance: process start time read back from the OS and the value
// recorded in the lock never match exactly (tick rounding, ps formatting).
const START_TIME_TOLERANCE_MS = 5000;
// A lock whose content is not valid JSON is corrupted, but give a short grace
// period so we never race a writer from a different (non tmp+rename) source.
const BAD_JSON_GRACE_MS = 5000;
const MUTEX_WAIT_TOTAL_MS = 10_000;
const HEARTBEAT_INTERVAL_MS = 10_000;

export type LockOperation = 'dev' | 'build' | 'deploy';
export type LockMode = 'shared' | 'exclusive';
export type LockState = 'starting' | 'ready' | 'running';

export interface DevLockInfo {
  schemaVersion: number;
  operation: LockOperation;
  mode: LockMode;
  state: LockState;
  pid: number;
  processStartedAt: number;
  port?: number;
  host?: string;
  urls?: string[];
  appDirectory: string;
  allowMultiple?: boolean;
  heartbeatAt?: number;
  /**
   * Runtime-only (never written to disk): whether the holder's identity was
   * verified via its real process start time. When false, kill suggestions
   * must be softened — the pid could belong to an unrelated process.
   */
  identityVerified?: boolean;
}

export type DevLockErrorCode =
  | 'EDEV_SERVER_RUNNING'
  | 'EDEV_BLOCKED_BY_BUILD'
  | 'EBUILD_BLOCKED_BY_DEV'
  | 'EBUILD_IN_PROGRESS'
  | 'EUNSUPPORTED_LEASE'
  | 'EDEVLOCK_BUSY';

export interface DevLockInstance {
  pid: number;
  operation: LockOperation;
  mode: LockMode;
  port?: number;
  urls?: string[];
  startedAt: number;
  appDirectory: string;
  /** Whether the pid's real start time confirmed the holder's identity. */
  identityVerified: boolean;
}

export class DevServerLockError extends Error {
  code: DevLockErrorCode;
  instances: DevLockInstance[];

  constructor(
    code: DevLockErrorCode,
    message: string,
    instances: DevLockInstance[] = [],
  ) {
    super(message);
    this.name = 'DevServerLockError';
    this.code = code;
    this.instances = instances;
  }
}

export const isDevServerLockError = (err: unknown): err is DevServerLockError =>
  err instanceof Error && err.name === 'DevServerLockError';

export const getLockDirectory = (appDirectory: string, metaName: string) =>
  path.join(appDirectory, 'node_modules', '.cache', metaName, 'locks', 'v1');

/** dev|start share the dev semantics; anything else does not take a lock. */
export const normalizeLockOperation = (
  command: string | undefined,
): LockOperation | null => {
  if (command === 'dev' || command === 'start' || command === 'dev-worker') {
    return 'dev';
  }
  if (command === 'build') {
    return 'build';
  }
  if (command === 'deploy') {
    return 'deploy';
  }
  return null;
};

const selfStartedAt = () => Date.now() - process.uptime() * 1000;

const isProcessAlive = (pid: number): boolean => {
  // A process asking about itself is alive by definition; this also keeps
  // sandboxes that guard `process.kill` on the own pid out of the picture.
  if (pid === process.pid) {
    return true;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM means the process exists but belongs to someone else.
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
};

/**
 * Best-effort process start time for PID-reuse detection. Returns null when
 * the platform offers no cheap way to read it (Windows), in which case
 * liveness alone decides and stale-lock handling stays fail-safe.
 */
const getProcessStartTime = (pid: number): number | null => {
  try {
    if (process.platform === 'linux') {
      // /proc/<pid> is created when the process starts.
      return fs.statSync(`/proc/${pid}`).ctimeMs;
    }
    if (process.platform === 'darwin') {
      const out = execSync(`ps -o lstart= -p ${pid}`, {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
      if (out) {
        const parsed = Date.parse(out);
        return Number.isNaN(parsed) ? null : parsed;
      }
    }
  } catch {
    // fall through
  }
  return null;
};

const identityMatches = (pid: number, recordedStartedAt: number): boolean => {
  if (!isProcessAlive(pid)) {
    return false;
  }
  const actual = getProcessStartTime(pid);
  if (actual === null) {
    // No start-time source on this platform: liveness is all we have.
    return true;
  }
  return Math.abs(actual - recordedStartedAt) <= START_TIME_TOLERANCE_MS;
};

const atomicWrite = (filePath: string, data: string) => {
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, filePath);
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface MutexOwner {
  pid: number;
  processStartedAt: number;
  token: string;
  acquiredAt: number;
}

const MUTEX_DIR_NAME = '.mutex';
const TOMBSTONE_PREFIX = '.stale-';
const CANDIDATE_PREFIX = '.mutex-candidate-';
// A mutex detached by its owner on release. Unlike a tombstone it no longer
// occupies a name any waiter can rename onto, so it is always safe to sweep.
const RELEASE_PREFIX = '.mutex-release-';

// Internal override so tests do not have to wait the full deadline.
const mutexWaitTotalMs = () => {
  const fromEnv = Number(process.env.MODERN_DEV_LOCK_MUTEX_WAIT_MS);
  return Number.isFinite(fromEnv) && fromEnv > 0
    ? fromEnv
    : MUTEX_WAIT_TOTAL_MS;
};

const readMutexOwner = (mutexDir: string): MutexOwner | null => {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(mutexDir, 'owner.json'), 'utf-8'),
    );
  } catch {
    return null;
  }
};

const renameQuietly = (from: string, to: string): void => {
  try {
    fs.renameSync(from, to);
  } catch {
    // ENOENT: another waiter already took it over. EEXIST/ENOTEMPTY: the
    // tombstone for this owner already exists, so this late rename is the
    // exact race the deterministic target name is there to stop — either
    // way the current `.mutex` (with its new owner) is left untouched.
  }
};

/**
 * Sweep candidate directories left behind by dead processes.
 *
 * Token tombstones (`.stale-<token>`) are deliberately never collected: a
 * waiter suspended for an arbitrary time may still hold a pre-suspension
 * read of a long-dead owner, and the tombstone occupying that exact target
 * name is the only thing preventing it from renaming the *current* holder's
 * mutex away. They are tiny and only ever created by abnormal takeovers.
 */
const cleanMutexDebris = (lockDir: string): void => {
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(lockDir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.startsWith(RELEASE_PREFIX)) {
      // Detached by a releaser that died before deleting it. Nothing can
      // reach it any more, so it is unconditionally collectible — and a
      // failed sweep must never abort the acquisition that triggered it.
      try {
        fs.rmSync(path.join(lockDir, entry), { recursive: true, force: true });
      } catch {
        // Left for the next sweep.
      }
      continue;
    }
    if (!entry.startsWith(CANDIDATE_PREFIX)) {
      continue;
    }
    const full = path.join(lockDir, entry);
    try {
      const owner = readMutexOwner(full);
      if (owner) {
        if (!identityMatches(owner.pid, owner.processStartedAt)) {
          fs.rmSync(full, { recursive: true, force: true });
        }
        continue;
      }
      // No owner.json yet: the creator may be alive between mkdir and the
      // owner write. The candidate name embeds its creator's pid — only
      // remove once that process is provably gone (or, for unparsable
      // names, after a generous grace period).
      const pidFromName = Number.parseInt(
        entry.slice(CANDIDATE_PREFIX.length),
        10,
      );
      if (Number.isInteger(pidFromName) && pidFromName > 0) {
        if (!isProcessAlive(pidFromName)) {
          fs.rmSync(full, { recursive: true, force: true });
        }
      } else if (Date.now() - fs.statSync(full).mtimeMs > BAD_JSON_GRACE_MS) {
        fs.rmSync(full, { recursive: true, force: true });
      }
    } catch {
      // debris cleanup is best-effort
    }
  }
};

/**
 * Cross-process critical section. Acquisition publishes a fully-populated
 * candidate directory and atomically renames it to the fixed `.mutex` path —
 * a rename onto an existing non-empty directory fails, so winning the rename
 * is winning the mutex, and a published mutex always carries a complete
 * `owner.json` (there is no created-but-not-yet-written window).
 *
 * The only condition that allows taking over someone else's mutex is proof
 * that its owner is dead; the takeover is itself an atomic rename to a
 * tombstone whose name is derived from the dead owner's token, so among
 * concurrent waiters exactly one wins and a late waiter cannot displace the
 * next owner's mutex. A live owner is waited on and, past the deadline,
 * reported as busy — never broken, no matter how long it has been holding.
 *
 * Exported for tests only.
 */
export const acquireRegistryMutex = async (
  lockDir: string,
): Promise<string> => {
  const mutexDir = path.join(lockDir, MUTEX_DIR_NAME);
  const token = `${process.pid}-${Math.random().toString(36).slice(2)}`;
  const candidate = path.join(lockDir, `${CANDIDATE_PREFIX}${token}`);
  const deadline = Date.now() + mutexWaitTotalMs();
  let delay = 50;

  cleanMutexDebris(lockDir);

  for (;;) {
    // Preparing the candidate only touches paths we own — any failure here
    // (read-only cache dir, ENOSPC, …) is a real IO error and must surface
    // immediately instead of degenerating into a busy retry loop.
    try {
      fs.mkdirSync(candidate, { recursive: true });
      const owner: MutexOwner = {
        pid: process.pid,
        processStartedAt: selfStartedAt(),
        token,
        acquiredAt: Date.now(),
      };
      atomicWrite(path.join(candidate, 'owner.json'), JSON.stringify(owner));
    } catch (err) {
      fs.rmSync(candidate, { recursive: true, force: true });
      throw err;
    }

    try {
      fs.renameSync(candidate, mutexDir);
      return token;
    } catch (err) {
      fs.rmSync(candidate, { recursive: true, force: true });
      const code = (err as NodeJS.ErrnoException).code;
      // An occupied rename target reads differently per platform
      // (EEXIST/ENOTEMPTY on POSIX, EPERM/EACCES on Windows); anything else
      // is a real IO error and must surface.
      if (
        code !== 'EEXIST' &&
        code !== 'ENOTEMPTY' &&
        code !== 'EPERM' &&
        code !== 'EACCES'
      ) {
        throw err;
      }
    }

    const owner = readMutexOwner(mutexDir);
    if (owner) {
      if (!identityMatches(owner.pid, owner.processStartedAt)) {
        renameQuietly(
          mutexDir,
          path.join(lockDir, `${TOMBSTONE_PREFIX}${owner.token}`),
        );
        continue;
      }
    } else {
      // A published mutex always contains owner.json, so a missing or
      // unreadable one can only come from manual damage or an old layout.
      // Grace it briefly, then take it over via a deterministic tombstone.
      // A vanished mutex (stat failure) falls through to the normal
      // deadline/backoff path — never into a hot spin.
      try {
        const mtime = fs.statSync(mutexDir).mtimeMs;
        if (Date.now() - mtime > BAD_JSON_GRACE_MS) {
          renameQuietly(
            mutexDir,
            path.join(
              lockDir,
              `${TOMBSTONE_PREFIX}corrupt-${Math.floor(mtime)}`,
            ),
          );
          continue;
        }
      } catch {
        // fall through to deadline check + backoff
      }
    }

    if (Date.now() >= deadline) {
      throw new DevServerLockError(
        'EDEVLOCK_BUSY',
        'Another Modern.js process is checking this project, please retry shortly.',
      );
    }
    await sleep(delay);
    delay = Math.min(delay * 1.5, 500);
  }
};

/** Exported for tests only. */
export const releaseRegistryMutex = (lockDir: string, token: string): void => {
  const mutexDir = path.join(lockDir, MUTEX_DIR_NAME);
  const owner = readMutexOwner(mutexDir);
  if (!owner || owner.token !== token) {
    // Either the mutex changed hands (we were declared dead) or it is being
    // handed over right now, so its owner is momentarily unreadable. Neither
    // is ours to delete.
    return;
  }

  // Detach under our own name before deleting. A recursive delete of the
  // shared path removes `owner.json` first and only then the directory, and
  // a waiter may rename its complete candidate onto that momentarily empty
  // directory — the trailing rmdir would fail with ENOTEMPTY and take files
  // from the new owner with it. A rename is atomic: either we move the whole
  // directory out of the shared name, or we never touch it.
  const detached = path.join(lockDir, `${RELEASE_PREFIX}${token}`);
  try {
    fs.renameSync(mutexDir, detached);
  } catch {
    // Taken over or already gone between the read and the rename; whatever
    // occupies the shared name now belongs to someone else.
    return;
  }

  try {
    fs.rmSync(detached, { recursive: true, force: true });
  } catch {
    // The mutex is already released — the shared name is free. Failing to
    // delete the detached copy must not surface as an error from the command
    // that was holding it; `cleanMutexDebris` collects it on the next acquire.
  }
};

const acquireMutex = acquireRegistryMutex;
const releaseMutex = releaseRegistryMutex;

const toInstance = (lock: DevLockInfo): DevLockInstance => ({
  pid: lock.pid,
  operation: lock.operation,
  mode: lock.mode,
  port: lock.port,
  urls: lock.urls,
  startedAt: lock.processStartedAt,
  appDirectory: lock.appDirectory,
  identityVerified: lock.identityVerified === true,
});

/**
 * Enumerate lock files, delete stale ones, and return the live locks held by
 * other processes plus (when present) our own lock for hot-restart reuse.
 */
const collectLiveLocks = async (lockDir: string) => {
  const others: DevLockInfo[] = [];
  let self: DevLockInfo | undefined;

  let entries: string[] = [];
  try {
    entries = fs.readdirSync(lockDir);
  } catch {
    return { others, self };
  }

  for (const entry of entries) {
    if (!entry.endsWith('.lock')) {
      continue;
    }
    const filePath = path.join(lockDir, entry);

    let lock: DevLockInfo;
    try {
      lock = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      try {
        if (Date.now() - fs.statSync(filePath).mtimeMs > BAD_JSON_GRACE_MS) {
          fs.rmSync(filePath, { force: true });
        }
      } catch {
        // already gone
      }
      continue;
    }

    if (typeof lock.schemaVersion !== 'number' || !lock.pid) {
      fs.rmSync(filePath, { force: true });
      continue;
    }
    if (lock.schemaVersion > LOCK_SCHEMA_VERSION) {
      // Written by a newer CLI: never delete what we cannot understand.
      throw new DevServerLockError(
        'EUNSUPPORTED_LEASE',
        `Found a lock file written by a newer version of the CLI (${filePath}). Upgrade this CLI, or remove the file manually if you are sure no other process is running.`,
        [toInstance(lock)],
      );
    }

    if (
      lock.pid === process.pid &&
      Math.abs(lock.processStartedAt - selfStartedAt()) <=
        START_TIME_TOLERANCE_MS
    ) {
      self = lock;
      continue;
    }

    if (!isProcessAlive(lock.pid)) {
      logger.debug(`[dev-lock] removing stale lock ${filePath}`);
      fs.rmSync(filePath, { force: true });
      continue;
    }

    const actualStartTime = getProcessStartTime(lock.pid);
    if (
      actualStartTime !== null &&
      Math.abs(actualStartTime - lock.processStartedAt) >
        START_TIME_TOLERANCE_MS
    ) {
      // The pid was reused by an unrelated process.
      logger.debug(`[dev-lock] removing pid-reused lock ${filePath}`);
      fs.rmSync(filePath, { force: true });
      continue;
    }

    // A lock whose pid is alive is kept on every platform — fail-safe.
    // During a config hot restart the server closes before CLI init
    // re-runs, so for a short window a live dev has no listening port;
    // any port-based "is it really serving" heuristic would delete the
    // lock in exactly that window and let a concurrent build wipe the
    // dev's output. Where no start-time source exists (Windows) this can
    // keep a pid-reused lock around until a human checks — a conservative
    // block, never a false green light.
    lock.identityVerified = actualStartTime !== null;
    others.push(lock);
  }

  return { others, self };
};

const decideConflict = (
  op: LockOperation,
  allowMultiple: boolean,
  others: DevLockInfo[],
): DevServerLockError | null => {
  const exclusive = others.filter(lock => lock.mode === 'exclusive');
  const shared = others.filter(lock => lock.mode === 'shared');

  if (op === 'dev') {
    if (exclusive.length > 0) {
      return new DevServerLockError(
        'EDEV_BLOCKED_BY_BUILD',
        'A build/deploy is currently writing the output of this project.',
        exclusive.map(toInstance),
      );
    }
    if (shared.length > 0 && !allowMultiple) {
      return new DevServerLockError(
        'EDEV_SERVER_RUNNING',
        'Another dev server is already running for this project.',
        shared.map(toInstance),
      );
    }
    return null;
  }

  // build / deploy
  if (exclusive.length > 0) {
    return new DevServerLockError(
      'EBUILD_IN_PROGRESS',
      'Another build/deploy is already running for this project.',
      exclusive.map(toInstance),
    );
  }
  if (shared.length > 0) {
    return new DevServerLockError(
      'EBUILD_BLOCKED_BY_DEV',
      'A dev server is running for this project; stop it before building.',
      shared.map(toInstance),
    );
  }
  return null;
};

// ---- per-process session (heartbeat + exit cleanup, hot-restart safe) ----

interface DevLockSession {
  lockDir: string;
  lockFile: string;
  current?: DevLockInfo;
  heartbeat?: ReturnType<typeof setInterval>;
}

const sessions = new Map<string, DevLockSession>();
let exitHookInstalled = false;

const sessionKey = (appDirectory: string, metaName: string) =>
  `${appDirectory} ${metaName}`;

const writeLockFile = (session: DevLockSession, lock: DevLockInfo) => {
  session.current = lock;
  atomicWrite(session.lockFile, JSON.stringify(lock, null, 2));
};

const removeOwnLock = (session: DevLockSession) => {
  stopHeartbeat(session);
  session.current = undefined;
  try {
    // Only ever delete our own <pid>.lock; identity re-check is implicit in
    // the filename (pid) plus the fact that we wrote it in this process.
    fs.rmSync(session.lockFile, { force: true });
  } catch {
    // best-effort
  }
};

const stopHeartbeat = (session: DevLockSession) => {
  if (session.heartbeat) {
    clearInterval(session.heartbeat);
    session.heartbeat = undefined;
  }
};

const startHeartbeat = (session: DevLockSession) => {
  stopHeartbeat(session);
  session.heartbeat = setInterval(() => {
    if (session.current) {
      try {
        writeLockFile(session, {
          ...session.current,
          heartbeatAt: Date.now(),
        });
      } catch {
        // best-effort
      }
    }
  }, HEARTBEAT_INTERVAL_MS);
  // Never keep the process alive just for the heartbeat.
  session.heartbeat.unref?.();
};

const installExitHook = () => {
  if (exitHookInstalled) {
    return;
  }
  exitHookInstalled = true;
  process.on('exit', () => {
    for (const session of sessions.values()) {
      removeOwnLock(session);
    }
  });
};

export interface AcquireOptions {
  appDirectory: string;
  metaName: string;
  operation: LockOperation;
  allowMultiple?: boolean;
}

/**
 * Check existing locks and register our own, atomically (inside the registry
 * mutex). Throws DevServerLockError on conflict. Re-entry from the same
 * process (config hot restart) reuses the existing lock file.
 */
export const acquireCommandLock = async ({
  appDirectory,
  metaName,
  operation,
  allowMultiple = false,
}: AcquireOptions): Promise<void> => {
  const lockDir = getLockDirectory(appDirectory, metaName);
  fs.mkdirSync(lockDir, { recursive: true });

  const key = sessionKey(appDirectory, metaName);
  let session = sessions.get(key);
  if (!session) {
    session = {
      lockDir,
      lockFile: path.join(lockDir, `${process.pid}.lock`),
    };
    sessions.set(key, session);
  }
  installExitHook();

  const token = await acquireMutex(lockDir);
  try {
    const { others, self } = await collectLiveLocks(lockDir);

    // A hot restart re-enters without the original CLI/run intent; the
    // privilege granted at the first acquire is persisted in our own lock
    // file, so a multi-instance dev survives config restarts.
    const effectiveAllowMultiple =
      allowMultiple ||
      (self?.operation === 'dev' && self.allowMultiple === true);

    const conflict = decideConflict(operation, effectiveAllowMultiple, others);
    if (conflict) {
      throw conflict;
    }

    const mode: LockMode = operation === 'dev' ? 'shared' : 'exclusive';
    const state: LockState = operation === 'dev' ? 'starting' : 'running';
    writeLockFile(session, {
      // Hot restart in the same process: reuse (rewrite) our existing file.
      ...(self ?? {}),
      schemaVersion: LOCK_SCHEMA_VERSION,
      operation,
      mode,
      state,
      pid: process.pid,
      processStartedAt: selfStartedAt(),
      appDirectory,
      allowMultiple: operation === 'dev' ? effectiveAllowMultiple : undefined,
      heartbeatAt: Date.now(),
    });
    startHeartbeat(session);
  } finally {
    releaseMutex(lockDir, token);
  }
};

/** dev only: fill in the real port/urls once `server.listen` succeeded. */
export const markDevLockReady = (
  appDirectory: string,
  metaName: string,
  info: { port?: number; host?: string; urls?: string[] },
): void => {
  const session = sessions.get(sessionKey(appDirectory, metaName));
  if (!session?.current) {
    return;
  }
  try {
    writeLockFile(session, {
      ...session.current,
      state: 'ready',
      port: info.port,
      host: info.host,
      urls: info.urls,
      heartbeatAt: Date.now(),
    });
  } catch (err) {
    // Losing the update downgrades protection but must not break dev itself.
    logger.warn(
      `[dev-lock] failed to update lock file, duplicate-instance protection is degraded: ${err}`,
    );
  }
};

/** Release the lock this process holds for the given operation, if any. */
export const releaseCommandLock = (
  appDirectory: string,
  metaName: string,
  operation?: LockOperation,
): void => {
  const session = sessions.get(sessionKey(appDirectory, metaName));
  if (!session) {
    return;
  }
  if (operation && session.current && session.current.operation !== operation) {
    return;
  }
  removeOwnLock(session);
};

/** Hot restart: keep the lock file, only dispose process-local resources. */
export const suspendForRestart = (
  appDirectory: string,
  metaName: string,
): void => {
  const session = sessions.get(sessionKey(appDirectory, metaName));
  if (session) {
    stopHeartbeat(session);
  }
};

export const releaseAllLocks = (): void => {
  for (const session of sessions.values()) {
    removeOwnLock(session);
  }
};

// ---- run-scoped intent (typed run options → guard plugin) ----

export interface DevLockIntent {
  allowMultiple?: boolean;
}

// Keyed by appDirectory so concurrent runs against different apps in one
// process cannot cross-pollinate. The entry lives only for the duration of
// the `run()` invocation that set it (cleared in its `finally`), so a stale
// `allowMultiple: true` can never leak into a later `cli.init()` for the
// same app. Hot restarts do not need this map: the privilege is persisted
// in the process's own lock file and re-applied on self re-entry.
const runIntents = new Map<string, DevLockIntent>();

export const setDevLockIntent = (
  appDirectory: string,
  intent: DevLockIntent,
): void => {
  runIntents.set(appDirectory, intent);
};

export const getDevLockIntent = (
  appDirectory: string,
): DevLockIntent | undefined => runIntents.get(appDirectory);

export const clearDevLockIntent = (appDirectory: string): void => {
  runIntents.delete(appDirectory);
};
