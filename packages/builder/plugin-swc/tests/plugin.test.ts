import * as path from 'path';
import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { PluginSwc } from '../src';
import { createSnapshotSerializer } from '@scripts/vitest-config';

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    replace: [
      { mark: 'root', match: path.resolve(__dirname, '..') },
    ],
  }),
);

describe('plugins/swc', () => {
  it('should set swc-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginSwc()],
      builderConfig: {},
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set swc minimizer in production', async () => {
    process.env.NODE_ENV = 'production';
    const builder = await createStubBuilder({
      plugins: [PluginSwc()],
      builderConfig: {},
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = 'test';
  });
});
