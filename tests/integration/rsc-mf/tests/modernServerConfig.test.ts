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
    c: { req: { url: string }; res?: Response },
    next: () => Promise<void>,
  ) => Promise<void>;
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

    expect(fetchMock).toHaveBeenCalledTimes(1);
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

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(context.res).toBeUndefined();
  });
});
