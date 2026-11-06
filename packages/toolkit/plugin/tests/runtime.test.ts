import { createAsyncInterruptHook, createSyncHook } from '../src/hooks';
import { createRuntime } from '../src/runtime/run/create';
import type { RuntimePluginAPI } from '../src/types/runtime/api';
import type { RuntimePlugin } from '../src/types/runtime/plugin';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(complete => {
    resolve = complete;
  });
  return { promise, resolve };
};

it('keeps synchronous registration and configuration available immediately', async () => {
  const calls: string[] = [];
  const { runtimeContext: runtime } = createRuntime().run({
    config: { value: 'user' },
    plugins: [
      {
        name: 'sync',
        setup(api: RuntimePluginAPI<any>) {
          calls.push('setup');
          api.config(() => {
            calls.push('config');
            return { value: 'plugin', extra: true };
          });
        },
      },
    ],
  });
  expect(calls).toEqual(['setup', 'config']);
  expect(runtime.config).toEqual({ value: 'user', extra: true });
  await runtime.ready;
});

it('awaits dependency-ordered setup and setup result processing before config', async () => {
  const gate = deferred();
  const calls: string[] = [];
  const { runtimeContext: runtime } = createRuntime().run({
    config: {},
    plugins: [
      {
        name: 'consumer',
        pre: ['source'],
        setup(api: RuntimePluginAPI<any>) {
          calls.push(`consumer:${api.getRuntimeContext().source}`);
        },
      },
      {
        name: 'source',
        async setup(api: RuntimePluginAPI<any>) {
          calls.push('source:start');
          await gate.promise;
          api.updateRuntimeContext({ source: 'ready' });
          api.config(() => {
            calls.push('config');
            return {};
          });
          calls.push('source:end');
        },
      },
    ],
    async handleSetupResult() {
      calls.push('result');
    },
  });
  expect(calls).toEqual(['source:start']);
  gate.resolve();
  await runtime.ready;
  expect(calls).toEqual([
    'source:start',
    'source:end',
    'result',
    'consumer:ready',
    'result',
    'config',
  ]);
});

it('uses one canonical context while preserving deep merge without binding patches', async () => {
  const canonical = { data: { before: true } };
  const patch = { data: { after: true }, nested: { value: 'original' } };
  let api!: RuntimePluginAPI<any>;
  let read!: () => unknown;
  const { runtimeContext: runtime } = createRuntime().run({
    runtimeContext: canonical,
    config: {},
    plugins: [
      {
        name: 'context',
        _registryApi(getContext) {
          read = getContext;
          return {};
        },
        setup(value: RuntimePluginAPI<any>) {
          api = value;
        },
      },
    ],
  });
  expect(runtime.runtimeContext).toBe(canonical);
  expect(read()).toBe(canonical);
  expect(api.getRuntimeContext()).toBe(canonical);
  api.updateRuntimeContext(patch);
  expect(canonical).toEqual({
    data: { before: true, after: true },
    nested: { value: 'original' },
  });
  patch.nested.value = 'changed';
  expect(api.getRuntimeContext().nested.value).toBe('original');
  expect(api.getRuntimeContext()._internalContext).toBe(runtime);
  expect(JSON.stringify(canonical)).toBe(
    '{"data":{"before":true,"after":true},"nested":{"value":"original"}}',
  );
  const items = [{ value: 'original' }];
  const service = { init() {}, value: 'original' };
  const references = { items, service };
  api.updateRuntimeContext(references);
  expect(api.getRuntimeContext().items).toBe(items);
  expect(api.getRuntimeContext().service).toBe(service);
  items.push({ value: 'added' });
  service.value = 'changed';
  expect(api.getRuntimeContext().items).toEqual([
    { value: 'original' },
    { value: 'added' },
  ]);
  expect(api.getRuntimeContext().service.value).toBe('changed');
  references.items = [];
  references.service = { init() {}, value: 'replacement' };
  expect(api.getRuntimeContext().items).toBe(items);
  expect(api.getRuntimeContext().service).toBe(service);
  await runtime.ready;
});

