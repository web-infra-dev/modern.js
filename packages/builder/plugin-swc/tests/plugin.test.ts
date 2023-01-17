import * as path from 'path';
import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { builderPluginSwc } from '../src';
import { builderPluginBabel } from '@modern-js/builder-webpack-provider/plugins/babel';
import { createSnapshotSerializer } from '@scripts/vitest-config';

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
});
