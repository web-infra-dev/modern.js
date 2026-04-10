import { type Plugin, createPluginManager } from '@modern-js/plugin';
import { build } from '../../src/commands/build';

const mockGenerateRoutes = rstest.fn();
const mockSetupTsRuntime = rstest.fn();
const mockLoadServerPlugins = rstest.fn();

rstest.mock('../../src/utils/routes', () => ({
  __esModule: true,
  generateRoutes: () => mockGenerateRoutes(),
}));

rstest.mock('../../src/utils/register', () => ({
  __esModule: true,
  setupTsRuntime: (...args: unknown[]) => mockSetupTsRuntime(...args),
}));

rstest.mock('../../src/utils/loadPlugins', () => ({
  __esModule: true,
  loadServerPlugins: (...args: unknown[]) => mockLoadServerPlugins(...args),
}));

describe('command build', () => {
  afterAll(() => {
    rstest.resetAllMocks();
  });

  test('hooks should be invoke correctly', async () => {
    const mockBeforeBuild = { call: rstest.fn() };
    const mockAfterBuild = { call: rstest.fn() };
    const mockInternalServerPlugins = {
      call: rstest.fn(() => ({ plugins: [] })),
    };

    const mockAPI = {
      getAppContext: rstest.fn((): any => ({
        apiOnly: true,
        distDirectory: '',
        appDirectory: '',
      })),
      getNormalizedConfig: rstest.fn(),
      getHooks: (): any => ({
        onAfterBuild: mockAfterBuild,
        onBeforeBuild: mockBeforeBuild,
        _internalServerPlugins: mockInternalServerPlugins,
      }),
      updateAppContext: rstest.fn(),
    };

    mockLoadServerPlugins.mockImplementation(async (api: any) => {
      api.getHooks()._internalServerPlugins.call({ plugins: [] });
      return [];
    });

    const pluginManager = createPluginManager();
    pluginManager.addPlugins([
      {
        name: 'test',
        async setup(api) {
          await build(api as any);
          expect(mockBeforeBuild.call).toBeCalled();
          expect(mockGenerateRoutes).toBeCalled();
          expect(mockAfterBuild.call).toBeCalled();
          expect(mockInternalServerPlugins.call).toBeCalled();
          expect(mockSetupTsRuntime).toBeCalledWith('', '', [], {
            moduleType: undefined,
          });
        },
      } as Plugin,
    ]);
    const plugins = await pluginManager.getPlugins();
    for (const plugin of plugins) {
      await plugin.setup(mockAPI);
    }
  });
});
