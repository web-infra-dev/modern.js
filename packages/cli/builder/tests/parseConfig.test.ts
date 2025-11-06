import type { OutputConfig } from '@rsbuild/core';
import { afterAll, afterEach, describe, expect, test } from 'vitest';
import { parseCommonConfig } from '../src/shared/parseCommonConfig';
import type { BuilderConfig } from '../src/types';

describe('parseCommonConfig', () => {
  const env = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = env;
  });

  test('merge config', async () => {
    class A {
      a = 1;

      apply() {
        return this.a;
      }
    }

    const config = await parseCommonConfig(
      {
        tools: {
          rspack: {
            plugins: [new A()],
          },
        },
      },
      {
        cwd: '',
      },
    );

    // @ts-expect-error
    const plugin = config.rsbuildConfig.tools!.rspack!.plugins![0];

    expect(plugin instanceof A).toBeTruthy();
  });

  test('output.disableCssModuleExtension', async () => {
    expect(
      (
        await parseCommonConfig({
          output: {
            disableCssModuleExtension: true,
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('output.assetsRetry', async () => {
    expect(
      (await parseCommonConfig({}, {})).rsbuildPlugins.some(
        item => item.name === 'rsbuild:assets-retry',
      ),
    ).toBeFalsy();

    expect(
      (
        await parseCommonConfig({
          output: {
            assetsRetry: {},
          },
        })
      ).rsbuildPlugins.some(item => item.name === 'rsbuild:assets-retry'),
    ).toBeTruthy();
  });

  test('dev.xxx', async () => {
    process.env.NODE_ENV = 'development';
    expect(
      (
        await parseCommonConfig({
          dev: {
            https: {
              key: 'xxxx',
              cert: 'xxx',
            },
            host: 'xxx.xxx',
            client: {
              path: '/aaaa',
            },
            hmr: false,
          },
          tools: {
            devServer: {
              compress: false,
              headers: {
                'X-Custom-Foo': 'bar',
              },
              historyApiFallback: true,
            },
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();

    process.env.NODE_ENV = 'production';
    expect(
      (
        await parseCommonConfig({
          dev: {
            https: {
              key: 'xxxx',
              cert: 'xxx',
            },
            host: 'xxx.xxx',
          },
          tools: {
            devServer: {
              historyApiFallback: true,
            },
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();
  });

  const injectStylesCases: [BuilderConfig['output'], OutputConfig][] = [
    [{}, { injectStyles: undefined }],
    [{ injectStyles: true }, { injectStyles: true }],
    [{ injectStyles: false }, { injectStyles: false }],
  ];
  describe('output.injectStyles', () => {
    for (const [config, output] of injectStylesCases) {
      test(`${JSON.stringify(config)} => ${JSON.stringify(
        output,
      )}`, async () => {
        expect(
          (await parseCommonConfig({ output: config })).rsbuildConfig.output
            ?.injectStyles,
        ).toEqual(output.injectStyles);
      });
    }
  });

  describe('CSS source map configuration', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('should not set css source map when output.sourceMap is true', async () => {
      const config = await parseCommonConfig({
        output: {
          sourceMap: true,
        },
      });

      expect(config.rsbuildConfig.output?.sourceMap).toBe(true);
      expect(config.rsbuildConfig.output?.sourceMap).not.toHaveProperty('css');
    });

    test('should set css source map to false when output.sourceMap is false', async () => {
      const config = await parseCommonConfig({
        output: {
          sourceMap: false,
        },
      });

      expect(config.rsbuildConfig.output?.sourceMap).toEqual(false);
    });

    test('should set css source map to true when output.sourceMap.css is explicitly true', async () => {
      const config = await parseCommonConfig({
        output: {
          sourceMap: {
            css: true,
          },
        },
      });

      expect(config.rsbuildConfig.output?.sourceMap).toEqual({
        css: true,
      });
    });

    test('should set css source map to false when output.sourceMap.css is explicitly false', async () => {
      const config = await parseCommonConfig({
        output: {
          sourceMap: {
            css: false,
          },
        },
      });

      expect(config.rsbuildConfig.output?.sourceMap).toEqual({
        css: false,
      });
    });

    test('should set css source map to true when output.sourceMap.css is undefined in development', async () => {
      process.env.NODE_ENV = 'development';

      const config = await parseCommonConfig({
        output: {
          sourceMap: {
            js: true,
          },
        },
      });

      expect(config.rsbuildConfig.output?.sourceMap).toEqual({
        js: true,
        css: true,
      });
    });

    test('should set css source map to false when output.sourceMap.css is undefined in production', async () => {
      process.env.NODE_ENV = 'production';

      const config = await parseCommonConfig({
        output: {
          sourceMap: {
            js: true,
          },
        },
      });

      expect(config.rsbuildConfig.output?.sourceMap).toEqual({
        js: true,
        css: false,
      });
    });

    test('should set css source map to true when output.sourceMap is undefined in development', async () => {
      process.env.NODE_ENV = 'development';

      const config = await parseCommonConfig({
        output: {},
      });

      expect(config.rsbuildConfig.output?.sourceMap).toEqual({
        css: true,
      });
    });

    test('should set css source map to false when output.sourceMap is undefined in production', async () => {
      process.env.NODE_ENV = 'production';

      const config = await parseCommonConfig({
        output: {},
      });

      expect(config.rsbuildConfig.output?.sourceMap).toEqual({
        css: false,
      });
    });

    test('should respect explicitly set css source map in development', async () => {
      process.env.NODE_ENV = 'development';

      const config = await parseCommonConfig({
        output: {
          sourceMap: {
            css: false,
          },
        },
      });

      // Even in development, if explicitly set to false, it should remain false
      expect(config.rsbuildConfig.output?.sourceMap).toEqual({
        css: false,
      });
    });

    test('should respect explicitly set css source map in production', async () => {
      process.env.NODE_ENV = 'production';

      const config = await parseCommonConfig({
        output: {
          sourceMap: {
            css: true,
          },
        },
      });

      // Even in production, if explicitly set to true, it should remain true
      expect(config.rsbuildConfig.output?.sourceMap).toEqual({
        css: true,
      });
    });

    test('should work with source.dedupe', async () => {
      const config = await parseCommonConfig({
        source: {
          dedupe: ['react'],
        },
      });

      expect(config.rsbuildConfig.resolve?.dedupe).toEqual(['react']);
    });
  });
});
