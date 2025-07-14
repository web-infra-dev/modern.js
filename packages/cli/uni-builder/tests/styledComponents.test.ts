import { describe, expect, it } from 'vitest';
import { createUniBuilder } from '../src';
import { matchRules } from './helper';

describe('plugins/styled-components', () => {
  it('should enable ssr when target contain node', async () => {
    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      cwd: '',
      config: {
        environments: {
          node: {
            output: {
              target: 'node',
            },
          },
          web: {
            output: {
              target: 'web',
            },
          },
        },
      },
    });

    const configs = await rsbuild.initConfigs();

    for (const config of configs) {
      expect(
        matchRules({
          config,
          testFile: 'a.js',
        }),
      ).toMatchSnapshot();
    }
  });
});
