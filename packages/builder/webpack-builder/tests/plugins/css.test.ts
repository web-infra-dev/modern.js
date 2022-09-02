import { expect, describe, it } from 'vitest';
import { PluginCss } from '../../src/plugins/css';
import { PluginSass } from '../../src/plugins/sass';
import { PluginLess } from '../../src/plugins/less';
import { createStubBuilder } from '../../src/stub';

describe('plugins/css', () => {
  // skipped because this case time out in CI env
  it.skip('should set css config with style-loader', async () => {
    const builder = createStubBuilder({
      plugins: [PluginCss()],
      builderConfig: {
        tools: {
          styleLoader: {},
        },
      },
    });
    const includeStyleLoader = await builder.matchWebpackLoader({
      loader: 'style-loader',
      testFile: 'index.css',
    });

    expect(includeStyleLoader).toBe(true);
  });

  it('should set css config with mini-css-extract-plugin', async () => {
    const builder = createStubBuilder({
      plugins: [PluginCss()],
      builderConfig: {},
    });

    const includeMiniCssExtractLoader = await builder.matchWebpackLoader({
      loader: 'mini-css-extract-plugin',
      testFile: 'index.css',
    });

    expect(includeMiniCssExtractLoader).toBe(true);
  });

  it('should add sass-loader', async () => {
    const builder = createStubBuilder({
      plugins: [PluginSass()],
      builderConfig: {
        tools: {
          sass: {},
        },
      },
    });

    const includeSassLoader = await builder.matchWebpackLoader({
      loader: 'sass-loader',
      testFile: 'index.scss',
    });

    expect(includeSassLoader).toBe(true);
  });

  it('should add less-loader', async () => {
    const builder = createStubBuilder({
      plugins: [PluginLess()],
      builderConfig: {
        tools: {
          less: {},
        },
      },
    });

    const includeLessLoader = await builder.matchWebpackLoader({
      loader: 'less-loader',
      testFile: 'index.less',
    });

    expect(includeLessLoader).toBe(true);
  });
});
