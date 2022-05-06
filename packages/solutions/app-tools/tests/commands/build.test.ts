import { manager } from '@modern-js/core';
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
    const mockBeforeBuild = jest.fn();
    const mockAfterBuild = jest.fn();
    const mockAPI = {
      useAppContext: jest.fn((): any => ({
        apiOnly: true,
        distDirectory: '',
        appDirectory: '',
      })),
      useResolvedConfigContext: jest.fn(),
      useHookRunners: (): any => ({
        afterBuild: mockAfterBuild,
        beforeBuild: mockBeforeBuild,
      }),
    };

    const cloned = manager.clone(mockAPI);
    cloned.usePlugin({
      async setup(api) {
        await build(api);
        expect(mockBeforeBuild).toBeCalled();
        expect(mockGenerateRoutes).toBeCalled();
        expect(mockAfterBuild).toBeCalled();
      },
    });
    await cloned.init();
  });
});
