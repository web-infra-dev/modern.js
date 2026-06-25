import { EventEmitter } from 'node:events';
import path from 'node:path';
import {
  type ServerPlugin,
  compatPlugin,
  createServerBase,
} from '@modern-js/server-core';

// Replace the real chokidar-backed Watcher with a controllable fake so the
// tests neither touch the filesystem nor leak watchers. The registry lives
// inside the factory (rstest.mock is hoisted) and is exposed via getters.
rstest.mock('../src/dev-tools/watcher', () => {
  const instances: any[] = [];
  class FakeWatcher {
    listenCb: ((filepath: string, event: string) => void) | null = null;
    closed = false;
    constructor() {
      instances.push(this);
    }
    createDepTree() {}
    updateDepTree() {}
    cleanDepCache() {}
    listen(
      _paths: unknown,
      _opts: unknown,
      cb: (filepath: string, event: string) => void,
    ) {
      this.listenCb = cb;
    }
    close() {
      this.closed = true;
    }
  }
  return {
    default: FakeWatcher,
    mergeWatchOptions: (options: unknown) => options ?? {},
    __getWatchers: () => instances,
    __resetWatchers: () => {
      instances.length = 0;
    },
  };
});

import { devRuntimeMiddlewarePlugin, setupDevInfra } from '../src/dev';
import { ReloadManager } from '../src/dev-tools/reloadManager';
import { createRuntimeServerOptions } from '../src/dev-tools/runtimeOptions';
import * as watcherModule from '../src/dev-tools/watcher';

rstest.useRealTimers();

const getWatchers = (): any[] => (watcherModule as any).__getWatchers();
const resetWatchers = (): void => (watcherModule as any).__resetWatchers();
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getDefaultConfig() {
  return {
    html: {},
    output: {},
    source: {},
    tools: {},
    server: {},
    bff: {},
    dev: {},
    security: {},
  } as any;
}

function getDefaultAppContext() {
  return { apiDirectory: '', lambdaDirectory: '' } as any;
}

function makeFakeRuntimeServer() {
  return { hooks: { onReset: { call: rstest.fn() } } } as any;
}

function makeBuilderDevServer(withMiddleware = true) {
  return {
    close: rstest.fn(),
    connectWebSocket: rstest.fn(),
    afterListen: rstest.fn(),
    middlewares: withMiddleware
      ? (_req: any, _res: any, next: any) => next()
      : undefined,
  } as any;
}

beforeEach(() => {
  resetWatchers();
});

describe('devRuntimeMiddlewarePlugin (per-runtime injection)', () => {
  async function buildRuntimeMiddlewareNames(
    builderDevServer: any,
  ): Promise<string[]> {
    let names: string[] = [];
    const probe: ServerPlugin = {
      name: 'probe',
      setup(api) {
        api.onPrepare(async () => {
          names = api.getServerContext().middlewares.map(m => m.name);
        });
      },
    };

    const server = createServerBase({
      config: getDefaultConfig(),
      appContext: getDefaultAppContext(),
      pwd: '',
    });
    server.addPlugins([
      compatPlugin(),
      devRuntimeMiddlewarePlugin(
        { pwd: '', dev: {}, builderDevServer } as any,
        null,
      ),
      probe,
    ]);
    await server.init();
    return names;
  }

  it('injects mock / rsbuild / file-reader middlewares into every fresh runtime', async () => {
    const builderDevServer = makeBuilderDevServer(true);

    // Two independent fresh runtimes both get a complete dev middleware set.
    const names1 = await buildRuntimeMiddlewareNames(builderDevServer);
    const names2 = await buildRuntimeMiddlewareNames(builderDevServer);

    for (const names of [names1, names2]) {
      expect(names).toEqual(
        expect.arrayContaining(['mock-dev', 'rsbuild-dev', 'init-file-reader']),
      );
    }
  });

  it('omits rsbuild-dev when the builder has no dev middleware', async () => {
    const names = await buildRuntimeMiddlewareNames(
      makeBuilderDevServer(false),
    );
    expect(names).toContain('mock-dev');
    expect(names).not.toContain('rsbuild-dev');
  });
});

