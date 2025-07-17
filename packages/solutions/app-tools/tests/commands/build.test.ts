import { type Plugin, createPluginManager } from '@modern-js/plugin';
import { build } from '../../src/commands/build';

const mockGenerateRoutes = jest.fn();

jest.mock('../../src/utils/routes', () => ({
  __esModule: true,
  generateRoutes: () => mockGenerateRoutes(),
}));

describe('command build', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  test('hooks should be invoke correctly', async () => {
    const mockBeforeBuild = { call: jest.fn() };
    const mockAfterBuild = { call: jest.fn() };
    const mockInternalServerPlugins = {
      call: jest.fn(() => ({ plugins: [] })),
    };

    const mockAPI = {
      getAppContext: jest.fn((): any => ({
        apiOnly: true,
        distDirectory: '',
        appDirectory: '',
      })),
      getNormalizedConfig: jest.fn(),
      getHooks: (): any => ({
        onAfterBuild: mockAfterBuild,
        onBeforeBuild: mockBeforeBuild,
        _internalServerPlugins: mockInternalServerPlugins,
      }),
      updateAppContext: jest.fn(),
    };

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
        },
      } as Plugin,
    ]);
    const plugins = await pluginManager.getPlugins();
    for (const plugin of plugins) {
      await plugin.setup(mockAPI);
    }
  });
});
