import { describe, expect, it } from 'vitest';
import { PluginCss } from '../../src/plugins/css';
import { PluginLess } from '../../src/plugins/less';
import { PluginSass } from '../../src/plugins/sass';
import { PluginRem } from '../../src/plugins/rem';
import { createStubBuilder } from '../../src/stub';

describe('plugins/rem', () => {
  it('should not run rem plugin without config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginCss(), PluginRem()],
      builderConfig: {},
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should not run rem plugin when false', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginCss(), PluginRem()],
      builderConfig: {
        output: {
          convertToRem: false,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should run rem plugin with default config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginCss(), PluginLess(), PluginSass(), PluginRem()],
      builderConfig: {
        output: {
          convertToRem: true,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();

    // should add AutoSetRootFontSizePlugin and postcss-rem plugin
    expect(config).toMatchSnapshot();
  });

  it('should not run htmlPlugin with enableRuntime is false', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginCss(), PluginRem()],
      builderConfig: {
        output: {
          convertToRem: {
            enableRuntime: false,
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();

    expect(config.plugins?.length || 0).toBe(0);
    expect(config).toMatchSnapshot();
  });

  it('should run rem plugin with custom config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginCss(), PluginRem()],
      builderConfig: {
        output: {
          convertToRem: {
            rootFontSize: 30,
            pxtorem: {
              propList: ['font-size'],
            },
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });
});
