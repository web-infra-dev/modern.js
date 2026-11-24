import { logger } from '@modern-js/utils';

const compile = rstest.fn();
rstest.mock('@modern-js/server-utils', () => ({ compile }));

type Hook = (...args: any[]) => Promise<void> | void;

const setupPlugin = async () => {
  const { bffPlugin } = await import('../src/cli');
  const hooks: Record<string, Hook> = {};
  const api = new Proxy(
    {
      getAppContext: () => ({
        appDirectory: __dirname,
        distDirectory: `${__dirname}/dist`,
        apiDirectory: `${__dirname}/fixtures/function/api`,
        lambdaDirectory: `${__dirname}/fixtures/function/api/lambda`,
        moduleType: 'commonjs',
      }),
      getNormalizedConfig: () => ({
        bff: { crossProject: true },
        source: {},
        resolve: {},
        output: {},
      }),
    } as Record<string, unknown>,
    {
      get: (target, key: string) =>
        key in target ? target[key] : (fn: Hook) => (hooks[key] = fn),
    },
  );
  bffPlugin().setup(api as any);
  return hooks;
};

describe('bffPlugin compile errors', () => {
  afterEach(() => {
    compile.mockReset();
  });

  it('logs a compile error at dev time instead of stopping the dev server', async () => {
    compile.mockRejectedValue(new Error('TypeScript compilation failed'));
    const error = rstest.spyOn(logger, 'error').mockImplementation(() => {});
    const hooks = await setupPlugin();
    try {
      await hooks.onBeforeDev().catch(() => {});
      expect(compile).toHaveBeenCalledTimes(1);
      expect(String(error.mock.calls[0][0])).toContain(
        'TypeScript compilation failed',
      );
    } finally {
      error.mockRestore();
    }
  });

  it('lets a compile error fail the build', async () => {
    compile.mockRejectedValue(new Error('TypeScript compilation failed'));
    const hooks = await setupPlugin();
    await expect(hooks.onAfterBuild()).rejects.toThrow(
      'TypeScript compilation failed',
    );
  });
});
