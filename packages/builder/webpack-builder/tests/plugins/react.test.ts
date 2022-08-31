import { expect, describe, it } from 'vitest';
import { setPathSerializer } from '../utils/snapshot';
import { PluginReact } from '../../src/plugins/react';
import { PluginBabel } from '../../src/plugins/babel';
import { PluginTsLoader } from '../../src/plugins/tsLoader';
import { createStubBuilder } from '../utils/builder';

describe('plugins/react', () => {
  setPathSerializer();
  it('should work with babel-loader', async () => {
    const builder = createStubBuilder({
      plugins: [PluginBabel(), PluginReact()],
      builderConfig: {
        tools: {
          tsChecker: false,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should work with ts-loader', async () => {
    const builder = createStubBuilder({
      plugins: [PluginTsLoader(), PluginReact()],
      builderConfig: {
        tools: {
          tsLoader: {},
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