it('isolates reused plugin hook definitions and nested runtime registration', async () => {
  const extension = createSyncHook<(value: string[]) => string[]>();
  extension.tap(values => [...values, 'static']);
  let count = 0;
  const engine = createRuntime<any>();
  const plugin: RuntimePlugin<any> = {
    name: 'shared-definition',
    registryHooks: { extension },
    setup(api) {
      const id = ++count;
      api.extension((values: string[]) => [...values, String(id)]);
      if (id === 1) engine.run({ config: {}, plugins: [] });
    },
  };
  const first = engine.run({ config: {}, plugins: [plugin] }).runtimeContext;
  const second = engine.run({ config: {}, plugins: [plugin] }).runtimeContext;
  await Promise.all([first.ready, second.ready]);
  expect(first.hooks.extension.call([])).toEqual(['static', '1']);
  expect(second.hooks.extension.call([])).toEqual(['static', '2']);
  expect(extension.call([])).toEqual(['static']);
});

it('creates custom extension hooks for each runtime through a registry factory', () => {
  let factories = 0;
  const plugin: RuntimePlugin<any> = {
    name: 'factory',
    registryHooks() {
      factories++;
      const callbacks: Array<() => string> = [];
      return {
        custom: {
          tap: (cb: () => string) => {
            callbacks.push(cb);
          },
          call: () => callbacks.map(cb => cb()),
        },
      };
    },
    setup(api) {
      api.custom(() => `instance:${factories}`);
    },
  };
  const engine = createRuntime<any>();
  const first = engine.run({ config: {}, plugins: [plugin] }).runtimeContext;
  const second = engine.run({ config: {}, plugins: [plugin] }).runtimeContext;
  expect(factories).toBe(2);
  expect(first.hooks.custom).not.toBe(second.hooks.custom);
  expect(first.hooks.custom.call()).toHaveLength(1);
  expect(second.hooks.custom.call()).toHaveLength(1);
});

it('supports detached cleanup methods and releases registrations once in reverse order', () => {
  const calls: number[] = [];
  let api!: RuntimePluginAPI<any>;
  const runtime = createRuntime().run({
    config: {},
    plugins: [
      {
        name: 'cleanup',
        setup(value: RuntimePluginAPI<any>) {
          api = value;
          api.onDispose(() => calls.push(1));
          api.onDispose(() => calls.push(2));
        },
      },
    ],
  }).runtimeContext;
  const { dispose } = runtime;
  const onDispose = api.onDispose;
  expect(runtime.disposed).toBe(false);
  dispose();
  runtime.dispose();
  onDispose(() => calls.push(3));
  expect(runtime.disposed).toBe(true);
  expect(calls).toEqual([2, 1, 3]);
});

it('runs all cleanup callbacks even when one fails', () => {
  const calls: string[] = [];
  const runtime = createRuntime().run({
    config: {},
    plugins: [
      {
        name: 'cleanup',
        setup(api: RuntimePluginAPI<any>) {
          api.onDispose(() => calls.push('first'));
          api.onDispose(() => {
            throw new Error('cleanup');
          });
          api.onDispose(() => calls.push('last'));
        },
      },
    ],
  }).runtimeContext;
  expect(() => runtime.dispose()).toThrow('Runtime cleanup failed');
  expect(() => runtime.dispose()).not.toThrow();
  expect(calls).toEqual(['last', 'first']);
});

it('stops setup after disposal and immediately releases late resources', async () => {
  const gate = deferred();
  const calls: string[] = [];
  const runtime = createRuntime().run({
    config: {},
    plugins: [
      {
        name: 'pending',
        async setup(api: RuntimePluginAPI<any>) {
          api.onDispose(() => calls.push('early-cleanup'));
          await gate.promise;
          api.onDispose(() => calls.push('late-cleanup'));
        },
      },
      {
        name: 'never',
        setup() {
          calls.push('next-setup');
        },
      },
    ],
  }).runtimeContext;
  runtime.dispose();
  gate.resolve();
  await expect(runtime.ready).rejects.toThrow('disposed during setup');
  expect(calls).toEqual(['early-cleanup', 'late-cleanup']);
});

