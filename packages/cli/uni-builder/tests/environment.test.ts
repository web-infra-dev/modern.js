import { describe, it, expect } from 'vitest';
import { createUniBuilder } from '../src';

describe('uni-builder environment compat', () => {
  it('should generator environment config correctly', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      config: {
        environments: {
          web: {},
          node: {
            output: {
              target: 'node',
            },
          },
          serviceWorker: {
            output: {
              target: 'web-worker',
            },
          },
        },
      },
      cwd: '',
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs.map(c => c.name)).toEqual([
      'web',
      'node',
      'serviceWorker',
    ]);

    expect(bundlerConfigs).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});
