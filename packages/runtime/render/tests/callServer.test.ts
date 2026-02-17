type WebpackRequireShim = {
  u: (chunkId: string | number) => string;
};

const globalState = globalThis as typeof globalThis & {
  __webpack_require__?: WebpackRequireShim;
};
const originalWebpackRequire = globalState.__webpack_require__;

if (!globalState.__webpack_require__) {
  globalState.__webpack_require__ = {
    u: chunkId => String(chunkId),
  };
}

const ACTION_RESOLVER_KEY = '__MODERN_RSC_ACTION_RESOLVER__';

type GlobalWithResolver = typeof globalThis & {
  [ACTION_RESOLVER_KEY]?: (id: string) => string | Promise<string>;
};

describe('requestCallServer pluggable action id resolver', () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = (globalThis as { window?: unknown }).window;
  let requestCallServer: typeof import('../src/client/callServer').requestCallServer;
  let setResolveActionId: typeof import('../src/client/callServer').setResolveActionId;
  let fetchMock: ReturnType<typeof rstest.fn>;

  beforeAll(async () => {
    const mod = await import('../src/client/callServer');
    requestCallServer = mod.requestCallServer;
    setResolveActionId = mod.setResolveActionId;
  });

  beforeEach(() => {
    (globalThis as unknown as { window?: { __MODERN_JS_ENTRY_NAME: string } }).window = {
      __MODERN_JS_ENTRY_NAME: 'main',
    };

    fetchMock = rstest.fn(async () => {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response;
    });
    globalThis.fetch = fetchMock as typeof globalThis.fetch;
  });

  afterEach(() => {
    delete (globalThis as GlobalWithResolver)[ACTION_RESOLVER_KEY];
    (globalThis as unknown as { window?: { __MODERN_JS_ENTRY_NAME: string } }).window = {
      __MODERN_JS_ENTRY_NAME: 'main',
    };
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    (globalThis as { window?: unknown }).window = originalWindow;
    globalState.__webpack_require__ = originalWebpackRequire;
  });

  const expectActionHeader = (actionId: string, expectedUrl = '/') => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(callArgs[0]).toBe(expectedUrl);
    expect(
      (callArgs[1]?.headers as Record<string, string>)['x-rsc-action'],
    ).toBe(actionId);
  };

  test('passes through ids unchanged when no resolver is registered', async () => {
    await requestCallServer('some-action-id', []);

    expectActionHeader('some-action-id');
  });

  test('uses a synchronous resolver to remap action ids', async () => {
    setResolveActionId(id => `remote:myRemote:${id}`);

    await requestCallServer('foo', []);

    expectActionHeader('remote:myRemote:foo');
  });

  test('uses an async resolver to remap action ids', async () => {
    setResolveActionId(async id => {
      await Promise.resolve();
      return `remote:asyncRemote:${id}`;
    });

    await requestCallServer('bar', []);

    expectActionHeader('remote:asyncRemote:bar');
  });

  test('resolver can pass through ids unchanged', async () => {
    setResolveActionId(id => id);

    await requestCallServer('untouched', []);

    expectActionHeader('untouched');
  });

  test('resolver set via global key is picked up', async () => {
    (globalThis as GlobalWithResolver)[ACTION_RESOLVER_KEY] = id =>
      `global:${id}`;

    await requestCallServer('action123', []);

    expectActionHeader('global:action123');
  });

  test('uses entry specific action endpoint when entry name is not main/index', async () => {
    (globalThis as unknown as { window?: { __MODERN_JS_ENTRY_NAME: string } }).window = {
      __MODERN_JS_ENTRY_NAME: 'server-component-root',
    };

    await requestCallServer('entry-action', []);

    expectActionHeader('entry-action', '/server-component-root');
  });

  test('falls back to root endpoint when window is unavailable', async () => {
    (globalThis as unknown as { window?: { __MODERN_JS_ENTRY_NAME: string } }).window =
      undefined;

    await requestCallServer('no-window-action', []);

    expectActionHeader('no-window-action', '/');
  });
});