describe('setupDevInfra (process-level singletons)', () => {
  function setup(getRuntimeServer: () => any) {
    const nodeServer = new EventEmitter() as any;
    const builder = { onDevCompileDone: rstest.fn() } as any;
    const builderDevServer = makeBuilderDevServer(true);
    const onFileChange = rstest.fn();
    const infra = setupDevInfra({
      config: { server: {} } as any,
      pwd: '/tmp/app',
      distDir: '/tmp/app/dist',
      builder,
      builderDevServer,
      compiler: null,
      nodeServer,
      getRuntimeServer,
      onFileChange,
    });
    return { infra, nodeServer, builder, builderDevServer, onFileChange };
  }

  it('creates each process-level resource exactly once and releases them on close', () => {
    const { infra, nodeServer, builder, builderDevServer } = setup(() =>
      makeFakeRuntimeServer(),
    );

    expect(builderDevServer.connectWebSocket).toHaveBeenCalledTimes(1);
    expect(builder.onDevCompileDone).toHaveBeenCalledTimes(1);
    expect(getWatchers()).toHaveLength(1);
    expect(nodeServer.listenerCount('close')).toBe(1);

    infra.close();
    expect(builderDevServer.close).toHaveBeenCalledTimes(1);
    expect(getWatchers()[0].closed).toBe(true);
  });

  it('does not add process-level resources across runtime rebuilds', async () => {
    let current = makeFakeRuntimeServer();
    const { nodeServer, builder, builderDevServer } = setup(() => current);
    const builderDevServerForRuntime = makeBuilderDevServer(true);

    // Simulate several hot reloads, each building a brand-new runtime server,
    // exactly like createDevServer's buildRuntimeServer does.
    for (let i = 0; i < 3; i++) {
      const runtimeServer = createServerBase({
        config: getDefaultConfig(),
        appContext: getDefaultAppContext(),
        pwd: '',
      });
      runtimeServer.addPlugins([
        compatPlugin(),
        devRuntimeMiddlewarePlugin(
          {
            pwd: '',
            dev: {},
            builderDevServer: builderDevServerForRuntime,
          } as any,
          null,
        ),
      ]);
      await runtimeServer.init();
      current = runtimeServer as any;
    }

    // None of the process-level resources were touched by the rebuilds.
    expect(builderDevServer.connectWebSocket).toHaveBeenCalledTimes(1);
    expect(builder.onDevCompileDone).toHaveBeenCalledTimes(1);
    expect(getWatchers()).toHaveLength(1);
    expect(nodeServer.listenerCount('close')).toBe(1);
  });

  it('triggers onFileChange (runtime reload) on a watched user server change', async () => {
    const { onFileChange } = setup(() => makeFakeRuntimeServer());

    const watcher = getWatchers()[0];
    expect(watcher.listenCb).toBeTypeOf('function');

    // A user server file change schedules a runtime reload.
    watcher.listenCb(path.join('/tmp/app', 'api/foo.ts'), 'change');
    await flush();
    expect(onFileChange).toHaveBeenCalledTimes(1);

    // Server loader bundles only drop the require cache; they never reload.
    watcher.listenCb(
      path.join('/tmp/app/dist', 'bundles/x-server-loaders.js'),
      'change',
    );
    await flush();
    expect(onFileChange).toHaveBeenCalledTimes(1);
  });

  it('onRepack reaches the live runtime via the mutable ref (no stale closure)', () => {
    let current = makeFakeRuntimeServer();
    const first = current;
    const { builder } = setup(() => current);

    // Capture the builder onDevCompileDone callback (server-bundle reset path).
    const onCompileDone = builder.onDevCompileDone.mock.calls[0][0];
    const clientStats = { stats: { toJson: () => ({ name: 'client' }) } };

    onCompileDone(clientStats);
    expect(first.hooks.onReset.call).toHaveBeenCalledTimes(1);

    // After a reload swaps the runtime, onRepack must hit the NEW runtime.
    const second = makeFakeRuntimeServer();
    current = second;
    onCompileDone(clientStats);
    expect(second.hooks.onReset.call).toHaveBeenCalledTimes(1);
    expect(first.hooks.onReset.call).toHaveBeenCalledTimes(1);
  });

  it('cancels a scheduled reload when the dev server closes (no build after close)', async () => {
    // Wire a real ReloadManager exactly like createDevServer: watcher change ->
    // schedule, dev server close -> reloadManager.close.
    const build = rstest.fn(
      async () => (() => new Response('ok')) as unknown as () => Response,
    );
    const reloadManager = new ReloadManager({
      initialHandle: () => new Response('init') as any,
      build,
      debounceMs: 30,
    });

    const nodeServer = new EventEmitter() as any;
    setupDevInfra({
      config: { server: {} } as any,
      pwd: '/tmp/app',
      distDir: '/tmp/app/dist',
      builder: { onDevCompileDone: rstest.fn() } as any,
      builderDevServer: makeBuilderDevServer(true),
      compiler: null,
      nodeServer,
      getRuntimeServer: () => makeFakeRuntimeServer(),
      onFileChange: () => reloadManager.schedule(),
      onClose: () => reloadManager.close(),
    });

    const watcher = getWatchers()[getWatchers().length - 1];

    // A file change schedules a (debounced) reload.
    watcher.listenCb(path.join('/tmp/app', 'api/foo.ts'), 'change');
    // The dev server closes before the debounce fires.
    nodeServer.emit('close');

    // After the debounce window, no build ran: close cancelled the pending
    // reload, so nothing rebuilds a runtime after teardown.
    await sleep(60);
    expect(build).toHaveBeenCalledTimes(0);
  });

  it('re-emits the public file-change onReset signal on the live runtime (downstream compat)', async () => {
    // Downstream plugins (e.g. EdenX gulu/gulux) tap onReset({type:'file-change'})
    // for their own dev refresh; the watcher must keep emitting it.
    const runtime = makeFakeRuntimeServer();
    const { onFileChange } = setup(() => runtime);

    const watcher = getWatchers()[getWatchers().length - 1];
    const file = path.join('/tmp/app', 'api/foo.ts');
    watcher.listenCb(file, 'change');
    await flush();

    expect(runtime.hooks.onReset.call).toHaveBeenCalledTimes(1);
    expect(runtime.hooks.onReset.call).toHaveBeenCalledWith({
      event: {
        type: 'file-change',
        payload: [{ filename: file, event: 'change' }],
      },
    });
    // and the unified reload is still triggered
    expect(onFileChange).toHaveBeenCalledTimes(1);
  });

  it('does NOT emit onReset for mock files (preserves pre-refactor emission) but still reloads', async () => {
    const runtime = makeFakeRuntimeServer();
    const { onFileChange } = setup(() => runtime);

    const watcher = getWatchers()[getWatchers().length - 1];
    // config/mock/** was never part of the onReset file-change signal; it
    // refreshes via the reload (getMockMiddleware re-runs) only.
    watcher.listenCb(path.join('/tmp/app', 'config/mock/index.ts'), 'change');
    await flush();

    expect(runtime.hooks.onReset.call).not.toHaveBeenCalled();
    // but the reload is still scheduled so the mock middleware refreshes
    expect(onFileChange).toHaveBeenCalledTimes(1);
  });
});

