const REMOTE_SERVER_CONFIG_MODULE = '../remote/server/modern.server';
const INTERNAL_FALLBACK_HEADER = 'x-rsc-mf-internal-fallback';

const loadRemoteServerConfig = () => {
  jest.resetModules();
  jest.doMock('@modern-js/server-runtime', () => ({
    defineServerConfig: (config: unknown) => config,
  }));

  let config: any;
  jest.isolateModules(() => {
    config = require(REMOTE_SERVER_CONFIG_MODULE).default;
  });

  return config;
};

const getRecoverMiddlewareHandler = () => {
  const config = loadRemoteServerConfig();
  if (!Array.isArray(config.middlewares)) {
    throw new Error('Remote server config did not provide a middlewares array');
  }

  const middleware = config.middlewares.find(
    (entry: { name?: string }) =>
      entry.name === 'recover-remote-federation-expose-asset',
  );
  if (!middleware) {
    throw new Error(
      'recover-remote-federation-expose-asset middleware missing',
    );
  }

  expect(middleware.order).toBe('pre');
  expect(middleware.before).toEqual(['server-static']);
  expect(typeof middleware.handler).toBe('function');

  return middleware.handler as (
    c: {
      req: { url: string; headers?: { get?: (name: string) => string | null } };
      res?: Response;
    },
    next: () => Promise<void>,
  ) => Promise<void>;
};

describe('rsc-mf remote modern.server middleware contracts', () => {
  const originalFetch = global.fetch;
  const originalFetchDescriptor = Object.getOwnPropertyDescriptor(
    global,
    'fetch',
  );

  const installFetchMock = (implementation: typeof fetch) => {
    const fetchMock = jest.fn(implementation);
    Object.defineProperty(global, 'fetch', {
      value: fetchMock,
      configurable: true,
      writable: true,
    });
    return fetchMock;
  };

  afterAll(() => {
    if (originalFetchDescriptor) {
      Object.defineProperty(global, 'fetch', originalFetchDescriptor);
      return;
    }
    global.fetch = originalFetch;
  });

  it('recovers stale expose asset path via remote manifest fallback', async () => {
    const handler = getRecoverMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              exposes: [
                {
                  assets: {
                    js: {
                      sync: [
                        'static/js/async/__federation_expose_RemoteServerCard.a1b2c3d4.js',
                      ],
                      async: [],
                    },
                    css: {
                      sync: [],
                      async: [],
                    },
                  },
                },
              ],
            }),
            {
              status: 200,
              headers: {
                'content-type': 'application/json',
              },
            },
          ),
        )
        .mockResolvedValueOnce(
          new Response('fallback-asset', {
            status: 200,
            headers: {
              'content-type': 'application/javascript',
            },
          }),
        ),
    );
    const context: {
      req: { url: string; headers?: { get?: (name: string) => string | null } };
      res?: Response;
    } = {
      req: {
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteServerCard.js?cache=1',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:3008/static/mf-manifest.json',
      {
        headers: {
          [INTERNAL_FALLBACK_HEADER]: '1',
        },
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteServerCard.a1b2c3d4.js?cache=1',
      {
        headers: {
          [INTERNAL_FALLBACK_HEADER]: '1',
        },
      },
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('fallback-asset');
  });

  it('falls through when request path is not a federated expose asset', async () => {
    const handler = getRecoverMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      async () => new Response('ignored', { status: 200 }),
    );
    const context: {
      req: { url: string; headers?: { get?: (name: string) => string | null } };
      res?: Response;
    } = {
      req: {
        url: 'http://127.0.0.1:3008/static/js/async/743.32436c1247.js',
      },
    };

    await handler(context, next);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('skips fallback when request is marked as internal middleware fetch', async () => {
    const handler = getRecoverMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      async () => new Response('ignored', { status: 200 }),
    );
    const context: {
      req: { url: string; headers?: { get?: (name: string) => string | null } };
      res?: Response;
    } = {
      req: {
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteServerCard.js',
        headers: {
          get: (name: string) =>
            name === INTERNAL_FALLBACK_HEADER ? '1' : undefined,
        },
      },
    };

    await handler(context, next);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when manifest fallback asset resolves to another origin', async () => {
    const handler = getRecoverMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            exposes: [
              {
                assets: {
                  js: {
                    sync: [
                      'https://cdn.example.com/static/js/async/__federation_expose_RemoteServerCard.a1b2c3d4.js',
                    ],
                    async: [],
                  },
                  css: {
                    sync: [],
                    async: [],
                  },
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        ),
      ),
    );
    const context: {
      req: { url: string; headers?: { get?: (name: string) => string | null } };
      res?: Response;
    } = {
      req: {
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteServerCard.js',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });
});
