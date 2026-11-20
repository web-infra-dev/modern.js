import { afterEach, describe, expect, rs, test } from '@rstest/core';
import { parseCommonConfig } from '../src/shared/parseCommonConfig';

describe('parseCommonConfig', () => {
  afterEach(() => {
    rs.unstubAllEnvs();
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

  test('disableCssModuleExtension distinguishes application styles from dependency styles', async () => {
    const { rsbuildConfig } = await parseCommonConfig({
      output: { disableCssModuleExtension: true },
    });
    const auto = rsbuildConfig.output?.cssModules?.auto;
    if (typeof auto !== 'function') {
      throw new Error('Expected a CSS module filename matcher');
    }
    expect(auto('/app/styles.css', '', '')).toBe(true);
    expect(auto('/app/styles.global.css', '', '')).toBe(false);
    expect(auto('/app/node_modules/pkg/styles.css', '', '')).toBe(false);
    expect(auto('/app/node_modules/pkg/styles.module.css', '', '')).toBe(true);
  });

  test('output.assetsRetry', async () => {
    expect(
      (await parseCommonConfig({})).rsbuildPlugins.some(
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

  test('tools.htmlPlugin should preserve async template parameters', async () => {
    const { rsbuildConfig } = await parseCommonConfig({
      html: {
        mountId: 'app',
      },
    });
    const htmlPlugin = rsbuildConfig.tools!.htmlPlugin as (
      config: Record<string, any>,
    ) => void;
    const config = {
      title: 'Modern.js',
      templateParameters: async () => ({
        htmlPlugin: {
          tags: {
            headTags: [],
            bodyTags: [],
          },
        },
        custom: 'value',
      }),
    };

    htmlPlugin(config);

    await expect(config.templateParameters()).resolves.toEqual({
      title: 'Modern.js',
      meta: undefined,
      mountId: 'app',
      htmlPlugin: {
        tags: {
          headTags: [],
          bodyTags: [],
        },
      },
      custom: 'value',
    });
  });

  test('maps legacy dev server options in development only', async () => {
    const input = {
      dev: {
        host: 'dev.example',
        client: { path: '/hmr' },
        hmr: false,
      },
      tools: {
        devServer: { headers: { 'X-Custom-Foo': 'bar' } },
      },
    };

    rs.stubEnv('NODE_ENV', 'development');
    const dev = (await parseCommonConfig(input)).rsbuildConfig;
    expect(dev.server).toMatchObject({
      host: 'dev.example',
      headers: { 'X-Custom-Foo': 'bar' },
    });
    expect(dev.dev).toMatchObject({ client: { path: '/hmr' }, hmr: false });

    rs.stubEnv('NODE_ENV', 'production');
    const prod = (await parseCommonConfig(input)).rsbuildConfig;
    expect(prod.server?.host).toBeUndefined();
    expect(prod.server?.headers).toBeUndefined();
  });

  describe('CSS source map configuration', () => {
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
      rs.stubEnv('NODE_ENV', 'development');

      const config = await parseCommonConfig({
        output: {
          sourceMap: {
            js: 'source-map',
          },
        },
      });

      expect(config.rsbuildConfig.output?.sourceMap).toEqual({
        js: 'source-map',
        css: true,
      });
    });

    test('should set css source map to false when output.sourceMap.css is undefined in production', async () => {
      rs.stubEnv('NODE_ENV', 'production');

      const config = await parseCommonConfig({
        output: {
          sourceMap: {
            js: 'source-map',
          },
        },
      });

      expect(config.rsbuildConfig.output?.sourceMap).toEqual({
        js: 'source-map',
        css: false,
      });
    });

    test('should set css source map to true when output.sourceMap is undefined in development', async () => {
      rs.stubEnv('NODE_ENV', 'development');

      const config = await parseCommonConfig({
        output: {},
      });

      expect(config.rsbuildConfig.output?.sourceMap).toEqual({
        css: true,
      });
    });

    test('should set css source map to false when output.sourceMap is undefined in production', async () => {
      rs.stubEnv('NODE_ENV', 'production');

      const config = await parseCommonConfig({
        output: {},
      });

      expect(config.rsbuildConfig.output?.sourceMap).toEqual({
        css: false,
      });
    });

    test('should respect explicitly set css source map in development', async () => {
      rs.stubEnv('NODE_ENV', 'development');

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
      rs.stubEnv('NODE_ENV', 'production');

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
  });
});
