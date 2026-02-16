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

describe('requestCallServer action id fallback mapping', () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = (globalThis as { window?: unknown }).window;
  let requestCallServer: typeof import(
    '../src/client/callServer',
  ).requestCallServer;
  let fetchMock: ReturnType<typeof rstest.fn>;

  beforeAll(async () => {
    requestCallServer = (await import('../src/client/callServer'))
      .requestCallServer;
  });

  beforeEach(() => {
    (globalThis as { window?: { __MODERN_JS_ENTRY_NAME: string } }).window = {
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
    delete (
      globalThis as typeof globalThis & {
        __MODERN_RSC_MF_ACTION_ID_MAP__?: Record<string, string | false>;
      }
    ).__MODERN_RSC_MF_ACTION_ID_MAP__;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
    (globalThis as { window?: unknown }).window = originalWindow;
    globalState.__webpack_require__ = originalWebpackRequire;
  });

  const expectActionHeader = (actionId: string) => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(callArgs[0]).toBe('/');
    expect(
      (callArgs[1]?.headers as Record<string, string>)['x-rsc-action'],
    ).toBe(actionId);
  };

  test('passes through already-prefixed ids', async () => {
    (
      globalThis as typeof globalThis & {
        __MODERN_RSC_MF_ACTION_ID_MAP__?: Record<string, string | false>;
      }
    ).__MODERN_RSC_MF_ACTION_ID_MAP__ = {
      foo: 'remote:foo-remapped',
    };

    await requestCallServer('remote:foo', []);

    expectActionHeader('remote:foo');
  });

  test('remaps raw ids when map entry is a string', async () => {
    (
      globalThis as typeof globalThis & {
        __MODERN_RSC_MF_ACTION_ID_MAP__?: Record<string, string | false>;
      }
    ).__MODERN_RSC_MF_ACTION_ID_MAP__ = {
      foo: 'remote:foo',
    };

    await requestCallServer('foo', []);

    expectActionHeader('remote:foo');
  });

  test('keeps raw ids when map entry is false', async () => {
    (
      globalThis as typeof globalThis & {
        __MODERN_RSC_MF_ACTION_ID_MAP__?: Record<string, string | false>;
      }
    ).__MODERN_RSC_MF_ACTION_ID_MAP__ = {
      foo: false,
    };

    await requestCallServer('foo', []);

    expectActionHeader('foo');
  });

  test('keeps raw ids when map entry is missing', async () => {
    (
      globalThis as typeof globalThis & {
        __MODERN_RSC_MF_ACTION_ID_MAP__?: Record<string, string | false>;
      }
    ).__MODERN_RSC_MF_ACTION_ID_MAP__ = {
      bar: 'remote:bar',
    };

    await requestCallServer('foo', []);

    expectActionHeader('foo');
  });
});
