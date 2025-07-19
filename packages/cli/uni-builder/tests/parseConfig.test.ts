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
            port: 8081,
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
});
