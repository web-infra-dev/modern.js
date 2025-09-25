import type { OutputConfig } from '@rsbuild/core';
import { afterAll, describe, expect, test } from 'vitest';
import { parseCommonConfig } from '../src/shared/parseCommonConfig';
import type { UniBuilderConfig } from '../src/types';

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

  test('output.cssModuleLocalIdentName', async () => {
    expect(
      (
        await parseCommonConfig({
          output: {
            cssModuleLocalIdentName: '[local]-[hash:base64:6]',
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();
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

  test('html.metaByEntries', async () => {
    expect(
      (
        await parseCommonConfig({
          html: {
            metaByEntries: {
              foo: {
                viewport: 'bar',
              },
            },
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();

    expect(
      (
        await parseCommonConfig({
          html: {
            meta: {
              charset: {
                charset: 'UTF-8',
              },
            },
            metaByEntries: {
              foo: {
                viewport: 'bar',
              },
            },
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('html.titleByEntries', async () => {
    expect(
      (
        await parseCommonConfig({
          html: {
            titleByEntries: {
              foo: 'Foo',
            },
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();

    expect(
      (
        await parseCommonConfig({
          html: {
            title: 'Default',
            titleByEntries: {
              foo: 'Foo',
            },
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('html.faviconByEntries', async () => {
    expect(
      (
        await parseCommonConfig({
          html: {
            faviconByEntries: {
              foo: 'https://www.foo.com/foo.ico',
            },
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();

    // expect(
    //   (
    //     await parseCommonConfig({
    //       html: {
    //         favicon: 'https://www.foo.com/default.ico',
    //         faviconByEntries: {
    //           foo: 'https://www.foo.com/foo.ico',
    //         },
    //       },
    //     })
    //   ).rsbuildConfig,
    // ).toMatchSnapshot();
  });

  test('html.faviconByEntries', async () => {
    expect(
      (
        await parseCommonConfig({
          html: {
            injectByEntries: {
              foo: 'head',
            },
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();

    expect(
      (
        await parseCommonConfig({
          html: {
            inject: 'body',
            injectByEntries: {
              foo: 'head',
            },
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('html.templateByEntries', async () => {
    expect(
      (
        await parseCommonConfig({
          html: {
            templateByEntries: {
              foo: './static/foo.html',
            },
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();

    expect(
      (
        await parseCommonConfig({
          html: {
            template: './static/index.html',
            templateByEntries: {
              foo: './static/foo.html',
            },
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('html.templateParametersByEntries', async () => {
    expect(
      (
        await parseCommonConfig({
          html: {
            templateParametersByEntries: {
              foo: {
                name: 'jack',
              },
            },
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();

    expect(
      (
        await parseCommonConfig({
          html: {
            templateParameters: {
              name: 'jack',
            },
            templateParametersByEntries: {
              foo: {
                name: 'rose',
              },
            },
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
            port: 8081,
            host: 'xxx.xxx',
          },
          tools: {
            devServer: {
              client: {
                path: '/aaaa',
              },
              compress: false,
              hot: false,
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
            port: 8081,
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

  test('output.enableInlineScripts', async () => {
    expect(
      (
        await parseCommonConfig({
          output: {
            enableInlineScripts: true,
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();
  });

  test('output.enableInlineStyles', async () => {
    expect(
      (
        await parseCommonConfig({
          output: {
            enableInlineStyles: true,
          },
        })
      ).rsbuildConfig,
    ).toMatchSnapshot();
  });

  const injectStylesCases: [UniBuilderConfig['output'], OutputConfig][] = [
    [{}, { injectStyles: undefined }],
    [{ injectStyles: true }, { injectStyles: true }],
    [{ injectStyles: false }, { injectStyles: false }],
    [{ disableCssExtract: true }, { injectStyles: true }],
    [{ disableCssExtract: false }, { injectStyles: undefined }],
    [{ disableCssExtract: true, injectStyles: true }, { injectStyles: true }],
    [{ disableCssExtract: false, injectStyles: true }, { injectStyles: true }],
    [{ disableCssExtract: true, injectStyles: false }, { injectStyles: false }],
    [
      { disableCssExtract: false, injectStyles: false },
      { injectStyles: false },
    ],
    [
      { disableCssExtract: false, injectStyles: false },
      { injectStyles: false },
    ],
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

    test('should set css source map to true when output.sourceMap is undefined in development', async () => {
      process.env.NODE_ENV = 'development';

      const config = await parseCommonConfig({
        output: {},
      });

      expect(config.rsbuildConfig.output?.sourceMap).toEqual({
        css: true,
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
  });
});
