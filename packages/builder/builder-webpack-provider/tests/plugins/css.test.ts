import { expect, describe, it } from 'vitest';
import { PluginCss } from '../../src/plugins/css';
import { PluginSass } from '../../src/plugins/sass';
import { PluginLess } from '../../src/plugins/less';
import { createStubBuilder } from '../../src/stub';

describe('plugins/css', () => {
  // skipped because this case time out in CI env
  it.skip('should set css config with style-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginCss()],
      builderConfig: {
        tools: {
          styleLoader: {},
        },
      },
    });
    const includeStyleLoader = await builder.matchWebpackLoader(
      'style-loader',
      'index.css',
    );

    expect(includeStyleLoader).toBe(true);
  });

  // skipped because this case time out in CI env
  it.skip('should set css config with mini-css-extract-plugin', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginCss()],
      builderConfig: {},
    });

    const includeMiniCssExtractLoader = await builder.matchWebpackLoader(
      'mini-css-extract-plugin',
      'index.css',
    );

    expect(includeMiniCssExtractLoader).toBe(true);
  });

  it('should add sass-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginSass()],
      builderConfig: {
        tools: {
          sass: {},
        },
      },
    });

    const includeSassLoader = await builder.matchWebpackLoader(
      'sass-loader',
      'index.scss',
    );

    expect(includeSassLoader).toBe(true);
  });

  it('should add less-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginLess()],
      builderConfig: {
        tools: {
          less: {},
        },
      },
    });

    const includeLessLoader = await builder.matchWebpackLoader(
      'less-loader',
      'index.less',
    );

    expect(includeLessLoader).toBe(true);
  });

  it('should override browserslist of autoprefixer when using output.overrideBrowserslist config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginCss()],
      builderConfig: {
        output: {
          overrideBrowserslist: ['Chrome 80'],
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not apply mini-css-extract-plugin when target is node', async () => {
    const builder = await createStubBuilder({
      target: ['node'],
      plugins: [PluginCss()],
      builderConfig: {},
    });

    const includeMiniCssExtractLoader = await builder.matchWebpackLoader(
      'mini-css-extract-plugin',
      'index.css',
    );

    expect(includeMiniCssExtractLoader).toBe(false);
  });

  it('should not apply style-loader when target is node', async () => {
    const builder = await createStubBuilder({
      target: ['node'],
      plugins: [PluginCss()],
      builderConfig: {
        tools: {
          styleLoader: {},
        },
      },
    });

    const includeStyleLoader = await builder.matchWebpackLoader(
      'style-loader',
      'index.css',
    );

    expect(includeStyleLoader).toBe(false);
  });

  it('should allow to disable extract css plugin', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginCss()],
      builderConfig: {
        tools: {
          cssExtract: false,
        },
      },
    });

    const includeMiniCssExtractLoader = await builder.matchWebpackLoader(
      'mini-css-extract-plugin',
      'index.css',
    );

    expect(includeMiniCssExtractLoader).toBe(false);
  });
});