describe('createRuntimeServerOptions (per-build option isolation)', () => {
  it('returns fresh containers so one build cannot pollute another', () => {
    const base = {
      config: { output: { distPath: { root: 'dist' } } },
      serverConfig: {
        middlewares: [{ name: 'a' }],
        renderMiddlewares: [{ name: 'r' }],
        plugins: [{ name: 'p' }],
      },
      plugins: [{ name: 'top' }],
    } as any;

    const a = createRuntimeServerOptions(base);
    const b = createRuntimeServerOptions(base);

    // Distinct container identities from the base and from each other.
    expect(a.config).not.toBe(base.config);
    expect(a.config.output).not.toBe(base.config.output);
    expect(a.serverConfig).not.toBe(base.serverConfig);
    expect(a.serverConfig.middlewares).not.toBe(base.serverConfig.middlewares);
    expect(a.serverConfig.renderMiddlewares).not.toBe(
      base.serverConfig.renderMiddlewares,
    );
    expect(a.serverConfig.plugins).not.toBe(base.serverConfig.plugins);
    expect(a.plugins).not.toBe(base.plugins);
    expect(a.serverConfig.middlewares).not.toBe(b.serverConfig.middlewares);

    // Pollute round A's arrays.
    a.serverConfig.middlewares.push({ name: 'leak-mw' });
    a.serverConfig.renderMiddlewares.push({ name: 'leak-render' });
    a.serverConfig.plugins.push({ name: 'leak-plugin' });
    a.plugins.push({ name: 'leak-top' });
    (a.config.output as any).assetPrefix = '/leaked/';

    // Round B and the base remain pristine.
    expect(b.serverConfig.middlewares).toHaveLength(1);
    expect(b.serverConfig.renderMiddlewares).toHaveLength(1);
    expect(b.serverConfig.plugins).toHaveLength(1);
    expect(b.plugins).toHaveLength(1);
    expect((b.config.output as any).assetPrefix).toBeUndefined();

    expect(base.serverConfig.middlewares).toHaveLength(1);
    expect(base.serverConfig.renderMiddlewares).toHaveLength(1);
    expect(base.serverConfig.plugins).toHaveLength(1);
    expect(base.plugins).toHaveLength(1);
    expect((base.config.output as any).assetPrefix).toBeUndefined();
  });

  it('weaves assetPrefix into the fresh config.output without touching the base', () => {
    const base = {
      config: { output: {} },
      serverConfig: {},
      plugins: [],
    } as any;
    const built = createRuntimeServerOptions(base, '/static/');

    expect(built.config.output.assetPrefix).toBe('/static/');
    // The original options.config.output is never mutated.
    expect((base.config.output as any).assetPrefix).toBeUndefined();
  });

  it('isolates serverConfig.middlewares pollution across consecutive runtime builds', async () => {
    const baseOptions = {
      config: getDefaultConfig(),
      appContext: getDefaultAppContext(),
      pwd: '',
      serverConfig: { middlewares: [], renderMiddlewares: [] },
      plugins: [],
    } as any;

    // Mirror buildRuntimeServer: a fresh options object per build, with a
    // plugin that appends to its own runtimeOptions.serverConfig.middlewares.
    const buildOnce = async () => {
      const runtimeOptions = createRuntimeServerOptions(baseOptions);
      const polluter: ServerPlugin = {
        name: 'polluter',
        setup(api) {
          api.onPrepare(async () => {
            (runtimeOptions.serverConfig as any).middlewares.push({
              name: 'leak',
            });
          });
        },
      };
      const server = createServerBase(runtimeOptions);
      server.addPlugins([compatPlugin(), polluter]);
      await server.init();
      return runtimeOptions;
    };

    const o1 = await buildOnce();
    const o2 = await buildOnce();

    expect((o1.serverConfig as any).middlewares).toHaveLength(1);
    // Second build does NOT inherit the first build's appended middleware.
    expect((o2.serverConfig as any).middlewares).toHaveLength(1);
    // The shared base stays pristine.
    expect((baseOptions.serverConfig as any).middlewares).toHaveLength(0);
  });
});
