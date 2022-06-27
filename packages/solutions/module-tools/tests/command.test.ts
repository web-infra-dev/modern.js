import path from 'path';
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
  // NB: must have 'mock' prefix
  const mockAPI = {
    useAppContext: () => ({
      appDirectory: path.join(__dirname, './fixtures/ts-app'),
    }),
    useResolvedConfigContext: () => ({ output: {} }),
  } as any;

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

  beforeEach(() => {
    // jest.restoreAllMocks();
    mockBuild.mockClear();
  });

  test(`build function, with default options`, async () => {
    await build(mockAPI, { ...defaultOption });
    const config = mockBuild.mock.calls[0][1];
    expect(config.enableWatchMode).toBeFalsy();
    expect(config.enableDtsGen).toBeFalsy();
    expect(config.isTsProject).toBeTruthy();
    expect(config.tsconfigName).toBe('./tsconfig.json');
    expect(config.outputPath).toBe('dist');
    expect(config.styleOnly).toBeFalsy();
    expect(config.platform).toBeFalsy();
    expect(config.clear).toBeTruthy();
    expect(config.legacyTsc).toBeTruthy();
  });

  test(`build function, with options '{ watch: true }'`, async () => {
    await build(mockAPI, { ...defaultOption, watch: true });
    expect(mockBuild.mock.calls[0][1].enableWatchMode).toBeTruthy();
  });

  test(`build function, with options '{ tsconfig: "./tsconfig.build.json" }'`, async () => {
    await build(mockAPI, {
      ...defaultOption,
      tsconfig: './tsconfig.build.json',
    });
    expect(mockBuild.mock.calls[0][1].tsconfigName).toBe(
      './tsconfig.build.json',
    );
  });

  test(`build function, with options '{ tsc: false }'`, async () => {
    await build(mockAPI, {
      ...defaultOption,
      tsc: false,
    });
    expect(mockBuild.mock.calls[0][1].legacyTsc).toBe(false);
    expect(mockBuild.mock.calls[0][1].enableDtsGen).toBe(false);
  });

  test(`build function, with options '{ platform: 'storybook' }'`, async () => {
    await build(mockAPI, {
      ...defaultOption,
      platform: 'storybook',
    });
    expect(mockBuild.mock.calls[0][1].platform).toBe('storybook');
  });

  test(`build function, with options '{ styleOnly: true }'`, async () => {
    await build(mockAPI, {
      ...defaultOption,
      styleOnly: true,
    });
    expect(mockBuild.mock.calls[0][1].styleOnly).toBe(true);
  });

  test(`build function, with options '{ dts: true } in ts project'`, async () => {
    await build(mockAPI, {
      ...defaultOption,
      dts: true,
    });
    expect(mockBuild.mock.calls[0][1].enableDtsGen).toBe(true);
  });

  test(`build function, with options '{ dts: true } in js project'`, async () => {
    await build(
      {
        ...mockAPI,
        useAppContext: () => ({
          appDirectory: path.join(__dirname, './fixtures/js-app'),
        }),
      },
      {
        ...defaultOption,
        dts: true,
      },
    );
    expect(mockBuild.mock.calls[0][1].isTsProject).toBe(false);
    expect(mockBuild.mock.calls[0][1].enableDtsGen).toBe(false);
  });

  test(`build function, with options '{ clear: false }'`, async () => {
    await build(mockAPI, {
      ...defaultOption,
      clear: false,
    });
    expect(mockBuild.mock.calls[0][1].clear).toBe(false);
  });

  test(`build function, with modernConfig  '{ output: { path: 'output' } }'`, async () => {
    await build(
      {
        ...mockAPI,
        useResolvedConfigContext() {
          return {
            output: {
              path: 'output',
            },
          };
        },
      },
      {
        ...defaultOption,
        clear: false,
      },
    );
    expect(mockBuild.mock.calls[0][1].outputPath).toBe('output');
  });
});
