import { describe, expect, it } from '@rstest/core';
import { createBuilder } from '../src';
import { matchRules, unwrapConfig } from './helper';

describe('plugin-postcssLegacy', () => {
  it('should register postcss plugin by browserslist', async () => {
    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        output: {
          overrideBrowserslist: ['chrome >= 87'],
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.css' })).toMatchSnapshot();
    expect(matchRules({ config, testFile: 'a.sass' })).toMatchSnapshot();
    expect(matchRules({ config, testFile: 'a.less' })).toMatchSnapshot();
  });

  it('should allow tools.postcss to override the plugins', async () => {
    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        tools: {
          postcss: {
            postcssOptions: {
              plugins: [
                {
                  postcssPlugin: 'postcss-plugin-test',
                  AtRule: {},
                },
              ],
            },
          },
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.css' })).toMatchSnapshot();
    expect(matchRules({ config, testFile: 'a.sass' })).toMatchSnapshot();
    expect(matchRules({ config, testFile: 'a.less' })).toMatchSnapshot();
  });

  it('should register postcss plugin correctly when injectStyles is enabled in dev environment', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        output: {
          injectStyles: true,
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.css' })).toMatchSnapshot();

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should register postcss plugin correctly when injectStyles is enabled in production environment', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        output: {
          injectStyles: true,
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.css' })).toMatchSnapshot();

    process.env.NODE_ENV = originalNodeEnv;
  });
});

describe('lightningcss-loader', () => {
  it('should register lightningcss-loader and disable postcss-loader when lightningcssLoader enabled', async () => {
    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        tools: {
          lightningcssLoader: true,
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.css' })).toMatchSnapshot();
  });

  it('should register lightningcss-loader and postcss-loader both', async () => {
    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        tools: {
          lightningcssLoader: true,
          postcss: {
            postcssOptions: {
              plugins: [
                {
                  postcssPlugin: 'postcss-plugin-test',
                  AtRule: {},
                },
              ],
            },
          },
        },
      },
      cwd: '',
    });

    const config = await unwrapConfig(rsbuild);

    expect(matchRules({ config, testFile: 'a.css' })).toMatchSnapshot();
  });
});
