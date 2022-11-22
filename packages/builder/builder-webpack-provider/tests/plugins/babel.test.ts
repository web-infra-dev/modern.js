import { expect, describe, it } from 'vitest';
import { PluginBabel } from '@/plugins/babel';
import { PluginEntry } from '@/plugins/entry';
import { createStubBuilder } from '@/stub';

describe('plugins/babel', () => {
  it('should set babel-loader', async () => {
    const builder = await createStubBuilder({
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
    const builder = await createStubBuilder({
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

  it('should apply exclude condition when using source.exclude', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginBabel()],
      builderConfig: {
        source: {
          exclude: ['src/foo/**/*.js'],
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should add core-js-entry when output.polyfill is entry', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginBabel()],
      builderConfig: {
        output: {
          polyfill: 'entry',
        },
      },
      entry: {
        main: './index.js',
      },
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.entry).toMatchSnapshot();
  });

  it('should not add core-js-entry when output.polyfill is usage', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginEntry(), PluginBabel()],
      builderConfig: {
        output: {
          polyfill: 'usage',
        },
      },
      entry: {
        main: './index.js',
      },
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config.entry).toMatchSnapshot();
  });

  it('should override targets of babel-preset-env when using output.overrideBrowserslist config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginBabel()],
      builderConfig: {
        output: {
          overrideBrowserslist: ['Chrome 80'],
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should add rule to compile Data URI when enable source.compileJsDataURI', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginBabel()],
      builderConfig: {
        source: {
          compileJsDataURI: true,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should adjust jsescOption config when charset is utf8', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginBabel()],
      builderConfig: {
        output: {
          charset: 'utf8',
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(JSON.stringify(config)).toContain(
      '"generatorOpts":{"jsescOption":{"minimal":true}}',
    );
  });

  it('should adjust browserslist when target is node', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginBabel()],
      target: 'node',
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
