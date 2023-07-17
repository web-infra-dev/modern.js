import * as path from 'path';
import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { builderPluginSwc } from '../src';
import { builderPluginBabel } from '@modern-js/builder-webpack-provider/plugins/babel';
import { createSnapshotSerializer } from '@scripts/vitest-config';
import { applyPluginConfig } from '../src/utils';
import type { NormalizedConfig } from '@modern-js/builder-webpack-provider';

const TEST_BUILDER_CONFIG = {
  output: {},
  tools: {},
} as unknown as NormalizedConfig;

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

  it('should apply source.include and source.exclude correctly', async () => {
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
    const config = await applyPluginConfig(
      {
        jsMinify: true,
      },
      'web',
      true,
      TEST_BUILDER_CONFIG,
      process.cwd(),
    );

    expect(config.minify).toBeFalsy();
  });

  it('should generate correct options in function form', async () => {
    const config = await applyPluginConfig(
      (config, { setConfig }) => {
        setConfig(config, 'jsc.transform.react.runtime', 'foo');
      },
      'web',
      true,
      TEST_BUILDER_CONFIG,
      process.cwd(),
    );

    expect(config.jsc?.transform?.react?.runtime).toBe('foo');
  });

  it('should generate correct options in function form using return', async () => {
    const config = await applyPluginConfig(
      _config => {
        return {};
      },
      'web',
      true,
      TEST_BUILDER_CONFIG,
      process.cwd(),
    );

    expect(config).toStrictEqual({});
  });

  it('should pass throng SWC config', async () => {
    {
      const config = await applyPluginConfig(
        {
          jsc: {
            transform: {
              useDefineForClassFields: false,
            },
          },
        },
        'web',
        true,
        TEST_BUILDER_CONFIG,
        process.cwd(),
      );

      expect(config.jsc?.transform?.useDefineForClassFields).toBeFalsy();
    }

    {
      const config = await applyPluginConfig(
        {
          env: {
            coreJs: '2',
          },
        },
        'web',
        true,
        TEST_BUILDER_CONFIG,
        process.cwd(),
      );

      expect(config.env?.coreJs).toBe('2');
      expect(config.env?.targets).toBeDefined();
    }

    {
      const config = await applyPluginConfig(
        config => {
          config.env!.coreJs = '2';
        },
        'web',
        true,
        TEST_BUILDER_CONFIG,
        process.cwd(),
      );

      expect(config.env?.coreJs).toBe('2');
      expect(config.env?.targets).toBeDefined();
    }
  });
});
