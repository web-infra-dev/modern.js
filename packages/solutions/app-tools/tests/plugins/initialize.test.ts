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
};

function setupPlugin(userConfig: any): Hookable {
  const captured: Hookable = {};
  const api: any = {
    getAppContext: () => ({ appDirectory: '/tmp/app' }),
    getConfig: () => userConfig,
    updateAppContext: () => {},
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
    expect(configCb!().dev.lazyCompilation).toMatchObject({
      imports: true,
      entries: false,
    });
  });

  it('keeps react-dom eagerly compiled via the default test', () => {
    const { configCb } = setupPlugin({});
    const { test } = configCb!().dev.lazyCompilation;
    expect(
      test({
        resource:
          '/app/node_modules/.pnpm/react-dom@19.2.7/node_modules/react-dom/client.js',
      }),
    ).toBe(false);
    expect(test({ resource: '/app/node_modules/react-dom/index.js' })).toBe(
      false,
    );
    expect(test({ resource: '/app/src/routes/page.tsx' })).toBe(true);
    expect(test({})).toBe(true);
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
    expect(configCb!().dev.lazyCompilation).toMatchObject({
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
