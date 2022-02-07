import { build } from '../../src/commands/build';

const mockBeforeBuild = jest.fn();
const mockAfterBuild = jest.fn();
const mockGenerateRoutes = jest.fn();

jest.mock('@modern-js/core', () => ({
  __esModule: true,
  mountHook() {
    return {
      beforeBuild: mockBeforeBuild,
      afterBuild: mockAfterBuild,
    };
  },
  useAppContext: jest.fn(() => ({
    existSrc: false,
  })),
  useResolvedConfigContext: jest.fn(),
}));

jest.mock('../../src/utils/routes', () => ({
  __esModule: true,
  generateRoutes: () => mockGenerateRoutes(),
}));

describe('command build', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  test('existSrc is false', async () => {
    await build();
    expect(mockBeforeBuild).toBeCalled();
    expect(mockGenerateRoutes).toBeCalled();
    expect(mockAfterBuild).toBeCalled();
  });
});
