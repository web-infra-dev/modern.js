import { createServer } from 'node:http';
import initializePlugin from '../../src/plugins/initialize';

// Keep the real `isLazyCompilationSafeByDefault`, but stub `createDefaultConfig`
// so the test focuses on the lazyCompilation injection rather than the full
// default config (which needs a heavy appContext).
rstest.mock('../../src/config', () => {
  const actual =
    rstest.requireActual<typeof import('../../src/config')>('../../src/config');
  return {
    ...actual,
    createDefaultConfig: () => ({ dev: {} }),
  };
});

type Hookable = {
  configCb?: () => any;
  modifyCb?: (resolved: any) => Promise<any> | any;
  updatedContext?: Record<string, unknown>;
};

function setupPlugin(
  userConfig: any,
  appContext: Record<string, unknown> = { appDirectory: '/tmp/app' },
): Hookable {
  const captured: Hookable = {};
  const api: any = {
    getAppContext: () => appContext,
    getConfig: () => userConfig,
    updateAppContext: (context: Record<string, unknown>) => {
      captured.updatedContext = context;
    },
    config: (cb: any) => {
      captured.configCb = cb;
    },
    modifyResolvedConfig: (cb: any) => {
      captured.modifyCb = cb;
    },
  };
  initializePlugin().setup(api);
  return captured;
}

describe('initialize plugin: default lazyCompilation', () => {
  it('injects { imports: true, entries: false } for CSR when user has not set it', () => {
    const { configCb } = setupPlugin({});
    expect(configCb!().dev.lazyCompilation).toEqual({
      imports: true,
      entries: false,
    });
  });

  it('does not override an explicit user `false`', () => {
    const { configCb } = setupPlugin({ dev: { lazyCompilation: false } });
    // api.config() is low priority; we simply must not inject our default.
    expect(configCb!().dev.lazyCompilation).toBeUndefined();
  });

  it('does not override an explicit user object', () => {
    const { configCb } = setupPlugin({
      dev: { lazyCompilation: { imports: false } },
    });
    expect(configCb!().dev.lazyCompilation).toBeUndefined();
  });

  it('injects for stream SSR (ssr: true)', () => {
    const { configCb } = setupPlugin({ server: { ssr: true } });
    expect(configCb!().dev.lazyCompilation).toEqual({
      imports: true,
      entries: false,
    });
  });

  it('does not inject for string SSR', () => {
    const { configCb } = setupPlugin({
      server: { ssr: { mode: 'string' } },
    });
    expect(configCb!().dev.lazyCompilation).toBeUndefined();
  });

  it('does not inject for RSC', () => {
    const { configCb } = setupPlugin({ server: { rsc: true } });
    expect(configCb!().dev.lazyCompilation).toBeUndefined();
  });
});

describe('initialize plugin: programmatic dev port', () => {
  it.each(['dev', 'start'])(
    'selects an available port for appContext.command=%s',
    async command => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const occupiedServer = createServer();
      await new Promise<void>(resolve => {
        occupiedServer.listen(0, '0.0.0.0', resolve);
      });
      const address = occupiedServer.address();
      const occupiedPort =
        typeof address === 'object' && address ? address.port : 0;

      try {
        const captured = setupPlugin({}, { appDirectory: '/tmp/app', command });
        await captured.modifyCb?.({
          dev: {},
          output: {},
          server: { port: occupiedPort },
          source: {},
        });

        expect(captured.updatedContext?.port).not.toBe(occupiedPort);
      } finally {
        await new Promise<void>((resolve, reject) => {
          occupiedServer.close(error => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
        if (previousNodeEnv === undefined) {
          delete process.env.NODE_ENV;
        } else {
          process.env.NODE_ENV = previousNodeEnv;
        }
      }
    },
  );
});
