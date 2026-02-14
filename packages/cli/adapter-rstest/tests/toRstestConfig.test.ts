import { describe, expect, test } from '@rstest/core';
import { toRstestExtendConfig } from '../src/toRstestConfig';

describe('toRstestExtendConfig', () => {
  test('should convert base rsbuild config to rstest config', () => {
    const plugin = { name: 'p' } as any;
    const config = toRstestExtendConfig({
      root: '/project',
      plugins: [plugin],
      resolve: {
        alias: {
          '@': '/project/src',
        },
      },
      source: {
        define: {
          __DEV__: 'true',
        },
        tsconfigPath: './tsconfig.json',
      },
      output: {
        target: 'web',
        cssModules: {
          auto: true,
        },
        module: false,
      },
      tools: {
        rspack: {
          mode: 'development',
        },
      },
    });

    expect(config).toEqual({
      root: '/project',
      name: undefined,
      plugins: [plugin],
      source: {
        decorators: undefined,
        define: {
          __DEV__: 'true',
        },
        include: undefined,
        exclude: undefined,
        tsconfigPath: './tsconfig.json',
      },
      resolve: {
        alias: {
          '@': '/project/src',
        },
      },
      output: {
        cssModules: {
          auto: true,
        },
        module: false,
      },
      tools: {
        rspack: {
          mode: 'development',
        },
        swc: undefined,
        bundlerChain: undefined,
      },
      testEnvironment: 'happy-dom',
    });
  });

  test('should merge environment config by environment name', () => {
    const config = toRstestExtendConfig(
      {
        source: {
          define: {
            A: '"base"',
          },
        },
        output: {
          target: 'web',
          module: false,
        },
        environments: {
          server: {
            source: {
              define: {
                B: '"server"',
              },
            },
            output: {
              target: 'node',
            },
          },
        },
      },
      'server',
    );

    expect(config.name).toBe('server');
    expect(config.source?.define).toEqual({
      A: '"base"',
      B: '"server"',
    });
    expect(config.output?.module).toBe(false);
    expect(config.testEnvironment).toBe('node');
  });
});
