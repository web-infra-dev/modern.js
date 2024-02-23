import { describe, it, expect } from 'vitest';
import { createUniBuilder } from '../src';

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

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0].module).toMatchSnapshot();
  });
});
