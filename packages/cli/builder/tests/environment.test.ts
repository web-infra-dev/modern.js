import { join } from 'path';
import { describe, expect, it } from '@rstest/core';
import { createBuilder } from '../src';

describe('builder environment compat', () => {
  it('should generator environment config correctly', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        environments: {
          client: {},
          server: {
            output: {
              target: 'node',
            },
          },
          workerSSR: {
            output: {
              target: 'web-worker',
            },
          },
        },
      },
      cwd: join(__dirname, '..'),
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs.map(c => c.name)).toEqual([
      'client',
      'server',
      'workerSSR',
    ]);

    expect(bundlerConfigs).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});
