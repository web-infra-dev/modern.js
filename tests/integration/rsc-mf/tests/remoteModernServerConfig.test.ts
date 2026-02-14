import { INTERNAL_FALLBACK_HEADER } from '../shared/manifestFallback';

const REMOTE_SERVER_CONFIG_MODULE = '../remote/server/modern.server';

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

  it('strips transfer headers from recovered fallback responses', async () => {
    const handler = getRecoverMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    installFetchMock(
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
          new Response('fallback-with-transport-headers', {
            status: 200,
            headers: {
              'content-type': 'application/javascript',
              'content-length': '999',
              'content-encoding': 'gzip',
              'transfer-encoding': 'chunked',
            },
          }),
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

    expect(next).not.toHaveBeenCalled();
    expect(context.res?.headers.get('content-type')).toBe(
      'application/javascript',
    );
    expect(context.res?.headers.get('content-length')).toBeNull();
    expect(context.res?.headers.get('content-encoding')).toBeNull();
    expect(context.res?.headers.get('transfer-encoding')).toBeNull();
    await expect(context.res?.text()).resolves.toBe(
      'fallback-with-transport-headers',
    );
  });

  it('recovers stale hashed expose asset path via remote manifest fallback', async () => {
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
                        'static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
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
          new Response('hashed-fallback-asset', {
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
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.deadbeef12.js',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
      {
        headers: {
          [INTERNAL_FALLBACK_HEADER]: '1',
        },
      },
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('hashed-fallback-asset');
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

  it('recovers stale css expose assets via manifest fallback', async () => {
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
                      sync: [],
                      async: [],
                    },
                    css: {
                      sync: [
                        'static/css/async/__federation_expose_RemoteClientCounter.9f773de2aa.css',
                      ],
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
          new Response('.fallback-style{}', {
            status: 200,
            headers: {
              'content-type': 'text/css',
            },
          }),
        ),
    );
    const context: {
      req: { url: string; headers?: { get?: (name: string) => string | null } };
      res?: Response;
    } = {
      req: {
        url: 'http://127.0.0.1:3008/static/css/async/__federation_expose_RemoteClientCounter.css?cache=1',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:3008/static/css/async/__federation_expose_RemoteClientCounter.9f773de2aa.css?cache=1',
      {
        headers: {
          [INTERNAL_FALLBACK_HEADER]: '1',
        },
      },
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('.fallback-style{}');
  });

  it('recovers stale hashed css expose assets via manifest fallback', async () => {
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
                      sync: [],
                      async: [],
                    },
                    css: {
                      sync: [
                        'static/css/async/__federation_expose_RemoteClientCounter.9f773de2aa.css',
                      ],
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
          new Response('.hashed-fallback-style{}', {
            status: 200,
            headers: {
              'content-type': 'text/css',
            },
          }),
        ),
    );
    const context: {
      req: { url: string; headers?: { get?: (name: string) => string | null } };
      res?: Response;
    } = {
      req: {
        url: 'http://127.0.0.1:3008/static/css/async/__federation_expose_RemoteClientCounter.deadbeef12.css?cache=1',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:3008/static/css/async/__federation_expose_RemoteClientCounter.9f773de2aa.css?cache=1',
      {
        headers: {
          [INTERNAL_FALLBACK_HEADER]: '1',
        },
      },
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('.hashed-fallback-style{}');
  });

  it('falls through when manifest response body is invalid json', async () => {
    const handler = getRecoverMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest.fn().mockResolvedValueOnce(
        new Response('not-json-manifest', {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        }),
      ),
    );
    const context: {
      req: { url: string; headers?: { get?: (name: string) => string | null } };
      res?: Response;
    } = {
      req: {
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when manifest request throws', async () => {
    const handler = getRecoverMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(async () => {
      throw new Error('manifest-fetch-failed');
    });
    const context: {
      req: { url: string; headers?: { get?: (name: string) => string | null } };
      res?: Response;
    } = {
      req: {
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when manifest fallback lookup has no canonical asset match', async () => {
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
                      'static/js/async/__federation_expose_other.abc123.js',
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
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when fallback asset fetch returns non-ok response', async () => {
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
                        'static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
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
          new Response('missing-fallback-asset', {
            status: 404,
            headers: {
              'content-type': 'text/plain',
            },
          }),
        ),
    );
    const context: {
      req: { url: string; headers?: { get?: (name: string) => string | null } };
      res?: Response;
    } = {
      req: {
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('merges request query params into absolute same-origin manifest fallback assets', async () => {
    const handler = getRecoverMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              shared: [
                {
                  assets: {
                    js: {
                      sync: [
                        'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js?manifest=1',
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
          new Response('absolute-fallback-asset', {
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
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.js?cache=1',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js?manifest=1&cache=1',
      {
        headers: {
          [INTERNAL_FALLBACK_HEADER]: '1',
        },
      },
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('absolute-fallback-asset');
  });

  it('lets request query params override manifest fallback query params', async () => {
    const handler = getRecoverMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              shared: [
                {
                  assets: {
                    js: {
                      sync: [
                        'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js?cache=manifest&v=1',
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
          new Response('query-override-fallback-asset', {
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
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.js?cache=request&x=2',
      },
    };

    await handler(context, next);

    const fallbackCallUrl = fetchMock.mock.calls[1]?.[0] as string;
    const parsedFallbackCallUrl = new URL(fallbackCallUrl);
    expect(parsedFallbackCallUrl.origin).toBe('http://127.0.0.1:3008');
    expect(parsedFallbackCallUrl.pathname).toBe(
      '/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
    );
    expect(parsedFallbackCallUrl.searchParams.get('cache')).toBe('request');
    expect(parsedFallbackCallUrl.searchParams.get('v')).toBe('1');
    expect(parsedFallbackCallUrl.searchParams.get('x')).toBe('2');
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe(
      'query-override-fallback-asset',
    );
  });

  it('falls through when fallback asset resolves to the same request url', async () => {
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
                      'static/js/async/__federation_expose_RemoteClientCounter.js',
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
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when manifest fallback path escapes async asset directory', async () => {
    const handler = getRecoverMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            shared: [
              {
                assets: {
                  js: {
                    sync: [
                      'static/js/async/../__federation_expose_RemoteClientCounter.7745fe5f0a.js',
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
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when manifest fallback path uses encoded async-directory escape', async () => {
    const handler = getRecoverMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            shared: [
              {
                assets: {
                  js: {
                    sync: [
                      'static/js/async/%2e%2e/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
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
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when manifest fallback path has invalid percent encoding', async () => {
    const handler = getRecoverMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            shared: [
              {
                assets: {
                  js: {
                    sync: [
                      'static/js/async/%E0%A4%A/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
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
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('resolves fallback asset paths from manifest async asset arrays', async () => {
    const handler = getRecoverMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              shared: [
                {
                  assets: {
                    js: {
                      sync: [],
                      async: [
                        'static/js/async/__federation_expose_nestedActions.a8ce95b11a.js',
                      ],
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
          new Response('async-array-fallback-hit', {
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
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_nestedActions.js',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:3008/static/js/async/__federation_expose_nestedActions.a8ce95b11a.js',
      {
        headers: {
          [INTERNAL_FALLBACK_HEADER]: '1',
        },
      },
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('async-array-fallback-hit');
  });

  it('matches fallback chunks with non-hex hash suffixes', async () => {
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
                        'static/js/async/__federation_expose_RemoteServerCard.a1b2c3x9.js',
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
          new Response('non-hex-fallback-hit', {
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
        url: 'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteServerCard.js',
      },
    };

    await handler(context, next);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:3008/static/js/async/__federation_expose_RemoteServerCard.a1b2c3x9.js',
      {
        headers: {
          [INTERNAL_FALLBACK_HEADER]: '1',
        },
      },
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('non-hex-fallback-hit');
  });
});
