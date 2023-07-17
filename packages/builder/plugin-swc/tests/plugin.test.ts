import * as path from 'path';
import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { builderPluginSwc } from '../src';
import { builderPluginBabel } from '@modern-js/builder-webpack-provider/plugins/babel';
import { createSnapshotSerializer } from '@scripts/vitest-config';
import { applyPluginConfig } from '../src/utils';
import type {
  ModifyWebpackChainUtils,
  NormalizedConfig,
} from '@modern-js/builder-webpack-provider';

const TEST_BUILDER_CONFIG = {
  output: {},
  tools: {},
} as unknown as NormalizedConfig;

const UTILS = { target: 'web', isProd: true } as ModifyWebpackChainUtils;

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    replace: [{ mark: 'root', match: path.resolve(__dirname, '..') }],
  }),
);

describe('plugins/swc', () => {
  it('should set swc-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginBabel(), builderPluginSwc()],
      builderConfig: {},
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set swc minimizer in production', async () => {
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: [builderPluginBabel(), builderPluginSwc()],
      builderConfig: {},
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.optimization).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should set correct swc minimizer options in production', async () => {
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: [
        builderPluginBabel(),
        builderPluginSwc({
          jsMinify: {
            compress: false,
            mangle: false,
          },
        }),
      ],
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.optimization).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should set correct swc minimizer options using raw swc config', async () => {
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: [
        builderPluginBabel(),
        builderPluginSwc({
          jsc: {
            minify: {
              compress: false,
              mangle: false,
            },
          },
        }),
      ],
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.optimization).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should disable swc minify', async () => {
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: [
        builderPluginBabel(),
        builderPluginSwc({
          jsMinify: false,
          cssMinify: false,
        }),
      ],
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.optimization).toBeFalsy();
    process.env.NODE_ENV = 'test';
  });

  it('should disable swc minify when raw swc config', async () => {
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: [
        builderPluginBabel(),
        builderPluginSwc({
          jsMinify: false,
          cssMinify: false,
          jsc: {
            minify: {},
          },
          minify: true,
        }),
      ],
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.optimization).toBeFalsy();
    process.env.NODE_ENV = 'test';
  });

  it('should apply source.include and source.exclude correctly', async () => {
    process.env.NODE_ENV = 'development';

    const builder = await createStubBuilder({
      plugins: [builderPluginBabel(), builderPluginSwc()],
      builderConfig: {
        source: {
          include: [/foo/],
          exclude: [/bar/],
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should disable react refresh when dev.hmr is false', async () => {
    process.env.NODE_ENV = 'development';
    const builder = await createStubBuilder({
      plugins: [builderPluginSwc()],
      builderConfig: {
        dev: {
          hmr: false,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.module).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });

  it('should disable react refresh when target is not web', async () => {
    process.env.NODE_ENV = 'development';

    const builder = await createStubBuilder({
      plugins: [builderPluginSwc()],
      target: ['modern-web', 'node', 'service-worker', 'web', 'web-worker'],
    });
    const configs = await builder.unwrapWebpackConfigs();

    for (const config of configs) {
      expect(config.module).toMatchSnapshot();
    }

    process.env.NODE_ENV = 'test';
  });

  it('should not using minify in transform', async () => {
    const config = (
      await applyPluginConfig(
        {
          jsMinify: true,
        },
        UTILS,
        TEST_BUILDER_CONFIG,
        process.cwd(),
      )
    )[0].swcConfig;

    expect(config.minify).toBeFalsy();
  });

  it('should generate correct options in function form', async () => {
    const config = (
      await applyPluginConfig(
        (config, { setConfig }) => {
          setConfig(config, 'jsc.transform.react.runtime', 'foo');
        },
        UTILS,
        TEST_BUILDER_CONFIG,
        process.cwd(),
      )
    )[0].swcConfig;

    expect(config.jsc?.transform?.react?.runtime).toBe('foo');
  });

  it('should generate correct options in function form using return', async () => {
    const config = await applyPluginConfig(
      _config => {
        return {};
      },
      UTILS,
      TEST_BUILDER_CONFIG,
      process.cwd(),
    );

    expect(config[0].swcConfig).toStrictEqual({});
  });

  it('should pass throng SWC config', async () => {
    {
      const config = (
        await applyPluginConfig(
          {
            jsc: {
              transform: {
                useDefineForClassFields: false,
              },
            },
          },
          UTILS,
          TEST_BUILDER_CONFIG,
          process.cwd(),
        )
      )[0].swcConfig;

      expect(config.jsc?.transform?.useDefineForClassFields).toBeFalsy();
    }

    {
      const config = (
        await applyPluginConfig(
          {
            env: {
              coreJs: '2',
            },
          },
          UTILS,
          TEST_BUILDER_CONFIG,
          process.cwd(),
        )
      )[0].swcConfig;

      expect(config.env?.coreJs).toBe('2');
      expect(config.env?.targets).toBeDefined();
    }

    {
      const config = (
        await applyPluginConfig(
          config => {
            config.env!.coreJs = '2';
          },
          UTILS,
          TEST_BUILDER_CONFIG,
          process.cwd(),
        )
      )[0].swcConfig;

      expect(config.env?.coreJs).toBe('2');
      expect(config.env?.targets).toBeDefined();
    }
  });

  it('should set multiple swc-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [
        builderPluginBabel(),
        builderPluginSwc({
          overrides: [
            {
              test: /override.ts/,
              jsc: {
                transform: {
                  useDefineForClassFields: false,
                },
              },
            },
          ],
          jsc: {
            transform: {
              useDefineForClassFields: true,
            },
          },
        }),
      ],
      builderConfig: {},
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config.module!.rules).toMatchSnapshot();
  });
});
