import { expect, describe, it } from 'vitest';
import { PluginCss, normalizeCssLoaderOptions } from '@/plugins/css';
import { PluginSass } from '@/plugins/sass';
import { PluginLess } from '@/plugins/less';
import { createStubBuilder } from '@/stub';

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

  it('should not apply mini-css-extract-plugin when target is web-worker', async () => {
    const builder = await createStubBuilder({
      target: ['web-worker'],
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

  it('should not apply style-loader when target is web-worker', async () => {
    const builder = await createStubBuilder({
      target: ['web-worker'],
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

  it('should not apply postcss-loader when target is node', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginCss()],
      target: 'node',
    });

    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});

describe('normalizeCssLoaderOptions', () => {
  it('should enable exportOnlyLocals correctly', () => {
    expect(normalizeCssLoaderOptions({ modules: false }, true)).toEqual({
      modules: false,
    });

    expect(normalizeCssLoaderOptions({ modules: true }, true)).toEqual({
      modules: {
        exportOnlyLocals: true,
      },
    });

    expect(normalizeCssLoaderOptions({ modules: true }, false)).toEqual({
      modules: true,
    });

    expect(normalizeCssLoaderOptions({ modules: 'local' }, true)).toEqual({
      modules: {
        mode: 'local',
        exportOnlyLocals: true,
      },
    });

    expect(
      normalizeCssLoaderOptions({ modules: { auto: true } }, true),
    ).toEqual({
      modules: {
        auto: true,
        exportOnlyLocals: true,
      },
    });
  });
});
