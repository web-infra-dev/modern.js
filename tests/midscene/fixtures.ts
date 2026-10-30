import { spawn, type ChildProcess } from 'node:child_process';
import { cp, mkdir, mkdtemp, open, rm, symlink } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

export const fixtureNames = [
  'i18n/app-csr',
  'i18n/routes-csr',
  'i18n/custom-i18n-wrapper',
  'pure-esm-project',
  'ssr/fixtures/partial',
  'routes',
] as const;
const root = fileURLToPath(new URL('../../', import.meta.url));
const cli = path.join(
  root,
  'tests/node_modules/@modern-js/app-tools/bin/modern.js',
);

export class Fixtures {
  private running = new Map<string, Promise<string>>();
  private cleanups: (() => Promise<void>)[] = [];
  constructor(private signal?: AbortSignal) {}

  open(name: (typeof fixtureNames)[number], mode: 'dev' | 'build') {
    const key = `${name}-${mode}`;
    let pending = this.running.get(key);
    if (!pending) {
      pending = this.start(name, mode);
      this.running.set(key, pending);
    }
    return pending;
  }

  private async start(name: string, mode: 'dev' | 'build') {
    const output = path.join(root, 'tests/midscene/midscene_run');
    await mkdir(output, { recursive: true });
    const scratch = await mkdtemp(path.join(output, 'fixture-'));
    this.cleanups.push(() => rm(scratch, { recursive: true, force: true }));
    const source = path.join(root, 'tests/integration', name);
    const cwd = path.join(scratch, 'tests/integration', name);
    await cp(source, cwd, {
      recursive: true,
      filter: file =>
        ![
          'node_modules',
          'dist',
          '.modern-js',
          '.rsbuild',
          'tests',
          'test',
        ].includes(path.basename(file)) || file === source,
    });
    await symlink(
      path.join(source, 'node_modules'),
      path.join(cwd, 'node_modules'),
      'dir',
    );
    await symlink(
      path.join(root, 'tests/utils'),
      path.join(scratch, 'tests/utils'),
      'dir',
    );
    const server = createServer();
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('No fixture port');
    const port = address.port;
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve())),
    );
    const env: NodeJS.ProcessEnv = {};
    for (const key of ['PATH', 'HOME', 'TMPDIR', 'SYSTEMROOT', 'CI']) {
      if (process.env[key]) env[key] = process.env[key];
    }
    Object.assign(env, {
      PORT: String(port),
      BUNDLER: 'rspack',
      NODE_ENV: mode === 'dev' ? 'development' : 'production',
    });
    const log = await open(`${scratch}.log`, 'w');
    const launch = (command: string) => {
      const child = spawn(process.execPath, [cli, command], {
        cwd,
        env,
        detached: process.platform !== 'win32',
        stdio: ['ignore', log.fd, log.fd],
      });
      const closed = new Promise<void>((resolve, reject) => {
        child.once('error', reject);
        child.once('close', () => resolve());
      });
      // Attach a handler immediately, including while the HTTP probe is pending.
      void closed.catch(() => {});
      this.cleanups.push(async () => {
        if (child.exitCode === null && child.signalCode === null) {
          await this.kill(child);
        }
        await closed;
      });
      return { child, closed };
    };
    try {
      if (mode === 'build') {
        const { child, closed } = launch('build');
        await Promise.race([
          closed,
          delay(180_000, undefined, { signal: this.signal, ref: false }).then(
            () => {
              throw new Error(`Build timeout: ${scratch}.log`);
            },
          ),
        ]);
        if (child.exitCode !== 0)
          throw new Error(`Build failed: ${scratch}.log`);
      }
      const { child } = launch(mode === 'dev' ? 'dev' : 'serve');
      const url = `http://localhost:${port}`;
      const readyPath =
        name === 'ssr/fixtures/partial'
          ? '/one/a'
          : name === 'routes'
            ? '/four/user/profile'
            : '/';
      const deadline = Date.now() + 180_000;
      while (Date.now() < deadline) {
        this.signal?.throwIfAborted();
        if (!child.pid || child.exitCode !== null || child.signalCode !== null)
          throw new Error(`Fixture exited: ${scratch}.log`);
        try {
          const response = await fetch(new URL(readyPath, url), {
            signal: AbortSignal.timeout(2_000),
          });
          await response.body?.cancel();
          if (response.ok) return url;
        } catch {
          /* The fixture may still be compiling. */
        }
        await delay(1_000, undefined, { signal: this.signal });
      }
      throw new Error(`Fixture readiness timeout: ${scratch}.log`);
    } finally {
      await log.close();
    }
  }

  private async kill(child: ChildProcess) {
    if (!child.pid) return;
    if (process.platform === 'win32') {
      await new Promise<void>((resolve, reject) => {
        const killer = spawn('taskkill', [
          '/pid',
          String(child.pid),
          '/t',
          '/f',
        ]);
        killer.once('error', reject);
        killer.once('close', code =>
          code === 0 || code === 128
            ? resolve()
            : reject(new Error('Fixture cleanup failed')),
        );
      });
    } else {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
      }
    }
  }

  async close() {
    await Promise.allSettled(this.running.values());
    const errors: unknown[] = [];
    for (const cleanup of this.cleanups.reverse()) {
      try {
        await cleanup();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length)
      throw new AggregateError(errors, 'Fixture cleanup failed');
  }
}
