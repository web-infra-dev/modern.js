import { expect, describe, it } from 'vitest';
import { PluginBabel } from '../src/plugins/babel';
import { createStubBuilder } from './utils/builder';

describe('plugins/babel', () => {
  it('should set babel-loader', async () => {
    const builder = createStubBuilder({
      plugins: [PluginBabel()],
      builderConfig: {
        output: {
          polyfill: 'entry',
        },
        tools: {
          babel: {},
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should set include/exclude', async () => {
    const builder = createStubBuilder({
      plugins: [PluginBabel()],
      builderConfig: {
        tools: {
          babel(options, { addIncludes, addExcludes }) {
            addIncludes(['src/**/*.ts']);
            addExcludes(['src/**/*.js']);
            return options;
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
