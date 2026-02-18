import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import rscBridgeRuntimePlugin from './rsc-bridge-runtime-plugin';

type ManifestLike = {
  serverManifest?: Record<string, any>;
  clientManifest?: Record<string, any>;
  serverConsumerModuleMap?: Record<string, any>;
};

type WebpackRequireRuntime = {
  m?: Record<string, (module: { exports: any }) => void>;
  c?: Record<string, { exports?: unknown }>;
  rscM?: ManifestLike;
};

const ACTION_REMAP_GLOBAL_KEY = '__MODERN_RSC_MF_ACTION_ID_MAP__';
const PROXY_MODULE_PREFIX = '__modernjs_mf_rsc_action_proxy__:';

const createWebpackRequireRuntime = (): WebpackRequireRuntime => ({
  m: {},
  c: {},
  rscM: {
    serverManifest: {},
    clientManifest: {},
    serverConsumerModuleMap: {},
  },
});

const getActionRemapMap = () =>
  (
    globalThis as typeof globalThis & {
      [ACTION_REMAP_GLOBAL_KEY]?: Record<string, string | false>;
    }
  )[ACTION_REMAP_GLOBAL_KEY] || {};

describe('rsc-bridge-runtime-plugin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (
      globalThis as typeof globalThis & {
        __webpack_require__?: WebpackRequireRuntime;
      }
    ).__webpack_require__ = createWebpackRequireRuntime();
    (
      globalThis as typeof globalThis & {
        window?: { __MODERN_JS_ENTRY_NAME?: string };
      }
    ).window = {
      __MODERN_JS_ENTRY_NAME: 'server-component-root',
    };
    delete (
      globalThis as typeof globalThis & {
        [ACTION_REMAP_GLOBAL_KEY]?: Record<string, string | false>;
      }
    )[ACTION_REMAP_GLOBAL_KEY];
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    delete (
      globalThis as typeof globalThis & {
        __webpack_require__?: WebpackRequireRuntime;
      }
    ).__webpack_require__;
    delete (
      globalThis as typeof globalThis & {
        window?: { __MODERN_JS_ENTRY_NAME?: string };
      }
    ).window;
    delete (globalThis as typeof globalThis & { fetch?: unknown }).fetch;
    delete (
      globalThis as typeof globalThis & {
        [ACTION_REMAP_GLOBAL_KEY]?: Record<string, string | false>;
      }
    )[ACTION_REMAP_GLOBAL_KEY];
  });

  it('merges remote manifest, registers action remap, and installs proxy dispatcher', async () => {
    const executeAction = vi.fn(async (id: string, args: unknown[]) => ({
      id,
      args,
    }));

    const plugin = rscBridgeRuntimePlugin();
    const loadRemote = vi.fn(async () => ({
      getManifest: () => ({
        clientManifest: {
          clientRef: {
            id: '123',
            name: 'default',
            chunks: [],
          },
        },
        serverConsumerModuleMap: {
          '123': {
            '*': {
              id: '123',
              name: 'default',
              chunks: [],
            },
          },
        },
        serverManifest: {
          rawActionId: {
            async: true,
          },
        },
      }),
      executeAction,
    }));

    await plugin.onLoad?.({
      remote: { alias: 'rscRemote' },
      options: { name: 'rscHost' },
      origin: {
        loadRemote,
      },
    });

    expect(loadRemote).toHaveBeenCalledTimes(1);
    expect(loadRemote).toHaveBeenCalledWith('rscRemote/__rspack_rsc_bridge__');

    const webpackRequire = (
      globalThis as typeof globalThis & {
        __webpack_require__?: WebpackRequireRuntime;
      }
    ).__webpack_require__!;
    const hostManifest = webpackRequire.rscM!;

    expect(hostManifest.clientManifest?.clientRef?.id).toBe(
      'remote-module:rscRemote:123',
    );
    expect(hostManifest.serverConsumerModuleMap).toHaveProperty(
      'remote-module:rscRemote:123',
    );
    expect(
      hostManifest.serverConsumerModuleMap?.['remote-module:rscRemote:123']?.[
        '*'
      ]?.id,
    ).toBe('remote-module:rscRemote:123');

    const prefixedActionId = 'remote:rscRemote:rawActionId';
    const proxyModuleId = `${PROXY_MODULE_PREFIX}rscRemote`;
    expect(hostManifest.serverManifest?.[prefixedActionId]).toMatchObject({
      id: proxyModuleId,
      name: prefixedActionId,
    });
    expect(getActionRemapMap().rawActionId).toBe(prefixedActionId);

    const proxyFactory = webpackRequire.m?.[proxyModuleId];
    expect(typeof proxyFactory).toBe('function');

    const proxyModule = { exports: {} as Record<string, any> };
    proxyFactory?.(proxyModule);
    const result = await proxyModule.exports[prefixedActionId]('payload');

    expect(executeAction).toHaveBeenCalledWith('rawActionId', ['payload']);
    expect(result).toEqual({
      id: 'rawActionId',
      args: ['payload'],
    });
  });

  it('awaits async bridge manifest responses before merge', async () => {
    const plugin = rscBridgeRuntimePlugin();

    await plugin.onLoad?.({
      remote: { alias: 'rscRemote' },
      options: { name: 'rscHost' },
      origin: {
        loadRemote: vi.fn(async () => ({
          getManifest: async () => ({
            serverManifest: {
              asyncRawAction: {
                async: true,
              },
            },
          }),
          executeAction: vi.fn(async () => undefined),
        })),
      },
    } as any);

    const webpackRequire = (
      globalThis as typeof globalThis & {
        __webpack_require__?: WebpackRequireRuntime;
      }
    ).__webpack_require__!;
    expect(webpackRequire.rscM?.serverManifest).toHaveProperty(
      'remote:rscRemote:asyncRawAction',
    );
    expect(getActionRemapMap().asyncRawAction).toBe(
      'remote:rscRemote:asyncRawAction',
    );
  });

  it('loads and merges each remote alias once', async () => {
    const plugin = rscBridgeRuntimePlugin();
    const loadRemote = vi.fn(async () => ({
      getManifest: () => ({
        serverManifest: {
          one: {
            async: true,
          },
        },
      }),
      executeAction: vi.fn(async () => undefined),
    }));

    const args = {
      remote: { alias: 'rscRemote' },
      options: { name: 'rscHost' },
      origin: {
        loadRemote,
      },
    };

    await plugin.onLoad?.(args as any);
    await plugin.onLoad?.(args as any);

    expect(loadRemote).toHaveBeenCalledTimes(1);
  });

  it('falls back to federation.instance when origin is unavailable', async () => {
    const loadRemote = vi.fn(async () => ({
      getManifest: () => ({
        serverManifest: {
          rawActionId: {
            async: true,
          },
        },
      }),
      executeAction: vi.fn(async () => undefined),
    }));

    const webpackRequire = (
      globalThis as typeof globalThis & {
        __webpack_require__?: WebpackRequireRuntime;
      }
    ).__webpack_require__!;
    (
      webpackRequire as WebpackRequireRuntime & {
        federation?: {
          instance?: { loadRemote?: (request: string) => Promise<unknown> };
        };
      }
    ).federation = {
      instance: {
        loadRemote,
      },
    };

    const plugin = rscBridgeRuntimePlugin();

    await plugin.onLoad?.({
      remote: { alias: 'rscRemote' },
      options: { name: 'rscHost' },
    } as any);

    expect(loadRemote).toHaveBeenCalledWith('rscRemote/__rspack_rsc_bridge__');
    expect(getActionRemapMap().rawActionId).toBe(
      'remote:rscRemote:rawActionId',
    );
  });

  it('throws deterministic conflict errors when manifests disagree', async () => {
    const webpackRequire = (
      globalThis as typeof globalThis & {
        __webpack_require__?: WebpackRequireRuntime;
      }
    ).__webpack_require__!;
    webpackRequire.rscM = {
      serverManifest: {},
      clientManifest: {
        sharedKey: {
          id: 'remote-module:existingRemote:123',
          name: 'default',
          chunks: [],
        },
      },
      serverConsumerModuleMap: {},
    };

    const plugin = rscBridgeRuntimePlugin();

    await expect(
      plugin.onLoad?.({
        remote: { alias: 'rscRemote' },
        options: { name: 'rscHost' },
        origin: {
          loadRemote: vi.fn(async () => ({
            getManifest: () => ({
              clientManifest: {
                sharedKey: {
                  id: '123',
                  name: 'default',
                  chunks: [],
                },
              },
            }),
            executeAction: vi.fn(async () => undefined),
          })),
        },
      } as any),
    ).rejects.toThrow(/clientManifest conflict/);
  });

  it('marks raw action remaps as false when aliases collide', async () => {
    const plugin = rscBridgeRuntimePlugin();

    const loadRemote = vi.fn(async (request: string) => {
      if (request.startsWith('rscRemoteA/')) {
        return {
          getManifest: () => ({
            serverManifest: {
              sameRawId: {
                async: true,
              },
            },
          }),
          executeAction: vi.fn(async () => undefined),
        };
      }

      return {
        getManifest: () => ({
          serverManifest: {
            sameRawId: {
              async: true,
            },
          },
        }),
        executeAction: vi.fn(async () => undefined),
      };
    });

    await plugin.onLoad?.({
      remote: { alias: 'rscRemoteA' },
      options: { name: 'rscHost' },
      origin: { loadRemote },
    } as any);

    await plugin.onLoad?.({
      remote: { alias: 'rscRemoteB' },
      options: { name: 'rscHost' },
      origin: { loadRemote },
    } as any);

    expect(getActionRemapMap().sameRawId).toBe(false);
  });

  it('normalizes missing ssrPublicPath on resolved remote snapshots', async () => {
    const plugin = rscBridgeRuntimePlugin();
    const loadRemote = vi.fn(async () => ({
      getManifest: () => ({}),
      executeAction: vi.fn(async () => undefined),
    }));
    const args: any = {
      remote: { alias: 'rscRemote' },
      remoteInfo: {
        publicPath: 'http://127.0.0.1:3008/bundles/',
        remoteEntry: {
          name: 'static/remoteEntry.js',
        },
      },
      origin: {
        loadRemote,
      },
    };

    await plugin.afterResolve?.(args);

    expect(args.remoteInfo.ssrPublicPath).toBe(
      'http://127.0.0.1:3008/bundles/',
    );
    expect(args.remoteInfo.remoteEntry.path).toBe('');
  });
});
