import { INTERNAL_FALLBACK_HEADER } from '../shared/manifestFallback';

const HOST_SERVER_CONFIG_MODULE = '../host/server/modern.server';

const withRemotePort = <T>(remotePort: string | undefined, run: () => T): T => {
  const previousRemotePort = process.env.RSC_MF_REMOTE_PORT;
  if (typeof remotePort === 'undefined') {
    delete process.env.RSC_MF_REMOTE_PORT;
  } else {
    process.env.RSC_MF_REMOTE_PORT = remotePort;
  }

  try {
    return run();
  } finally {
    if (typeof previousRemotePort === 'undefined') {
      delete process.env.RSC_MF_REMOTE_PORT;
    } else {
      process.env.RSC_MF_REMOTE_PORT = previousRemotePort;
    }
  }
};

const loadHostServerConfig = () => {
  jest.resetModules();
  jest.doMock('@modern-js/server-runtime', () => ({
    defineServerConfig: (config: unknown) => config,
  }));

  let config: any;
  let loadError: unknown;
  jest.isolateModules(() => {
    try {
      config = require(HOST_SERVER_CONFIG_MODULE).default;
    } catch (error) {
      loadError = error;
    }
  });
  if (loadError) {
    const message =
      loadError instanceof Error
        ? loadError.stack || loadError.message
        : String(loadError);
    throw new Error(`Failed to load host server config: ${message}`);
  }
  return config;
};

