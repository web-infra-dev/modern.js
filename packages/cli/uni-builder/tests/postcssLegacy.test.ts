import { describe, it, expect } from 'vitest';
import { createUniBuilder } from '../src';
import { unwrapConfig, matchRules } from './helper';

describe('plugin-postcssLegacy', () => {
  it('should register postcss plugin by browserslist', async () => {
    const rsbuild = await createUniBuilder({
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
    const rsbuild = await createUniBuilder({
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
});
