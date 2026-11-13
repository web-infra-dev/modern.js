import { AsyncLocalStorage } from 'node:async_hooks';
import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { createSSRUpdateServerPlugin } from './ssrUpdateServer';
import {
  shouldUpdateRemote,
  updateRemotes,
} from '../../../../runtime/plugin-runtime/src/mf/update';

const key = Symbol.for('modern-js.mf.ssr.update-manager');
const previous = (globalThis as any)[key];
afterEach(() => {
  (globalThis as any)[key] = previous;
  rs.restoreAllMocks();
});
const remote = {
  name: 'remote',
  entry: 'https://remote/mf-manifest.json',
  moduleInfo: { remoteEntry: 'a.js', buildVersion: 'a' },
};
function fixture(name: string, onReady = rs.fn()) {
  const prepare: Array<() => unknown> = [];
  const context: any = {
    routes: [{ entryName: 'main', isSSR: true }],
    ssrUpdateParticipants: [],
  };
  createSSRUpdateServerPlugin({ name, remotes: [remote], onReady }).setup({
    onPrepare: (callback: () => unknown) => prepare.push(callback),
    getServerContext: () => ({ ...context }),
    updateServerContext: (values: Record<string, unknown>) =>
      Object.assign(context, values),
  } as any);
  return {
    context,
    async init() {
      for (const callback of prepare) await callback();
    },
  };
}
describe('application-bound public update API', () => {
  it('binds single-application background APIs after resources are ready, and removes the binding on close', async () => {
    (globalThis as any)[key] = undefined;
    const onReady = rs.fn();
    const f = fixture('host', onReady);
    await f.init();
    await expect(shouldUpdateRemote(remote)).rejects.toThrow('No Modern SSR');
    const application = {
      status: { phase: 'serving' },
      close: async () => {},
      update: rs.fn(),
    };
    f.context.ssrApplication.onReady(application);
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onReady.mock.calls[0][0]).toBe(f.context.ssrUpdateManager);
    await expect(shouldUpdateRemote(remote)).resolves.toBe(false);
    await expect(updateRemotes([remote])).resolves.toMatchObject({
      changed: false,
    });
    expect(application.update).not.toHaveBeenCalled();
    await f.context.ssrUpdateManager.close();
    await expect(shouldUpdateRemote(remote)).rejects.toThrow('No Modern SSR');
  });
  it('uses request-local managers for simultaneous applications and rejects ambiguous background calls', async () => {
    (globalThis as any)[key] = {
      applications: new Map(),
      context: new AsyncLocalStorage(),
    };
    const a = fixture('a');
    const b = fixture('b');
    await a.init();
    await b.init();
    for (const f of [a, b])
      f.context.ssrApplication.onReady({
        status: { phase: 'serving' },
        close: async () => {},
        update: rs.fn(),
      });
    await expect(shouldUpdateRemote(remote)).rejects.toThrow('Multiple SSR');
    await expect(
      shouldUpdateRemote(remote, { application: 'a' }),
    ).resolves.toBe(false);
    const checks = [a, b].map(f =>
      f.context.ssrApplication.run(async () => {
        await Promise.resolve();
        expect((globalThis as any)[key].context.getStore()).toBe(
          f.context.ssrUpdateManager,
        );
        return shouldUpdateRemote(remote);
      }),
    );
    expect(await Promise.all(checks)).toEqual([false, false]);
    await Promise.all([a, b].map(f => f.context.ssrUpdateManager.close()));
  });
  it('keeps same-name service managers distinct and rejects ambiguous explicit names', async () => {
    (globalThis as any)[key] = undefined;
    const a = fixture('same');
    const b = fixture('same');
    await a.init();
    await b.init();
    expect(a.context.ssrUpdateOwnerId).not.toBe(b.context.ssrUpdateOwnerId);
    for (const f of [a, b])
      f.context.ssrApplication.onReady({
        status: { phase: 'serving' },
        close: async () => {},
        update: rs.fn(),
      });
    await expect(shouldUpdateRemote(remote)).rejects.toThrow('Multiple SSR');
    await expect(
      shouldUpdateRemote(remote, { application: 'same' }),
    ).rejects.toThrow("Multiple SSR applications are named 'same'");
    for (const f of [a, b])
      await f.context.ssrApplication.run(async () => {
        expect((globalThis as any)[key].context.getStore()).toBe(
          f.context.ssrUpdateManager,
        );
        await expect(shouldUpdateRemote(remote)).resolves.toBe(false);
      });
    await a.context.ssrUpdateManager.close();
    await expect(
      shouldUpdateRemote(remote, { application: 'same' }),
    ).resolves.toBe(false);
    await b.context.ssrUpdateManager.close();
  });
  it('awaits local refresh participant invalidation and prepare, then disposes all participants despite errors', async () => {
    (globalThis as any)[key] = undefined;
    const cleanup = rs.fn();
    const f = fixture(
      'host',
      rs.fn(() => cleanup),
    );
    await f.init();
    const events: string[] = [];
    f.context.ssrUpdateParticipants.push(
      {
        invalidate: () => {
          events.push('invalidate');
        },
        prepare: () => {
          events.push('prepare');
        },
        dispose: () => {
          events.push('dispose-one');
          throw new Error('cleanup failed');
        },
      },
      {
        invalidate: () => {},
        dispose: () => {
          events.push('dispose-two');
        },
      },
    );
    f.context.ssrApplication.onReady({
      status: { phase: 'serving' },
      close: async () => {},
      update: async (invalidate: () => Promise<void>) => {
        await invalidate();
        await f.context.ssrApplication.validate({ templates: {} });
        events.push('published');
        return 2;
      },
    });
    await expect(
      f.context.ssrUpdateManager.refresh(() => {
        events.push('clear-local');
      }),
    ).resolves.toBe(2);
    expect(events).toEqual([
      'clear-local',
      'invalidate',
      'prepare',
      'published',
    ]);
    await expect(f.context.ssrUpdateManager.close()).rejects.toThrow(
      'cleanup failed',
    );
    expect(events).toContain('dispose-one');
    expect(events).toContain('dispose-two');
    expect(cleanup).toHaveBeenCalledTimes(1);
    await expect(shouldUpdateRemote(remote)).rejects.toThrow('No Modern SSR');
  });
  it('retains synchronous after-response receipts and rejects plain awaited updates inside the owning request', async () => {
    (globalThis as any)[key] = undefined;
    const f = fixture('host');
    await f.init();
    let pending: (() => Promise<any>) | undefined;
    const application = {
      status: { phase: 'serving' },
      close: async () => {},
      assertUpdateAllowed: () => {
        throw new Error('request being drained');
      },
      defer: (operation: () => Promise<any>) => {
        pending = operation;
        return { completed: new Promise(() => {}) };
      },
      update: rs.fn(),
    };
    f.context.ssrApplication.onReady(application);
    const receipt = updateRemotes([remote], { defer: 'after-response' });
    expect(receipt).toMatchObject({ phase: 'scheduled' });
    expect(receipt).not.toHaveProperty('then');
    expect(pending).toBeTypeOf('function');
    await expect(updateRemotes([remote])).rejects.toThrow(
      'request being drained',
    );
    await f.context.ssrUpdateManager.close();
  });
});

