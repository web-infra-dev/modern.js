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
    const proxyModuleId = `${PROXY_MODULE_PREFIX}rscHost`;
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

  it('falls back to bridge action ids when remote manifest is unavailable', async () => {
    const plugin = rscBridgeRuntimePlugin();

    await plugin.onLoad?.({
      remote: { alias: 'rscRemote' },
      options: { name: 'rscHost' },
      origin: {
        loadRemote: vi.fn(async () => ({
          getManifest: () => undefined,
          getActionIds: async () => ['rawFromBridgeIds'],
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
      'remote:rscRemote:rawFromBridgeIds',
    );
    expect(getActionRemapMap().rawFromBridgeIds).toBe(
      'remote:rscRemote:rawFromBridgeIds',
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

  it('installs host-routed callback for federated client.browser modules', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
    }));
    (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    const setServerCallbackMock = vi.fn();
    const createFromFetchMock = vi.fn(() => Promise.resolve('ok'));
    const encodeReplyMock = vi.fn(
      async () => 'encoded-body' as unknown as BodyInit,
    );

    const webpackRequire = (
      globalThis as typeof globalThis & {
        __webpack_require__?: WebpackRequireRuntime;
      }
    ).__webpack_require__!;
    webpackRequire.c = {
      clientBrowserModule: {
        exports: {
          setServerCallback: setServerCallbackMock,
          createFromFetch: createFromFetchMock,
          encodeReply: encodeReplyMock,
        },
      },
    };

    const plugin = rscBridgeRuntimePlugin();
    await plugin.onLoad?.({
      remote: { alias: 'rscRemote' },
      options: { name: 'rscHost' },
      origin: {
        loadRemote: vi.fn(async () => ({
          getManifest: () => ({
            serverManifest: {
              rawActionId: { async: true },
            },
          }),
          executeAction: vi.fn(async () => undefined),
        })),
      },
    } as any);

    expect(setServerCallbackMock).toHaveBeenCalledTimes(1);
    const installedCallback = setServerCallbackMock.mock.calls[0]?.[0] as (
      id: string,
      args: unknown[],
    ) => unknown;

    await installedCallback('rawActionId', ['value-a']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/server-component-root');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: {
        Accept: 'text/x-component',
        'x-rsc-action': 'remote:rscRemote:rawActionId',
      },
      body: 'encoded-body',
    });
    expect(encodeReplyMock).toHaveBeenCalledWith(['value-a']);
    expect(createFromFetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries client.browser callback installation when module cache is populated late', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
    }));
    (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    const webpackRequire = (
      globalThis as typeof globalThis & {
        __webpack_require__?: WebpackRequireRuntime;
      }
    ).__webpack_require__!;
    webpackRequire.c = {};

    const plugin = rscBridgeRuntimePlugin();
    await plugin.onLoad?.({
      remote: { alias: 'rscRemote' },
      options: { name: 'rscHost' },
      origin: {
        loadRemote: vi.fn(async () => ({
          getManifest: () => ({
            serverManifest: {
              rawActionId: { async: true },
            },
          }),
          executeAction: vi.fn(async () => undefined),
        })),
      },
    } as any);

    const setServerCallbackMock = vi.fn();
    const createFromFetchMock = vi.fn(() => Promise.resolve('ok'));
    const encodeReplyMock = vi.fn(
      async () => 'encoded-body' as unknown as BodyInit,
    );
    webpackRequire.c.clientBrowserModule = {
      exports: {
        setServerCallback: setServerCallbackMock,
        createFromFetch: createFromFetchMock,
        encodeReply: encodeReplyMock,
      },
    };

    await vi.runOnlyPendingTimersAsync();

    expect(setServerCallbackMock).toHaveBeenCalledTimes(1);
    const installedCallback = setServerCallbackMock.mock.calls[0]?.[0] as (
      id: string,
      args: unknown[],
    ) => unknown;

    await installedCallback('rawActionId', ['retry-value']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/server-component-root');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: {
        Accept: 'text/x-component',
        'x-rsc-action': 'remote:rscRemote:rawActionId',
      },
      body: 'encoded-body',
    });
    expect(encodeReplyMock).toHaveBeenCalledWith(['retry-value']);
    expect(createFromFetchMock).toHaveBeenCalledTimes(1);
  });

  it('patches each client.browser module export once across repeated onLoad calls', async () => {
    const setServerCallbackMock = vi.fn();
    const createFromFetchMock = vi.fn(() => Promise.resolve('ok'));
    const encodeReplyMock = vi.fn(
      async () => 'encoded-body' as unknown as BodyInit,
    );

    const webpackRequire = (
      globalThis as typeof globalThis & {
        __webpack_require__?: WebpackRequireRuntime;
      }
    ).__webpack_require__!;
    webpackRequire.c = {
      clientBrowserModule: {
        exports: {
          setServerCallback: setServerCallbackMock,
          createFromFetch: createFromFetchMock,
          encodeReply: encodeReplyMock,
        },
      },
    };

    const loadRemote = vi.fn(async () => ({
      getManifest: () => ({
        serverManifest: {
          rawActionId: { async: true },
        },
      }),
      executeAction: vi.fn(async () => undefined),
    }));

    const plugin = rscBridgeRuntimePlugin();
    const loadArgs = {
      remote: { alias: 'rscRemote' },
      options: { name: 'rscHost' },
      origin: { loadRemote },
    };

    await plugin.onLoad?.(loadArgs as any);
    await plugin.onLoad?.(loadArgs as any);

    expect(setServerCallbackMock).toHaveBeenCalledTimes(1);
  });
});
