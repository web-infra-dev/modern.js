import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@modern-js/webpack-builder/stub';
import { PluginEsbuild } from '../src';

describe('plugins/esbuild', () => {
  it('should set esbuild-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEsbuild()],
      builderConfig: {},
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