it('propagates async setup errors and releases initialized resources', async () => {
  const error = new Error('setup failure');
  const calls: string[] = [];
  const runtime = createRuntime().run({
    config: {},
    plugins: [
      {
        name: 'failure',
        async setup(api: RuntimePluginAPI<any>) {
          api.onDispose(() => calls.push('cleanup'));
          throw error;
        },
      },
      {
        name: 'never',
        setup() {
          calls.push('next');
        },
      },
    ],
  }).runtimeContext;
  await expect(runtime.ready).rejects.toBe(error);
  expect(calls).toEqual(['cleanup']);
});

it('preserves synchronous setup failure and cleans up prior registrations', () => {
  const calls: string[] = [];
  expect(() =>
    createRuntime().run({
      config: {},
      plugins: [
        {
          name: 'failure',
          setup(api: RuntimePluginAPI<any>) {
            api.onDispose(() => calls.push('cleanup'));
            throw new Error('sync failure');
          },
        },
      ],
    }),
  ).toThrow('sync failure');
  expect(calls).toEqual(['cleanup']);
});

it('distinguishes interrupt(undefined) from a completed context pipeline', async () => {
  const hook =
    createAsyncInterruptHook<
      (context: object, interrupt: (value: unknown) => void) => unknown
    >();
  const context = {};
  hook.tap(async (_, interrupt) => {
    await Promise.resolve();
    interrupt(undefined);
  });
  hook.tap(() => {
    throw new Error('must not continue');
  });
  expect(await hook.callWithResult(context)).toEqual({
    value: undefined,
    interrupted: true,
  });
  expect(await hook.call(context)).toBeUndefined();
  const complete =
    createAsyncInterruptHook<
      (context: object, interrupt: (value: unknown) => void) => unknown
    >();
  expect(await complete.callWithResult(context)).toEqual({
    value: context,
    interrupted: false,
  });
});

it('preserves response interrupt identity and async hook rejection', async () => {
  const response = new Response(null, {
    status: 302,
    headers: { location: '/next' },
  });
  const hook =
    createAsyncInterruptHook<
      (context: object, interrupt: (value: unknown) => void) => unknown
    >();
  hook.tap((_, interrupt) => interrupt(response));
  expect((await hook.callWithResult({})).value).toBe(response);
  const failing = createAsyncInterruptHook<() => Promise<void>>();
  const error = new Error('hook failure');
  failing.tap(async () => {
    throw error;
  });
  await expect(failing.callWithResult()).rejects.toBe(error);
});

it('does not continue prepare hooks after runtime disposal', async () => {
  const gate = deferred();
  const calls: string[] = [];
  const runtime = createRuntime().run({
    config: {},
    plugins: [
      {
        name: 'prepare',
        setup(api: RuntimePluginAPI<any>) {
          api.onBeforeRender(async () => {
            calls.push('pending');
            await gate.promise;
          });
          api.onBeforeRender(() => {
            calls.push('must not execute');
          });
        },
      },
    ],
  }).runtimeContext;
  const preparing = runtime.hooks.onBeforeRender.callWithResult(
    runtime.runtimeContext,
  );
  runtime.dispose();
  gate.resolve();
  expect(await preparing).toEqual({ value: undefined, interrupted: true });
  expect(calls).toEqual(['pending']);
});

it('keeps canonical context between callbacks returning replacement objects', async () => {
  const canonical = { initialData: { value: 'before' } };
  const updated = { value: 'after' };
  const routes = [{ id: 'page' }];
  Object.defineProperty(canonical, 'routes', {
    enumerable: true,
    get: () => routes,
  });
  let observed: unknown;
  const runtime = createRuntime<any>().run({
    runtimeContext: canonical,
    config: {},
    plugins: [
      {
        name: 'pipeline',
        setup(api: RuntimePluginAPI<any>) {
          api.onBeforeRender((context: any) => ({
            ...context,
            initialData: updated,
          }));
          api.onBeforeRender((context: any) => {
            expect(context).toBe(api.getRuntimeContext());
            expect(context).toBe(canonical);
            observed = context.initialData;
          });
        },
      },
    ],
  }).runtimeContext;
  const result = await runtime.hooks.onBeforeRender.callWithResult(canonical);
  expect(observed).toBe(updated);
  expect(result).toEqual({ value: canonical, interrupted: false });
});

