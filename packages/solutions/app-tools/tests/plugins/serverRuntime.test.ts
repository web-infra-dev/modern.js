import serverRuntimePlugin from '../../src/plugins/serverRuntime';

const isPackageInstalled = rstest.fn();

rstest.mock('@modern-js/utils', () => {
  const actual =
    rstest.requireActual<typeof import('@modern-js/utils')>('@modern-js/utils');
  return {
    ...actual,
    isPackageInstalled: (...args: unknown[]) => isPackageInstalled(...args),
  };
});

function runConfigHook(appDirectory = '/tmp/app') {
  let configCb: (() => any) | undefined;
  const api: any = {
    getAppContext: () => ({ appDirectory }),
    config: (cb: any) => {
      configCb = cb;
    },
  };

  serverRuntimePlugin().setup(api);

  expect(configCb).toBeTypeOf('function');
  return configCb!();
}

describe('server runtime plugin', () => {
  beforeEach(() => {
    isPackageInstalled.mockReset();
  });

  it('externalizes the package when the app can resolve it', () => {
    isPackageInstalled.mockReturnValue(true);

    expect(runConfigHook()).toEqual({
      output: {
        externals: [
          { '@modern-js/server-runtime': '@modern-js/server-runtime' },
        ],
      },
    });
    expect(isPackageInstalled).toHaveBeenCalledWith(
      '@modern-js/server-runtime',
      '/tmp/app',
    );
  });

  // An unresolvable external leaves a `require()` in the SSR bundle that throws
  // at load time, which degrades rendering to CSR without surfacing an error.
  // Frameworks that re-export this package under their own name land here.
  it('keeps the package bundled when the app cannot resolve it', () => {
    isPackageInstalled.mockReturnValue(false);

    expect(runConfigHook()).toEqual({});
  });
});
