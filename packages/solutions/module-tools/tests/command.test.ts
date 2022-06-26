import { build } from '../src/commands/build';

describe('build command', () => {
  const defaultOption = {
    watch: false,
    tsconfig: './tsconfig.json',
    tsc: true,
    dts: false,
    clear: true,
    styleOnly: false,
  };
  // NB: must have 'mock' prefix
  const mockBuild = jest.fn();

  beforeAll(() => {
    jest.mock('../src/features/build', () => {
      return {
        __esModule: true,
        ...jest.requireActual('../src/features/build'),
        build: mockBuild,
      };
    });

    jest.mock('../src/utils/valide', () => {
      return {
        __esModule: true,
        ...jest.requireActual('../src/utils/valide'),
        valideBeforeTask: jest.fn(),
      };
    });
  });

  test(`build function, with options '{ watch: true }'`, async () => {
    // NB: must have 'mock' prefix
    const mockAPI = {
      useAppContext: () => ({ appDirectory: 'app' }),
      useResolvedConfigContext: () => ({ output: {} }),
    } as any;
    await build(mockAPI, { ...defaultOption, watch: true });
    expect(mockBuild.mock.calls[0][1].enableWatchMode).toBeTruthy();
  });
});
