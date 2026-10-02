import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export type ReleaseFixtureLock = () => Promise<void>;

const pollInterval = 200;
const staleLockAge = 10 * 60 * 1000;

function resolveLockDir(fixtureDir: string) {
  const realPath = path.resolve(fixtureDir);
  const digest = crypto.createHash('sha1').update(realPath).digest('hex');

  return path.join(os.tmpdir(), `modernjs-fixture-${digest}.lock`);
}

export async function acquireFixtureLock(
  fixtureDir: string,
): Promise<ReleaseFixtureLock> {
  const lockDir = resolveLockDir(fixtureDir);

  while (true) {
    try {
      await fs.mkdir(lockDir);
      await fs.writeFile(
        path.join(lockDir, 'owner.json'),
        JSON.stringify({
          pid: process.pid,
          fixtureDir: path.resolve(fixtureDir),
          acquiredAt: new Date().toISOString(),
        }),
      );

      return async () => {
        await fs.rm(lockDir, { recursive: true, force: true });
      };
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }

      try {
        const stat = await fs.stat(lockDir);
        if (Date.now() - stat.mtimeMs > staleLockAge) {
          await fs.rm(lockDir, { recursive: true, force: true });
          continue;
        }
      } catch {
        continue;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

export async function acquireFixtureLocks(
  fixtureDirs: string[],
): Promise<ReleaseFixtureLock> {
  const releaseLocks: ReleaseFixtureLock[] = [];
  const sortedFixtureDirs = [
    ...new Set(fixtureDirs.map(dir => path.resolve(dir))),
  ].sort();

  try {
    for (const fixtureDir of sortedFixtureDirs) {
      releaseLocks.push(await acquireFixtureLock(fixtureDir));
    }
  } catch (error) {
    await Promise.allSettled(releaseLocks.reverse().map(release => release()));
    throw error;
  }

  return async () => {
    await Promise.allSettled(releaseLocks.reverse().map(release => release()));
  };
}