it('stops notifications and waits for local publication before disposing participants', async () => {
  (globalThis as any)[key] = undefined;
  const events: string[] = [];
  let finishRefresh!: () => void;
  const publication = new Promise<number>(resolve => {
    finishRefresh = () => resolve(2);
  });
  const f = fixture(
    'host',
    rs.fn(() => async () => {
      events.push('stop-watcher');
    }),
  );
  await f.init();
  f.context.ssrUpdateParticipants.push({
    invalidate: () => {},
    dispose: () => {
      events.push('dispose');
    },
  });
  f.context.ssrApplication.onReady({
    status: { phase: 'serving' },
    close: async () => {},
    update: () => publication,
  });
  const refresh = f.context.ssrUpdateManager.refresh(() => {});
  const close = f.context.ssrUpdateManager.close();
  await Promise.resolve();
  await Promise.resolve();
  expect(events).toEqual(['stop-watcher']);
  finishRefresh();
  await refresh;
  await close;
  expect(events).toEqual(['stop-watcher', 'dispose']);
});

it('does not dispose live resources after drain timeout and permits a later close retry', async () => {
  (globalThis as any)[key] = undefined;
  const f = fixture('host');
  await f.init();
  const dispose = rs.fn();
  f.context.ssrUpdateParticipants.push({ invalidate: () => {}, dispose });
  const close = rs
    .fn()
    .mockRejectedValueOnce(new Error('drain timed out'))
    .mockResolvedValue(undefined);
  f.context.ssrApplication.onReady({
    status: { phase: 'serving' },
    close,
    update: rs.fn(),
  });
  await expect(f.context.ssrUpdateManager.close()).rejects.toThrow(
    'drain timed out',
  );
  expect(dispose).not.toHaveBeenCalled();
  await f.context.ssrUpdateManager.close();
  expect(dispose).toHaveBeenCalledTimes(1);
});