it('treats a returned runtime Response as an interrupt without copying it into context', async () => {
  const response = new Response('stopped', { status: 403 });
  const canonical = { initialData: 'untouched' };
  const runtime = createRuntime<any>().run({
    runtimeContext: canonical,
    config: {},
    plugins: [
      {
        name: 'response',
        setup(api: RuntimePluginAPI<any>) {
          api.onBeforeRender(() => response);
          api.onBeforeRender(() => {
            throw new Error('must not run');
          });
        },
      },
    ],
  }).runtimeContext;
  const result = await runtime.hooks.onBeforeRender.callWithResult(canonical);
  expect(result.value).toBe(response);
  expect(result.interrupted).toBe(true);
  expect(canonical).toEqual({ initialData: 'untouched' });
});

it.each(['spread', 'assign', 'prototype'] as const)(
  'preserves a %s wrapper while cloning standard hooks per runtime',
  kind => {
    const standard = createSyncHook<(value: string[]) => string[]>();
    standard.tap(values => [...values, 'static']);
    const customCall = (values: string[]) => [
      ...standard.call(values),
      'custom',
    ];
    const customTap = (callback: (value: string[]) => string[]) =>
      standard.tap(callback);
    const overrides = { call: customCall, tap: customTap };
    const custom =
      kind === 'spread'
        ? { ...standard, ...overrides }
        : Object.assign(
            kind === 'assign' ? {} : Object.create(standard),
            kind === 'assign' ? standard : {},
            overrides,
          );
    let sequence = 0;
    const plugin: RuntimePlugin<any> = {
      name: 'wrapped-hook',
      registryHooks: { standard, custom },
      setup(api) {
        const id = ++sequence;
        api.standard((values: string[]) => [...values, String(id)]);
      },
    };
    const engine = createRuntime<any>();
    const first = engine.run({ config: {}, plugins: [plugin] }).runtimeContext;
    const second = engine.run({ config: {}, plugins: [plugin] }).runtimeContext;
    try {
      for (const instance of [first, second]) {
        expect(instance.hooks.custom).toBe(custom);
        expect(instance.hooks.custom.call).toBe(customCall);
        expect(instance.hooks.custom.tap).toBe(customTap);
        expect(instance.hooks.custom.call([])).toEqual(['static', 'custom']);
      }
      expect(first.hooks.standard).not.toBe(standard);
      expect(first.hooks.standard).not.toBe(second.hooks.standard);
      expect(first.hooks.standard.call([])).toEqual(['static', '1']);
      expect(second.hooks.standard.call([])).toEqual(['static', '2']);
      expect(standard.call([])).toEqual(['static']);
    } finally {
      first.dispose();
      second.dispose();
    }
  },
);

it('keeps a disposal cause for registered and late cleanup callbacks', () => {
  const cause = new Error('request disconnected');
  const received: unknown[] = [];
  const { runtimeContext } = createRuntime().run({
    plugins: [
      {
        name: 'cleanup-reason',
        setup(api) {
          api.onDispose(reason => {
            received.push(reason);
          });
        },
      },
    ],
  });
  runtimeContext.dispose(cause);
  runtimeContext.onDispose(reason => {
    received.push(reason);
  });
  runtimeContext.dispose(new Error('second disposal'));
  expect(received).toEqual([cause, cause]);
});

it.each([false, true])(
  'passes the original setup failure to cleanup (async %s)',
  async asynchronous => {
    const failure = new Error('setup failed');
    const reasons: unknown[] = [];
    let late: ((callback: (reason?: unknown) => void) => void) | undefined;
    const run = () =>
      createRuntime().run({
        config: {},
        plugins: [
          {
            name: 'failing-owner',
            setup(api: RuntimePluginAPI<any>) {
              late = api.onDispose;
              api.onDispose(reason => reasons.push(reason));
              if (asynchronous) return Promise.reject(failure);
              throw failure;
            },
          },
        ],
      });
    if (asynchronous)
      await expect(run().runtimeContext.ready).rejects.toBe(failure);
    else expect(run).toThrow(failure);
    late!(reason => reasons.push(reason));
    expect(reasons).toEqual([failure, failure]);
  },
);
