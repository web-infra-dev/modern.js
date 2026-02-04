import { join } from 'path';
import { afterEach, describe, expect, it, rstest } from '@rstest/core';
import { after } from 'lodash';
import { createBuilder } from '../src';

describe('builder environment compat', () => {
  afterEach(() => {
    rstest.unstubAllEnvs();
  });
  it('should generator environment config correctly', async () => {
    rstest.stubEnv('NODE_ENV', 'development');

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
  });
});
