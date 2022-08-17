import { expect, describe, it } from 'vitest';
import { PluginCss } from '../src/plugins/css';
import { PluginSass } from '../src/plugins/sass';
import { PluginLess } from '../src/plugins/less';
import { createStubBuilder } from './utils/builder';
import { matchLoader } from './utils/matchLoader';

describe('plugins/css', () => {
  it('should set css config with style-loader', async () => {
    const builder = createStubBuilder({
      plugins: [PluginCss()],
      builderConfig: {
        tools: {},
      },
    });
    const config = await builder.unwrapWebpackConfig();

    const includeStyleLoader = matchLoader({
      loader: 'style-loader',
      testFile: 'index.css',
      config,
    });

    expect(includeStyleLoader).toBe(true);
  });

  it('should set css config with mini-css-extract-plugin', async () => {
    const builder = createStubBuilder({
      plugins: [PluginCss()],
      builderConfig: {
        tools: {
          cssExtract: {},
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    const includeMiniCssExtractLoader = matchLoader({
      loader: 'mini-css-extract-plugin',
      testFile: 'index.css',
      config,
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
    const config = await builder.unwrapWebpackConfig();

    const includeSassLoader = matchLoader({
      loader: 'sass-loader',
      testFile: 'index.scss',
      config,
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
    const config = await builder.unwrapWebpackConfig();

    const includeLessLoader = matchLoader({
      loader: 'less-loader',
      testFile: 'index.less',
      config,
    });

    expect(includeLessLoader).toBe(true);
  });
});