const getProxyMiddlewareHandler = () => {
  const config = loadHostServerConfig();
  if (!Array.isArray(config.middlewares)) {
    throw new Error('Host server config did not provide a middlewares array');
  }
  const middleware = config.middlewares.find(
    (entry: { name?: string }) =>
      entry.name === 'proxy-remote-federation-asset',
  );
  if (!middleware) {
    throw new Error('proxy-remote-federation-asset middleware not found');
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

const expectInternalFallbackFetchCall = (
  fetchMock: jest.Mock,
  nthCall: number,
  url: string,
) => {
  expect(fetchMock).toHaveBeenNthCalledWith(nthCall, url, {
    headers: {
      [INTERNAL_FALLBACK_HEADER]: '1',
    },
  });
};

describe('rsc-mf host modern.server middleware contracts', () => {
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

  it('proxies federated async JS expose chunks to remote origin', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(async () => {
      return new Response('proxied-js', {
        status: 200,
        headers: {
          'content-type': 'application/javascript',
        },
      });
    });
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_infoBundle.11dea89e81.js?cache=1',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3999/static/js/async/__federation_expose_infoBundle.11dea89e81.js?cache=1',
    );
    expect(next).not.toHaveBeenCalled();
    expect(context.res).toBeInstanceOf(Response);
    await expect(context.res?.text()).resolves.toBe('proxied-js');
  });

  it('strips transfer headers from proxied upstream responses', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    installFetchMock(async () => {
      return new Response('proxied-with-transport-headers', {
        status: 200,
        headers: {
          'content-type': 'application/javascript',
          'content-length': '999',
          'content-encoding': 'gzip',
          connection: 'keep-alive, x-proxy-hop-header',
          'keep-alive': 'timeout=5',
          'x-proxy-hop-header': 'remove-me',
          te: 'trailers',
          trailer: 'x-trailer-a',
          upgrade: 'websocket',
          'transfer-encoding': 'chunked',
        },
      });
    });
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_infoBundle.11dea89e81.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(next).not.toHaveBeenCalled();
    expect(context.res?.headers.get('content-type')).toBe(
      'application/javascript',
    );
    expect(context.res?.headers.get('content-length')).toBeNull();
    expect(context.res?.headers.get('content-encoding')).toBeNull();
    expect(context.res?.headers.get('connection')).toBeNull();
    expect(context.res?.headers.get('keep-alive')).toBeNull();
    expect(context.res?.headers.get('x-proxy-hop-header')).toBeNull();
    expect(context.res?.headers.get('te')).toBeNull();
    expect(context.res?.headers.get('trailer')).toBeNull();
    expect(context.res?.headers.get('upgrade')).toBeNull();
    expect(context.res?.headers.get('transfer-encoding')).toBeNull();
    await expect(context.res?.text()).resolves.toBe(
      'proxied-with-transport-headers',
    );
  });

  it('proxies federated async CSS expose chunks to remote origin', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(async () => {
      return new Response('.remote-style{}', {
        status: 200,
        headers: {
          'content-type': 'text/css',
        },
      });
    });
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/css/async/__federation_expose_RemoteClientCounter.9f773de2aa.css',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3999/static/css/async/__federation_expose_RemoteClientCounter.9f773de2aa.css',
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('.remote-style{}');
  });

  it('proxies async JS chunks with react server component marker', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(async () => {
      return new Response('proxied-rsc-chunk', {
        status: 200,
        headers: {
          'content-type': 'application/javascript',
        },
      });
    });
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/503_react-server-components_0f2d4f91.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3999/static/js/async/503_react-server-components_0f2d4f91.js',
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('proxied-rsc-chunk');
  });

  it('proxies async JS chunks containing node_modules react markers', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(async () => {
      return new Response('proxied-react-chunk', {
        status: 200,
        headers: {
          'content-type': 'application/javascript',
        },
      });
    });
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/node_modules_pnpm_react_19.0.0_react-dom_19.0.0.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3999/static/js/async/node_modules_pnpm_react_19.0.0_react-dom_19.0.0.js',
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('proxied-react-chunk');
  });

  it('falls through when request path is outside federated asset patterns', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      async () => new Response('ignored', { status: 200 }),
    );
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/server-component-root.abc123.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('skips proxying when request is marked as internal fallback fetch', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      async () => new Response('ignored', { status: 200 }),
    );
    const context: {
      req: { url: string; headers?: { get?: (name: string) => string | null } };
      res?: Response;
    } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_actions.44d8f1d7ae.js',
        headers: {
          get: (name: string) =>
            name === INTERNAL_FALLBACK_HEADER ? '1' : undefined,
        },
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when remote port is not configured', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      async () => new Response('ignored', { status: 200 }),
    );
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_actions.44d8f1d7ae.js',
      },
    };

    await withRemotePort(undefined, () => handler(context, next));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when upstream returns non-ok response', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      async () => new Response('not-found', { status: 404 }),
    );
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_actions.44d8f1d7ae.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expectInternalFallbackFetchCall(
      fetchMock,
      2,
      'http://127.0.0.1:3999/static/mf-manifest.json',
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when upstream fetch throws', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(async () => {
      throw new Error('upstream-unreachable');
    });
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_actionBundle.c842b162f4.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expectInternalFallbackFetchCall(
      fetchMock,
      2,
      'http://127.0.0.1:3999/static/mf-manifest.json',
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('recovers from stale expose chunk path via manifest-driven fallback', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              exposes: [
                {
                  assets: {
                    js: {
                      sync: [
                        'static/js/async/__federation_expose_RemoteServerCard.6e997e54ed.js',
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
          new Response('fallback-hit', {
            status: 200,
            headers: {
              'content-type': 'application/javascript',
            },
          }),
        ),
    );
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteServerCard.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteServerCard.js',
    );
    expectInternalFallbackFetchCall(
      fetchMock,
      2,
      'http://127.0.0.1:3999/static/mf-manifest.json',
    );
    expectInternalFallbackFetchCall(
      fetchMock,
      3,
      'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteServerCard.6e997e54ed.js',
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('fallback-hit');
  });

  it('recovers stale hashed expose chunk path via manifest-driven fallback', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
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
          new Response('hashed-fallback-hit', {
            status: 200,
            headers: {
              'content-type': 'application/javascript',
            },
          }),
        ),
    );
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteClientCounter.deadbeef12.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteClientCounter.deadbeef12.js',
    );
    expectInternalFallbackFetchCall(
      fetchMock,
      2,
      'http://127.0.0.1:3999/static/mf-manifest.json',
    );
    expectInternalFallbackFetchCall(
      fetchMock,
      3,
      'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('hashed-fallback-hit');
  });

  it('recovers stale expose path when manifest match is under shared assets', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              shared: [
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
          new Response('shared-fallback-hit', {
            status: 200,
            headers: {
              'content-type': 'application/javascript',
            },
          }),
        ),
    );
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteClientCounter.js',
    );
    expectInternalFallbackFetchCall(
      fetchMock,
      2,
      'http://127.0.0.1:3999/static/mf-manifest.json',
    );
    expectInternalFallbackFetchCall(
      fetchMock,
      3,
      'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('shared-fallback-hit');
  });

  it('recovers stale CSS expose path via manifest-driven fallback', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
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
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/css/async/__federation_expose_RemoteClientCounter.css',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:3999/static/css/async/__federation_expose_RemoteClientCounter.css',
    );
    expectInternalFallbackFetchCall(
      fetchMock,
      2,
      'http://127.0.0.1:3999/static/mf-manifest.json',
    );
    expectInternalFallbackFetchCall(
      fetchMock,
      3,
      'http://127.0.0.1:3999/static/css/async/__federation_expose_RemoteClientCounter.9f773de2aa.css',
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('.fallback-style{}');
  });

  it('recovers stale hashed CSS expose path via manifest-driven fallback', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
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
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/css/async/__federation_expose_RemoteClientCounter.deadbeef12.css',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:3999/static/css/async/__federation_expose_RemoteClientCounter.deadbeef12.css',
    );
    expectInternalFallbackFetchCall(
      fetchMock,
      2,
      'http://127.0.0.1:3999/static/mf-manifest.json',
    );
    expectInternalFallbackFetchCall(
      fetchMock,
      3,
      'http://127.0.0.1:3999/static/css/async/__federation_expose_RemoteClientCounter.9f773de2aa.css',
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('.hashed-fallback-style{}');
  });

  it('falls through when manifest lookup has no matching fallback asset', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
        .mockResolvedValueOnce(
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
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteServerCard.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteServerCard.js',
    );
    expectInternalFallbackFetchCall(
      fetchMock,
      2,
      'http://127.0.0.1:3999/static/mf-manifest.json',
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when manifest response body is invalid JSON', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
        .mockResolvedValueOnce(
          new Response('not-json-manifest', {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          }),
        ),
    );
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteServerCard.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when manifest request throws after stale asset miss', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
        .mockRejectedValueOnce(new Error('manifest-fetch-failed')),
    );
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteServerCard.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('preserves query string when retrying manifest-resolved fallback asset', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
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
          new Response('query-fallback-hit', {
            status: 200,
            headers: {
              'content-type': 'application/javascript',
            },
          }),
        ),
    );
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteClientCounter.js?cache=1&v=2',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expectInternalFallbackFetchCall(
      fetchMock,
      3,
      'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js?cache=1&v=2',
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('query-fallback-hit');
  });

  it('supports absolute manifest fallback asset URLs and merges request query params', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              exposes: [
                {
                  assets: {
                    js: {
                      sync: [
                        'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js?manifest=1',
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
          new Response('absolute-query-fallback-hit', {
            status: 200,
            headers: {
              'content-type': 'application/javascript',
            },
          }),
        ),
    );
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteClientCounter.js?cache=1',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expectInternalFallbackFetchCall(
      fetchMock,
      3,
      'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js?manifest=1&cache=1',
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe(
      'absolute-query-fallback-hit',
    );
  });

  it('lets request query params override manifest fallback query params', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              exposes: [
                {
                  assets: {
                    js: {
                      sync: [
                        'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js?cache=manifest&v=1',
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
          new Response('query-override-fallback-hit', {
            status: 200,
            headers: {
              'content-type': 'application/javascript',
            },
          }),
        ),
    );
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteClientCounter.js?cache=request&x=2',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    const fallbackCallUrl = fetchMock.mock.calls[2]?.[0] as string;
    const parsedFallbackCallUrl = new URL(fallbackCallUrl);
    expect(parsedFallbackCallUrl.origin).toBe('http://127.0.0.1:3999');
    expect(parsedFallbackCallUrl.pathname).toBe(
      '/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
    );
    expect(parsedFallbackCallUrl.searchParams.get('cache')).toBe('request');
    expect(parsedFallbackCallUrl.searchParams.get('v')).toBe('1');
    expect(parsedFallbackCallUrl.searchParams.get('x')).toBe('2');
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe(
      'query-override-fallback-hit',
    );
  });

  it('falls through when manifest fallback asset URL points to another origin', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              exposes: [
                {
                  assets: {
                    js: {
                      sync: [
                        'https://cdn.example.com/static/js/async/__federation_expose_RemoteClientCounter.7745fe5f0a.js',
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
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when manifest fallback resolves to original request URL', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
        .mockResolvedValueOnce(
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
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when manifest fallback path escapes async asset directory', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
        .mockResolvedValueOnce(
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
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when manifest fallback path uses encoded async-directory escape', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
        .mockResolvedValueOnce(
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
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('falls through when manifest fallback path has invalid percent encoding', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
        .mockResolvedValueOnce(
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
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteClientCounter.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });

  it('matches fallback chunks when manifest hash suffix includes non-hex characters', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
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
          new Response('non-hex-hash-fallback-hit', {
            status: 200,
            headers: {
              'content-type': 'application/javascript',
            },
          }),
        ),
    );
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_RemoteServerCard.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expectInternalFallbackFetchCall(
      fetchMock,
      3,
      'http://127.0.0.1:3999/static/js/async/__federation_expose_RemoteServerCard.a1b2c3x9.js',
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe(
      'non-hex-hash-fallback-hit',
    );
  });

  it('resolves fallback asset paths from manifest async asset arrays', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 }))
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
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/__federation_expose_nestedActions.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expectInternalFallbackFetchCall(
      fetchMock,
      3,
      'http://127.0.0.1:3999/static/js/async/__federation_expose_nestedActions.a8ce95b11a.js',
    );
    expect(next).not.toHaveBeenCalled();
    await expect(context.res?.text()).resolves.toBe('async-array-fallback-hit');
  });

  it('does not attempt manifest fallback for non-expose marker chunk paths', async () => {
    const handler = getProxyMiddlewareHandler();
    const next = jest.fn(async (): Promise<void> => undefined);
    const fetchMock = installFetchMock(
      jest
        .fn()
        .mockResolvedValueOnce(new Response('not-found', { status: 404 })),
    );
    const context: { req: { url: string }; res?: Response } = {
      req: {
        url: 'http://127.0.0.1:3007/static/js/async/503_react-server-components_0f2d4f91.js',
      },
    };

    await withRemotePort('3999', () => handler(context, next));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3999/static/js/async/503_react-server-components_0f2d4f91.js',
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });
});
