import { manager } from '@modern-js/core';
import { build } from '../../src/commands/build';

const mockBeforeBuild = jest.fn();
const mockAfterBuild = jest.fn();
const mockGenerateRoutes = jest.fn();

jest.mock('@modern-js/core', () => {
  return {
    __esModule: true,
    ...jest.requireActual('@modern-js/core'),
    mountHook() {
      return {
        beforeBuild: mockBeforeBuild,
        afterBuild: mockAfterBuild,
      };
    },
  };
});

jest.mock('../../src/utils/routes', () => ({
  __esModule: true,
  generateRoutes: () => mockGenerateRoutes(),
}));

describe('command build', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  test('existSrc is false', async () => {
    const mockAPI = {
      useAppContext: jest.fn(
        () =>
          ({
            existSrc: false,
            distDirectory: '',
          } as any),
      ),
      useResolvedConfigContext: jest.fn(),
    };

    manager.clone(mockAPI).usePlugin({
      async setup(api) {
        await build(api);
        expect(mockBeforeBuild).toBeCalled();
        expect(mockGenerateRoutes).toBeCalled();
        expect(mockAfterBuild).toBeCalled();
      },
    });
    await manager.init();
  });
});
