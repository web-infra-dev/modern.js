import path from 'path';
import { runCli, initBeforeTest } from './utils';

initBeforeTest();

describe('normalize config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('no buildConfig and buildPreset, resolved is', async () => {
    const configFile = path.join(
      __dirname,
      './fixtures/normalize-config/empty.ts',
    );
    jest.mock('../src/builder', () => {
      const originalModule = jest.requireActual('../src/builder');

      return {
        __esModule: true,
        ...originalModule,
        run: async (_: any, resolvedConfigs: any) => {
          expect(resolvedConfigs).toMatchSnapshot();
        },
      };
    });
    await runCli({ argv: ['build'], configFile });
  });

  it('buildConfig is object, resolved is', async () => {
    const configFile = path.join(
      __dirname,
      './fixtures/normalize-config/build-config-object.ts',
    );
    jest.mock('../src/builder', () => {
      const originalModule = jest.requireActual('../src/builder');

      return {
        __esModule: true,
        ...originalModule,
        run: async (_: any, resolvedConfigs: any) => {
          expect(resolvedConfigs).toMatchSnapshot();
        },
      };
    });
    await runCli({ argv: ['build'], configFile });
  });

  it('buildConfig is array, resolved is', async () => {
    const configFile = path.join(
      __dirname,
      './fixtures/normalize-config/build-config-array.ts',
    );
    jest.mock('../src/builder', () => {
      const originalModule = jest.requireActual('../src/builder');

      return {
        __esModule: true,
        ...originalModule,
        run: async (_: any, resolvedConfigs: any) => {
          expect(resolvedConfigs).toMatchSnapshot();
        },
      };
    });
    await runCli({ argv: ['build'], configFile });
  });

  it('buildPreset is function, resolved is', async () => {
    const configFile = path.join(
      __dirname,
      './fixtures/normalize-config/preset-function.ts',
    );
    jest.mock('../src/builder', () => {
      const originalModule = jest.requireActual('../src/builder');

      return {
        __esModule: true,
        ...originalModule,
        run: async (_: any, resolvedConfigs: any) => {
          expect(resolvedConfigs).toMatchSnapshot();
        },
      };
    });
    await runCli({ argv: ['build'], configFile });
  });

  it('buildPreset is string, resolved is', async () => {
    const configFile = path.join(
      __dirname,
      './fixtures/normalize-config/preset-string.ts',
    );
    jest.mock('../src/builder', () => {
      const originalModule = jest.requireActual('../src/builder');

      return {
        __esModule: true,
        ...originalModule,
        run: async (_: any, resolvedConfigs: any) => {
          expect(resolvedConfigs).toMatchSnapshot();
        },
      };
    });
    await runCli({ argv: ['build'], configFile });
  });

  it('buildConfig with buildPreset, resolved is', async () => {
    const configFile = path.join(
      __dirname,
      './fixtures/normalize-config/config-with-preset.ts',
    );
    jest.mock('../src/builder', () => {
      const originalModule = jest.requireActual('../src/builder');

      return {
        __esModule: true,
        ...originalModule,
        run: async (_: any, resolvedConfigs: any) => {
          expect(resolvedConfigs).toMatchSnapshot();
        },
      };
    });
    await runCli({ argv: ['build'], configFile });
  });

  it('buildPreset function not return value', async () => {
    const configFile = path.join(
      __dirname,
      './fixtures/normalize-config/preset-function-no-return.ts',
    );
    jest.mock('../src/config/normalize.ts', () => {
      const originalModule = jest.requireActual('../src/config/normalize');

      return {
        __esModule: true,
        ...originalModule,
        normalizeBuildConfig: async (...rest: any) => {
          try {
            await originalModule.normalizeBuildConfig(...rest);
          } catch (e) {
            expect((e as Error).message).toBe(
              'buildPreset函数不允许返回值为空',
            );
          }
        },
      };
    });
    await runCli({ argv: ['build'], configFile });
  });
});
